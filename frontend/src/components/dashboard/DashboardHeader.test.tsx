/**
 * DashboardHeader Component Tests
 * Tests for rendering, interactions, and accessibility
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DashboardHeader } from './DashboardHeader';

describe('DashboardHeader', () => {
  const defaultProps = {
    userName: 'John Doe',
  };

  describe('Rendering', () => {
    it('should render component with welcome message', () => {
      render(<DashboardHeader {...defaultProps} />);
      expect(screen.getByText(/Welcome back, John Doe/)).toBeInTheDocument();
    });

    it('should display user name', () => {
      render(<DashboardHeader {...defaultProps} />);
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('should display current date', () => {
      render(<DashboardHeader {...defaultProps} />);
      const today = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      });
      expect(screen.getByText(today)).toBeInTheDocument();
    });

    it('should render search input', () => {
      render(<DashboardHeader {...defaultProps} />);
      expect(screen.getByPlaceholderText('Search packages...')).toBeInTheDocument();
    });

    it('should render notifications button', () => {
      render(<DashboardHeader {...defaultProps} />);
      expect(screen.getByLabelText(/Notifications/)).toBeInTheDocument();
    });

    it('should render profile button', () => {
      render(<DashboardHeader {...defaultProps} />);
      expect(screen.getByLabelText('User profile menu')).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('should call onSearch when search input changes', async () => {
      const onSearch = jest.fn();
      render(<DashboardHeader {...defaultProps} onSearch={onSearch} />);

      const searchInput = screen.getByPlaceholderText('Search packages...');
      await userEvent.type(searchInput, 'USA');

      expect(onSearch).toHaveBeenCalledWith('USA');
    });

    it('should update search input value', async () => {
      render(<DashboardHeader {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Search packages...') as HTMLInputElement;
      await userEvent.type(searchInput, 'Europe');

      expect(searchInput.value).toBe('Europe');
    });

    it('should show clear button when search has value', async () => {
      render(<DashboardHeader {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Search packages...');
      await userEvent.type(searchInput, 'test');

      expect(screen.getByLabelText('Clear search')).toBeInTheDocument();
    });

    it('should clear search when clear button is clicked', async () => {
      const onSearch = jest.fn();
      render(<DashboardHeader {...defaultProps} onSearch={onSearch} />);

      const searchInput = screen.getByPlaceholderText('Search packages...');
      await userEvent.type(searchInput, 'test');

      const clearButton = screen.getByLabelText('Clear search');
      await userEvent.click(clearButton);

      expect(onSearch).toHaveBeenCalledWith('');
    });

    it('should not show clear button when search is empty', () => {
      render(<DashboardHeader {...defaultProps} />);
      expect(screen.queryByLabelText('Clear search')).not.toBeInTheDocument();
    });
  });

  describe('Notifications', () => {
    it('should display notification count', () => {
      render(<DashboardHeader {...defaultProps} notificationCount={5} />);
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('should show 9+ for counts over 9', () => {
      render(<DashboardHeader {...defaultProps} notificationCount={15} />);
      expect(screen.getByText('9+')).toBeInTheDocument();
    });

    it('should not show count badge when notificationCount is 0', () => {
      render(<DashboardHeader {...defaultProps} notificationCount={0} />);
      expect(screen.queryByText('0')).not.toBeInTheDocument();
    });

    it('should call onNotifications when bell is clicked', async () => {
      const onNotifications = jest.fn();
      render(<DashboardHeader {...defaultProps} onNotifications={onNotifications} />);

      const notificationButton = screen.getByLabelText(/Notifications/);
      await userEvent.click(notificationButton);

      expect(onNotifications).toHaveBeenCalledTimes(1);
    });
  });

  describe('Profile Menu', () => {
    it('should not show profile menu initially', () => {
      render(<DashboardHeader {...defaultProps} />);
      expect(screen.queryByText('Profile Settings')).not.toBeInTheDocument();
    });

    it('should show profile menu when profile button is clicked', async () => {
      render(<DashboardHeader {...defaultProps} />);

      const profileButton = screen.getByLabelText('User profile menu');
      await userEvent.click(profileButton);

      expect(screen.getByText('Profile Settings')).toBeInTheDocument();
      expect(screen.getByText('Logout')).toBeInTheDocument();
    });

    it('should hide profile menu when clicked again', async () => {
      render(<DashboardHeader {...defaultProps} />);

      const profileButton = screen.getByLabelText('User profile menu');
      await userEvent.click(profileButton);
      expect(screen.getByText('Profile Settings')).toBeInTheDocument();

      await userEvent.click(profileButton);
      expect(screen.queryByText('Profile Settings')).not.toBeInTheDocument();
    });

    it('should call onProfile when Profile Settings is clicked', async () => {
      const onProfile = jest.fn();
      render(<DashboardHeader {...defaultProps} onProfile={onProfile} />);

      const profileButton = screen.getByLabelText('User profile menu');
      await userEvent.click(profileButton);

      const profileSettingsButton = screen.getByText('Profile Settings');
      await userEvent.click(profileSettingsButton);

      expect(onProfile).toHaveBeenCalledTimes(1);
    });

    it('should call onLogout when Logout is clicked', async () => {
      const onLogout = jest.fn();
      render(<DashboardHeader {...defaultProps} onLogout={onLogout} />);

      const profileButton = screen.getByLabelText('User profile menu');
      await userEvent.click(profileButton);

      const logoutButton = screen.getByText('Logout');
      await userEvent.click(logoutButton);

      expect(onLogout).toHaveBeenCalledTimes(1);
    });

    it('should close menu after profile click', async () => {
      const onProfile = jest.fn();
      render(<DashboardHeader {...defaultProps} onProfile={onProfile} />);

      const profileButton = screen.getByLabelText('User profile menu');
      await userEvent.click(profileButton);

      const profileSettingsButton = screen.getByText('Profile Settings');
      await userEvent.click(profileSettingsButton);

      expect(screen.queryByText('Profile Settings')).not.toBeInTheDocument();
    });

    it('should close menu after logout click', async () => {
      const onLogout = jest.fn();
      render(<DashboardHeader {...defaultProps} onLogout={onLogout} />);

      const profileButton = screen.getByLabelText('User profile menu');
      await userEvent.click(profileButton);

      const logoutButton = screen.getByText('Logout');
      await userEvent.click(logoutButton);

      expect(screen.queryByText('Logout')).not.toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should disable search input when loading', () => {
      render(<DashboardHeader {...defaultProps} isLoading={true} />);
      expect(screen.getByPlaceholderText('Search packages...')).toBeDisabled();
    });

    it('should disable notifications button when loading', () => {
      render(<DashboardHeader {...defaultProps} isLoading={true} />);
      expect(screen.getByLabelText(/Notifications/)).toBeDisabled();
    });

    it('should disable profile button when loading', () => {
      render(<DashboardHeader {...defaultProps} isLoading={true} />);
      expect(screen.getByLabelText('User profile menu')).toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      render(<DashboardHeader {...defaultProps} />);
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent('Welcome back');
    });

    it('should have aria-label on search input', () => {
      render(<DashboardHeader {...defaultProps} />);
      expect(screen.getByLabelText('Search packages')).toBeInTheDocument();
    });

    it('should have aria-label on notifications button', () => {
      render(<DashboardHeader {...defaultProps} />);
      expect(screen.getByLabelText(/Notifications/)).toBeInTheDocument();
    });

    it('should have aria-label on profile button', () => {
      render(<DashboardHeader {...defaultProps} />);
      expect(screen.getByLabelText('User profile menu')).toBeInTheDocument();
    });

    it('should have role="menu" on profile dropdown', async () => {
      render(<DashboardHeader {...defaultProps} />);

      const profileButton = screen.getByLabelText('User profile menu');
      await userEvent.click(profileButton);

      const menu = screen.getByRole('menu');
      expect(menu).toBeInTheDocument();
    });

    it('should have role="menuitem" on menu items', async () => {
      render(<DashboardHeader {...defaultProps} />);

      const profileButton = screen.getByLabelText('User profile menu');
      await userEvent.click(profileButton);

      const menuItems = screen.getAllByRole('menuitem');
      expect(menuItems.length).toBe(2);
    });

    it('should have aria-expanded on profile button', async () => {
      render(<DashboardHeader {...defaultProps} />);

      const profileButton = screen.getByLabelText('User profile menu');
      expect(profileButton).toHaveAttribute('aria-expanded', 'false');

      await userEvent.click(profileButton);
      expect(profileButton).toHaveAttribute('aria-expanded', 'true');
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined callbacks gracefully', () => {
      render(<DashboardHeader {...defaultProps} />);
      expect(screen.getByText(/Welcome back/)).toBeInTheDocument();
    });

    it('should handle very long user names', () => {
      const longName = 'A'.repeat(50);
      render(<DashboardHeader userName={longName} />);
      expect(screen.getByText(new RegExp(longName))).toBeInTheDocument();
    });

    it('should handle special characters in user name', () => {
      render(<DashboardHeader userName="José García-López" />);
      expect(screen.getByText(/José García-López/)).toBeInTheDocument();
    });

    it('should handle component remounting', () => {
      const { rerender } = render(<DashboardHeader {...defaultProps} />);
      expect(screen.getByText(/Welcome back/)).toBeInTheDocument();

      rerender(<DashboardHeader userName="Jane Smith" />);
      expect(screen.getByText(/Welcome back, Jane Smith/)).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should have sticky positioning', () => {
      const { container } = render(<DashboardHeader {...defaultProps} />);
      const header = container.querySelector('header');
      expect(header).toHaveClass('sticky', 'top-0');
    });

    it('should have responsive padding', () => {
      const { container } = render(<DashboardHeader {...defaultProps} />);
      const headerContent = container.querySelector('header > div');
      expect(headerContent).toHaveClass('px-4', 'md:px-6');
    });
  });
});
