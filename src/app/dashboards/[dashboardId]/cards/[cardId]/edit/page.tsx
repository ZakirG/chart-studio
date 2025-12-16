'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useDebouncedCallback } from 'use-debounce'
import { 
  DndContext, 
  DragEndEvent, 
  DragOverEvent,
  DragStartEvent,
  closestCenter,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragOverlay,
  useDraggable,
  useDroppable
} from '@dnd-kit/core'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { ChartRenderer } from '@/components/charts/renderer'
import AppLayout from '@/components/layout/app-layout'
import { useGetSchemaMetadataQuery, useExecuteChartQuery, useUpsertCardMutation } from '@/graphql/generated/graphql'
import { ChartSpec, ChartType } from '@/types/chart-spec'
import { setChartType } from '@/lib/chart-spec-builder'
import { toast } from 'sonner'
import { ArrowLeft, Plus, X } from 'lucide-react'

interface Field {
  name: string
  type: string
  table: string
  nullable?: boolean
  isPrimaryKey?: boolean
  isForeignKey?: boolean
}

// Available chart types
const CHART_TYPES = [
  { value: 'bar', label: 'Bar Chart' },
  { value: 'line', label: 'Line Chart' },
  { value: 'pie', label: 'Pie Chart' },
  { value: 'table', label: 'Table' },
] as const

interface DroppableShelf {
  id: string
  label: string
  encoding: 'x' | 'y' | 'series' | 'category' | 'value' | 'columns'
  accepts: string[]
  maxItems?: number
}

const AGGREGATIONS = [
  { value: 'count', label: 'Count' },
  { value: 'sum', label: 'Sum' },
  { value: 'avg', label: 'Average' },
  { value: 'min', label: 'Minimum' },
  { value: 'max', label: 'Maximum' },
]

export default function ChartBuilderPage() {
  const params = useParams()
  const router = useRouter()
  const dashboardId = params.dashboardId as string
  const cardId = params.cardId as string
  const isNewCard = cardId === 'new'

  // Schema data
  const { data: schemaData, loading: schemaLoading } = useGetSchemaMetadataQuery()
  
  // Chart spec state
  const [chartSpec, setChartSpec] = useState<ChartSpec>({
    v: 1,
    type: 'bar',
    data: {
      source: '',
      dimensions: [],
      measures: []
    },
    encodings: {},
    options: {
      title: 'New Chart',
      height: 300
    }
  })

  // UI state
  const [selectedTable, setSelectedTable] = useState<string>('')
  const [draggedField, setDraggedField] = useState<Field | null>(null)
  
  // Mutations
  const [upsertCard, { loading: saving }] = useUpsertCardMutation({
    update(cache, { data }) {
      if (data?.upsertCard) {
        // Update the GET_DASHBOARD cache to include the new/updated card
        const dashboardCacheId = cache.identify({ __typename: 'Dashboard', id: dashboardId })
        if (dashboardCacheId) {
          cache.modify({
            id: dashboardCacheId,
            fields: {
              cards(existingCards) {
                const newCard = data.upsertCard
                // Ensure existingCards is an array
                const cards = Array.isArray(existingCards) ? existingCards : []
                // If it's a new card, add it to the list
                if (isNewCard) {
                  return [...cards, newCard]
                }
                // If updating existing card, replace it
                return cards.map((card: any) => 
                  card.id === newCard.id ? newCard : card
                )
              },
              layout(existingLayout) {
                const newCard = data.upsertCard
                // Ensure existingLayout is an array
                const layout = Array.isArray(existingLayout) ? existingLayout : []
                // If it's a new card and not in layout, add layout entry
                if (isNewCard && !layout.find((item: any) => item.i === newCard.id)) {
                  const maxY = layout.length > 0 ? Math.max(...layout.map((item: any) => item.y + item.h)) : 0
                  return [...layout, {
                    i: newCard.id,
                    x: 0,
                    y: maxY,
                    w: 4,
                    h: 5
                  }]
                }
                return layout
              }
            }
          })
        }
      }
    }
  })

  // Live preview with debounced execution
  const { data: previewData, loading: previewLoading, error: previewError } = useExecuteChartQuery({
    variables: { spec: chartSpec },
    skip: !chartSpec.data.source || chartSpec.data.measures.length === 0,
    fetchPolicy: 'cache-and-network',
    onCompleted: (data) => {
      console.log('GraphQL Query completed:', {
        rowsCount: data?.executeChart?.rows?.length,
        rows: data?.executeChart?.rows,
        meta: data?.executeChart?.meta,
        spec: chartSpec
      })
    },
    onError: (error) => {
      console.log('GraphQL Query error:', error)
    }
  })

  // Debug the query state
  console.log('Query state:', {
    shouldSkip: !chartSpec.data.source || chartSpec.data.measures.length === 0,
    hasSource: !!chartSpec.data.source,
    measuresCount: chartSpec.data.measures.length,
    isLoading: previewLoading,
    hasError: !!previewError,
    hasData: !!previewData,
    currentSpec: chartSpec
  })

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
  )

  // Get available fields from selected table
  const availableFields: Field[] = selectedTable && schemaData?.getSchemaMetadata ? 
    schemaData.getSchemaMetadata.tables
      .find(table => table.name === selectedTable)?.columns
      .map(col => ({
        name: col.name,
        type: col.type,
        table: selectedTable,
        nullable: col.nullable,
        isPrimaryKey: col.isPrimaryKey,
        isForeignKey: col.isForeignKey
      })) || [] : []

  // Define drop targets (shelves) based on chart type
  const getShelvesForChartType = (type: string): DroppableShelf[] => {
    switch (type) {
      case 'pie':
        return [
          { id: 'category', label: 'Category', encoding: 'category', accepts: ['string', 'date'] },
          { id: 'value', label: 'Value', encoding: 'value', accepts: ['number'], maxItems: 1 },
        ]
      case 'table':
        return [
          { id: 'columns', label: 'Columns', encoding: 'columns', accepts: ['string', 'number', 'date'], maxItems: 10 },
        ]
      default: // bar, line
        return [
          { id: 'x-axis', label: 'X-Axis', encoding: 'x', accepts: ['string', 'date'], maxItems: 1 },
          { id: 'y-axis', label: 'Y-Axis', encoding: 'y', accepts: ['number'], maxItems: 1 },
          { id: 'series', label: 'Series', encoding: 'series', accepts: ['string'], maxItems: 1 },
        ]
    }
  }

  const shelves = getShelvesForChartType(chartSpec.type)

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    const field = availableFields.find(f => f.name === event.active.id)
    setDraggedField(field || null)
  }

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setDraggedField(null)

    if (!over) return

    // Get field from active - either from data.current or find by id
    let field = active.data.current as Field
    if (!field) {
      field = availableFields.find(f => f.name === active.id)
    }
    
    // Get shelf from over - either from data.current or find by id
    let shelf = over.data.current as DroppableShelf
    if (!shelf) {
      shelf = shelves.find(s => s.id === over.id)
    }
    
    console.log('Drag end debug:', { 
      activeId: active.id, 
      overId: over.id, 
      fieldName: field?.name,
      shelfId: shelf?.id,
      shelfEncoding: shelf?.encoding
    })
    
    if (!field || !shelf) {
      console.log('Missing field or shelf:', { field, shelf })
      return
    }

    // Check if field type is accepted by the shelf
    const fieldType = getFieldDataType(field.type)
    if (!shelf.accepts.includes(fieldType)) {
      toast.error(`Cannot drop ${field.type} field into ${shelf.label}`)
      return
    }

    // Update chart spec based on the shelf
    addFieldToShelf(field, shelf)
    
    // Log the updated chart spec
    setTimeout(() => {
      console.log('Updated chart spec:', {
        source: chartSpec.data.source,
        measuresCount: chartSpec.data.measures.length,
        measures: chartSpec.data.measures,
        dimensionsCount: chartSpec.data.dimensions.length,
        encodings: chartSpec.encodings
      })
    }, 100)
  }

  // Map database types to general data types
  const getFieldDataType = (dbType: string): string => {
    const lowerType = dbType.toLowerCase()
    if (lowerType.includes('int') || lowerType.includes('decimal') || lowerType.includes('float') || lowerType.includes('number')) {
      return 'number'
    }
    if (lowerType.includes('date') || lowerType.includes('time')) {
      return 'date'
    }
    return 'string'
  }

  // Add field to a shelf (update chart spec)
  const addFieldToShelf = (field: Field, shelf: DroppableShelf) => {
    setChartSpec(prev => {
      const newSpec = { ...prev }
      
      // Update data source if not set
      if (!newSpec.data.source) {
        newSpec.data.source = field.table
      }

      // Handle different shelf types
      switch (shelf.encoding) {
        case 'x':
          newSpec.encodings = { ...newSpec.encodings, x: { field: field.name } }
          // Add to dimensions if it's a dimension field
          if (getFieldDataType(field.type) !== 'number') {
            if (!newSpec.data.dimensions.some(d => d.field === field.name)) {
              newSpec.data.dimensions.push({ field: field.name })
            }
          }
          break
          
        case 'y':
          newSpec.encodings = { ...newSpec.encodings, y: { field: field.name } }
          // Add to measures
          if (!newSpec.data.measures.some(m => m.field === field.name)) {
            newSpec.data.measures.push({ 
              field: field.name, 
              aggregate: 'sum',
              label: field.name 
            })
          }
          break
          
        case 'series':
          newSpec.encodings = { ...newSpec.encodings, series: { field: field.name } }
          if (!newSpec.data.dimensions.some(d => d.field === field.name)) {
            newSpec.data.dimensions.push({ field: field.name })
          }
          break
          
        case 'category':
          newSpec.encodings = { ...newSpec.encodings, category: { field: field.name } }
          if (!newSpec.data.dimensions.some(d => d.field === field.name)) {
            newSpec.data.dimensions.push({ field: field.name })
          }
          break
          
        case 'value':
          newSpec.encodings = { ...newSpec.encodings, value: { field: field.name } }
          if (!newSpec.data.measures.some(m => m.field === field.name)) {
            newSpec.data.measures.push({ 
              field: field.name, 
              aggregate: 'sum',
              label: field.name 
            })
          }
          break
          
        case 'columns':
          // For table columns, we store multiple fields in a columns array
          const currentColumns = (newSpec.encodings as any).columns || []
          const newColumns = [...currentColumns]
          
          // Check if field is already added
          if (!newColumns.some((col: any) => col.field === field.name)) {
            newColumns.push({ field: field.name })
            
            // Add to dimensions for string/date fields, measures for number fields
            const fieldType = getFieldDataType(field.type)
            if (fieldType === 'number') {
              if (!newSpec.data.measures.some(m => m.field === field.name)) {
                newSpec.data.measures.push({ 
                  field: field.name, 
                  aggregate: 'sum',
                  label: field.name 
                })
              }
            } else {
              if (!newSpec.data.dimensions.some(d => d.field === field.name)) {
                newSpec.data.dimensions.push({ field: field.name })
              }
            }
          }
          
          newSpec.encodings = { ...newSpec.encodings, columns: newColumns }
          break
      }

      return newSpec
    })
  }

  // Remove field from shelf
  const removeFieldFromShelf = (shelf: DroppableShelf) => {
    setChartSpec(prev => {
      const newSpec = { ...prev }
      
      // Remove from encodings
      if (newSpec.encodings && (newSpec.encodings as any)[shelf.encoding]) {
        delete (newSpec.encodings as any)[shelf.encoding]
      }
      
      return newSpec
    })
  }

  // Remove specific field from columns shelf
  const removeFieldFromColumnsShelf = (fieldToRemove: Field) => {
    setChartSpec(prev => {
      const newSpec = { ...prev }
      const currentColumns = (newSpec.encodings as any).columns || []
      
      // Remove the field from columns
      const newColumns = currentColumns.filter((col: any) => col.field !== fieldToRemove.name)
      
      // Remove from dimensions/measures
      newSpec.data.dimensions = newSpec.data.dimensions.filter(d => d.field !== fieldToRemove.name)
      newSpec.data.measures = newSpec.data.measures.filter(m => m.field !== fieldToRemove.name)
      
      // Update encodings
      if (newColumns.length > 0) {
        (newSpec.encodings as any).columns = newColumns
      } else {
        delete (newSpec.encodings as any).columns
      }
      
      return newSpec
    })
  }

  // Get field currently in a shelf
  const getFieldInShelf = (shelf: DroppableShelf): string | null => {
    if (!chartSpec.encodings) return null
    const encoding = (chartSpec.encodings as any)[shelf.encoding]
    
    // Handle columns encoding which stores multiple fields
    if (shelf.encoding === 'columns' && Array.isArray(encoding)) {
      return encoding.length > 0 ? `${encoding.length} columns` : null
    }
    
    return encoding?.field || null
  }

  // Get all fields in a shelf (for multi-field shelves like table columns)
  const getFieldsInShelf = (shelf: DroppableShelf): Field[] => {
    if (!chartSpec.encodings) return []
    const encoding = (chartSpec.encodings as any)[shelf.encoding]
    
    if (shelf.encoding === 'columns' && Array.isArray(encoding)) {
      return encoding.map((col: any) => 
        availableFields.find(f => f.name === col.field)
      ).filter((field): field is Field => field !== undefined)
    }
    
    if (encoding?.field) {
      const field = availableFields.find(f => f.name === encoding.field)
      return field ? [field] : []
    }
    
    return []
  }

  // Handle chart type change while preserving fields
  const handleChartTypeChange = (newType: ChartType) => {
    setChartSpec(prev => {
      console.log('Changing chart type from', prev.type, 'to', newType)
      console.log('Current encodings:', prev.encodings)
      
      const newSpec = setChartType(prev, newType)
      
      console.log('New encodings:', newSpec.encodings)
      return newSpec
    })
  }

  // Handle save
  const handleSave = async () => {
    if (!chartSpec.data.source || chartSpec.data.measures.length === 0) {
      toast.error('Please add at least one measure to the chart')
      return
    }

    try {
      await upsertCard({
        variables: {
          dashboardId,
          cardId: isNewCard ? undefined : cardId,
          chartSpec
        }
      })
      
      toast.success(isNewCard ? 'Chart created successfully!' : 'Chart updated successfully!')
      router.push(`/dashboards/${dashboardId}`)
    } catch (error) {
      console.error('Save error:', error)
      toast.error('Failed to save chart')
    }
  }

  return (
    <AppLayout>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-xl font-semibold">
              {isNewCard ? 'Create New Chart' : 'Edit Chart'}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Chart'}
            </Button>
          </div>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex-1 flex overflow-hidden">
            {/* Left Panel - Fields and Data Source */}
            <div className="w-80 border-r bg-gray-50 flex flex-col">
              <div className="p-4 border-b bg-white">
                <h2 className="font-medium mb-3">Data Source</h2>
                <Select value={selectedTable} onValueChange={setSelectedTable}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a table" />
                  </SelectTrigger>
                  <SelectContent>
                    {schemaLoading ? (
                      <div className="p-2">Loading tables...</div>
                    ) : (
                      schemaData?.getSchemaMetadata?.tables.map(table => (
                        <SelectItem key={table.name} value={table.name}>
                          {table.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1 overflow-y-auto">
                <div className="p-4">
                  <h3 className="font-medium mb-3">Available Fields</h3>
                  {!selectedTable ? (
                    <p className="text-sm text-gray-500">Select a table to see fields</p>
                  ) : availableFields.length === 0 ? (
                    <p className="text-sm text-gray-500">No fields found</p>
                  ) : (
                    <div className="space-y-2">
                      {availableFields.map(field => (
                        <FieldItem key={field.name} field={field} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col">
              {/* Chart Configuration */}
              <div className="p-4 border-b bg-white">
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex-1">
                    <Label htmlFor="chart-title">Chart Title</Label>
                    <Input
                      id="chart-title"
                      value={chartSpec.options?.title || ''}
                      onChange={(e) => setChartSpec(prev => ({
                        ...prev,
                        options: { ...prev.options, title: e.target.value }
                      }))}
                      placeholder="Enter chart title"
                    />
                  </div>
                  <div>
                    <Label htmlFor="chart-type">Chart Type</Label>
                    <Select
                      value={chartSpec.type}
                      onValueChange={handleChartTypeChange}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CHART_TYPES.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Drop Shelves */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {shelves.map(shelf => 
                    shelf.encoding === 'columns' ? (
                      <MultiFieldDropShelf
                        key={shelf.id}
                        shelf={shelf}
                        fields={getFieldsInShelf(shelf)}
                        onRemoveField={(field) => removeFieldFromColumnsShelf(field)}
                      />
                    ) : (
                      <DropShelf
                        key={shelf.id}
                        shelf={shelf}
                        fieldName={getFieldInShelf(shelf)}
                        onRemove={() => removeFieldFromShelf(shelf)}
                      />
                    )
                  )}
                </div>
              </div>

              {/* Chart Preview */}
              <div className="flex-1 p-4">
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle>Preview</CardTitle>
                  </CardHeader>
                  <CardContent className="h-full">
                    {(() => {
                      console.log('Preview render conditions:', {
                        hasSource: !!chartSpec.data.source,
                        measuresCount: chartSpec.data.measures.length,
                        isLoading: previewLoading,
                        hasError: !!previewError,
                        hasData: !!previewData,
                        dataRowsCount: previewData?.executeChart?.rows?.length || 0
                      })
                      
                      if (!chartSpec.data.source) {
                        console.log('Preview: No data source')
                        return (
                          <div className="h-full flex items-center justify-center text-gray-500">
                            Select a data source and add fields to see preview
                          </div>
                        )
                      }
                      
                      if (chartSpec.data.measures.length === 0) {
                        console.log('Preview: No measures')
                        return (
                          <div className="h-full flex items-center justify-center text-gray-500">
                            Add at least one measure to see preview
                          </div>
                        )
                      }
                      
                      if (previewLoading) {
                        console.log('Preview: Loading')
                        return (
                          <div className="h-full flex items-center justify-center">
                            <Skeleton className="w-full h-64" />
                          </div>
                        )
                      }
                      
                      if (previewError) {
                        console.log('Preview: Error', previewError)
                        return (
                          <div className="h-full flex items-center justify-center text-red-500">
                            Error loading preview: {previewError.message}
                          </div>
                        )
                      }
                      
                      console.log('Preview: Rendering chart with data:', previewData?.executeChart?.rows)
                      return (
                        <ChartRenderer
                          spec={{
                            ...chartSpec,
                            data: {
                              ...chartSpec.data,
                              rows: previewData?.executeChart?.rows || []
                            }
                          }}
                        />
                      )
                    })()}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          {/* Drag Overlay */}
          <DragOverlay>
            {draggedField ? (
              <div className="bg-blue-100 border border-blue-300 rounded px-3 py-2 shadow-lg">
                <div className="font-medium">{draggedField.name}</div>
                <div className="text-xs text-gray-600">{draggedField.type}</div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </AppLayout>
  )
}

// Field Item Component (Draggable)
function FieldItem({ field }: { field: Field }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: field.name,
    data: field,
  })

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`bg-white border rounded-lg p-3 cursor-grab hover:shadow-sm transition-shadow ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate">{field.name}</div>
          <div className="text-xs text-gray-500">{field.type}</div>
        </div>
        <div className="flex items-center gap-1 ml-2">
          {field.isPrimaryKey && (
            <span className="bg-yellow-100 text-yellow-800 text-xs px-1 rounded">PK</span>
          )}
          {field.isForeignKey && (
            <span className="bg-blue-100 text-blue-800 text-xs px-1 rounded">FK</span>
          )}
        </div>
      </div>
    </div>
  )
}

// Multi-Field Drop Shelf Component (for Table columns)
function MultiFieldDropShelf({
  shelf,
  fields,
  onRemoveField
}: {
  shelf: DroppableShelf
  fields: Field[]
  onRemoveField: (field: Field) => void
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: shelf.id,
    data: shelf,
  })

  return (
    <div 
      ref={setNodeRef}
      className={`border-2 border-dashed rounded-lg p-4 min-h-32 transition-colors ${
        isOver 
          ? 'border-blue-400 bg-blue-50'
          : 'border-gray-300 bg-gray-50'
      }`}
    >
      <div className="text-sm font-medium text-gray-700 mb-3">{shelf.label}</div>
      
      {fields.length > 0 ? (
        <div className="grid grid-cols-2 gap-2">
          {fields.map(field => (
            <div 
              key={field.name}
              className="bg-blue-100 border border-blue-300 rounded px-2 py-1 flex items-center justify-between text-xs"
            >
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{field.name}</div>
                <div className="text-gray-600 truncate">{field.type}</div>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-4 w-4 p-0 ml-1 hover:bg-red-100"
                onClick={() => onRemoveField(field)}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-xs text-gray-500 text-center py-4">
          Drop {shelf.accepts.join('/')} fields here
          <br />
          <span className="text-gray-400">Multiple fields supported</span>
        </div>
      )}
    </div>
  )
}

// Drop Shelf Component
function DropShelf({ 
  shelf, 
  fieldName, 
  onRemove 
}: { 
  shelf: DroppableShelf
  fieldName: string | null
  onRemove: () => void
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: shelf.id,
    data: shelf,
  })

  return (
    <div 
      ref={setNodeRef}
      className={`border-2 border-dashed rounded-lg p-4 min-h-20 transition-colors ${
        isOver 
          ? 'border-blue-400 bg-blue-50' 
          : 'border-gray-300 bg-gray-50'
      }`}
    >
      <div className="text-sm font-medium text-gray-700 mb-2">{shelf.label}</div>
      {fieldName ? (
        <div className="bg-blue-100 border border-blue-300 rounded px-2 py-1 flex items-center justify-between">
          <span className="text-sm font-medium">{fieldName}</span>
          <Button variant="ghost" size="sm" onClick={onRemove}>
            <X className="w-3 h-3" />
          </Button>
        </div>
      ) : (
        <div className="text-xs text-gray-500">
          Drop {shelf.accepts.join('/')} field here
        </div>
      )}
    </div>
  )
}
