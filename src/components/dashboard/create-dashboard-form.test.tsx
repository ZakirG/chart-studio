import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { CreateDashboardDialog } from './create-dashboard-form'

describe('CreateDashboardDialog', () => {
  const mockOnSubmit = jest.fn()
  const mockOnOpenChange = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('shows validation errors when name is empty and form is submitted', async () => {
    render(
      <CreateDashboardDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onSubmit={mockOnSubmit}
      />
    )

    // Submit the form without filling required fields
    const submitButton = screen.getByRole('button', { name: /create dashboard/i })
    fireEvent.click(submitButton)

    // Check for validation error
    await waitFor(() => {
      expect(screen.getByText('Dashboard name is required')).toBeInTheDocument()
    })

    // Ensure onSubmit is not called when validation fails
    expect(mockOnSubmit).not.toHaveBeenCalled()
  })

  it('calls onSubmit with correct data when form is valid and submitted', async () => {
    render(
      <CreateDashboardDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onSubmit={mockOnSubmit}
      />
    )

    // Fill in the form
    const nameInput = screen.getByPlaceholderText('Dashboard name')
    const descriptionInput = screen.getByPlaceholderText('Optional description')
    
    fireEvent.change(nameInput, { target: { value: 'Test Dashboard' } })
    fireEvent.change(descriptionInput, { target: { value: 'Test description' } })

    // Select a category
    const categorySelect = screen.getByRole('combobox')
    fireEvent.click(categorySelect)
    
    await waitFor(() => {
      const option = screen.getByText('Sales & Performance')
      fireEvent.click(option)
    })

    // Submit the form
    const submitButton = screen.getByRole('button', { name: /create dashboard/i })
    fireEvent.click(submitButton)

    // Check that onSubmit is called with correct data
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: 'Test Dashboard',
        description: 'Test description',
        category: 'Sales & Performance',
      })
    })
  })

  it('shows loading state when isLoading is true', () => {
    render(
      <CreateDashboardDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onSubmit={mockOnSubmit}
        isLoading={true}
      />
    )

    const submitButton = screen.getByRole('button', { name: /creating/i })
    expect(submitButton).toBeDisabled()
  })

  it('closes dialog when cancel button is clicked', () => {
    render(
      <CreateDashboardDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onSubmit={mockOnSubmit}
      />
    )

    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    fireEvent.click(cancelButton)

    expect(mockOnOpenChange).toHaveBeenCalledWith(false)
  })
})
