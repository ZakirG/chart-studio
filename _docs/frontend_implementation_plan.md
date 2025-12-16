# Frontend Implementation Plan

This document outlines the phased implementation plan for the frontend of the AI-First CRM Reporting & Dashboard Platform. The plan is based on the technical and product requirements specified in the project documentation. It uses the tech stack defined in `_docs/general_plan.md` and aims to deliver core features in a structured, testable, and efficient manner.

The plan assumes the existence of a GraphQL backend that implements the schema defined in `_docs/initial_plan.md`. The frontend will be built with Next.js, TypeScript, TailwindCSS, ShadCN, Recharts, and ClerkJS. To accelerate development and improve quality, this plan incorporates the following key libraries:
*   **GraphQL Code Generator**: For generating TypeScript types and React hooks from GraphQL schemas, eliminating manual type definitions and reducing runtime errors.
*   **React Hook Form & Zod**: For robust, type-safe form management and validation in all user-input forms (e.g., creating dashboards, editing cards).
*   **use-debounce**: For debouncing expensive operations like layout saving and live data previews.
*   **AG Grid Community**: For a feature-rich, virtualized data grid in the Data Explorer, providing sorting, filtering, and CSV export out of the box.
*   **ChartSpec Object**: A declarative, JSON-serializable object for defining chart configurations, as detailed in `_docs/recharts_charts_spec.md`. This spec will be the source of truth for rendering charts and executing data queries.

---

## Phase A: Project Foundation and Core Layout

**Goal**: Establish the Next.js project structure, integrate authentication, and build the main application shell that provides consistent navigation and user context.

**Implementation Details**:
1.  **Project Initialization**: Use `create-next-app` to scaffold a new Next.js 14+ project with the App Router, TypeScript, and Tailwind CSS.
2.  **Component Library**: Initialize ShadCN by running `pnpm dlx shadcn-ui@latest init`. This will set up `components.json` and create the `components` and `lib/utils.ts` directories. Install core components like `button`, `card`, `dropdown-menu`, `skeleton`, and `toast` (via `sonner`).
3.  **Authentication**: Integrate ClerkJS for user management.
    *   Wrap the root layout (`app/layout.tsx`) with Clerk's `<ClerkProvider>`.
    *   Create standard sign-in (`/sign-in/[[...sign-in]]`), sign-up (`/sign-up/[[...sign-up]]`), and user profile pages using Clerk's pre-built components.
    *   Implement `middleware.ts` at the root to protect all routes by default, redirecting unauthenticated users to the sign-in page.
4.  **Application Shell**:
    *   Create a main layout component that will be shared across authenticated pages. This component will render a header and a primary sidebar.
    *   **Header**: The header will be a simple bar containing the company logo and a `<UserButton />` from Clerk on the right to manage user profile and sign-out.
    *   **Sidebar**: The sidebar will contain navigation links for "Dashboards", "Data Explorer", and "Templates". These will be simple Next.js `<Link>` components pointing to placeholder pages for now (`/dashboards`, `/explorer`, `/templates`).
5.  **Animations**: As per `general_plan.md`, integrate Magic UI's "Blur Fade" component for future use in loading animations. This involves adding the component source via the `shadcn-ui add` command with the specified URL.

**Human-Performed UI Test**:
1.  Access the application's root URL. Verify you are redirected to the `/sign-in` page.
2.  Create a new account and sign in successfully.
3.  After login, verify you are redirected to the dashboards list page (`/dashboards`).
4.  Verify the layout shows a persistent header with a user profile icon and a left sidebar with navigation links.
5.  Clicking the links in the sidebar navigates to the correct (currently empty) pages.
6.  The user can sign out via the user profile button in the header.

---

## Phase B: Dashboard Picker and Multi-Dashboard Management

**Goal**: Implement the dashboard picker interface with pre-built categories and enable users to create, duplicate, and manage multiple dashboards as required by the project specifications.

**Implementation Details**:
1.  **Dashboard List Page**: Create `app/dashboards/page.tsx` as the main dashboard picker interface.
2.  **Dashboard Categories**: Implement a category-based organization system with the following pre-built categories matching the project requirements:
    *   **Sales & Performance**: Sales Performance Report, Company Performance Report, Referral Source Report
    *   **Financial**: Accounts Receivable Report, Commission Report, Sales Tax Report, Invoice Report, Payments Report
    *   **Operations**: Document Status Report, Work Order Report, Job Schedules Report, Appointments Report
    *   **Administrative**: Master List Report, Clock In & Out Report, User Activity Report
    *   **Custom**: User-created dashboards
3.  **Dashboard Grid**: Display dashboards in a responsive grid layout with thumbnail previews, titles, descriptions, and last modified dates.
4.  **Dashboard Actions**: Implement dashboard management functionality using **react-hook-form** and **zod** for all modals (Create, Duplicate, Edit Metadata) to ensure type-safe inputs and streamlined validation.
    *   **Create New Dashboard**: Modal or page (`/dashboards/new`) with name, description, and category selection.
    *   **Duplicate Dashboard**: Copy existing dashboard with all cards and layout.
    *   **Delete Dashboard**: Confirmation modal with permanent deletion.
    *   **Edit Metadata**: Rename dashboard, change description, update category.
5.  **GraphQL Operations & Type Generation**:
    *   Define necessary GraphQL operations for dashboard management: `getDashboards`, `createDashboard`, `duplicateDashboard`, `deleteDashboard`, and `updateDashboard`.
    *   Configure **GraphQL Code Generator** to automatically generate TypeScript types and React hooks from these GraphQL operations. This will be used in all subsequent phases.
6.  **Navigation**: Update the main dashboard page route to `/dashboards/[dashboardId]` and ensure proper breadcrumbs and navigation between the picker and individual dashboards.

**Human-Performed UI Test**:
1.  Navigate to `/dashboards` after logging in. Verify the dashboard picker shows categorized dashboard cards.
2.  Filter dashboards by category and verify the correct dashboards appear.
3.  Click "Create New Dashboard", fill in details, and verify it appears in the appropriate category.
4.  Use the duplicate action on an existing dashboard and verify the copy is created.
5.  Navigate to a specific dashboard (`/dashboards/[id]`) and verify it loads the dashboard view.
6.  Use breadcrumb navigation to return to the dashboard picker.

---

## Phase C: Static Dashboard and Chart Rendering

**Goal**: Visually construct the dashboard UI by rendering a static, hardcoded grid of charts. This phase focuses purely on the presentation layer without backend data.

**Implementation Details**:
1.  **Dashboard Page**: Create the main dashboard page at `app/dashboards/[dashboardId]/page.tsx`.
2.  **Grid Layout**: Use `react-grid-layout` to implement the dashboard's grid system.
    *   In the dashboard page, use the `<ResponsiveGridLayout>` component.
    *   Define a hardcoded `layout` array of objects (each with `i, x, y, w, h`) to position items on the grid.
3.  **Card Component**: Create a `DashboardCard` component at `components/dashboard/card.tsx`. It will use a ShadCN `<Card>` as its root element, containing `<CardHeader>`, `<CardTitle>`, and `<CardContent>`.
4.  **Chart Rendering Logic**: Create a generic `ChartRenderer` component at `components/charts/renderer.tsx`.
    *   This component will accept a `ChartSpec` object (as defined in `_docs/recharts_charts_spec.md`) and use it to drive rendering.
    *   For this phase, the component will be provided with a hardcoded `ChartSpec` object and a static `data` array.
    *   It will use a `switch` statement on the `spec.type` property to render the correct chart (`bar`, `line`, `pie`) using Recharts.
    *   A basic table will also be supported. Map visualization is deferred as an optional extension.
5.  **Assembly**: In the dashboard page, map over the hardcoded layout array. For each item, render a `div` with the appropriate `key` and `data-grid` properties for `react-grid-layout`. Inside each `div`, place a `DashboardCard` containing the `ChartRenderer` with a corresponding hardcoded `ChartSpec`.

**Human-Performed UI Test**:
1.  Navigate to a specific dashboard page (`/dashboards/[id]`) after logging in.
2.  Verify a grid of several cards appears without fetching any data.
3.  Verify that at least one line chart, one bar chart, one pie chart, and one data table are visible and correctly rendered within their cards.
4.  Resize the browser window to confirm that the grid layout is responsive. Cards should not be draggable or resizable.

---

## Phase D: Dynamic Data Integration with GraphQL

**Goal**: Replace the static, hardcoded dashboard content with live data fetched from the GraphQL backend. This phase focuses on data fetching, caching, and handling loading/error states.

**Implementation Details**:
1.  **GraphQL Client Setup**: Configure Apollo Client for the Next.js App Router using the official `@apollo/client/experimental-nextjs-app-support` package for seamless integration with Server Components and caching.
2.  **GraphQL Queries**: Use the hooks generated by **GraphQL Code Generator** to fetch data.
    *   `useGetDashboardQuery`: Fetches dashboard metadata, including layout and a list of cards, each containing a `ChartSpec` JSON object.
    *   `useExecuteChartQuery`: Executes a `ChartSpec` and returns rows of data. This query will pass the entire `spec.data` object to the backend, which is responsible for generating and executing the SQL.
    *   Note: Coordinate with backend team to ensure their `executeChart` mutation correctly interprets the `ChartSpec` object as defined in `_docs/recharts_charts_spec.md`.
3.  **Dynamic Dashboard Page**: In `app/dashboards/[dashboardId]/page.tsx`, use the `useGetDashboardQuery` hook to fetch the dashboard data, including the `ChartSpec` for each card.
4.  **Dynamic Chart Data**: Modify the `DashboardCard` to pass the `ChartSpec` object it receives to the `ChartRenderer` component. The `ChartRenderer` will be responsible for calling the `useExecuteChartQuery` hook with the `ChartSpec` to fetch its own data.
5.  **Loading & Error States**:
    *   While the main `useGetDashboardQuery` is loading, render a full-page skeleton UI.
    *   Inside `DashboardCard`, use the `loading` and `error` states from its `useExecuteChartQuery` hook. When `loading`, render a ShadCN `<Skeleton>` component. If an `error` occurs, display an error message within the card.

**Human-Performed UI Test**:
1.  Navigate to the dashboard page.
2.  Verify that skeleton loaders are displayed briefly for each card position.
3.  Verify that the cards then populate with charts rendered using data fetched from the backend.
4.  If the backend is configured to return an error for one of the `executeChart` calls, verify that the corresponding card displays an error message while other cards load successfully.

---

## Phase E: Dashboard Layout Interactivity

**Goal**: Enable users to customize their dashboards by dragging and resizing cards, and persist these layout changes to the backend.

**Implementation Details**:
1.  **Enable Grid Interactivity**: In the `<ResponsiveGridLayout>` component, set the props `isDraggable` and `isResizable` to `true`.
2.  **Layout Change Handling**: Implement the `onLayoutChange` callback on the grid component. This function receives the new layout array whenever a user interacts with a card.
3.  **GraphQL Mutation**: Use the generated `useUpdateDashboardLayoutMutation` hook.
4.  **Persisting Changes**: In the `onLayoutChange` handler, call the `updateDashboardLayout` mutation. Use the **use-debounce** hook to prevent excessive API requests during rapid interaction.
5.  **User Feedback**: Implement optimistic UI updates. Update the component's local state immediately. Use a toast notification to show "Saving..." and "Layout saved!" or "Failed to save layout" based on the mutation result.

**Human-Performed UI Test**:
1.  On the dashboard, click and drag a card to a new position.
2.  Resize a card using its resize handle.
3.  After interaction, verify a toast notification appears indicating the save operation.
4.  Reload the browser page. Verify the dashboard loads with the new, persisted layout.

---

## Phase F: Data Explorer Implementation

**Goal**: Build a production-grade data exploration tool for advanced users, featuring a schema browser, a powerful SQL editor with robust autocomplete, and a virtualized results viewer with export capabilities.

**Implementation Details**:
1.  **High-Level Architecture & Page Structure**:
    *   Create the main page at `app/explorer/page.tsx`.
    *   Use `react-resizable-panels` to establish a three-panel layout:
        *   **Schema Sidebar**: A collapsible left panel for browsing database schemas and tables.
        *   **Main Workspace**: A vertically split area containing the SQL Editor (top) and the Results Table (bottom).
    *   Implement a **Toolbar** above the editor for primary actions like "Run," "Cancel," and "Export."

2.  **Schema Browser Component**:
    *   This component will fetch database metadata (tables, columns, types, keys) via a `getSchemaMetadata` GraphQL query upon loading.
    *   It will display the schema in a collapsible tree view. Each table will be expandable to show its columns, types, and primary/foreign key indicators.
    *   A search box will allow for filtering of tables and columns.
    *   A "Refresh Metadata" button will be available to invalidate any caches and refetch the schema.

3.  **SQL Editor Core (CodeMirror 6)**:
    *   Create a dedicated `SqlEditor` component that wraps the CodeMirror 6 editor.
    *   Utilize `@codemirror/lang-sql` for syntax highlighting and `@codemirror/autocomplete` for the completion engine.
    *   **Autocomplete Strategy**: The completion provider will be hooked into the schema metadata. It will intelligently suggest:
        *   SQL keywords (`SELECT`, `WHERE`, `GROUP BY`, etc.).
        *   Table names after `FROM` or `JOIN` clauses.
        *   Column names specific to the tables present in the query, especially after a table alias and a dot (e.g., `c.`).
        *   **Bonus**: Propose `JOIN` conditions based on foreign key relationships defined in the schema.
    *   Implement basic client-side linting to forbid multiple statements (disallow `;`) and non-`SELECT` queries.

4.  **Query Execution & Data Handling**:
    *   The "Run" button triggers an `executeSql(sql: String!)` GraphQL mutation.
    *   The "Cancel" button triggers a `cancelQuery(runId: ID!)` mutation to halt long-running queries on the backend.
    *   The frontend will manage loading, error, and success states for the query execution lifecycle.

5.  **Results Table Component**:
    *   Integrate **AG Grid Community** to replace a manually constructed table. This provides virtualization, sorting, column resizing, and CSV export out-of-the-box, significantly reducing implementation time.
    *   A summary of the execution will be displayed (e.g., execution time, rows returned).

6.  **Data Export**:
    *   For small-to-medium datasets, use the built-in CSV export functionality of **AG Grid**.
    *   For very large datasets, retain the option to call a dedicated backend REST endpoint that streams results, as this is more robust than client-side exporting.

7.  **UX Polish**:
    *   Persist the content of the SQL editor to `localStorage` to prevent users from losing work on a page reload.
    *   Use **react-hotkeys-hook** to implement keyboard shortcuts, such as `Cmd/Ctrl+Enter` to run the current query, providing a reliable cross-platform experience.

**Human-Performed UI Test**:
1.  Navigate to the `/explorer` page. Verify the three-panel layout is visible and the schema browser is populated with tables and columns from the backend.
2.  Type a `SELECT` query in the editor. Verify that SQL syntax is highlighted correctly.
3.  As you type `FROM `, verify that a dropdown of table names appears. After selecting a table alias and typing a dot (e.g., `t.`), verify that its columns appear as suggestions.
4.  Run a valid query. Verify a loading indicator appears, and then the results are rendered in the virtualized table below the editor. The execution time and row count should be displayed.
5.  Run a known long-running query and click "Cancel". Verify the query stops and the results pane shows a "Cancelled" status message.
6.  Click a column header in the results grid to sort the data. Verify the rows re-order correctly.
7.  Click the "Export to CSV" button in the AG Grid toolbar. Verify a CSV file containing the currently displayed result set is downloaded.
8.  Type a query into the editor, then reload the browser page. Verify your query text is restored.
9.  Press `Cmd/Ctrl+Enter`. Verify the query executes as if the "Run" button was clicked.
10. Attempt to run a `DELETE` statement. Verify that a client-side validation error appears and prevents the query from being sent.

---

## Phase G: Visual Chart Builder

**Goal**: Create an intuitive, drag-and-drop interface for users to build or edit visualizations without writing SQL.

**Implementation Details**:
1.  **Builder UI Surface**: Implement the builder in a full-screen modal or a dedicated page (e.g., `/dashboards/[dashboardId]/cards/[cardId]/edit`).
2.  **Layout**: The builder UI will have a fields panel on the left (draggable items) and a main area with encoding shelves (drop targets) and a live chart preview. Use `@dnd-kit/core` for all drag-and-drop functionality.
3.  **State Management**: Use `useState` or a simple reducer to manage the current `ChartSpec` object in the builder's local state. The structure of this state will adhere strictly to the `ChartSpec` type definition from `_docs/recharts_charts_spec.md`.
4.  **Drag-and-Drop Logic**: When a field is dropped onto a shelf (e.g., X-Axis, Y-Axis, Series), update the `ChartSpec` state accordingly. For example, dropping a field on the X-Axis shelf updates `spec.encodings.x`. Inline controls on shelves for aggregation or date binning will also directly modify the `ChartSpec` object.
5.  **Live Data Preview**: Use a `useEffect` hook that listens for changes to the `ChartSpec` object. Inside the effect, make a debounced call to the `executeChart` GraphQL query using **use-debounce**, passing the current `spec`. Feed the returned data into a live preview instance of the `ChartRenderer`.
6.  **Persistence**: A "Save" button will trigger the `useUpsertCardMutation` hook, sending the final, validated `ChartSpec` object to the backend for storage. Form management will use **react-hook-form** with a **zod** schema based on the `ChartSpec` definition to ensure validity.

**Human-Performed UI Test**:
1.  From a dashboard, click an "Add Card" or "Edit Card" button. Verify the builder UI opens.
2.  Select a Data Source. Verify the Fields panel populates.
3.  Drag fields to the "X-Axis" and "Y-Axis" shelves.
4.  Verify that a live chart preview appears and updates with data from the backend.
5.  Drag a field to the "Series" shelf. Verify the preview updates to a multi-series chart.
6.  Click "Save". Verify the builder closes and the card on the dashboard reflects the new visualization.

