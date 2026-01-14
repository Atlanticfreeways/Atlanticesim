/**
 * DashboardFooter Storybook Stories
 * Visual documentation and testing for the component
 */

import type { Meta, StoryObj } from '@storybook/react';
import { DashboardFooter } from './DashboardFooter';

const meta = {
  title: 'Dashboard/DashboardFooter',
  component: DashboardFooter,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof DashboardFooter>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default story
 */
export const Default: Story = {
  args: {},
};

/**
 * With callbacks
 */
export const WithCallbacks: Story = {
  args: {
    onHelpClick: () => alert('Help clicked'),
    onSupportClick: () => alert('Support clicked'),
    onTermsClick: () => alert('Terms clicked'),
    onPrivacyClick: () => alert('Privacy clicked'),
  },
};

/**
 * Custom company name
 */
export const CustomCompanyName: Story = {
  args: {
    companyName: 'Global eSIM Solutions',
  },
};

/**
 * Custom year
 */
export const CustomYear: Story = {
  args: {
    year: 2024,
  },
};

/**
 * Different company and year
 */
export const CustomCompanyAndYear: Story = {
  args: {
    companyName: 'Premium eSIM Services',
    year: 2023,
  },
};

/**
 * Mobile view
 */
export const MobileView: Story = {
  args: {},
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
  args: {},
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
  args: {},
  parameters: {
    viewport: {
      defaultViewport: 'desktop',
    },
  },
};

/**
 * With all customizations
 */
export const FullyCustomized: Story = {
  args: {
    companyName: 'Atlantic eSIM Premium',
    year: 2025,
    onHelpClick: () => console.log('Help clicked'),
    onSupportClick: () => console.log('Support clicked'),
    onTermsClick: () => console.log('Terms clicked'),
    onPrivacyClick: () => console.log('Privacy clicked'),
  },
};

/**
 * Long company name
 */
export const LongCompanyName: Story = {
  args: {
    companyName: 'International Global eSIM Distribution and Services Company',
  },
};
