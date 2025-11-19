/**
 * DashboardHeader Storybook Stories
 * Visual documentation and testing for the component
 */

import type { Meta, StoryObj } from '@storybook/react';
import { DashboardHeader } from './DashboardHeader';

const meta = {
  title: 'Dashboard/DashboardHeader',
  component: DashboardHeader,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof DashboardHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default story
 */
export const Default: Story = {
  args: {
    userName: 'John Doe',
    notificationCount: 0,
  },
};

/**
 * With notifications
 */
export const WithNotifications: Story = {
  args: {
    userName: 'John Doe',
    notificationCount: 5,
  },
};

/**
 * With many notifications
 */
export const WithManyNotifications: Story = {
  args: {
    userName: 'John Doe',
    notificationCount: 15,
  },
};

/**
 * With callbacks
 */
export const WithCallbacks: Story = {
  args: {
    userName: 'John Doe',
    notificationCount: 3,
    onSearch: (query) => alert(`Search: ${query}`),
    onNotifications: () => alert('Notifications clicked'),
    onProfile: () => alert('Profile clicked'),
    onLogout: () => alert('Logout clicked'),
  },
};

/**
 * Loading state
 */
export const Loading: Story = {
  args: {
    userName: 'John Doe',
    notificationCount: 0,
    isLoading: true,
  },
};

/**
 * Different user names
 */
export const DifferentUserNames: Story = {
  args: {
    userName: 'Jane Smith',
    notificationCount: 2,
  },
};

/**
 * Long user name
 */
export const LongUserName: Story = {
  args: {
    userName: 'Alexander Christopher Montgomery III',
    notificationCount: 0,
  },
};

/**
 * Special characters in name
 */
export const SpecialCharactersInName: Story = {
  args: {
    userName: 'José García-López',
    notificationCount: 1,
  },
};

/**
 * Mobile view
 */
export const MobileView: Story = {
  args: {
    userName: 'John Doe',
    notificationCount: 5,
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
    userName: 'John Doe',
    notificationCount: 5,
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
    userName: 'John Doe',
    notificationCount: 5,
  },
  parameters: {
    viewport: {
      defaultViewport: 'desktop',
    },
  },
};

/**
 * No notifications
 */
export const NoNotifications: Story = {
  args: {
    userName: 'John Doe',
    notificationCount: 0,
  },
};

/**
 * With search interaction
 */
export const WithSearchInteraction: Story = {
  args: {
    userName: 'John Doe',
    notificationCount: 2,
    onSearch: (query) => console.log('Search:', query),
  },
};
