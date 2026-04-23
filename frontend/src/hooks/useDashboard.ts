/**
 * useDashboard Hook
 * Manages dashboard data fetching and state
 * Uses React Query for caching and synchronization
 */

import { useQuery, UseQueryResult } from 'react-query';
import { dashboardService } from '@/services/dashboard.service';
import { DashboardData, DashboardError } from '@/types/dashboard';

interface UseDashboardOptions {
  enabled?: boolean;
  refetchInterval?: number;
  staleTime?: number;
}

/**
 * Main dashboard hook - fetches all dashboard data
 */
export function useDashboard(
  options: UseDashboardOptions = {}
): UseQueryResult<DashboardData, DashboardError> {
  const {
    enabled = true,
    refetchInterval = 30000, // Refetch every 30 seconds
    staleTime = 10000, // Data is fresh for 10 seconds
  } = options;

  return useQuery({
    queryKey: ['dashboard'],
    queryFn: () => dashboardService.getDashboardData(),
    enabled,
    refetchInterval,
    staleTime,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

/**
 * Hook for active eSIMs
 */
export function useActiveESIMs(options: UseDashboardOptions = {}) {
  const { enabled = true, staleTime = 10000 } = options;

  return useQuery({
    queryKey: ['esims', 'active'],
    queryFn: () => dashboardService.getActiveESIMs(),
    enabled,
    staleTime,
    retry: 2,
  });
}

/**
 * Hook for recent orders
 */
export function useRecentOrders(limit: number = 5, options: UseDashboardOptions = {}) {
  const { enabled = true, staleTime = 10000 } = options;

  return useQuery({
    queryKey: ['orders', 'recent', limit],
    queryFn: () => dashboardService.getRecentOrders(limit),
    enabled,
    staleTime,
    retry: 2,
  });
}

/**
 * Hook for dashboard statistics
 */
export function useDashboardStats(options: UseDashboardOptions = {}) {
  const { enabled = true, staleTime = 10000 } = options;

  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: () => dashboardService.getStats(),
    enabled,
    staleTime,
    retry: 2,
  });
}

/**
 * Hook for eSIM QR code
 */
export function useESIMQRCode(esimId: string, options: UseDashboardOptions = {}) {
  const { enabled = !!esimId, staleTime = 60000 } = options;

  return useQuery({
    queryKey: ['esim', esimId, 'qr'],
    queryFn: () => dashboardService.getESIMQRCode(esimId),
    enabled,
    staleTime,
    retry: 1,
  });
}

/**
 * Hook for eSIM usage
 */
export function useESIMUsage(esimId: string, options: UseDashboardOptions = {}) {
  const { enabled = !!esimId, staleTime = 5000 } = options;

  return useQuery({
    queryKey: ['esim', esimId, 'usage'],
    queryFn: () => dashboardService.getESIMUsage(esimId),
    enabled,
    staleTime,
    retry: 2,
  });
}
