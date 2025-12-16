'use client'

import React, { useCallback, useMemo, useRef } from 'react'
import { AgGridReact } from 'ag-grid-react'
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community'
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-alpine.css'
import { ColDef, GridApi } from 'ag-grid-community'

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule])

interface ResultsTableProps {
  columns: string[]
  rows: Record<string, any>[]
  loading?: boolean
}

interface ResultsTableRef {
  exportToCsv: () => void
}

export const ResultsTable = React.forwardRef<ResultsTableRef, ResultsTableProps>(
  ({ columns, rows, loading = false }, ref) => {
    const gridRef = useRef<AgGridReact>(null)
    
    // Generate column definitions dynamically
  const columnDefs: ColDef[] = useMemo(() => {
    return columns.map(column => ({
      field: column,
      headerName: column.charAt(0).toUpperCase() + column.slice(1),
      sortable: true,
      filter: true,
      resizable: true,
      minWidth: 120,
      // Format numbers and dates appropriately
      valueFormatter: (params) => {
        if (params.value === null || params.value === undefined) {
          return ''
        }
        if (typeof params.value === 'number') {
          // Format large numbers with commas
          if (Number.isInteger(params.value)) {
            return params.value.toLocaleString()
          } else {
            return params.value.toLocaleString(undefined, { 
              minimumFractionDigits: 2, 
              maximumFractionDigits: 2 
            })
          }
        }
        return String(params.value)
      }
    }))
  }, [columns])

  // Grid configuration
  const defaultColDef = useMemo(() => ({
    flex: 1,
    minWidth: 100,
    sortable: true,
    filter: true,
    resizable: true,
  }), [])

  const exportToCsv = useCallback(() => {
    if (gridRef.current) {
      const gridApi: GridApi = gridRef.current.api
      gridApi.exportDataAsCsv({
        fileName: `query_results_${new Date().toISOString().split('T')[0]}.csv`
      })
    }
  }, [])

  // Expose the export function to parent components
  React.useImperativeHandle(ref, () => ({
    exportToCsv
  }))

  if (loading) {
    return (
      <div className="ag-theme-alpine h-full">
        <div className="flex items-center justify-center h-full">
          <div className="text-gray-500">Loading results...</div>
        </div>
      </div>
    )
  }

  if (columns.length === 0 || rows.length === 0) {
    return (
      <div className="ag-theme-alpine h-full">
        <div className="flex items-center justify-center h-full">
          <div className="text-gray-500">No results to display</div>
        </div>
      </div>
    )
  }

  return (
    <div className="ag-theme-alpine h-full">
      <AgGridReact
        ref={gridRef}
        columnDefs={columnDefs}
        rowData={rows}
        defaultColDef={defaultColDef}
        theme="legacy"
        animateRows={true}
        rowSelection="multiple"
        enableBrowserTooltips={true}
        pagination={true}
        paginationPageSize={100}
        paginationPageSizeSelector={[50, 100, 200, 500]}
        suppressExcelExport={true}
        enableCellTextSelection={true}
        ensureDomOrder={true}
        suppressRowHoverHighlight={false}
        rowHeight={35}
        headerHeight={40}
      />
    </div>
  )
})

ResultsTable.displayName = 'ResultsTable'

// Export function that can be called from parent components
export const exportResultsToCsv = (gridRef: React.RefObject<AgGridReact>) => {
  if (gridRef.current) {
    const gridApi: GridApi = gridRef.current.api
    gridApi.exportDataAsCsv({
      fileName: `query_results_${new Date().toISOString().split('T')[0]}.csv`
    })
  }
}
