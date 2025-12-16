Here’s a concrete, implementation-focused plan for the SQL editor that meets all requirements and plugs cleanly into your Next.js + GraphQL stack.

---

## 1) High-level architecture

**Client (Next.js)**

* **SQLWorkspace** page composed of:

  * **SchemaSidebar** (tables/columns, search, refresh)
  * **SQLEditor** (Monaco or CodeMirror 6)
  * **Toolbar** (run/cancel, row-limit, timeout, export CSV/JSON, “Save as Card/DataSource”)
  * **ParamsPanel** (named parameters when using org templates)
  * **ResultsTable** (virtualized grid, paging, column sorting)

**Server (Node + GraphQL)**

* **Metadata service**: caches table/column/keys/types from `information_schema`, exposes to client.
* **Query service**: validates, parameterizes, executes **SELECT-only** SQL with enforced timeout + row limits; streams results.
* **Export service (REST)**: re-executes the last validated query and streams CSV/JSON. (Use REST for file streaming; keep GraphQL for everything else.)

**DB (MySQL 8)**

* Read-only user for editor; `SELECT`, `SHOW VIEW`, `EXPLAIN`.
* Enforce `MAX_EXECUTION_TIME` and server-side `LIMIT`.

---

## 2) Editor core (syntax highlighting + autocomplete)

**Editor library**:

* Prefer **Monaco** (VS Code engine). It has SQL highlighting and a robust completion API.
* Alternative: **CodeMirror 6** with `@codemirror/lang-sql` and custom completion sources.

**Autocomplete strategy**:

* On load, call `schemaMetadata { tables { name, schema, approxRows } columns { table, name, type, nullable } foreignKeys { table, column, refTable, refColumn } }`.
* Build in-memory indexes:

  * `tablesByName`, `columnsByTable`, `fkMap`.
* Register a completion provider that:

  * Suggests **keywords** (SELECT, WHERE, GROUP BY…).
  * Suggests **tables** after `FROM / JOIN / UPDATE <space>` etc.
  * Suggests **columns** after `SELECT`, after `<table>.`, or when a table alias is detected.
  * Bonus: **join suggestions**—if the caret is after `JOIN` and a left table is known, propose right tables via `fkMap` with an auto-snippet `ON left.col = right.ref_col`.
* Add **hover provider** for columns (type, nullability, FK badge) and **signature help** for functions.
* Add **lint**: simple client check forbids `;` separated multiple statements and non-SELECT verbs.

*Pseudo (Monaco)*:

```ts
monaco.languages.registerCompletionItemProvider('sql', {
  triggerCharacters: ['.', ' ', '\n'],
  provideCompletionItems(model, position) {
    const ctx = extractSqlContext(model.getValue(), position); // finds clause, aliases
    if (ctx.afterDot) return columnCompletions(ctx.tableOrAlias);
    if (ctx.inFromOrJoin) return tableCompletions();
    if (ctx.inSelectOrWhere) return keywordAndColumnCompletions(ctx.visibleTables);
    return keywordCompletions();
  }
});
```

---

## 3) Schema/table browser

Left sidebar with:

* Search box; collapsible schemas.
* For each table: name, approx row count, last analyzed (from cached metadata), expandable column list (name\:type, PK/FK badges).
* “Refresh Metadata” button → invalidates server cache and refetches.

**Metadata acquisition** (server):

* Query `information_schema.tables`, `information_schema.columns`, `information_schema.KEY_COLUMN_USAGE`.
* Optionally keep an hourly cache (in Redis or memory with ETag).
* Expose as GraphQL: `schemaMetadata` (versioned).

---

## 4) Query execution window

**Run** button:

* Collect SQL text + **bound params** (from ParamsPanel).
* Client does pre-validation (single statement, SELECT-only); server does authoritative validation:

  * Parse first token = `SELECT` or `WITH`.
  * Reject DDL/DML, comments with `/*+ */` allowed only for `MAX_EXECUTION_TIME`.
* Server adds safety:

  * Prepend optimizer hint: `/*+ MAX_EXECUTION_TIME(10000) */` using the requested timeout (cap at e.g. 30s).
  * Append `LIMIT :rowLimit` if none present (cap e.g. 10k).
* Execute via a dedicated connection; capture **connection\_id** to support **cancel** (server can `KILL QUERY <id>`).
* Stream rows back; client renders progressively (or page in 500–1000 row chunks).

**Cancel**:

* Client sends `cancelQuery(jid)`; server calls `KILL QUERY` using saved connection id; return `cancelled:true`.

**Explain** (optional):

* Button to run `EXPLAIN FORMAT=JSON <query>`; display plan in a drawer.

---

## 5) Results table

* Use a virtualized grid (e.g., **AG Grid**, **MUI DataGrid**, or **react-virtuoso**).
* Features: column resize, sort (client-side for current page; server-side if you re-issue with `ORDER BY`), copy cell/row, “Open as chart” for quick visualization prototype.
* Show execution time, rows returned, truncated note if `LIMIT` hit.

---

## 6) CSV/JSON export

* Toolbar buttons call **REST** endpoints: `/export/csv?token=...` or `/export/json?token=...`.
* The token references a **server-side stored, validated query** (SQL + bound params + row limit + timeout + userId + createdAt).
* Server re-executes with a safe **export cap** (e.g., 250k rows) and streams as a file.
* Client initiates download; include column headers; UTF-8 with BOM optional.

---

## 7) Using existing org SQL as a base

* Provide a **Templates** dropdown above the editor: list of **DataSources** (the org’s vetted SQL), each with **named params**.
* When the user picks a template:

  * Load SQL into editor with **parameter placeholders** (e.g., `:startDate`, `:officeId`).
  * Right-side **ParamsPanel** renders inputs based on the DataSource’s `params` spec (type, required, options).
  * Users may edit the SQL locally; keep a banner “Derived from: Sales by Month v3”.
  * “Save as Card” wraps the query + presentation settings into a `ChartSpec` and stores a reference to `dataSourceId` or saves a new `ad_hoc` DataSource (if allowed).

**Parameter binding**:

* Strictly use prepared statements / named parameter binding server-side (no string interpolation).
* Validate param types and value ranges against the DataSource `params` spec.

---

## 8) Governance, safety, observability

* **Read-only DB user** for editor.
* **Statement guard**: hard reject anything not starting with `SELECT` or `WITH` (case-insensitive). No `;`.
* **Timeout + row cap** always enforced server-side, regardless of client request.
* **Rate limiting** per user; concurrent query cap (e.g., 2).
* **Audit log** table: userId, sqlHash, rowCount, durationMs, cancelled, timestamp.
* **Query cache** (optional): hash(SQL+params+limit) → short TTL result cache for repeated runs.

---

## 9) GraphQL surface

```graphql
type SchemaMetadata {
  version: String!
  tables: [Table!]!
  columns: [Column!]!
  foreignKeys: [ForeignKey!]!
}
type Table { schema: String!, name: String!, approxRows: Int }
type Column { table: String!, name: String!, type: String!, nullable: Boolean! }
type ForeignKey { table: String!, column: String!, refTable: String!, refColumn: String! }

type QueryRunHandle { id: ID!, startedAt: String! }
type QueryResultPage { columns: [String!]!, rows: [JSON!]!, hasMore: Boolean!, nextOffset: Int }

type Query {
  schemaMetadata: SchemaMetadata!
  startQuery(sql: String!, params: JSON, rowLimit: Int, timeoutMs: Int): QueryRunHandle!
  fetchPage(id: ID!, offset: Int, size: Int): QueryResultPage!
  explain(sql: String!, params: JSON): JSON
  dataSources: [DataSource!]!
}
type Mutation {
  cancelQuery(id: ID!): Boolean!
  saveAsCard(input: SaveCardInput!): Card!
}
```

> For exports, use REST: `/export/:id.csv` and `/export/:id.json`.

---

## 10) UX polish & performance

* Debounce `Run` on param edits (300–500ms) with a visible “Running…” state and partial row count ticker.
* Keep **sticky errors** per result pane, not global (one bad query shouldn’t break the editor).
* Support **query tabs** with independent run states.
* Persist editor content to localStorage keyed by user+tab to avoid losing work.
* Add **keyboard shortcuts**: `Cmd/Ctrl+Enter` run, `Esc` cancel, `Cmd/Ctrl+S` save as card.

---

## 11) “Save as Card/DataSource” flow

* When saving, prompt for:

  * Name, category, visibility (private/shared), default params, and suggested viz (table/line/bar).
* Create or reference a **DataSource** entry (org-approved) and attach a **ChartSpec** for dashboard use.
* Version the DataSource (e.g., `sales_by_month@3`) to keep old cards stable.

---

This plan gives you a production-grade SQL editor with strong UX, safe execution, and a clean bridge to your dashboarding flow—without reinventing the wheel. If you want, I can sketch the Monaco completion provider and the server’s validation/binding middleware in code next.
