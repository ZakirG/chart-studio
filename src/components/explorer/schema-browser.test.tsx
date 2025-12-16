import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MockedProvider } from '@apollo/client/testing'
import { SchemaBrowser } from './schema-browser'
import { gql } from '@apollo/client'

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

const mockSchemaData = {
  getSchemaMetadata: {
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
            referencedTable: null,
            referencedColumn: null,
          },
          {
            name: 'name',
            type: 'VARCHAR(255)',
            nullable: false,
            isPrimaryKey: false,
            isForeignKey: false,
            referencedTable: null,
            referencedColumn: null,
          },
          {
            name: 'email',
            type: 'VARCHAR(255)',
            nullable: false,
            isPrimaryKey: false,
            isForeignKey: false,
            referencedTable: null,
            referencedColumn: null,
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
            referencedTable: null,
            referencedColumn: null,
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
        ],
      },
    ],
  },
}

const mocks = [
  {
    request: {
      query: GET_SCHEMA_METADATA,
    },
    result: {
      data: mockSchemaData,
    },
  },
]

describe('SchemaBrowser', () => {
  it('renders loading state initially', () => {
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <SchemaBrowser />
      </MockedProvider>
    )

    // Check for loading skeletons using data-slot attribute
    const skeletons = document.querySelectorAll('[data-slot="skeleton"]')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('displays schema tables after loading', async () => {
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <SchemaBrowser />
      </MockedProvider>
    )

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('customers')).toBeInTheDocument()
      expect(screen.getByText('orders')).toBeInTheDocument()
    })
  })

  it('filters tables and columns based on search term', async () => {
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <SchemaBrowser />
      </MockedProvider>
    )

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('customers')).toBeInTheDocument()
    })

    // Find search input and type 'email'
    const searchInput = screen.getByPlaceholderText('Filter tables and columns...')
    fireEvent.change(searchInput, { target: { value: 'email' } })

    // Should still show customers table because it has an 'email' column
    expect(screen.getByText('customers')).toBeInTheDocument()
    // Should not show orders table since it doesn't have 'email' column
    expect(screen.queryByText('orders')).not.toBeInTheDocument()
  })

  it('expands and collapses table details', async () => {
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <SchemaBrowser />
      </MockedProvider>
    )

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('customers')).toBeInTheDocument()
    })

    // Initially, column details should not be visible
    expect(screen.queryByText('id')).not.toBeInTheDocument()
    expect(screen.queryByText('name')).not.toBeInTheDocument()

    // Click on customers table to expand
    const customersTable = screen.getByText('customers')
    fireEvent.click(customersTable)

    // Now column details should be visible
    await waitFor(() => {
      expect(screen.getByText('id')).toBeInTheDocument()
      expect(screen.getByText('name')).toBeInTheDocument()
      expect(screen.getByText('email')).toBeInTheDocument()
    })

    // Click again to collapse
    fireEvent.click(customersTable)

    // Column details should be hidden again
    await waitFor(() => {
      expect(screen.queryByText('id')).not.toBeInTheDocument()
    })
  })

  it('shows "No tables found" when search returns no results', async () => {
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <SchemaBrowser />
      </MockedProvider>
    )

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('customers')).toBeInTheDocument()
    })

    // Search for something that doesn't exist
    const searchInput = screen.getByPlaceholderText('Filter tables and columns...')
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } })

    // Should show no results message
    expect(screen.getByText('No tables found')).toBeInTheDocument()
    expect(screen.getByText('Try adjusting your search term')).toBeInTheDocument()
  })
})
