import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
const defaultOptions = {} as const;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  JSON: { input: any; output: any; }
};

export type Card = {
  __typename?: 'Card';
  chartSpec: Scalars['JSON']['output'];
  id: Scalars['ID']['output'];
};

export type ChartExecutionMeta = {
  __typename?: 'ChartExecutionMeta';
  durationMs: Scalars['Int']['output'];
  rowCount: Scalars['Int']['output'];
};

export type ChartExecutionResult = {
  __typename?: 'ChartExecutionResult';
  meta: ChartExecutionMeta;
  rows: Array<Scalars['JSON']['output']>;
};

export type ColumnMetadata = {
  __typename?: 'ColumnMetadata';
  isForeignKey: Scalars['Boolean']['output'];
  isPrimaryKey: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  nullable: Scalars['Boolean']['output'];
  referencedColumn?: Maybe<Scalars['String']['output']>;
  referencedTable?: Maybe<Scalars['String']['output']>;
  type: Scalars['String']['output'];
};

export type CreateDashboardInput = {
  category: Scalars['String']['input'];
  description?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
};

export type Dashboard = {
  __typename?: 'Dashboard';
  cards?: Maybe<Array<Card>>;
  category: Scalars['String']['output'];
  createdAt: Scalars['String']['output'];
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  lastModified: Scalars['String']['output'];
  layout?: Maybe<Scalars['JSON']['output']>;
  name: Scalars['String']['output'];
};

export type Mutation = {
  __typename?: 'Mutation';
  cancelQuery: Scalars['Boolean']['output'];
  createDashboard: Dashboard;
  deleteCard: Scalars['Boolean']['output'];
  deleteDashboard: Scalars['Boolean']['output'];
  duplicateDashboard: Dashboard;
  executeSql: SqlExecutionResult;
  updateDashboard: Dashboard;
  updateDashboardLayout: Dashboard;
  upsertCard: Card;
};


export type MutationCancelQueryArgs = {
  runId: Scalars['ID']['input'];
};


export type MutationCreateDashboardArgs = {
  input: CreateDashboardInput;
};


export type MutationDeleteCardArgs = {
  cardId: Scalars['ID']['input'];
  dashboardId: Scalars['ID']['input'];
};


export type MutationDeleteDashboardArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDuplicateDashboardArgs = {
  id: Scalars['ID']['input'];
};


export type MutationExecuteSqlArgs = {
  sql: Scalars['String']['input'];
};


export type MutationUpdateDashboardArgs = {
  id: Scalars['ID']['input'];
  input: UpdateDashboardInput;
};


export type MutationUpdateDashboardLayoutArgs = {
  id: Scalars['ID']['input'];
  layout: Scalars['JSON']['input'];
};


export type MutationUpsertCardArgs = {
  cardId?: InputMaybe<Scalars['ID']['input']>;
  chartSpec: Scalars['JSON']['input'];
  dashboardId: Scalars['ID']['input'];
};

export type Query = {
  __typename?: 'Query';
  dashboard?: Maybe<Dashboard>;
  dashboards: Array<Dashboard>;
  executeChart: ChartExecutionResult;
  getSchemaMetadata: SchemaMetadata;
};


export type QueryDashboardArgs = {
  id: Scalars['ID']['input'];
};


export type QueryExecuteChartArgs = {
  spec: Scalars['JSON']['input'];
};

export type SchemaMetadata = {
  __typename?: 'SchemaMetadata';
  tables: Array<TableMetadata>;
};

export type SqlExecutionResult = {
  __typename?: 'SqlExecutionResult';
  columns: Array<Scalars['String']['output']>;
  executionTimeMs: Scalars['Int']['output'];
  rowCount: Scalars['Int']['output'];
  rows: Array<Scalars['JSON']['output']>;
  runId: Scalars['ID']['output'];
  status: Scalars['String']['output'];
};

export type TableMetadata = {
  __typename?: 'TableMetadata';
  columns: Array<ColumnMetadata>;
  name: Scalars['String']['output'];
  type: Scalars['String']['output'];
};

export type UpdateDashboardInput = {
  category?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
};

export type GetDashboardsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetDashboardsQuery = { __typename?: 'Query', dashboards: Array<{ __typename?: 'Dashboard', id: string, name: string, description?: string | null, category: string, lastModified: string, createdAt: string, cards?: Array<{ __typename?: 'Card', id: string, chartSpec: any }> | null }> };

export type GetDashboardQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetDashboardQuery = { __typename?: 'Query', dashboard?: { __typename?: 'Dashboard', id: string, name: string, description?: string | null, category: string, lastModified: string, createdAt: string, layout?: any | null, cards?: Array<{ __typename?: 'Card', id: string, chartSpec: any }> | null } | null };

export type CreateDashboardMutationVariables = Exact<{
  input: CreateDashboardInput;
}>;


export type CreateDashboardMutation = { __typename?: 'Mutation', createDashboard: { __typename?: 'Dashboard', id: string, name: string, description?: string | null, category: string, lastModified: string, createdAt: string } };

export type UpdateDashboardMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: UpdateDashboardInput;
}>;


export type UpdateDashboardMutation = { __typename?: 'Mutation', updateDashboard: { __typename?: 'Dashboard', id: string, name: string, description?: string | null, category: string, lastModified: string, createdAt: string } };

export type DuplicateDashboardMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DuplicateDashboardMutation = { __typename?: 'Mutation', duplicateDashboard: { __typename?: 'Dashboard', id: string, name: string, description?: string | null, category: string, lastModified: string, createdAt: string } };

export type DeleteDashboardMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteDashboardMutation = { __typename?: 'Mutation', deleteDashboard: boolean };

export type UpdateDashboardLayoutMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  layout: Scalars['JSON']['input'];
}>;


export type UpdateDashboardLayoutMutation = { __typename?: 'Mutation', updateDashboardLayout: { __typename?: 'Dashboard', id: string, name: string, description?: string | null, category: string, lastModified: string, createdAt: string, layout?: any | null, cards?: Array<{ __typename?: 'Card', id: string, chartSpec: any }> | null } };

export type ExecuteChartQueryVariables = Exact<{
  spec: Scalars['JSON']['input'];
}>;


export type ExecuteChartQuery = { __typename?: 'Query', executeChart: { __typename?: 'ChartExecutionResult', rows: Array<any>, meta: { __typename?: 'ChartExecutionMeta', rowCount: number, durationMs: number } } };

export type GetSchemaMetadataQueryVariables = Exact<{ [key: string]: never; }>;


export type GetSchemaMetadataQuery = { __typename?: 'Query', getSchemaMetadata: { __typename?: 'SchemaMetadata', tables: Array<{ __typename?: 'TableMetadata', name: string, type: string, columns: Array<{ __typename?: 'ColumnMetadata', name: string, type: string, nullable: boolean, isPrimaryKey: boolean, isForeignKey: boolean, referencedTable?: string | null, referencedColumn?: string | null }> }> } };

export type ExecuteSqlMutationVariables = Exact<{
  sql: Scalars['String']['input'];
}>;


export type ExecuteSqlMutation = { __typename?: 'Mutation', executeSql: { __typename?: 'SqlExecutionResult', runId: string, columns: Array<string>, rows: Array<any>, rowCount: number, executionTimeMs: number, status: string } };

export type CancelQueryMutationVariables = Exact<{
  runId: Scalars['ID']['input'];
}>;


export type CancelQueryMutation = { __typename?: 'Mutation', cancelQuery: boolean };

export type UpsertCardMutationVariables = Exact<{
  dashboardId: Scalars['ID']['input'];
  cardId?: InputMaybe<Scalars['ID']['input']>;
  chartSpec: Scalars['JSON']['input'];
}>;


export type UpsertCardMutation = { __typename?: 'Mutation', upsertCard: { __typename?: 'Card', id: string, chartSpec: any } };

export type DeleteCardMutationVariables = Exact<{
  dashboardId: Scalars['ID']['input'];
  cardId: Scalars['ID']['input'];
}>;


export type DeleteCardMutation = { __typename?: 'Mutation', deleteCard: boolean };


export const GetDashboardsDocument = gql`
    query GetDashboards {
  dashboards {
    id
    name
    description
    category
    lastModified
    createdAt
    cards {
      id
      chartSpec
    }
  }
}
    `;

/**
 * __useGetDashboardsQuery__
 *
 * To run a query within a React component, call `useGetDashboardsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetDashboardsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetDashboardsQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetDashboardsQuery(baseOptions?: Apollo.QueryHookOptions<GetDashboardsQuery, GetDashboardsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetDashboardsQuery, GetDashboardsQueryVariables>(GetDashboardsDocument, options);
      }
export function useGetDashboardsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetDashboardsQuery, GetDashboardsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetDashboardsQuery, GetDashboardsQueryVariables>(GetDashboardsDocument, options);
        }
export function useGetDashboardsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetDashboardsQuery, GetDashboardsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetDashboardsQuery, GetDashboardsQueryVariables>(GetDashboardsDocument, options);
        }
export type GetDashboardsQueryHookResult = ReturnType<typeof useGetDashboardsQuery>;
export type GetDashboardsLazyQueryHookResult = ReturnType<typeof useGetDashboardsLazyQuery>;
export type GetDashboardsSuspenseQueryHookResult = ReturnType<typeof useGetDashboardsSuspenseQuery>;
export type GetDashboardsQueryResult = Apollo.QueryResult<GetDashboardsQuery, GetDashboardsQueryVariables>;
export const GetDashboardDocument = gql`
    query GetDashboard($id: ID!) {
  dashboard(id: $id) {
    id
    name
    description
    category
    lastModified
    createdAt
    layout
    cards {
      id
      chartSpec
    }
  }
}
    `;

/**
 * __useGetDashboardQuery__
 *
 * To run a query within a React component, call `useGetDashboardQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetDashboardQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetDashboardQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useGetDashboardQuery(baseOptions: Apollo.QueryHookOptions<GetDashboardQuery, GetDashboardQueryVariables> & ({ variables: GetDashboardQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetDashboardQuery, GetDashboardQueryVariables>(GetDashboardDocument, options);
      }
export function useGetDashboardLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetDashboardQuery, GetDashboardQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetDashboardQuery, GetDashboardQueryVariables>(GetDashboardDocument, options);
        }
export function useGetDashboardSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetDashboardQuery, GetDashboardQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetDashboardQuery, GetDashboardQueryVariables>(GetDashboardDocument, options);
        }
export type GetDashboardQueryHookResult = ReturnType<typeof useGetDashboardQuery>;
export type GetDashboardLazyQueryHookResult = ReturnType<typeof useGetDashboardLazyQuery>;
export type GetDashboardSuspenseQueryHookResult = ReturnType<typeof useGetDashboardSuspenseQuery>;
export type GetDashboardQueryResult = Apollo.QueryResult<GetDashboardQuery, GetDashboardQueryVariables>;
export const CreateDashboardDocument = gql`
    mutation CreateDashboard($input: CreateDashboardInput!) {
  createDashboard(input: $input) {
    id
    name
    description
    category
    lastModified
    createdAt
  }
}
    `;
export type CreateDashboardMutationFn = Apollo.MutationFunction<CreateDashboardMutation, CreateDashboardMutationVariables>;

/**
 * __useCreateDashboardMutation__
 *
 * To run a mutation, you first call `useCreateDashboardMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateDashboardMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createDashboardMutation, { data, loading, error }] = useCreateDashboardMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreateDashboardMutation(baseOptions?: Apollo.MutationHookOptions<CreateDashboardMutation, CreateDashboardMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreateDashboardMutation, CreateDashboardMutationVariables>(CreateDashboardDocument, options);
      }
export type CreateDashboardMutationHookResult = ReturnType<typeof useCreateDashboardMutation>;
export type CreateDashboardMutationResult = Apollo.MutationResult<CreateDashboardMutation>;
export type CreateDashboardMutationOptions = Apollo.BaseMutationOptions<CreateDashboardMutation, CreateDashboardMutationVariables>;
export const UpdateDashboardDocument = gql`
    mutation UpdateDashboard($id: ID!, $input: UpdateDashboardInput!) {
  updateDashboard(id: $id, input: $input) {
    id
    name
    description
    category
    lastModified
    createdAt
  }
}
    `;
export type UpdateDashboardMutationFn = Apollo.MutationFunction<UpdateDashboardMutation, UpdateDashboardMutationVariables>;

/**
 * __useUpdateDashboardMutation__
 *
 * To run a mutation, you first call `useUpdateDashboardMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateDashboardMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateDashboardMutation, { data, loading, error }] = useUpdateDashboardMutation({
 *   variables: {
 *      id: // value for 'id'
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUpdateDashboardMutation(baseOptions?: Apollo.MutationHookOptions<UpdateDashboardMutation, UpdateDashboardMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpdateDashboardMutation, UpdateDashboardMutationVariables>(UpdateDashboardDocument, options);
      }
export type UpdateDashboardMutationHookResult = ReturnType<typeof useUpdateDashboardMutation>;
export type UpdateDashboardMutationResult = Apollo.MutationResult<UpdateDashboardMutation>;
export type UpdateDashboardMutationOptions = Apollo.BaseMutationOptions<UpdateDashboardMutation, UpdateDashboardMutationVariables>;
export const DuplicateDashboardDocument = gql`
    mutation DuplicateDashboard($id: ID!) {
  duplicateDashboard(id: $id) {
    id
    name
    description
    category
    lastModified
    createdAt
  }
}
    `;
export type DuplicateDashboardMutationFn = Apollo.MutationFunction<DuplicateDashboardMutation, DuplicateDashboardMutationVariables>;

/**
 * __useDuplicateDashboardMutation__
 *
 * To run a mutation, you first call `useDuplicateDashboardMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDuplicateDashboardMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [duplicateDashboardMutation, { data, loading, error }] = useDuplicateDashboardMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useDuplicateDashboardMutation(baseOptions?: Apollo.MutationHookOptions<DuplicateDashboardMutation, DuplicateDashboardMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<DuplicateDashboardMutation, DuplicateDashboardMutationVariables>(DuplicateDashboardDocument, options);
      }
export type DuplicateDashboardMutationHookResult = ReturnType<typeof useDuplicateDashboardMutation>;
export type DuplicateDashboardMutationResult = Apollo.MutationResult<DuplicateDashboardMutation>;
export type DuplicateDashboardMutationOptions = Apollo.BaseMutationOptions<DuplicateDashboardMutation, DuplicateDashboardMutationVariables>;
export const DeleteDashboardDocument = gql`
    mutation DeleteDashboard($id: ID!) {
  deleteDashboard(id: $id)
}
    `;
export type DeleteDashboardMutationFn = Apollo.MutationFunction<DeleteDashboardMutation, DeleteDashboardMutationVariables>;

/**
 * __useDeleteDashboardMutation__
 *
 * To run a mutation, you first call `useDeleteDashboardMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteDashboardMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteDashboardMutation, { data, loading, error }] = useDeleteDashboardMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useDeleteDashboardMutation(baseOptions?: Apollo.MutationHookOptions<DeleteDashboardMutation, DeleteDashboardMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<DeleteDashboardMutation, DeleteDashboardMutationVariables>(DeleteDashboardDocument, options);
      }
export type DeleteDashboardMutationHookResult = ReturnType<typeof useDeleteDashboardMutation>;
export type DeleteDashboardMutationResult = Apollo.MutationResult<DeleteDashboardMutation>;
export type DeleteDashboardMutationOptions = Apollo.BaseMutationOptions<DeleteDashboardMutation, DeleteDashboardMutationVariables>;
export const UpdateDashboardLayoutDocument = gql`
    mutation UpdateDashboardLayout($id: ID!, $layout: JSON!) {
  updateDashboardLayout(id: $id, layout: $layout) {
    id
    name
    description
    category
    lastModified
    createdAt
    layout
    cards {
      id
      chartSpec
    }
  }
}
    `;
export type UpdateDashboardLayoutMutationFn = Apollo.MutationFunction<UpdateDashboardLayoutMutation, UpdateDashboardLayoutMutationVariables>;

/**
 * __useUpdateDashboardLayoutMutation__
 *
 * To run a mutation, you first call `useUpdateDashboardLayoutMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateDashboardLayoutMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateDashboardLayoutMutation, { data, loading, error }] = useUpdateDashboardLayoutMutation({
 *   variables: {
 *      id: // value for 'id'
 *      layout: // value for 'layout'
 *   },
 * });
 */
export function useUpdateDashboardLayoutMutation(baseOptions?: Apollo.MutationHookOptions<UpdateDashboardLayoutMutation, UpdateDashboardLayoutMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpdateDashboardLayoutMutation, UpdateDashboardLayoutMutationVariables>(UpdateDashboardLayoutDocument, options);
      }
export type UpdateDashboardLayoutMutationHookResult = ReturnType<typeof useUpdateDashboardLayoutMutation>;
export type UpdateDashboardLayoutMutationResult = Apollo.MutationResult<UpdateDashboardLayoutMutation>;
export type UpdateDashboardLayoutMutationOptions = Apollo.BaseMutationOptions<UpdateDashboardLayoutMutation, UpdateDashboardLayoutMutationVariables>;
export const ExecuteChartDocument = gql`
    query ExecuteChart($spec: JSON!) {
  executeChart(spec: $spec) {
    rows
    meta {
      rowCount
      durationMs
    }
  }
}
    `;

/**
 * __useExecuteChartQuery__
 *
 * To run a query within a React component, call `useExecuteChartQuery` and pass it any options that fit your needs.
 * When your component renders, `useExecuteChartQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useExecuteChartQuery({
 *   variables: {
 *      spec: // value for 'spec'
 *   },
 * });
 */
export function useExecuteChartQuery(baseOptions: Apollo.QueryHookOptions<ExecuteChartQuery, ExecuteChartQueryVariables> & ({ variables: ExecuteChartQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ExecuteChartQuery, ExecuteChartQueryVariables>(ExecuteChartDocument, options);
      }
export function useExecuteChartLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ExecuteChartQuery, ExecuteChartQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ExecuteChartQuery, ExecuteChartQueryVariables>(ExecuteChartDocument, options);
        }
export function useExecuteChartSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ExecuteChartQuery, ExecuteChartQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<ExecuteChartQuery, ExecuteChartQueryVariables>(ExecuteChartDocument, options);
        }
export type ExecuteChartQueryHookResult = ReturnType<typeof useExecuteChartQuery>;
export type ExecuteChartLazyQueryHookResult = ReturnType<typeof useExecuteChartLazyQuery>;
export type ExecuteChartSuspenseQueryHookResult = ReturnType<typeof useExecuteChartSuspenseQuery>;
export type ExecuteChartQueryResult = Apollo.QueryResult<ExecuteChartQuery, ExecuteChartQueryVariables>;
export const GetSchemaMetadataDocument = gql`
    query GetSchemaMetadata {
  getSchemaMetadata {
    tables {
      name
      type
      columns {
        name
        type
        nullable
        isPrimaryKey
        isForeignKey
        referencedTable
        referencedColumn
      }
    }
  }
}
    `;

/**
 * __useGetSchemaMetadataQuery__
 *
 * To run a query within a React component, call `useGetSchemaMetadataQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetSchemaMetadataQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetSchemaMetadataQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetSchemaMetadataQuery(baseOptions?: Apollo.QueryHookOptions<GetSchemaMetadataQuery, GetSchemaMetadataQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetSchemaMetadataQuery, GetSchemaMetadataQueryVariables>(GetSchemaMetadataDocument, options);
      }
export function useGetSchemaMetadataLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetSchemaMetadataQuery, GetSchemaMetadataQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetSchemaMetadataQuery, GetSchemaMetadataQueryVariables>(GetSchemaMetadataDocument, options);
        }
export function useGetSchemaMetadataSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetSchemaMetadataQuery, GetSchemaMetadataQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetSchemaMetadataQuery, GetSchemaMetadataQueryVariables>(GetSchemaMetadataDocument, options);
        }
export type GetSchemaMetadataQueryHookResult = ReturnType<typeof useGetSchemaMetadataQuery>;
export type GetSchemaMetadataLazyQueryHookResult = ReturnType<typeof useGetSchemaMetadataLazyQuery>;
export type GetSchemaMetadataSuspenseQueryHookResult = ReturnType<typeof useGetSchemaMetadataSuspenseQuery>;
export type GetSchemaMetadataQueryResult = Apollo.QueryResult<GetSchemaMetadataQuery, GetSchemaMetadataQueryVariables>;
export const ExecuteSqlDocument = gql`
    mutation ExecuteSql($sql: String!) {
  executeSql(sql: $sql) {
    runId
    columns
    rows
    rowCount
    executionTimeMs
    status
  }
}
    `;
export type ExecuteSqlMutationFn = Apollo.MutationFunction<ExecuteSqlMutation, ExecuteSqlMutationVariables>;

/**
 * __useExecuteSqlMutation__
 *
 * To run a mutation, you first call `useExecuteSqlMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useExecuteSqlMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [executeSqlMutation, { data, loading, error }] = useExecuteSqlMutation({
 *   variables: {
 *      sql: // value for 'sql'
 *   },
 * });
 */
export function useExecuteSqlMutation(baseOptions?: Apollo.MutationHookOptions<ExecuteSqlMutation, ExecuteSqlMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<ExecuteSqlMutation, ExecuteSqlMutationVariables>(ExecuteSqlDocument, options);
      }
export type ExecuteSqlMutationHookResult = ReturnType<typeof useExecuteSqlMutation>;
export type ExecuteSqlMutationResult = Apollo.MutationResult<ExecuteSqlMutation>;
export type ExecuteSqlMutationOptions = Apollo.BaseMutationOptions<ExecuteSqlMutation, ExecuteSqlMutationVariables>;
export const CancelQueryDocument = gql`
    mutation CancelQuery($runId: ID!) {
  cancelQuery(runId: $runId)
}
    `;
export type CancelQueryMutationFn = Apollo.MutationFunction<CancelQueryMutation, CancelQueryMutationVariables>;

/**
 * __useCancelQueryMutation__
 *
 * To run a mutation, you first call `useCancelQueryMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCancelQueryMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [cancelQueryMutation, { data, loading, error }] = useCancelQueryMutation({
 *   variables: {
 *      runId: // value for 'runId'
 *   },
 * });
 */
export function useCancelQueryMutation(baseOptions?: Apollo.MutationHookOptions<CancelQueryMutation, CancelQueryMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CancelQueryMutation, CancelQueryMutationVariables>(CancelQueryDocument, options);
      }
export type CancelQueryMutationHookResult = ReturnType<typeof useCancelQueryMutation>;
export type CancelQueryMutationResult = Apollo.MutationResult<CancelQueryMutation>;
export type CancelQueryMutationOptions = Apollo.BaseMutationOptions<CancelQueryMutation, CancelQueryMutationVariables>;
export const UpsertCardDocument = gql`
    mutation UpsertCard($dashboardId: ID!, $cardId: ID, $chartSpec: JSON!) {
  upsertCard(dashboardId: $dashboardId, cardId: $cardId, chartSpec: $chartSpec) {
    id
    chartSpec
  }
}
    `;
export type UpsertCardMutationFn = Apollo.MutationFunction<UpsertCardMutation, UpsertCardMutationVariables>;

/**
 * __useUpsertCardMutation__
 *
 * To run a mutation, you first call `useUpsertCardMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpsertCardMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [upsertCardMutation, { data, loading, error }] = useUpsertCardMutation({
 *   variables: {
 *      dashboardId: // value for 'dashboardId'
 *      cardId: // value for 'cardId'
 *      chartSpec: // value for 'chartSpec'
 *   },
 * });
 */
export function useUpsertCardMutation(baseOptions?: Apollo.MutationHookOptions<UpsertCardMutation, UpsertCardMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpsertCardMutation, UpsertCardMutationVariables>(UpsertCardDocument, options);
      }
export type UpsertCardMutationHookResult = ReturnType<typeof useUpsertCardMutation>;
export type UpsertCardMutationResult = Apollo.MutationResult<UpsertCardMutation>;
export type UpsertCardMutationOptions = Apollo.BaseMutationOptions<UpsertCardMutation, UpsertCardMutationVariables>;
export const DeleteCardDocument = gql`
    mutation DeleteCard($dashboardId: ID!, $cardId: ID!) {
  deleteCard(dashboardId: $dashboardId, cardId: $cardId)
}
    `;
export type DeleteCardMutationFn = Apollo.MutationFunction<DeleteCardMutation, DeleteCardMutationVariables>;

/**
 * __useDeleteCardMutation__
 *
 * To run a mutation, you first call `useDeleteCardMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteCardMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteCardMutation, { data, loading, error }] = useDeleteCardMutation({
 *   variables: {
 *      dashboardId: // value for 'dashboardId'
 *      cardId: // value for 'cardId'
 *   },
 * });
 */
export function useDeleteCardMutation(baseOptions?: Apollo.MutationHookOptions<DeleteCardMutation, DeleteCardMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<DeleteCardMutation, DeleteCardMutationVariables>(DeleteCardDocument, options);
      }
export type DeleteCardMutationHookResult = ReturnType<typeof useDeleteCardMutation>;
export type DeleteCardMutationResult = Apollo.MutationResult<DeleteCardMutation>;
export type DeleteCardMutationOptions = Apollo.BaseMutationOptions<DeleteCardMutation, DeleteCardMutationVariables>;