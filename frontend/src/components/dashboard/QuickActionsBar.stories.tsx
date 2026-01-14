/**
 * QuickActionsBar Storybook Stories
 * Visual documentation and testing for the component
 */

import type { Meta, StoryObj } from '@storybook/react';
import { QuickActionsBar } from './QuickActionsBar';

const meta = {
  title: 'Dashboard/QuickActionsBar',
  component: QuickActionsBar,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof QuickActionsBar>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default story - all callbacks
 */
export const Default: Story = {
  args: {
    onBuyNew: () => alert('Buy New eSIM clicked'),
    onTopUp: () => alert('Top Up Data clicked'),
    onSupport: () => alert('Support clicked'),
    onSettings: () => alert('Settings clicked'),
  },
};

/**
 * Without callbacks
 */
export const NoCallbacks: Story = {
  args: {},
};

/**
 * Loading state
 */
export const Loading: Story = {
  args: {
    isLoading: true,
    onBuyNew: () => alert('Buy New eSIM clicked'),
    onTopUp: () => alert('Top Up Data clicked'),
    onSupport: () => alert('Support clicked'),
    onSettings: () => alert('Settings clicked'),
  },
};

/**
 * Only Buy New callback
 */
export const OnlyBuyNew: Story = {
  args: {
    onBuyNew: () => alert('Buy New eSIM clicked'),
  },
};

/**
 * Only Top Up callback
 */
export const OnlyTopUp: Story = {
  args: {
    onTopUp: () => alert('Top Up Data clicked'),
  },
};

/**
 * Only Support callback
 */
export const OnlySupport: Story = {
  args: {
    onSupport: () => alert('Support clicked'),
  },
};

/**
 * Only Settings callback
 */
export const OnlySettings: Story = {
  args: {
    onSettings: () => alert('Settings clicked'),
  },
};

/**
 * Mobile view
 */
export const MobileView: Story = {
  args: {
    onBuyNew: () => alert('Buy New eSIM clicked'),
    onTopUp: () => alert('Top Up Data clicked'),
    onSupport: () => alert('Support clicked'),
    onSettings: () => alert('Settings clicked'),
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
    onBuyNew: () => alert('Buy New eSIM clicked'),
    onTopUp: () => alert('Top Up Data clicked'),
    onSupport: () => alert('Support clicked'),
    onSettings: () => alert('Settings clicked'),
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
    onBuyNew: () => alert('Buy New eSIM clicked'),
    onTopUp: () => alert('Top Up Data clicked'),
    onSupport: () => alert('Support clicked'),
    onSettings: () => alert('Settings clicked'),
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
    isLoading: true,
    onBuyNew: () => alert('Buy New eSIM clicked'),
    onTopUp: () => alert('Top Up Data clicked'),
    onSupport: () => alert('Support clicked'),
    onSettings: () => alert('Settings clicked'),
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

/**
 * Loading on desktop
 */
export const LoadingDesktop: Story = {
  args: {
    isLoading: true,
    onBuyNew: () => alert('Buy New eSIM clicked'),
    onTopUp: () => alert('Top Up Data clicked'),
    onSupport: () => alert('Support clicked'),
    onSettings: () => alert('Settings clicked'),
  },
  parameters: {
    viewport: {
      defaultViewport: 'desktop',
    },
  },
};
