/**
 * Mock Dashboard Data
 * Realistic mock data for development and testing
 */

import { ESIM, Order, DashboardStats, DashboardData } from '@/types/dashboard';

/**
 * Mock eSIM data
 */
export const mockESIMs: ESIM[] = [
  {
    id: 'esim-001',
    iccid: '8901410123456789012',
    status: 'ACTIVE',
    country: 'USA',
    countryCode: 'US',
    dataAmount: 5,
    dataUnit: 'GB',
    dataUsed: 2.5,
    validityDays: 30,
    activatedAt: '2025-11-10T10:00:00Z',
    expiresAt: '2025-12-10T10:00:00Z',
    provider: 'Airalo',
    qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  },
  {
    id: 'esim-002',
    iccid: '8901410123456789013',
    status: 'ACTIVE',
    country: 'Europe',
    countryCode: 'DE',
    dataAmount: 10,
    dataUnit: 'GB',
    dataUsed: 3.2,
    validityDays: 30,
    activatedAt: '2025-11-09T10:00:00Z',
    expiresAt: '2025-12-09T10:00:00Z',
    provider: 'Maya Mobile',
    qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  },
  {
    id: 'esim-003',
    iccid: '8901410123456789014',
    status: 'EXPIRING_SOON',
    country: 'Asia',
    countryCode: 'SG',
    dataAmount: 3,
    dataUnit: 'GB',
    dataUsed: 2.8,
    validityDays: 7,
    activatedAt: '2025-11-03T10:00:00Z',
    expiresAt: '2025-11-20T10:00:00Z',
    provider: 'eSIMCard',
    qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  },
];

/**
 * Mock order data
 */
export const mockOrders: Order[] = [
  {
    id: 'order-001',
    packageId: 'pkg-001',
    packageName: 'USA 5GB - 30 Days',
    price: 19.99,
    currency: 'USD',
    status: 'COMPLETED',
    createdAt: '2025-11-10T10:00:00Z',
    updatedAt: '2025-11-10T10:30:00Z',
  },
  {
    id: 'order-002',
    packageId: 'pkg-002',
    packageName: 'Europe 10GB - 30 Days',
    price: 24.99,
    currency: 'USD',
    status: 'COMPLETED',
    createdAt: '2025-11-09T10:00:00Z',
    updatedAt: '2025-11-09T10:30:00Z',
  },
  {
    id: 'order-003',
    packageId: 'pkg-003',
    packageName: 'Asia 3GB - 7 Days',
    price: 9.99,
    currency: 'USD',
    status: 'COMPLETED',
    createdAt: '2025-11-03T10:00:00Z',
    updatedAt: '2025-11-03T10:30:00Z',
  },
  {
    id: 'order-004',
    packageId: 'pkg-004',
    packageName: 'Canada 2GB - 7 Days',
    price: 7.99,
    currency: 'USD',
    status: 'PENDING',
    createdAt: '2025-11-15T14:00:00Z',
    updatedAt: '2025-11-15T14:00:00Z',
  },
  {
    id: 'order-005',
    packageId: 'pkg-005',
    packageName: 'Australia 5GB - 14 Days',
    price: 14.99,
    currency: 'USD',
    status: 'COMPLETED',
    createdAt: '2025-11-01T10:00:00Z',
    updatedAt: '2025-11-01T10:30:00Z',
  },
];

/**
 * Mock stats data
 */
export const mockStats: DashboardStats = {
  activeESIMs: 3,
  totalSpent: 54.97,
  totalDataUsed: 8.5,
  currency: 'USD',
};

/**
 * Mock complete dashboard data
 */
export const mockDashboardData: DashboardData = {
  stats: mockStats,
  esims: mockESIMs,
  recentOrders: mockOrders.slice(0, 3),
};

/**
 * Generate mock eSIM with custom values
 */
export function generateMockESIM(overrides?: Partial<ESIM>): ESIM {
  return {
    id: `esim-${Math.random().toString(36).substr(2, 9)}`,
    iccid: `890141${Math.random().toString().substr(2, 13)}`,
    status: 'ACTIVE',
    country: 'USA',
    countryCode: 'US',
    dataAmount: 5,
    dataUnit: 'GB',
    dataUsed: 2.5,
    validityDays: 30,
    activatedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    provider: 'Airalo',
    qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    ...overrides,
  };
}

/**
 * Generate mock order with custom values
 */
export function generateMockOrder(overrides?: Partial<Order>): Order {
  return {
    id: `order-${Math.random().toString(36).substr(2, 9)}`,
    packageId: `pkg-${Math.random().toString(36).substr(2, 9)}`,
    packageName: 'Sample Package',
    price: 19.99,
    currency: 'USD',
    status: 'COMPLETED',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Generate mock dashboard data with custom values
 */
export function generateMockDashboardData(
  overrides?: Partial<DashboardData>
): DashboardData {
  return {
    stats: mockStats,
    esims: mockESIMs,
    recentOrders: mockOrders.slice(0, 3),
    ...overrides,
  };
}

/**
 * Generate multiple mock eSIMs
 */
export function generateMockESIMs(count: number, overrides?: Partial<ESIM>): ESIM[] {
  return Array.from({ length: count }, (_, i) =>
    generateMockESIM({
      id: `esim-${String(i + 1).padStart(3, '0')}`,
      ...overrides,
    })
  );
}

/**
 * Generate multiple mock orders
 */
export function generateMockOrders(count: number, overrides?: Partial<Order>): Order[] {
  return Array.from({ length: count }, (_, i) =>
    generateMockOrder({
      id: `order-${String(i + 1).padStart(3, '0')}`,
      ...overrides,
    })
  );
}

/**
 * Mock data for different scenarios
 */
export const mockScenarios = {
  /**
   * Empty dashboard (no eSIMs, no orders)
   */
  empty: (): DashboardData => ({
    stats: {
      activeESIMs: 0,
      totalSpent: 0,
      totalDataUsed: 0,
      currency: 'USD',
    },
    esims: [],
    recentOrders: [],
  }),

  /**
   * Single eSIM, single order
   */
  minimal: (): DashboardData => ({
    stats: {
      activeESIMs: 1,
      totalSpent: 19.99,
      totalDataUsed: 2.5,
      currency: 'USD',
    },
    esims: [mockESIMs[0]],
    recentOrders: [mockOrders[0]],
  }),

  /**
   * Many eSIMs and orders
   */
  loaded: (): DashboardData => ({
    stats: {
      activeESIMs: 10,
      totalSpent: 299.99,
      totalDataUsed: 45.5,
      currency: 'USD',
    },
    esims: generateMockESIMs(10),
    recentOrders: generateMockOrders(10),
  }),

  /**
   * High data usage
   */
  highUsage: (): DashboardData => ({
    stats: {
      activeESIMs: 3,
      totalSpent: 54.97,
      totalDataUsed: 28.5,
      currency: 'USD',
    },
    esims: [
      generateMockESIM({ dataUsed: 9.5, dataAmount: 10 }),
      generateMockESIM({ dataUsed: 9.8, dataAmount: 10 }),
      generateMockESIM({ dataUsed: 9.2, dataAmount: 10 }),
    ],
    recentOrders: mockOrders.slice(0, 3),
  }),

  /**
   * Expiring eSIMs
   */
  expiring: (): DashboardData => ({
    stats: {
      activeESIMs: 3,
      totalSpent: 54.97,
      totalDataUsed: 8.5,
      currency: 'USD',
    },
    esims: [
      generateMockESIM({ status: 'EXPIRING_SOON', validityDays: 3 }),
      generateMockESIM({ status: 'EXPIRING_SOON', validityDays: 5 }),
      generateMockESIM({ status: 'EXPIRED' }),
    ],
    recentOrders: mockOrders.slice(0, 3),
  }),

  /**
   * Pending orders
   */
  pendingOrders: (): DashboardData => ({
    stats: mockStats,
    esims: mockESIMs,
    recentOrders: [
      generateMockOrder({ status: 'PENDING' }),
      generateMockOrder({ status: 'PENDING' }),
      generateMockOrder({ status: 'COMPLETED' }),
    ],
  }),

  /**
   * Failed orders
   */
  failedOrders: (): DashboardData => ({
    stats: mockStats,
    esims: mockESIMs,
    recentOrders: [
      generateMockOrder({ status: 'FAILED' }),
      generateMockOrder({ status: 'CANCELLED' }),
      generateMockOrder({ status: 'COMPLETED' }),
    ],
  }),
};
