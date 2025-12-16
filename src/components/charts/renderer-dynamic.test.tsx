import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import { ChartRenderer } from './renderer';
import type { ChartSpec } from '@/types/chart-spec';
import { gql } from '@apollo/client';

const EXECUTE_CHART = gql`
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

const mockChartSpec: ChartSpec = {
  v: 1,
  type: 'bar',
  data: {
    source: 'test_data',
    dimensions: [{ field: 'category' }],
    measures: [{ field: 'value', aggregate: 'sum' }],
  },
  encodings: {
    x: { field: 'category' },
    y: { field: 'value', aggregate: 'sum' },
  },
  options: {
    title: 'Test Chart',
    height: 200,
  },
};

const mockData = [
  { category: 'A', value: 100 },
  { category: 'B', value: 200 },
  { category: 'C', value: 150 },
];

const mocks = [
  {
    request: {
      query: EXECUTE_CHART,
      variables: { spec: mockChartSpec },
    },
    result: {
      data: {
        executeChart: {
          rows: mockData,
          meta: {
            rowCount: 3,
            durationMs: 45,
          },
        },
      },
    },
  },
];

const errorMocks = [
  {
    request: {
      query: EXECUTE_CHART,
      variables: { spec: mockChartSpec },
    },
    error: new Error('GraphQL error'),
  },
];

describe('ChartRenderer (Dynamic)', () => {
  it('initially renders loading state', () => {
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <ChartRenderer spec={mockChartSpec} />
      </MockedProvider>
    );

    // Should show skeleton loading state
    expect(screen.getByTestId('skeleton')).toBeInTheDocument();
  });

  it('renders chart after data is fetched', async () => {
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <ChartRenderer spec={mockChartSpec} />
      </MockedProvider>
    );

    // Wait for the data to be fetched and chart to render
    await waitFor(() => {
      // Check for SVG element which indicates chart is rendered
      expect(document.querySelector('svg')).toBeInTheDocument();
    });
  });

  it('handles error state gracefully', async () => {
    render(
      <MockedProvider mocks={errorMocks} addTypename={false}>
        <ChartRenderer spec={mockChartSpec} />
      </MockedProvider>
    );

    // Wait for error state
    await waitFor(() => {
      expect(screen.getByText('Failed to load chart')).toBeInTheDocument();
      expect(screen.getByText('Using fallback data')).toBeInTheDocument();
    });
  });
});
