/**
 * useMockDashboard Hook
 * Returns mock dashboard data for development and testing
 * Can be swapped with useDashboard for real API calls
 */

import { useQuery, UseQueryResult } from 'react-query';
import { DashboardData, DashboardError } from '@/types/dashboard';
import { mockDashboardData } from '@/mocks/dashboardData';

interface UseMockDashboardOptions {
  /** Delay in milliseconds to simulate network latency */
  delay?: number;
  /** Whether to simulate an error */
  simulateError?: boolean;
  /** Error message to simulate */
  errorMessage?: string;
  /** Scenario to use (default, empty, minimal, loaded, etc.) */
  scenario?: 'default' | 'empty' | 'minimal' | 'loaded' | 'highUsage' | 'expiring' | 'pendingOrders' | 'failedOrders';
}

/**
 * Simulate network delay
 */
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * useMockDashboard Hook
 */
export function useMockDashboard(
  options: UseMockDashboardOptions = {}
): UseQueryResult<DashboardData, DashboardError> {
  const {
    delay: delayMs = 500,
    simulateError = false,
    errorMessage = 'Failed to load dashboard',
    scenario = 'default',
  } = options;

  return useQuery({
    queryKey: ['dashboard', 'mock', scenario],
    queryFn: async () => {
      // Simulate network delay
      await delay(delayMs);

      // Simulate error
      if (simulateError) {
        throw new Error(errorMessage);
      }

      // Return mock data based on scenario
      if (scenario === 'default') {
        return mockDashboardData;
      }

      // Import scenarios dynamically
      const { mockScenarios } = await import('@/mocks/dashboardData');
      const scenarioFn = mockScenarios[scenario as keyof typeof mockScenarios];

      if (scenarioFn) {
        return scenarioFn();
      }

      return mockDashboardData;
    },
    staleTime: 10000,
    retry: 1,
  });
}

/**
 * Hook to get mock data synchronously (for Storybook, etc.)
 */
export function getMockDashboardData(scenario: string = 'default'): DashboardData {
  const { mockScenarios } = require('@/mocks/dashboardData');
  const scenarioFn = mockScenarios[scenario];

  if (scenarioFn) {
    return scenarioFn();
  }

  return mockDashboardData;
}
