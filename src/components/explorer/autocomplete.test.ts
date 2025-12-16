import { extractSqlContext, createSqlCompletionSource, SchemaMetadata } from './sql-autocomplete'

// Mock schema data for testing
const mockSchema: SchemaMetadata = {
  tables: [
    {
      name: 'customers',
      type: 'table',
      columns: [
        {
          name: 'id',
          type: 'INTEGER',
          nullable: false,
          isPrimaryKey: true,
          isForeignKey: false,
        },
        {
          name: 'name',
          type: 'VARCHAR(255)',
          nullable: false,
          isPrimaryKey: false,
          isForeignKey: false,
        },
        {
          name: 'email',
          type: 'VARCHAR(255)',
          nullable: false,
          isPrimaryKey: false,
          isForeignKey: false,
        },
      ],
    },
    {
      name: 'orders',
      type: 'table',
      columns: [
        {
          name: 'id',
          type: 'INTEGER',
          nullable: false,
          isPrimaryKey: true,
          isForeignKey: false,
        },
        {
          name: 'customer_id',
          type: 'INTEGER',
          nullable: false,
          isPrimaryKey: false,
          isForeignKey: true,
          referencedTable: 'customers',
          referencedColumn: 'id',
        },
        {
          name: 'total',
          type: 'DECIMAL(10,2)',
          nullable: false,
          isPrimaryKey: false,
          isForeignKey: false,
        },
      ],
    },
  ],
}

// Mock completion context for CodeMirror
function createMockContext(text: string, pos: number) {
  return {
    pos,
    state: {
      doc: {
        toString: () => text,
        length: text.length,
      },
    },
  } as any
}

describe('SQL Autocomplete', () => {
  describe('extractSqlContext', () => {
    it('detects table alias after dot', () => {
      const text = 'SELECT * FROM customers c WHERE c.'
      const pos = text.length
      const context = extractSqlContext(text, pos)

      expect(context.afterDot).toBe(true)
      expect(context.tableAlias).toBe('c')
    })

    it('detects FROM clause context', () => {
      const text = 'SELECT * FROM '
      const pos = text.length
      const context = extractSqlContext(text, pos)

      expect(context.inFromClause).toBe(true)
      expect(context.inSelectClause).toBe(false)
    })

    it('detects SELECT clause context', () => {
      const text = 'SELECT '
      const pos = text.length
      const context = extractSqlContext(text, pos)

      expect(context.inSelectClause).toBe(true)
      expect(context.inFromClause).toBe(false)
    })

    it('extracts detected tables with aliases', () => {
      const text = 'SELECT * FROM customers c JOIN orders o ON c.id = o.customer_id WHERE '
      const pos = text.length
      const context = extractSqlContext(text, pos)

      expect(context.detectedTables).toEqual([
        { name: 'customers', alias: 'c' },
        { name: 'orders', alias: 'o' },
      ])
    })
  })

  describe('createSqlCompletionSource', () => {
    it('provides column completions after table alias', () => {
      const completionSource = createSqlCompletionSource(mockSchema)
      const text = 'SELECT * FROM customers c WHERE c.'
      const context = createMockContext(text, text.length)

      const result = completionSource(context)

      expect(result).toBeTruthy()
      expect(result?.options).toHaveLength(3)
      expect(result?.options.map(o => o.label)).toEqual(['id', 'name', 'email'])
      expect(result?.options[0].type).toBe('property')
      expect(result?.options[0].detail).toBe('INTEGER')
    })

    it('provides table completions in FROM clause', () => {
      const completionSource = createSqlCompletionSource(mockSchema)
      const text = 'SELECT * FROM '
      const context = createMockContext(text, text.length)

      const result = completionSource(context)

      expect(result).toBeTruthy()
      expect(result?.options).toHaveLength(2)
      expect(result?.options.map(o => o.label)).toEqual(['customers', 'orders'])
      expect(result?.options[0].type).toBe('variable')
      expect(result?.options[0].detail).toBe('table (3 columns)')
    })

    it('provides keyword completions in general context', () => {
      const completionSource = createSqlCompletionSource(mockSchema)
      const text = 'SEL'
      const context = createMockContext(text, text.length)

      const result = completionSource(context)

      expect(result).toBeTruthy()
      expect(result?.options.some(o => o.label === 'SELECT')).toBe(true)
      expect(result?.options.find(o => o.label === 'SELECT')?.type).toBe('keyword')
    })

    it('provides column completions for detected tables in SELECT clause', () => {
      const completionSource = createSqlCompletionSource(mockSchema)
      // Position the cursor after we've already established table context
      const text = 'SELECT * FROM customers c WHERE c.id = 1 AND '
      const context = createMockContext(text, text.length)

      const result = completionSource(context)

      expect(result).toBeTruthy()
      if (result) {
        // Should include columns from customers table
        expect(result.options.some(o => o.label === 'id')).toBe(true)
        expect(result.options.some(o => o.label === 'name')).toBe(true)
        expect(result.options.some(o => o.label === 'email')).toBe(true)
      }
    })

    it('provides keyword completions when no tables are detected', () => {
      const completionSource = createSqlCompletionSource(mockSchema)
      const text = 'SEL'
      const context = createMockContext(text, text.length)

      const result = completionSource(context)

      expect(result).toBeTruthy()
      expect(result?.options.some(o => o.label === 'SELECT')).toBe(true)
    })

    it('returns null when no completions are available', () => {
      const completionSource = createSqlCompletionSource(mockSchema)
      const text = 'SELECT * FROM nonexistent_table nt WHERE nt.'
      const context = createMockContext(text, text.length)

      const result = completionSource(context)

      expect(result).toBeNull()
    })

    it('handles table name completion in JOIN clause', () => {
      const completionSource = createSqlCompletionSource(mockSchema)
      const text = 'SELECT * FROM customers c JOIN '
      const context = createMockContext(text, text.length)

      const result = completionSource(context)

      expect(result).toBeTruthy()
      expect(result?.options.map(o => o.label)).toEqual(['customers', 'orders'])
    })
  })
})
