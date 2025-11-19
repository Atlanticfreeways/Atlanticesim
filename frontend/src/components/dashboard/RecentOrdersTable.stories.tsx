/**
 * RecentOrdersTable Storybook Stories
 * Visual documentation and testing for the component
 */

import type { Meta, StoryObj } from '@storybook/react';
import { RecentOrdersTable } from './RecentOrdersTable';
import { Order } from '@/types/dashboard';

const meta = {
  title: 'Dashboard/RecentOrdersTable',
  component: RecentOrdersTable,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof RecentOrdersTable>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Mock data
 */
const mockOrders: Order[] = [
  {
    id: 'order-001',
    packageId: 'pkg-1',
    packageName: 'USA 5GB - 30 Days',
    price: 19.99,
    currency: 'USD',
    status: 'COMPLETED',
    createdAt: '2025-11-10T10:00:00Z',
    updatedAt: '2025-11-10T10:00:00Z',
  },
  {
    id: 'order-002',
    packageId: 'pkg-2',
    packageName: 'Europe 10GB - 30 Days',
    price: 24.99,
    currency: 'USD',
    status: 'PENDING',
    createdAt: '2025-11-09T10:00:00Z',
    updatedAt: '2025-11-09T10:00:00Z',
  },
  {
    id: 'order-003',
    packageId: 'pkg-3',
    packageName: 'Asia 3GB - 7 Days',
    price: 9.99,
    currency: 'USD',
    status: 'COMPLETED',
    createdAt: '2025-11-08T10:00:00Z',
    updatedAt: '2025-11-08T10:00:00Z',
  },
  {
    id: 'order-004',
    packageId: 'pkg-4',
    packageName: 'Canada 2GB - 7 Days',
    price: 7.99,
    currency: 'USD',
    status: 'FAILED',
    createdAt: '2025-11-07T10:00:00Z',
    updatedAt: '2025-11-07T10:00:00Z',
  },
  {
    id: 'order-005',
    packageId: 'pkg-5',
    packageName: 'Australia 5GB - 14 Days',
    price: 14.99,
    currency: 'USD',
    status: 'CANCELLED',
    createdAt: '2025-11-06T10:00:00Z',
    updatedAt: '2025-11-06T10:00:00Z',
  },
];

/**
 * Default story - with orders
 */
export const Default: Story = {
  args: {
    orders: mockOrders,
    isLoading: false,
  },
};

/**
 * Loading state
 */
export const Loading: Story = {
  args: {
    orders: [],
    isLoading: true,
  },
};

/**
 * Empty state
 */
export const Empty: Story = {
  args: {
    orders: [],
    isLoading: false,
  },
};

/**
 * Single order
 */
export const SingleOrder: Story = {
  args: {
    orders: [mockOrders[0]],
    isLoading: false,
  },
};

/**
 * With callbacks
 */
export const WithCallbacks: Story = {
  args: {
    orders: mockOrders,
    isLoading: false,
    onViewAll: () => alert('View All clicked'),
    onViewOrder: (orderId) => alert(`View Order: ${orderId}`),
  },
};

/**
 * Different statuses
 */
export const AllStatuses: Story = {
  args: {
    orders: [
      { ...mockOrders[0], status: 'COMPLETED' },
      { ...mockOrders[1], status: 'PENDING' },
      { ...mockOrders[2], status: 'FAILED' },
      { ...mockOrders[3], status: 'CANCELLED' },
    ],
    isLoading: false,
  },
};

/**
 * Many orders
 */
export const ManyOrders: Story = {
  args: {
    orders: Array.from({ length: 10 }, (_, i) => ({
      ...mockOrders[i % mockOrders.length],
      id: `order-${String(i + 1).padStart(3, '0')}`,
    })),
    isLoading: false,
  },
};

/**
 * Long package names
 */
export const LongPackageNames: Story = {
  args: {
    orders: [
      {
        ...mockOrders[0],
        packageName: 'Ultra Premium International Data Bundle with Unlimited Calls and SMS - 60 Days',
      },
      {
        ...mockOrders[1],
        packageName: 'Basic Data Only Plan for Europe Region - 7 Days',
      },
    ],
    isLoading: false,
  },
};

/**
 * Different currencies
 */
export const DifferentCurrencies: Story = {
  args: {
    orders: [
      { ...mockOrders[0], currency: 'USD', price: 19.99 },
      { ...mockOrders[1], currency: 'EUR', price: 22.99 },
      { ...mockOrders[2], currency: 'GBP', price: 17.99 },
      { ...mockOrders[3], currency: 'JPY', price: 2199 },
    ],
    isLoading: false,
  },
};

/**
 * Mobile view (responsive)
 */
export const MobileView: Story = {
  args: {
    orders: mockOrders,
    isLoading: false,
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

/**
 * Tablet view (responsive)
 */
export const TabletView: Story = {
  args: {
    orders: mockOrders,
    isLoading: false,
  },
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
  },
};

/**
 * Desktop view (responsive)
 */
export const DesktopView: Story = {
  args: {
    orders: mockOrders,
    isLoading: false,
  },
  parameters: {
    viewport: {
      defaultViewport: 'desktop',
    },
  },
};
