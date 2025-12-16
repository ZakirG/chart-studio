import { describe, it, expect } from '@jest/globals'
import { ChartSpec } from '@/types/chart-spec'
import { 
  setX, 
  setY, 
  setSeries, 
  setCategory, 
  setValue, 
  removeField, 
  setChartType 
} from './chart-spec-builder'

describe('Chart Spec Builder', () => {
  const createInitialSpec = (): ChartSpec => ({
    v: 1,
    type: 'bar',
    data: {
      source: '',
      dimensions: [],
      measures: []
    },
    encodings: {},
    options: {
      title: 'Test Chart',
      height: 300
    }
  })

  const customerField = {
    name: 'customer_name',
    type: 'varchar',
    table: 'customers'
  }

  const revenueField = {
    name: 'revenue',
    type: 'decimal',
    table: 'sales'
  }

  describe('setX', () => {
    it('should set X-axis field and update data source', () => {
      const result = setX(createInitialSpec(), customerField)
      
      expect(result.encodings.x).toEqual({ field: 'customer_name' })
      expect(result.data.source).toBe('customers')
      expect(result.data.dimensions).toContainEqual({ field: 'customer_name' })
    })

    it('should not override existing data source', () => {
      const specWithSource = { ...createInitialSpec(), data: { ...createInitialSpec().data, source: 'existing_table' } }
      const result = setX(specWithSource, customerField)
      
      expect(result.data.source).toBe('existing_table')
    })

    it('should not add numeric fields to dimensions', () => {
      const numericField = { name: 'amount', type: 'integer', table: 'sales' }
      const result = setX(createInitialSpec(), numericField)
      
      expect(result.data.dimensions).not.toContainEqual({ field: 'amount' })
    })
  })

  describe('setY', () => {
    it('should set Y-axis field and add to measures with default aggregate', () => {
      const result = setY(createInitialSpec(), revenueField)
      
      expect(result.encodings.y).toEqual({ field: 'revenue' })
      expect(result.data.source).toBe('sales')
      expect(result.data.measures).toContainEqual({ 
        field: 'revenue', 
        aggregate: 'sum',
        label: 'revenue' 
      })
    })

    it('should set Y-axis field with custom aggregate', () => {
      const result = setY(createInitialSpec(), revenueField, 'avg')
      
      expect(result.data.measures).toContainEqual({ 
        field: 'revenue', 
        aggregate: 'avg',
        label: 'revenue' 
      })
    })
  })

  describe('setSeries', () => {
    it('should set series field and add to dimensions', () => {
      const regionField = { name: 'region', type: 'varchar', table: 'locations' }
      const result = setSeries(createInitialSpec(), regionField)
      
      expect(result.encodings.series).toEqual({ field: 'region' })
      expect(result.data.source).toBe('locations')
      expect(result.data.dimensions).toContainEqual({ field: 'region' })
    })
  })

  describe('setCategory and setValue for pie charts', () => {
    it('should set category field correctly', () => {
      const result = setCategory(createInitialSpec(), customerField)
      
      expect(result.encodings.category).toEqual({ field: 'customer_name' })
      expect(result.data.dimensions).toContainEqual({ field: 'customer_name' })
    })

    it('should set value field correctly', () => {
      const result = setValue(createInitialSpec(), revenueField)
      
      expect(result.encodings.value).toEqual({ field: 'revenue' })
      expect(result.data.measures).toContainEqual({ 
        field: 'revenue', 
        aggregate: 'sum',
        label: 'revenue' 
      })
    })
  })

  describe('removeField', () => {
    it('should remove field from encodings and clean up dimensions/measures', () => {
      const specWithXField = setX(createInitialSpec(), customerField)
      const result = removeField(specWithXField, 'x')
      
      expect(result.encodings.x).toBeUndefined()
      expect(result.data.dimensions).not.toContainEqual({ field: 'customer_name' })
    })

    it('should not remove field from dimensions if still used in other encodings', () => {
      let spec = setX(createInitialSpec(), customerField)
      spec = setSeries(spec, customerField)
      const result = removeField(spec, 'x')
      
      expect(result.encodings.x).toBeUndefined()
      expect(result.encodings.series).toEqual({ field: 'customer_name' })
      expect(result.data.dimensions).toContainEqual({ field: 'customer_name' })
    })
  })

  describe('setChartType', () => {
    it('should convert from bar to pie chart and transform encodings', () => {
      let spec = setX(createInitialSpec(), customerField)
      spec = setY(spec, revenueField)
      
      const result = setChartType(spec, 'pie')
      
      expect(result.type).toBe('pie')
      expect(result.encodings.category).toEqual({ field: 'customer_name' })
      expect(result.encodings.value).toEqual({ field: 'revenue' })
      expect(result.encodings.x).toBeUndefined()
      expect(result.encodings.y).toBeUndefined()
    })

    it('should convert from pie to bar chart and transform encodings', () => {
      let spec = { ...createInitialSpec(), type: 'pie' as const }
      spec = setCategory(spec, customerField)
      spec = setValue(spec, revenueField)
      
      const result = setChartType(spec, 'bar')
      
      expect(result.type).toBe('bar')
      expect(result.encodings.x).toEqual({ field: 'customer_name' })
      expect(result.encodings.y).toEqual({ field: 'revenue' })
      expect(result.encodings.category).toBeUndefined()
      expect(result.encodings.value).toBeUndefined()
    })

    it('should clear all encodings for table chart type', () => {
      let spec = setX(createInitialSpec(), customerField)
      spec = setY(spec, revenueField)
      
      const result = setChartType(spec, 'table')
      
      expect(result.type).toBe('table')
      expect(result.encodings).toEqual({})
    })
  })

  describe('immutability', () => {
    it('should not mutate the original spec', () => {
      const originalSpec = createInitialSpec()
      const originalSpecCopy = { ...originalSpec, data: { ...originalSpec.data } }
      setX(originalSpec, customerField)
      
      expect(originalSpec).toEqual(originalSpecCopy)
    })
  })
})
