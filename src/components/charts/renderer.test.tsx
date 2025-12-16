import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ChartRenderer } from './renderer';
import type { ChartSpec } from '@/types/chart-spec';

// Mock recharts components
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  BarChart: ({ children }: { children: React.ReactNode }) => (
    <svg data-testid="bar-chart">{children}</svg>
  ),
  LineChart: ({ children }: { children: React.ReactNode }) => (
    <svg data-testid="line-chart">{children}</svg>
  ),
  PieChart: ({ children }: { children: React.ReactNode }) => (
    <svg data-testid="pie-chart">{children}</svg>
  ),
  Bar: () => <rect data-testid="bar" />,
  Line: () => <path data-testid="line" />,
  Pie: () => <circle data-testid="pie" />,
  Cell: () => <path data-testid="cell" />,
  XAxis: () => <g data-testid="x-axis" />,
  YAxis: () => <g data-testid="y-axis" />,
  CartesianGrid: () => <g data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
}));

describe('ChartRenderer', () => {
  const barChartSpec: ChartSpec = {
    v: 1,
    type: 'bar',
    data: {
      source: 'pipeline_stages',
      dimensions: [{ field: 'stage' }],
      measures: [{ field: 'amount', aggregate: 'sum' }],
    },
    encodings: {
      x: { field: 'stage' },
      y: { field: 'amount', aggregate: 'sum' },
    },
    options: {
      title: 'Pipeline by Stage',
      height: 280,
    },
  };

  const lineChartSpec: ChartSpec = {
    v: 1,
    type: 'line',
    data: {
      source: 'sales_revenue',
      dimensions: [{ field: 'month' }, { field: 'lead_source' }],
      measures: [{ field: 'revenue', aggregate: 'sum' }],
    },
    encodings: {
      x: { field: 'month' },
      y: { field: 'revenue', aggregate: 'sum' },
      series: { field: 'lead_source' },
      smooth: true,
    },
    options: {
      title: 'Revenue by Month',
      height: 280,
    },
  };

  const pieChartSpec: ChartSpec = {
    v: 1,
    type: 'pie',
    data: {
      source: 'ar_aging',
      dimensions: [{ field: 'aging_bucket' }],
      measures: [{ field: 'amount_due', aggregate: 'sum' }],
    },
    encodings: {
      series: { field: 'aging_bucket' },
      y: { field: 'amount_due', aggregate: 'sum' },
    },
    options: {
      title: 'A/R by Aging',
      height: 280,
    },
  };

  const tableChartSpec: ChartSpec = {
    v: 1,
    type: 'table',
    data: {
      source: 'top_accounts',
      dimensions: [{ field: 'account_name' }],
      measures: [{ field: 'revenue_90d', aggregate: 'sum' }],
    },
    encodings: {},
    options: {
      title: 'Top Accounts',
    },
  };

  test('renders a BarChart component for bar chart type', () => {
    render(<ChartRenderer spec={barChartSpec} />);
    
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    expect(screen.getByTestId('bar')).toBeInTheDocument();
    expect(screen.getByTestId('x-axis')).toBeInTheDocument();
    expect(screen.getByTestId('y-axis')).toBeInTheDocument();
  });

  test('renders a LineChart component for line chart type', () => {
    render(<ChartRenderer spec={lineChartSpec} />);
    
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    expect(screen.getAllByTestId('line')).toHaveLength(2); // Multiple series = multiple lines
    expect(screen.getByTestId('x-axis')).toBeInTheDocument();
    expect(screen.getByTestId('y-axis')).toBeInTheDocument();
  });

  test('renders a PieChart component for pie chart type', () => {
    render(<ChartRenderer spec={pieChartSpec} />);
    
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
    expect(screen.getByTestId('pie')).toBeInTheDocument();
    expect(screen.getByTestId('tooltip')).toBeInTheDocument();
  });

  test('renders a table for table chart type', () => {
    render(<ChartRenderer spec={tableChartSpec} />);
    
    // Should render an HTML table, not a chart
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /account_name/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /revenue_90d/i })).toBeInTheDocument();
  });

  test('applies custom height from chart options', () => {
    const customHeightSpec = { ...barChartSpec, options: { height: 400 } };
    render(<ChartRenderer spec={customHeightSpec} />);
    
    const container = screen.getByTestId('responsive-container').parentElement;
    expect(container).toHaveStyle({ height: '400px' });
  });

  test('uses default height when not specified', () => {
    const noHeightSpec = { ...barChartSpec, options: {} };
    render(<ChartRenderer spec={noHeightSpec} />);
    
    const container = screen.getByTestId('responsive-container').parentElement;
    expect(container).toHaveStyle({ height: '300px' });
  });
});
