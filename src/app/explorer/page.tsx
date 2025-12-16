'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useQuery, useMutation } from '@apollo/client'
import { gql } from '@apollo/client'
import { useHotkeys } from 'react-hotkeys-hook'
import { toast } from 'sonner'
import AppLayout from '@/components/layout/app-layout'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import { SchemaBrowser } from '@/components/explorer/schema-browser'
import { Toolbar } from '@/components/explorer/toolbar'
import { SqlEditor } from '@/components/explorer/sql-editor'
import { ResultsTable } from '@/components/explorer/results-table'
import { validateSqlQuery, ValidationError } from '@/components/explorer/sql-validation'

const GET_SCHEMA_METADATA = gql`
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
`

const EXECUTE_SQL = gql`
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
`

const CANCEL_QUERY = gql`
  mutation CancelQuery($runId: ID!) {
    cancelQuery(runId: $runId)
  }
`

interface SqlResult {
  runId: string
  columns: string[]
  rows: Record<string, any>[]
  rowCount: number
  executionTimeMs: number
  status: string
}

export default function ExplorerPage() {
  const [sqlQuery, setSqlQuery] = useState('-- Write your SQL query here\nSELECT * FROM customers LIMIT 10;')
  const [currentResult, setCurrentResult] = useState<SqlResult | null>(null)
  const [currentRunId, setCurrentRunId] = useState<string | null>(null)
  const resultsTableRef = useRef<{ exportToCsv: () => void }>(null)
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])
  const [resultsFadeIn, setResultsFadeIn] = useState(false)
  const [whiteFadeOpacity, setWhiteFadeOpacity] = useState(0)
  const [showResults, setShowResults] = useState(false)
  const [hasRunQuery, setHasRunQuery] = useState(false)
  const fadeTimeoutRef = useRef<any>(null)

  // Fetch schema metadata for autocomplete
  const { data: schemaData } = useQuery(GET_SCHEMA_METADATA, {
    fetchPolicy: 'cache-first',
  })

  // GraphQL mutations
  const [executeSql, { loading: isExecuting, error: executionError }] = useMutation(EXECUTE_SQL, {
    onCompleted: (data) => {
      const result = data.executeSql
      setCurrentResult(result)
      setCurrentRunId(null)
      toast.success(`Query completed in ${result.executionTimeMs}ms. ${result.rowCount} rows returned.`)

      console.log('🔄 Query completed, starting instant fade-in...')
      // Start fade immediately
      setShowResults(true)
      requestAnimationFrame(() => {
        console.log('🎯 Setting resultsFadeIn to true')
        setResultsFadeIn(true)
      })
    },
    onError: (error) => {
      toast.error(`Query failed: ${error.message}`)
      setCurrentRunId(null)
    }
  })

  const [cancelQuery] = useMutation(CANCEL_QUERY, {
    onCompleted: () => {
      toast.info('Query canceled')
      setCurrentRunId(null)
    },
    onError: (error) => {
      toast.error(`Failed to cancel query: ${error.message}`)
    }
  })

  const schema = schemaData?.getSchemaMetadata
  
  // Debug: Log schema data
  console.log('📊 Schema data in Explorer:', { 
    hasSchemaData: !!schemaData,
    hasSchema: !!schema,
    tablesCount: schema?.tables?.length || 0,
    tables: schema?.tables?.map((t: any) => ({ 
      name: t.name, 
      columnCount: t.columns?.length || 0,
      columns: t.columns?.map((c: any) => c.name) || []
    })) || []
  })

  // Handler functions
  const handleRunQuery = useCallback(async () => {
    if (!sqlQuery.trim()) {
      toast.error('Please enter a SQL query')
      return
    }

    console.log('🚀 Starting query execution...')
    // Mark that user has attempted to run a query
    setHasRunQuery(true)
    
    // Validate on run; show errors in results panel
    const errors = validateSqlQuery(sqlQuery)
    setValidationErrors(errors)
    setCurrentResult(null)
    setShowResults(false)
    setResultsFadeIn(false)
    if (errors.length > 0) {
      console.log('❌ Validation errors found, not executing')
      return
    }

    try {
      const result = await executeSql({
        variables: { sql: sqlQuery }
      })
      if (result.data?.executeSql) {
        setCurrentRunId(result.data.executeSql.runId)
      }
    } catch (error) {
      // Error is handled by the mutation's onError callback
    }
  }, [sqlQuery, executeSql])

  const handleCancelQuery = useCallback(() => {
    if (currentRunId) {
      cancelQuery({
        variables: { runId: currentRunId }
      })
    }
  }, [currentRunId, cancelQuery])

  const handleExportResults = useCallback(() => {
    if (resultsTableRef.current) {
      resultsTableRef.current.exportToCsv()
      toast.success('Results exported to CSV')
    }
  }, [])

  // Add keyboard shortcut for running queries
  useHotkeys('meta+enter, ctrl+enter', (event) => {
    event.preventDefault()
    handleRunQuery()
  }, {
    enableOnContentEditable: true,
    enableOnFormTags: true
  }, [handleRunQuery])

  // Debug state changes
  useEffect(() => {
    console.log('📊 State changed:', {
      showResults,
      resultsFadeIn,
      hasCurrentResult: !!currentResult,
      hasValidationErrors: validationErrors.length > 0,
      isExecuting
    })
  }, [showResults, resultsFadeIn, currentResult, validationErrors, isExecuting])

  // Fade-in effect for results when they load
  useEffect(() => {
    if (currentResult && validationErrors.length === 0 && !isExecuting) {
      setResultsFadeIn(false)
      // Trigger content fade-in
      const id = requestAnimationFrame(() => setResultsFadeIn(true))
      // Trigger white overlay fade-out
      setWhiteFadeOpacity(1)
      const id2 = requestAnimationFrame(() => setWhiteFadeOpacity(0))
      return () => {
        cancelAnimationFrame(id)
        cancelAnimationFrame(id2)
      }
    } else {
      setResultsFadeIn(false)
      setWhiteFadeOpacity(0)
    }
  }, [currentResult, validationErrors, isExecuting])

  // Keyboard shortcuts
  useHotkeys(['cmd+enter', 'ctrl+enter'], handleRunQuery, {
    enableOnFormTags: true,
    preventDefault: true,
  })

  // Determine the CSS class for results panel
  const getResultsPanelClass = () => {
    if (!hasRunQuery) return 'results-panel-visible'
    if (showResults && resultsFadeIn) return 'results-panel-visible'
    return 'results-panel-hidden'
  }

  return (
    <AppLayout>
      <style jsx>{`
        .results-panel-visible {
          transition: opacity 300ms ease-in-out;
          opacity: 1;
        }
        .results-panel-hidden {
          transition: opacity 300ms ease-in-out;
          opacity: 0;
        }
        .load-spinner {
          z-index: 50;
          position: relative;
        }
      `}</style>
      <div className="h-full flex flex-col">
        <div className="border-b border-gray-200 pb-4 mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Data Explorer</h1>
          <p className="mt-1 text-sm text-gray-600">
            Advanced SQL query interface for data exploration
          </p>
        </div>

        <Toolbar 
          onRun={handleRunQuery}
          onCancel={handleCancelQuery}
          onExport={handleExportResults}
          isRunning={isExecuting}
          hasResults={!!currentResult && currentResult.rows.length > 0}
        />

        <div className="flex-1 min-h-0">
          <PanelGroup direction="horizontal" className="h-full">
            {/* Left Panel - Schema Browser */}
            <Panel
              defaultSize={25}
              minSize={15}
              maxSize={40}
              className="bg-gray-50 border-r border-gray-200"
            >
              <SchemaBrowser />
            </Panel>

            <PanelResizeHandle className="w-1 bg-gray-200 hover:bg-gray-300 transition-colors" />

            {/* Main Panel - SQL Editor and Results */}
            <Panel defaultSize={75} minSize={60}>
              <PanelGroup direction="vertical" className="h-full">
                {/* SQL Editor Panel */}
                <Panel
                  defaultSize={50}
                  minSize={30}
                  className="border-b border-gray-200"
                >
                  <div className="h-full bg-white p-4">
                    <div className="mb-2">
                      <h3 className="text-sm font-medium text-gray-900 mb-1">SQL Query</h3>
                      <p className="text-xs text-gray-600">
                        Write SELECT queries to explore your data. Start typing for table/column suggestions, or use Ctrl+Space to trigger autocomplete.
                      </p>
                    </div>
                    <SqlEditor
                      value={sqlQuery}
                      onChange={setSqlQuery}
                      schema={schema}
                      placeholder="-- Write your SQL query here
SELECT * FROM customers LIMIT 10;"
                    />
                  </div>
                </Panel>

                <PanelResizeHandle className="h-1 bg-gray-200 hover:bg-gray-300 transition-colors" />

                                                  {/* Results Panel */}
                <Panel defaultSize={50} minSize={30}>
                  <div className="relative h-full bg-white">
                    {/* Spinner Overlay - Outside the results panel to remain visible */}
                    {isExecuting && (
                      <div className="absolute inset-0 z-50 bg-white flex items-center justify-center min-h-full load-spinner">
                        <div className="text-center">
                          <svg className="mx-auto w-8 h-8 text-blue-600 animate-spin" fill="none" viewBox="0 0 24 24" aria-label="Loading">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          <div className="mt-3 text-sm text-gray-700">Running query...</div>
                        </div>
                      </div>
                    )}

                    {/* Results Panel Content */}
                    <div className={`h-full flex flex-col ${getResultsPanelClass()}`}>
                      {/* Validation Errors */}
                      {validationErrors.length > 0 && (
                        <div className="px-4 py-3 bg-red-50 border-b border-red-200">
                          <div className="text-sm font-medium text-red-800 mb-1">Query Validation Errors:</div>
                          <ul className="list-disc ml-5 space-y-1">
                            {validationErrors.map((e, i) => (
                              <li key={i} className="text-sm text-red-700">{e.message}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Execution Summary */}
                      {currentResult && validationErrors.length === 0 && (
                        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-4">
                              <span className="text-gray-600">
                                <span className="font-medium">{currentResult.rowCount.toLocaleString()}</span> rows returned
                              </span>
                              <span className="text-gray-600">
                                Executed in <span className="font-medium">{currentResult.executionTimeMs}ms</span>
                              </span>
                              <span className="text-gray-600">
                                Status: <span className="font-medium capitalize">{currentResult.status}</span>
                              </span>
                            </div>
                            {currentResult.runId && (
                              <span className="text-xs text-gray-500 font-mono">
                                Run ID: {currentResult.runId}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Results Content */}
                      <div className="flex-1 min-h-0">
                        {currentResult && validationErrors.length === 0 ? (
                          <div className={`relative h-full transition-opacity duration-700 ${showResults && resultsFadeIn ? 'opacity-100' : 'opacity-0'}`}>
                            {/* White overlay that fades out to reveal results */}
                            <div
                              className="pointer-events-none absolute inset-0 bg-white"
                              style={{ opacity: whiteFadeOpacity, transition: 'opacity 700ms ease' }}
                            />
                            <ResultsTable
                              ref={resultsTableRef}
                              columns={currentResult.columns}
                              rows={currentResult.rows}
                              loading={isExecuting}
                            />
                          </div>
                        ) : (
                          <div className="h-full flex items-center justify-center">
                            {validationErrors.length > 0 ? (
                              <div className="text-center text-red-700">
                                <h3 className="text-lg font-medium mb-2">Query Validation Errors</h3>
                                <p className="text-sm">Fix the issues above and run again.</p>
                              </div>
                            ) : (
                              <div className="text-center text-gray-500">
                                <h3 className="text-lg font-medium mb-2">Query Results</h3>
                                <p className="text-sm">Run a SQL query to see results here</p>
                                <p className="text-xs mt-2 text-gray-400">
                                  Use <kbd className="px-1 py-0.5 text-xs bg-gray-100 border rounded">Cmd+Enter</kbd> to execute
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Panel>
              </PanelGroup>
            </Panel>
          </PanelGroup>
        </div>
      </div>
    </AppLayout>
  )
}