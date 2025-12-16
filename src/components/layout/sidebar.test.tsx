import { render, screen } from '@testing-library/react'
import Sidebar from './sidebar'

// Mock Next.js usePathname hook
jest.mock('next/navigation', () => ({
  usePathname: () => '/dashboards',
}))

describe('Sidebar', () => {
  it('renders three navigation links with correct href attributes', () => {
    render(<Sidebar />)
    
    // Check that all three main navigation links are present
    const dashboardsLink = screen.getByRole('link', { name: /dashboards/i })
    const explorerLink = screen.getByRole('link', { name: /data explorer/i })
    const templatesLink = screen.getByRole('link', { name: /templates/i })
    
    // Verify the href attributes
    expect(dashboardsLink).toHaveAttribute('href', '/dashboards')
    expect(explorerLink).toHaveAttribute('href', '/explorer')
    expect(templatesLink).toHaveAttribute('href', '/templates')
  })
  
  it('highlights the active navigation item', () => {
    render(<Sidebar />)
    
    const dashboardsLink = screen.getByRole('link', { name: /dashboards/i })
    
    // Check that the dashboards link has active styling (since we mocked pathname to '/dashboards')
    expect(dashboardsLink).toHaveClass('bg-blue-50', 'text-blue-700')
  })
})
