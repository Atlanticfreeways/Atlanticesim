/**
 * MyESIMsSection Storybook Stories
 * Visual documentation and testing for the component
 */

import type { Meta, StoryObj } from '@storybook/react';
import { MyESIMsSection } from './MyESIMsSection';
import { ESIM } from '@/types/dashboard';

const meta = {
  title: 'Dashboard/MyESIMsSection',
  component: MyESIMsSection,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof MyESIMsSection>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Mock eSIM data
 */
const mockESIMs: ESIM[] = [
  {
    id: '1',
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
    qrCode: 'data:image/png;base64,...',
  },
  {
    id: '2',
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
    qrCode: 'data:image/png;base64,...',
  },
  {
    id: '3',
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
    qrCode: 'data:image/png;base64,...',
  },
];

/**
 * Default story - with eSIMs
 */
export const Default: Story = {
  args: {
    esims: mockESIMs,
    isLoading: false,
  },
};

/**
 * Loading state
 */
export const Loading: Story = {
  args: {
    esims: [],
    isLoading: true,
  },
};

/**
 * Empty state
 */
export const Empty: Story = {
  args: {
    esims: [],
    isLoading: false,
  },
};

/**
 * Single eSIM
 */
export const SingleESIM: Story = {
  args: {
    esims: [mockESIMs[0]],
    isLoading: false,
  },
};

/**
 * Two eSIMs
 */
export const TwoESIMs: Story = {
  args: {
    esims: [mockESIMs[0], mockESIMs[1]],
    isLoading: false,
  },
};

/**
 * With callbacks
 */
export const WithCallbacks: Story = {
  args: {
    esims: mockESIMs,
    isLoading: false,
    onViewDetails: (id) => alert(`View details for eSIM: ${id}`),
    onShowQR: (id) => alert(`Show QR for eSIM: ${id}`),
    onManage: (id) => alert(`Manage eSIM: ${id}`),
  },
};

/**
 * Many eSIMs
 */
export const ManyESIMs: Story = {
  args: {
    esims: Array.from({ length: 6 }, (_, i) => ({
      ...mockESIMs[i % mockESIMs.length],
      id: `esim-${i}`,
    })),
    isLoading: false,
  },
};

/**
 * Different statuses
 */
export const DifferentStatuses: Story = {
  args: {
    esims: [
      { ...mockESIMs[0], status: 'ACTIVE' },
      { ...mockESIMs[1], status: 'EXPIRING_SOON' },
      { ...mockESIMs[2], status: 'EXPIRED' },
    ],
    isLoading: false,
  },
};

/**
 * High data usage
 */
export const HighDataUsage: Story = {
  args: {
    esims: [
      { ...mockESIMs[0], dataUsed: 4.8, dataAmount: 5 },
      { ...mockESIMs[1], dataUsed: 9.5, dataAmount: 10 },
      { ...mockESIMs[2], dataUsed: 2.9, dataAmount: 3 },
    ],
    isLoading: false,
  },
};

/**
 * Mobile view
 */
export const MobileView: Story = {
  args: {
    esims: mockESIMs,
    isLoading: false,
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

/**
 * Tablet view
 */
export const TabletView: Story = {
  args: {
    esims: mockESIMs,
    isLoading: false,
  },
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
  },
};

/**
 * Desktop view
 */
export const DesktopView: Story = {
  args: {
    esims: mockESIMs,
    isLoading: false,
  },
  parameters: {
    viewport: {
      defaultViewport: 'desktop',
    },
  },
};

/**
 * Loading on mobile
 */
export const LoadingMobile: Story = {
  args: {
    esims: [],
    isLoading: true,
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

/**
 * Empty on mobile
 */
export const EmptyMobile: Story = {
  args: {
    esims: [],
    isLoading: false,
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};
