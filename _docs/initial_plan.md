## 1) Drag-and-drop architecture

**Two distinct DnD surfaces**:

1. **Grid Layout (position/resize cards)**

   * Use `react-grid-layout` for snap-to-grid placement, resize handles, breakpoints.
   * Each card has `{ i, x, y, w, h }` persisted to DB.

2. **Field Mapping (build a chart by dropping fields onto shelves)**

   * Use `dnd-kit` (or `@dnd-kit/core` + `@dnd-kit/sortable`) for dragging fields from a **Fields panel** to **Encoding shelves**: `x`, `y`, `series/color`, `size`, `tooltip`, `facet`, and **Filters**.
   * On drop, update a local `ChartSpec` and re-render a live preview.
   * Enforce constraints (e.g., only numeric on `y`) using field metadata types.

**Flow**:

* User chooses **Data Source** (predefined SQL).
* Sidebar lists **Fields** (`name`, `type`, `nullable`, `domainHint`).
* User drags fields into shelves → you update `ChartSpec.encodings`.
* Optional: pick **aggregation** (sum/avg/count), **date binning**, **sort**, **top N** on each shelf via inline controls.

---

## 2) What to save (specs & layout)

### 2.1 Minimal, Vega-Lite-ish `ChartSpec`

Keep it small but expressive and stable to map into Recharts.

```json
{
  "vizType": "line|bar|pie|table",
  "dataSourceId": "sales_by_day",
  "params": { "startDate": "2025-06-01", "endDate": "2025-08-06", "officeId": 12 },
  "transform": {
    "filters": [
      { "field": "status", "op": "in", "value": ["Closed Won", "Closed Lost"] }
    ],
    "bin": [{ "field": "created_at", "unit": "day" }],
    "aggregate": [
      { "op": "sum", "field": "amount", "as": "amount_sum" }
    ],
    "sort": [{ "field": "created_at", "dir": "asc" }],
    "limit": 5000
  },
  "encodings": {
    "x":   { "field": "created_at", "type": "temporal" },
    "y":   { "field": "amount_sum", "type": "quantitative" },
    "series": { "field": "rep_name", "type": "nominal", "optional": true },
    "tooltip": ["rep_name", "amount_sum", "created_at"]
  },
  "options": {
    "title": "Sales by Day",
    "legend": true,
    "stack": false,
    "numberFormat": "0,0.[00]"
  }
}
```

### 2.2 `DataSource` (saved SQL as source of truth)

```json
{
  "id": "sales_by_day",
  "label": "Sales by Day",
  "engine": "mysql",
  "sql": "/* uses :startDate, :endDate, :officeId */ SELECT ...",
  "params": [
    { "name": "startDate", "type": "date", "required": true },
    { "name": "endDate", "type": "date", "required": true },
    { "name": "officeId", "type": "int", "required": false }
  ],
  "fields": [
    { "name": "created_at", "type": "temporal" },
    { "name": "amount", "type": "number" },
    { "name": "rep_name", "type": "string" }
  ],
  "rowLimitDefault": 10000,
  "timeoutMs": 10000
}
```

### 2.3 Dashboard + Cards

* **Dashboard**: `{ id, ownerUserId, name, description, layout: GridItem[], theme, createdAt, updatedAt }`
* **Card**: `{ id, dashboardId, title, layout: {i,x,y,w,h}, chartSpec: ChartSpec, refreshIntervalSec }`

---

## 3) Recharts rendering adapter

Create a `renderChart(spec, data)` adapter that:

* Executes pivots/grouping based on `encodings.series` (multi-line/stacked bars).
* Applies `aggregate` client-side only if the SQL doesn’t, but prefer doing it **in SQL** via provided definitions/params.
* Handles date binning (`day|week|month`) in SQL when possible; fall back to client binning only for small datasets.
* Maps to Recharts components:

  * `line` → `LineChart` with dynamic `<Line dataKey=... />` per series
  * `bar` → `BarChart` with `stack` option
  * `pie` → `PieChart` using single series and category
  * `table` → plain grid with sortable columns

---

## 4) Backend (GraphQL) shape

**Types**

```graphql
type Dashboard { id: ID!, name: String!, layout: [GridItem!]!, cards: [Card!]! }
type GridItem { i: ID!, x: Int!, y: Int!, w: Int!, h: Int! }
type Card { id: ID!, title: String!, layout: GridItem!, chartSpec: JSON! }

type DataSource { id: ID!, label: String!, params: [Param!]!, fields: [Field!]! }
type Param { name: String!, type: String!, required: Boolean! }
type Field { name: String!, type: String! }

type Query {
  dashboards: [Dashboard!]!
  dashboard(id: ID!): Dashboard
  dataSources: [DataSource!]!
  dataSource(id: ID!): DataSource
  runChart(spec: JSON!): ChartResult!  # server executes SQL + returns rows
}

type ChartResult { rows: [JSON!]!, meta: JSON }
type Mutation {
  createDashboard(name: String!): Dashboard!
  updateDashboardLayout(id: ID!, layout: [GridItemInput!]!): Dashboard!
  upsertCard(dashboardId: ID!, card: CardInput!): Card!
  deleteCard(id: ID!): Boolean!
}
```

**Server execution**

* Validate `spec.dataSourceId`, bind `spec.params`, enforce `timeoutMs` and `rowLimit`.
* Return rows + meta (field types, execution time).
* Optional: cache query results keyed by `(dataSourceId, params, specHash)` with short TTL.

---

## 5) Builder UX details

* **Fields panel**: searchable; badges for type (`#`, `ABC`, `🗓️`).
* **Shelves**: droppable zones with inline controls for aggregation (`SUM/AVG/COUNT`), binning (`day/week/month`), sorting, top-N.
* **Filters**: a dedicated shelf using the same drag-in pattern → opens a condition editor (`op: in/=/between/contains`).
* **Live Preview**: runs `runChart(spec)` on debounce (e.g., 300–500ms).
* **Versioning**: store `card.version` and keep `card_history` for undo.

---

## 6) Persistence (MySQL)

Tables (simplified):

```sql
CREATE TABLE dashboards (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  owner_user_id BIGINT NOT NULL,
  name VARCHAR(255) NOT NULL,
  layout JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE cards (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  dashboard_id BIGINT NOT NULL,
  title VARCHAR(255) NOT NULL,
  layout JSON NOT NULL,        -- {i,x,y,w,h}
  chart_spec JSON NOT NULL,    -- ChartSpec
  refresh_interval_sec INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (dashboard_id) REFERENCES dashboards(id) ON DELETE CASCADE
);

CREATE TABLE data_sources (
  id VARCHAR(128) PRIMARY KEY,
  label VARCHAR(255) NOT NULL,
  engine VARCHAR(32) NOT NULL,
  sql MEDIUMTEXT NOT NULL,
  params JSON NOT NULL,
  fields JSON NOT NULL,
  row_limit_default INT NOT NULL,
  timeout_ms INT NOT NULL
);
```

---

## 7) Performance & safety

* **Server-side pagination** and **row limits** for tables.
* **Time-boxed queries** with kill-switch (MySQL `MAX_EXECUTION_TIME`).
* **Downsampling** for dense time series (bin to day/hour in SQL).
* **RBAC**: dashboards are private by default; add sharing later.

---

## 8) Example saved artifacts

**KPI card** (single number):

```json
{ "vizType": "table", "dataSourceId": "kpi_total_sales",
  "transform": { "aggregate": [{ "op": "sum", "field": "amount", "as": "total" }] },
  "encodings": { "columns": ["total"] },
  "options": { "style": "kpi" }
}
```

**Stacked bar (sales by rep monthly)**:

```json
{
  "vizType": "bar",
  "dataSourceId": "sales_by_month_rep",
  "transform": { "bin": [{ "field": "created_at", "unit": "month" }], "aggregate": [{ "op": "sum", "field": "amount", "as": "sum_amount" }] },
  "encodings": { "x": {"field":"created_at","type":"temporal"}, "y":{"field":"sum_amount","type":"quantitative"}, "series":{"field":"rep_name","type":"nominal"} },
  "options": { "stack": true, "title": "Monthly Sales by Rep" }
}
```

This gives you a clean separation between **layout**, **chart spec**, and **data sources**, while making the DnD builder straightforward and the Recharts renderer predictable.
