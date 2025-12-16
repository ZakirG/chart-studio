# AI Agent Prompts for Frontend Implementation

This document provides a series of structured prompts for an AI coding agent to build the frontend of the CRM Reporting & Dashboard Platform. Each prompt corresponds to a major feature set outlined in the project's implementation plan.

```text
1. [✅] Project Foundation and Core Layout

Human User Actions:
- Create an account on Clerk.com.
- Create a new project in the Clerk dashboard and select "Next.js".
- In your local project directory, create a new file named .env.local.
- Copy the environment variables (NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, CLERK_SECRET_KEY, etc.) from the Clerk dashboard into your .env.local file.

AI Prompt:
- Initialize a new Next.js 14+ project in the current directory using `npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"`.
- Install ShadCN using `pnpm dlx shadcn-ui@latest init`. Accept the defaults.
- Add the following core ShadCN components: `button`, `card`, `dropdown-menu`, `skeleton`, and `sonner` (for toasts).
- Install Clerk for Next.js: `pnpm install @clerk/nextjs`.
- Integrate ClerkJS for authentication:
  - Wrap the root layout (`app/layout.tsx`) with `<ClerkProvider>`.
  - Create the standard sign-in (`/sign-in/[[...sign-in]]`), sign-up (`/sign-up/[[...sign-up]]`), and user profile (`/user-profile/[[...user-profile]]`) pages using Clerk's pre-built components.
  - Create a `middleware.ts` file at the root of the project to protect all routes by default, redirecting unauthenticated users to the sign-in page.
- Create the main application shell:
  - Create a main layout component for authenticated pages. This component should render a header and a primary sidebar.
  - The header should contain the company logo (use a placeholder) and Clerk's `<UserButton />`.
  - The sidebar should contain Next.js `<Link>` components for "Dashboards" (`/dashboards`), "Data Explorer" (`/explorer`), and "Templates" (`/templates`). Create placeholder pages for these routes.
- Integrate Magic UI's "Blur Fade" component for animations by running `pnpm dlx shadcn-ui@latest add "https://magicui.design/r/blur-fade"`.
- Once all steps are complete, run `pnpm run dev` to start the development server.

Unit Test:
- File: `src/components/layout/sidebar.test.tsx`
- Test that the sidebar component renders three links with the correct `href` attributes: `/dashboards`, `/explorer`, and `/templates`.

AI Browser Test:
- Navigate to the root URL (`/`).
- The test should assert that the browser is redirected to the `/sign-in` page.
- The test should assert that the sign-in page contains the text "Sign in to your account".

Human User Test:
1. Access the application's root URL. Verify you are redirected to the `/sign-in` page.
2. Create a new account and sign in successfully.
3. After login, verify you are redirected to the dashboards list page (`/dashboards`).
4. Verify the layout shows a persistent header with a user profile icon and a left sidebar with navigation links.
5. Click the links in the sidebar and verify navigation to the correct (currently empty) pages.
6. Sign out via the user profile button in the header and verify you are returned to the sign-in page.

---

2. [✅] Dashboard Picker and Management

Human User Actions:
- Ensure a mock GraphQL backend is running and accessible.
- The backend must provide mock implementations for the following GraphQL operations: `getDashboards`, `createDashboard`, `duplicateDashboard`, `deleteDashboard`, and `updateDashboard`.

AI Prompt:
- Create the main dashboard picker interface at `app/dashboards/page.tsx`.
- Implement a category-based organization system as specified in the implementation plan (Sales & Performance, Financial, etc.). Fetch and display dashboards from the mock backend.
- Display dashboards in a responsive grid. Each dashboard card should show a thumbnail preview (placeholder), title, description, and last modified date.
- Install `react-hook-form` and `zod` (`pnpm install react-hook-form zod @hookform/resolvers`).
- Implement modals for "Create New Dashboard", "Duplicate Dashboard", and "Edit Metadata". Use `react-hook-form` and `zod` for type-safe form management and validation in these modals.
- Install GraphQL and code generation tools: `pnpm install @apollo/client graphql graphql-ws` and `pnpm install -D @graphql-codegen/cli @graphql-codegen/client-preset`.
- Create a `codegen.ts` configuration file. Configure it to generate TypeScript types and React hooks from your GraphQL schema and operations, placing the output in `src/graphql/generated/`.
- Define the necessary GraphQL operations (`getDashboards`, `createDashboard`, etc.) in `.graphql` files.
- Run the code generator to create the hooks.
- Use the generated `useGetDashboardsQuery` to fetch the list of dashboards and the corresponding mutations (`useCreateDashboardMutation`, etc.) to implement the dashboard actions.
- Update the main dashboard page route to `/dashboards/[dashboardId]`.
- Start the development server with `pnpm run dev`.

Unit Test:
- File: `src/components/dashboard/create-dashboard-form.test.tsx`
- Test the "Create New Dashboard" form.
- Assert that the form shows validation errors from `zod` when the name is empty and the form is submitted.
- Assert that the `onSubmit` function is called with the correct data when the form is valid and submitted.

AI Browser Test:
1. After logging in, navigate to `/dashboards`.
2. Assert that dashboard cards are visible.
3. Find and click the "Create New Dashboard" button.
4. Assert that a modal opens containing input fields for "Name" and "Description".
5. Close the modal and check for console errors on the browser.

Human User Test:
1. Navigate to `/dashboards` after logging in. Verify the dashboard picker shows categorized dashboard cards.
2. Filter dashboards by category and verify the correct dashboards appear.
3. Click "Create New Dashboard", fill in details, and verify it appears in the "Custom" category.
4. Use the duplicate action on an existing dashboard and verify the copy is created.
5. Click on a dashboard card and verify it navigates to `/dashboards/[id]`.

---

3. [✅] Static Dashboard and Chart Rendering

Human User Actions:
- No specific actions are required if the previous steps are completed.

AI Prompt:
- Create the main dashboard page at `app/dashboards/[dashboardId]/page.tsx`.
- Install `react-grid-layout`: `pnpm install react-grid-layout` and `pnpm install -D @types/react-grid-layout`.
- Implement a static grid using the `<ResponsiveGridLayout>` component. Define a hardcoded `layout` array to position several items on the grid. Set `isDraggable` and `isResizable` to `false`.
- Create a `DashboardCard` component at `src/components/dashboard/card.tsx`. It should use a ShadCN `<Card>` and contain a header, title, and content area.
- Create a `ChartRenderer` component at `src/components/charts/renderer.tsx`.
- The `ChartRenderer` will accept a `ChartSpec` object (as defined in `_docs/recharts_charts_spec.md`) and a static `data` array as props. For this phase, you will hardcode both inside the component.
- Based on `spec.type`, the `ChartRenderer` will render the correct chart (`bar`, `line`, `pie`, `table`) using `recharts`.
- Assemble the page: in `app/dashboards/[dashboardId]/page.tsx`, map over the hardcoded layout array, rendering a `DashboardCard` for each item. Inside each card, place the `ChartRenderer` with a corresponding hardcoded `ChartSpec`.
- Start the development server with `pnpm run dev`.

Unit Test:
- File: `src/components/charts/renderer.test.tsx`
- Create a test for the `ChartRenderer` component.
- Pass a hardcoded `ChartSpec` for a 'bar' chart and a static data array.
- Assert that the component renders a `<BarChart>` component from Recharts.
- Repeat for 'line' and 'pie' chart types.

AI Browser Test:
1. After logging in, navigate to `/dashboards/1` (or any other hardcoded ID).
2. Assert that a grid of cards is visible on the page.
3. Assert that at least four `svg` elements are present within the cards, indicating that the Recharts charts have been rendered.
4. Check for any console errors.

Human User Test:
1. Navigate to a specific dashboard page (`/dashboards/[id]`).
2. Verify a grid of several cards appears without fetching any data.
3. Verify that at least one line chart, one bar chart, one pie chart, and one data table are visible and correctly rendered within their cards.
4. Resize the browser window to confirm the grid layout is responsive.
5. Verify that cards are not draggable or resizable.

---

4. [✅] Dynamic Data Integration with GraphQL

Human User Actions:
- Ensure the GraphQL backend is running.
- The backend must correctly implement the `getDashboard(id: ID!)` query, which should return dashboard metadata, layout, and a list of cards, each containing a `ChartSpec` JSON object.
- The backend must correctly implement the `executeChart(spec: JSON!)` query, which should accept a `ChartSpec` object and return data rows.

AI Prompt:
- Configure Apollo Client for the Next.js App Router. Use the `@apollo/client/experimental-nextjs-app-support` package for integration with Server Components and caching.
- In `app/dashboards/[dashboardId]/page.tsx`, replace the static layout and data with a call to the generated `useGetDashboardQuery` hook to fetch the dashboard data dynamically.
- Modify the `DashboardCard` component to receive a `ChartSpec` object as a prop.
- Modify the `ChartRenderer` component. Remove the hardcoded data and use the generated `useExecuteChartQuery` hook to fetch its own data based on the `ChartSpec` prop it receives.
- Implement loading and error states:
  - On the main dashboard page, render a full-page skeleton UI while the `useGetDashboardQuery` is loading.
  - Inside `ChartRenderer`, use the `loading` and `error` states from `useExecuteChartQuery`. Render a ShadCN `<Skeleton>` component while loading and an error message if an error occurs.
- Start the development server with `pnpm run dev`.

Unit Test:
- File: `src/components/charts/renderer-dynamic.test.tsx`
- Write a test for the dynamic `ChartRenderer`.
- Use `@apollo/client/testing` to mock the `ApolloProvider`.
- Provide a mock response for the `executeChart` query.
- Assert that the component initially renders the loading state (`<Skeleton>`).
- After the data is "fetched", assert that it renders the correct chart.
- Test the error state by providing an error in the mock response.

AI Browser Test:
1. After logging in, navigate to a dashboard page (`/dashboards/[id]`).
2. The test should first assert the presence of skeleton loader elements.
3. After a short wait, the test should assert that the skeleton loaders are gone and that `svg` elements (the charts) are now visible.
4. Check for any console errors.

Human User Test:
1. Navigate to the dashboard page.
2. Verify that skeleton loaders are displayed briefly for each card position.
3. Verify that the cards then populate with charts rendered using data fetched from the backend.
4. If possible, configure the backend to return an error for one card's query and verify that card displays an error message while others load successfully.

---

5. [✅] Dashboard Layout Interactivity

Human User Actions:
- Ensure the backend has a working `updateDashboardLayout(id: ID!, layout: JSON!)` GraphQL mutation.

AI Prompt:
- Install `use-debounce`: `pnpm install use-debounce`.
- In the dashboard page (`app/dashboards/[dashboardId]/page.tsx`), enable interactivity in the `<ResponsiveGridLayout>` component by setting `isDraggable` and `isResizable` to `true`.
- Implement the `onLayoutChange` callback on the grid component.
- Inside the `onLayoutChange` handler, use the `useUpdateDashboardLayoutMutation` hook (generated by the codegen) to persist the new layout.
- Wrap the mutation call in a `useDebouncedCallback` from `use-debounce` with a delay of 500ms to prevent excessive API calls.
- Implement user feedback using `sonner`. Show a "Saving layout..." toast when the debounced function is called and then "Layout saved!" or "Failed to save layout" based on the mutation's success or failure.
- Start the development server with `pnpm run dev`.

Unit Test:
- Given the reliance on hooks and external libraries, an end-to-end test is more valuable. A unit test could mock `useDebouncedCallback` and the mutation hook to verify they are called with the correct parameters, but this provides limited value.

AI Browser Test:
1. After logging in, navigate to a dashboard page.
2. The test should use Playwright's `dragAndDrop` action to move a dashboard card.
3. After the drag, assert that a toast notification with the text "Saving layout..." appears.
4. Subsequently, assert that a toast with the text "Layout saved!" appears.
5. Check for any console errors.

Human User Test:
1. On the dashboard, click and drag a card to a new position.
2. Resize a card using its resize handle.
3. After you stop interacting, verify a toast notification appears indicating the save operation.
4. Reload the browser page. Verify the dashboard loads with the new, persisted layout.

---

6. [✅] Data Explorer: Layout and Schema Browser

Human User Actions:
- Ensure the GraphQL backend provides a `getSchemaMetadata` query that returns a list of database tables, with their columns, types, and key constraints.

AI Prompt:
- Install `react-resizable-panels`: `pnpm install react-resizable-panels`.
- Create the main page at `app/explorer/page.tsx`.
- Use `react-resizable-panels` to create a three-panel layout: a collapsible left sidebar for the schema and a main area split vertically for the SQL editor and results.
- Implement a `SchemaBrowser` component in the left panel.
- This component will use a `useGetSchemaMetadataQuery` hook to fetch schema data.
- Display the schema in a collapsible tree view (e.g., using ShadCN's `Collapsible` or a similar component). Tables should be expandable to show columns.
- Add a search box to filter tables/columns and a "Refresh" button to refetch the schema.
- Create a `Toolbar` component above the main workspace with placeholder buttons for "Run," "Cancel," and "Export."
- Start the development server with `pnpm run dev`.

Unit Test:
- File: `src/components/explorer/schema-browser.test.tsx`
- Test the filtering logic of the `SchemaBrowser`.
- Provide a mock schema with a few tables and columns.
- Simulate typing a search term into the filter input.
- Assert that the displayed list of tables/columns is correctly filtered.

AI Browser Test:
1. After logging in, navigate to `/explorer`.
2. Assert that the resizable panel group element is present.
3. Assert that the schema browser area contains text corresponding to mock table names fetched from the backend.
4. Check for any console errors.

Human User Test:
1. Navigate to the `/explorer` page.
2. Verify the three-panel layout is visible and resizable.
3. Verify the schema browser is populated with tables and columns from the backend.
4. Use the search box to filter the schema tree.
5. Click the "Refresh" button and verify the schema reloads.

---

7. [✅] Data Explorer: SQL Editor

Human User Actions:
- No specific actions are required if the previous step is completed.

AI Prompt:
- Install CodeMirror 6 dependencies: `pnpm install @uiw/react-codemirror @codemirror/lang-sql @codemirror/autocomplete`.
- Create a `SqlEditor` component that wraps the CodeMirror 6 editor.
- Use the schema data fetched in the parent `/explorer` page.
- Configure the editor with the `sql()` language extension for syntax highlighting.
- Implement a custom autocomplete extension using `autocompletion` from `@codemirror/autocomplete`. The completion source function should be aware of the database schema and provide context-aware suggestions for:
  - SQL keywords.
  - Table names (especially after `FROM` or `JOIN`).
  - Column names (especially after a table alias and a dot, e.g., `alias.`).
- Implement basic client-side linting to forbid multiple statements (disallow `;`) and any statements other than `SELECT`. Display an error if validation fails.
- Start the development server with `pnpm run dev`.

Unit Test:
- File: `src/components/explorer/autocomplete.test.ts`
- Write a unit test for the autocomplete source logic.
- This test will not involve React components. It will be a pure function test.
- Mock the editor state and schema.
- Call the completion source function with a context object representing `SELECT * FROM my_table_alias.`
- Assert that the returned completion results include the columns for `my_table`.

AI Browser Test:
1. After logging in, navigate to `/explorer`.
2. Type `SELECT` into the editor. Assert that the text is highlighted correctly.
3. Type `FROM `. Assert that an autocomplete dropdown appears with table names.
4. Type a table name, an alias, and a dot (e.g., `customers c.`). Assert that a new autocomplete dropdown appears with column names for the `customers` table.

Human User Test:
1. In the editor, type a `SELECT` query. Verify syntax is highlighted.
2. As you type `FROM `, verify a dropdown of table names appears.
3. After selecting a table and typing an alias and a dot (e.g., `t.`), verify its columns appear as suggestions.
4. Attempt to type `DELETE FROM ...`. Verify a client-side validation error appears.

---

8. [✅] Data Explorer: Execution, Results, and Polish

Human User Actions:
- Ensure the backend has working `executeSql(sql: String!)` and `cancelQuery(runId: ID!)` GraphQL mutations.

AI Prompt:
- Install AG Grid: `pnpm install ag-grid-react ag-grid-community`.
- Wire up the "Run" button in the toolbar to trigger the `useExecuteSqlMutation`.
- Display loading and error states for the query.
- Create a `ResultsTable` component that uses AG Grid. It should dynamically generate columns based on the returned data and display the rows. AG Grid handles virtualization automatically.
- Display the execution summary (e.g., execution time, rows returned) above the results table.
- Wire up the "Export" button to use AG Grid's built-in `gridApi.exportDataAsCsv()` function.
- Wire up the "Cancel" button to the `cancelQuery` mutation.
- Persist the SQL editor's content to `localStorage` on change to prevent data loss on reload.
- Install `react-hotkeys-hook`: `pnpm install react-hotkeys-hook`.
- Implement a keyboard shortcut (`Cmd+Enter` or `Ctrl+Enter`) to run the query.
- Start the development server with `pnpm run dev`.

Unit Test:
- A unit test for `localStorage` persistence can be written to verify that `localStorage.setItem` is called when the editor content changes.

AI Browser Test:
1. Navigate to `/explorer`. Type a valid SQL query (e.g., `SELECT * FROM customers LIMIT 10`).
2. Press `Cmd+Enter`.
3. Assert that a loading indicator appears.
4. Assert that the AG Grid table is populated with result rows.
5. Reload the page. Assert that the query `SELECT * FROM customers LIMIT 10` is still present in the editor.

Human User Test:
1. Run a valid query. Verify a loading indicator appears, and then results are rendered in the AG Grid table.
2. Run a long-running query and click "Cancel". Verify the query stops.
3. Click a column header to sort the data.
4. Click the "Export to CSV" button and verify a file is downloaded.
5. Type a query, reload the page, and verify your text is restored.
6. Press `Cmd/Ctrl+Enter` and verify the query executes.

---

9. [✅] Visual Chart Builder

Human User Actions:
- Ensure the backend `executeChart(spec: JSON!)` query is robust.
- Ensure the backend has a working `upsertCard(dashboardId: ID!, chartSpec: JSON!)` mutation.

AI Prompt:
- Install `@dnd-kit/core`: `pnpm install @dnd-kit/core`.
- Create the chart builder UI, either as a full-screen modal or a new page at `/dashboards/[dashboardId]/cards/[cardId]/edit`.
- The UI should have a left panel listing available data source fields and a main area with drop targets ("shelves") for encodings like X-Axis, Y-Axis, and Series.
- Use `useState` to manage the current `ChartSpec` object in state.
- Use `@dnd-kit/core` to implement drag-and-drop. When a field is dropped onto a shelf, update the `ChartSpec` state accordingly.
- Use a `useEffect` hook that listens for changes to the `ChartSpec`. Inside, use a debounced call to the `executeChart` GraphQL query.
- Feed the data returned from the query into a live preview instance of the `ChartRenderer` component.
- The "Save" button should trigger a `useUpsertCardMutation`, sending the final `ChartSpec` object to the backend. Use a `zod` schema based on the `ChartSpec` type to validate the spec before saving.
- Start the development server with `pnpm run dev`.

Unit Test:
- File: `src/lib/chart-spec-builder.test.ts`
- Test the helper functions that manipulate the `ChartSpec` state.
- For example, create a function `setX(spec, field)`. Write a test that provides an initial spec and a field, and asserts that the returned spec is correctly updated.

AI Browser Test:
1. From a dashboard, click a mock "Edit Card" button to open the builder.
2. Use Playwright actions to drag a "field" element to a "shelf" element.
3. Assert that the chart preview area updates (e.g., by checking for a change in an `svg` element).
4. Click "Save". Assert that the builder closes.

Human User Test:
1. From a dashboard, click an "Add Card" or "Edit Card" button to open the builder.
2. Select a Data Source and verify the Fields panel populates.
3. Drag fields to the "X-Axis" and "Y-Axis" shelves.
4. Verify that a live chart preview appears and updates with data.
5. Drag a field to the "Series" shelf. Verify the preview updates to a multi-series chart.
6. Click "Save". Verify the builder closes and the card on the dashboard reflects the new visualization.

```

### Parallel Implementation Guidelines

To accelerate development, the following prompts can be worked on in parallel after the initial foundation is complete. The key is to ensure the core application shell and authentication are stable before branching out into feature work.

**Step 1: Foundational (Sequential)**
*   **Prompt 1 (Project Foundation)** must be completed first. It establishes the entire project structure, authentication, and navigation shell that all other features depend on.

**Step 2: Parallel Feature Development**
Once Prompt 1 is complete, the following three tracks can be developed in parallel by different developers or agents, as they are largely independent features:

*   **Track A: Dashboard Management (Sequential)**
    *   Start with **Prompt 2 (Dashboard Picker and Management)**. This track focuses on the lifecycle of a dashboard entity.

*   **Track B: Data Explorer (Sequential)**
    *   This is a self-contained feature. Work through **Prompts 6, 7, and 8** in sequence.
        1.  **Prompt 6 (Layout and Schema Browser)**
        2.  **Prompt 7 (SQL Editor)**
        3.  **Prompt 8 (Execution and Results)**

*   **Track C: Core Charting UI (Sequential)**
    *   Start with **Prompt 3 (Static Dashboard and Chart Rendering)**. This can be done without a live backend, allowing UI and component development to proceed independently.

**Step 3: Integration and Interactivity (Sequential, Depends on Tracks A & C)**
After Tracks A and C are sufficiently mature, the following prompts can be addressed. They integrate the UI with live data and add interactivity.

1.  **Prompt 4 (Dynamic Data Integration)**: This requires the dashboard management UI from Track A (Prompt 2) and the static chart components from Track C (Prompt 3).
2.  **Prompt 5 (Dashboard Layout Interactivity)**: This builds directly on Prompt 4.
3.  **Prompt 9 (Visual Chart Builder)**: This can be started once Prompt 4 is complete, as it depends on the dynamic `ChartRenderer` and the `executeChart` data flow. It can be developed in parallel with Prompt 5.

