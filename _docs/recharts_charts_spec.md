Great—let’s lock in a **Recharts-friendly, spec-based** approach that’s clean to serialize, easy to render, and simple to extend.

Below is a pragmatic v1 you can ship now, with a path to grow.

This ChartSpec object below will be serialized and stored as a JSONB column in a new Postgres table (e.g., dashboard_cards.chart_spec). It defines the structure of a chart, including data source, encodings, filters, and visual options, and will be used both for rendering charts in the frontend (Recharts) and generating SQL in the backend.

---

## 1) `ChartSpec` v1 (TypeScript)

```ts
// src/types/chart-spec.ts
export type ChartType = 'bar' | 'line' | 'pie' | 'table';

export type TimeUnit = 'year' | 'quarter' | 'month' | 'week' | 'day' | 'hour' | 'none';

export type Aggregate = 'sum' | 'avg' | 'min' | 'max' | 'count' | 'countDistinct';

export type FilterOp = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'notIn' | 'contains' | 'startsWith' | 'between' | 'isNull' | 'notNull';

export interface FieldRef {
  field: string;        // column name (e.g., "amount", "created_at")
  label?: string;       // human label
}

export interface MeasureRef extends FieldRef {
  aggregate?: Aggregate; // default 'sum' for numeric fields, 'count' otherwise
  format?: string;       // d3-format or Intl format string (handled in UI)
}

export interface DimensionRef extends FieldRef {
  timeUnit?: TimeUnit;   // applied if field is a timestamp/date
  sort?: 'asc' | 'desc';
}

export interface Filter {
  field: string;
  op: FilterOp;
  value?: any;           // array for in/notIn/between; omit for isNull/notNull
}

export interface DataQuery {
  source: string;               // logical table/view name from backend catalog
  dimensions: DimensionRef[];   // 0..n (e.g., date, lead_source)
  measures: MeasureRef[];       // 1..n
  filters?: Filter[];
  limit?: number;               // applied after aggregation/sort
  orderBy?: { field: string; dir: 'asc' | 'desc' }[];
}

export interface Encodings {
  x?: DimensionRef;             // primary category / time
  y?: MeasureRef | MeasureRef[];// one or more measures (bars/lines)
  series?: DimensionRef;        // splits y into multiple series (pivot)
  color?: string[];             // palette override (optional)
  label?: boolean;              // show data labels
  stack?: boolean;              // bar/area stacking
  smooth?: boolean;             // line smoothing
}

export interface ChartOptions {
  title?: string;
  legend?: 'none' | 'top' | 'right' | 'bottom' | 'left';
  yAxisFormat?: string;
  xAxisTickFormat?: string;     // for dates or categorical abbreviations
  tooltipFields?: FieldRef[];   // extra fields to show in tooltip
  height?: number;              // px; width is responsive container
  sampleTopNSeries?: number;    // limit series cardinality
}

export interface ChartSpec {
  v: 1;                         // spec version
  type: ChartType;
  data: DataQuery;
  encodings: Encodings;
  options?: ChartOptions;
}
```

> Store exactly this JSON in your DB. Add a simple spec-migrator when you bump `v`.

---

## 2) Example specs (ready to save)

**A) Line: Revenue by month, series by lead\_source**

```json
{
  "v": 1,
  "type": "line",
  "data": {
    "source": "fact_sales",
    "dimensions": [{ "field": "created_at", "timeUnit": "month" }, { "field": "lead_source" }],
    "measures": [{ "field": "revenue", "aggregate": "sum", "label": "Revenue" }],
    "filters": [{ "field": "status", "op": "in", "value": ["Closed Won"] }],
    "orderBy": [{ "field": "created_at", "dir": "asc" }]
  },
  "encodings": {
    "x": { "field": "created_at", "timeUnit": "month" },
    "y": { "field": "revenue", "aggregate": "sum", "label": "Revenue" },
    "series": { "field": "lead_source" },
    "smooth": true
  },
  "options": {
    "title": "Revenue by Month",
    "legend": "bottom",
    "yAxisFormat": "$~s",
    "xAxisTickFormat": "MMM yyyy",
    "sampleTopNSeries": 8,
    "height": 320
  }
}
```

**B) Bar (stacked): Pipeline by stage (current month)**

```json
{
  "v": 1,
  "type": "bar",
  "data": {
    "source": "fact_opportunity",
    "dimensions": [{ "field": "stage" }],
    "measures": [{ "field": "amount", "aggregate": "sum" }],
    "filters": [{ "field": "close_date", "op": "between", "value": ["2025-08-01","2025-08-31"] }]
  },
  "encodings": {
    "x": { "field": "stage" },
    "y": { "field": "amount", "aggregate": "sum" },
    "stack": true
  },
  "options": { "title": "Pipeline by Stage", "height": 280 }
}
```

**C) Pie: A/R aging buckets**

```json
{
  "v": 1,
  "type": "pie",
  "data": {
    "source": "ar_balances",
    "dimensions": [{ "field": "aging_bucket" }],
    "measures": [{ "field": "amount_due", "aggregate": "sum" }]
  },
  "encodings": {
    "series": { "field": "aging_bucket" }, 
    "y": { "field": "amount_due", "aggregate": "sum" }
  },
  "options": { "title": "A/R by Aging", "legend": "right", "height": 260 }
}
```

**D) Table: Top 20 accounts by 90-day revenue**

```json
{
  "v": 1,
  "type": "table",
  "data": {
    "source": "fact_sales",
    "dimensions": [{ "field": "account_name" }],
    "measures": [{ "field": "revenue_90d", "aggregate": "sum", "label": "Revenue (90d)" }],
    "orderBy": [{ "field": "revenue_90d", "dir": "desc" }],
    "limit": 20
  },
  "encodings": {},
  "options": { "title": "Top Accounts" }
}
```

---

## 3) Renderer: `ChartRenderer` (Recharts)

```tsx
// src/components/charts/ChartRenderer.tsx
'use client';
import { useMemo } from 'react';
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, PieChart, Pie,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';
import type { ChartSpec } from '@/types/chart-spec';
import { useExecuteChart } from '@/graphql/hooks'; // generated by codegen
import { transformRowsForRecharts } from './dataTransform';

export function ChartRenderer({ spec }: { spec: ChartSpec }) {
  const { data, loading, error } = useExecuteChart(spec); // backend returns rows[]
  if (loading) return <div className="h-[200px] animate-pulse rounded bg-muted" />;
  if (error)   return <div className="text-destructive">Failed to load chart.</div>;

  const { chartData, seriesKeys, xKey, valueKey } = useMemo(
    () => transformRowsForRecharts(spec, data?.executeChart?.rows ?? []),
    [spec, data]
  );

  const height = spec.options?.height ?? 300;

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer>
        {spec.type === 'line' && (
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xKey} />
            <YAxis />
            <Tooltip />
            {spec.options?.legend !== 'none' && <Legend verticalAlign="bottom" height={32} />}
            {seriesKeys.map((k) => (
              <Line key={k} type={spec.encodings.smooth ? 'monotone' : 'linear'} dataKey={k} dot={false} />
            ))}
          </LineChart>
        )}

        {spec.type === 'bar' && (
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xKey} />
            <YAxis />
            <Tooltip />
            {spec.options?.legend !== 'none' && <Legend verticalAlign="bottom" height={32} />}
            {seriesKeys.map((k) => (
              <Bar key={k} dataKey={k} stackId={spec.encodings.stack ? 'a' : undefined} />
            ))}
          </BarChart>
        )}

        {spec.type === 'pie' && (
          <PieChart>
            <Tooltip />
            {spec.options?.legend !== 'none' && <Legend verticalAlign="right" layout="vertical" />}
            <Pie data={chartData} dataKey={valueKey} nameKey={xKey} label={spec.encodings.label} />
          </PieChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
```

---

## 4) Data shaping for Recharts

Recharts wants **wide** data for multi-series line/bar (one column per series). Pie wants `{ name, value }` per slice. Transform once in a helper:

```ts
// src/components/charts/dataTransform.ts
import type { ChartSpec } from '@/types/chart-spec';

// rows: backend returns array of objects with grouped columns and measures
export function transformRowsForRecharts(spec: ChartSpec, rows: any[]) {
  const x = spec.encodings.x?.field ?? spec.data.dimensions[0]?.field;
  const series = spec.encodings.series?.field;
  const m = Array.isArray(spec.encodings.y) ? spec.encodings.y[0] : spec.encodings.y;
  const valueField = m?.label || m?.field || 'value';

  if (spec.type === 'pie') {
    // expect single dimension + single measure
    return {
      chartData: rows.map(r => ({
        [x]: r[x],
        [valueField]: r[valueField] ?? r[m!.field],
      })),
      seriesKeys: [valueField],
      xKey: x,
      valueKey: valueField,
    };
  }

  // line/bar
  if (series) {
    // pivot: one row per x, columns per series value
    const map = new Map<string, any>();
    for (const r of rows) {
      const key = String(r[x]);
      const s = r[series];
      const v = r[valueField] ?? r[m!.field];
      if (!map.has(key)) map.set(key, { [x]: r[x] });
      map.get(key)[s] = v;
    }
    const chartData = Array.from(map.values());
    const seriesKeys = Array.from(new Set(rows.map(r => r[series])));
    return { chartData, seriesKeys, xKey: x, valueKey: valueField };
  } else {
    // single series; use value field as single series key
    const chartData = rows.map(r => ({ [x]: r[x], [valueField]: r[valueField] ?? r[m!.field] }));
    return { chartData, seriesKeys: [valueField], xKey: x, valueKey: valueField };
  }
}
```

> If series cardinality is huge, apply `options.sampleTopNSeries` on the backend during aggregation (top-N by total), and bucket the rest into “Other”.

---

## 5) Backend contract (`executeChart`)

Keep your existing plan: **GraphQL executes the spec** and returns `rows` that match the grouping. That lets you centralize SQL, security, row limits, and caching.

```graphql
# request
mutation ExecuteChart($spec: JSON!) { executeChart(spec: $spec) { rows { ... } meta { rowCount durationMs } } }
```

**SQL generator sketch (Postgres)**

```sql
SELECT
  /* x */ DATE_TRUNC('month', created_at) AS created_at,
  /* series */ lead_source,
  /* measure */ SUM(revenue) AS revenue
FROM fact_sales
WHERE status IN ('Closed Won')
GROUP BY 1, 2
ORDER BY 1 ASC;
```

Backend responsibilities:

* Apply `timeUnit` via `DATE_TRUNC`.
* Enforce allowed sources/columns (catalog).
* Apply filters safely (parameterized).
* Enforce `limit`/`orderBy`.
* Cardinality guardrails (e.g., max 12 x-bins, max 20 series).
* Return **labels** that match measure `label` when provided (so the transformer can reference them directly).

---

## 6) Drag-and-drop builder → spec

* Shelves: **X**, **Y**, **Series**, **Filters**.
* Dropping a field into **X** sets `encodings.x.field` and adds to `data.dimensions` if not present.
* Dropping a numeric field into **Y** sets `encodings.y` (or pushes into array). If no `aggregate`, default to `sum`.
* Dropping a categorical field into **Series** sets `encodings.series` and adds it to `data.dimensions`.
* Toggle controls on shelves set `timeUnit`, `aggregate`, `stack`, `smooth`, `label`, and formats.

```ts
// builder state update helpers
export function upsertDimension(spec: ChartSpec, d: DimensionRef) {
  const exists = spec.data.dimensions.find(x => x.field === d.field);
  if (!exists) spec.data.dimensions.push(d);
}
export function setX(spec: ChartSpec, d: DimensionRef) {
  spec.encodings.x = d; upsertDimension(spec, d);
}
export function setY(spec: ChartSpec, m: MeasureRef) {
  spec.encodings.y = m;
  const has = spec.data.measures.find(x => x.field === m.field && x.aggregate === m.aggregate);
  if (!has) spec.data.measures.push(m);
}
export function setSeries(spec: ChartSpec, d: DimensionRef) {
  spec.encodings.series = d; upsertDimension(spec, d);
}
```

Use **zod** to validate before save, and **immer** in React for ergonomic updates.

---

## 7) Validation (zod)

```ts
import { z } from 'zod';

export const ChartSpecSchema = z.object({
  v: z.literal(1),
  type: z.enum(['bar','line','pie','table']),
  data: z.object({
    source: z.string().min(1),
    dimensions: z.array(z.object({
      field: z.string(),
      label: z.string().optional(),
      timeUnit: z.enum(['year','quarter','month','week','day','hour','none']).optional(),
      sort: z.enum(['asc','desc']).optional()
    })),
    measures: z.array(z.object({
      field: z.string(),
      label: z.string().optional(),
      aggregate: z.enum(['sum','avg','min','max','count','countDistinct']).optional(),
      format: z.string().optional(),
    })).min(1),
    filters: z.array(z.any()).optional(),
    limit: z.number().int().positive().optional(),
    orderBy: z.array(z.object({ field: z.string(), dir: z.enum(['asc','desc'])})).optional()
  }),
  encodings: z.object({
    x: z.any().optional(),
    y: z.any().optional(),
    series: z.any().optional(),
    color: z.array(z.string()).optional(),
    label: z.boolean().optional(),
    stack: z.boolean().optional(),
    smooth: z.boolean().optional(),
  }),
  options: z.any().optional()
});
```

---

## 8) Formatting & tooltips

* Keep formatting in **options** (`yAxisFormat`, `xAxisTickFormat`). Implement with `Intl.NumberFormat` / `date-fns` in the renderer (or let the backend pre-format).
* Provide a default **custom `Tooltip`** that renders fields in `options.tooltipFields` if present, otherwise shows x + visible measures.

---

## 9) Versioning & migrations

* Include `v: 1` in every spec.
* Keep a tiny migrator:

```ts
export function migrateSpec(raw: any): ChartSpec {
  if (raw.v === 1) return raw;
  // if v0 → v1 changes existed, map them here
  throw new Error('Unsupported spec version');
}
```

---

## 10) Testing targets

* **Unit**: `transformRowsForRecharts` with (a) single series, (b) multi-series pivot, (c) pie, (d) empty rows, (e) high series cardinality.
* **Contract**: Spec → backend → rows → renderer smoke (Cypress component tests).
* **Perf**: 10k rows to grid; 12×20 pivot stress test.

---

### Bottom line

* You keep **Recharts aesthetics**.
* You still get **saved/portable JSON specs** you can round-trip through your GraphQL API.
* Complexity lives in **backend SQL generation** and a small **pivot** helper—both tractable and testable.

If you want, I can stub the `executeChart` SQL generator (Postgres) for `timeUnit`, `aggregate`, filters, and top-N series next.
