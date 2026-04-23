/**
 * Dashboard Page Tests
 * Tests for the main dashboard page
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Dashboard } from './Dashboard';
import * as dashboardHooks from '@/hooks/useDashboard';

// Mock the useDashboard hook
jest.mock('@/hooks/useDashboard');

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const queryClient = new QueryClient();

const renderDashboard = () => {
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Dashboard Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
  });

  describe('Rendering', () => {
    it('should render dashboard header', () => {
      (dashboardHooks.useDashboard as jest.Mock).mockReturnValue({
        data: {
          stats: { activeESIMs: 2, totalSpent: 50, totalDataUsed: 5 },
          esims: [],
          recentOrders: [],
          notificationCount: 0,
          user: { name: 'John Doe' },
        },
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      });

      renderDashboard();
      expect(screen.getByText(/Welcome back, John Doe/)).toBeInTheDocument();
    });

    it('should render welcome banner', () => {
      (dashboardHooks.useDashboard as jest.Mock).mockReturnValue({
        data: {
          stats: { activeESIMs: 0, totalSpent: 0, totalDataUsed: 0 },
          esims: [],
          recentOrders: [],
          notificationCount: 0,
          user: { name: 'John' },
        },
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      });

      renderDashboard();
      expect(screen.getByText('Welcome to Atlantic eSIM')).toBeInTheDocument();
    });

    it('should render stats cards', () => {
      (dashboardHooks.useDashboard as jest.Mock).mockReturnValue({
        data: {
          stats: { activeESIMs: 2, totalSpent: 50, totalDataUsed: 5 },
          esims: [],
          recentOrders: [],
          notificationCount: 0,
          user: { name: 'John' },
        },
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      });

      renderDashboard();
      expect(screen.getByText('Active eSIMs')).toBeInTheDocument();
      expect(screen.getByText('Total Spent')).toBeInTheDocument();
      expect(screen.getByText('Data Used')).toBeInTheDocument();
    });

    it('should render My eSIMs section', () => {
      (dashboardHooks.useDashboard as jest.Mock).mockReturnValue({
        data: {
          stats: { activeESIMs: 0, totalSpent: 0, totalDataUsed: 0 },
          esims: [],
          recentOrders: [],
          notificationCount: 0,
          user: { name: 'John' },
        },
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      });

      renderDashboard();
      expect(screen.getByText('My eSIMs')).toBeInTheDocument();
    });

    it('should render Recent Orders section', () => {
      (dashboardHooks.useDashboard as jest.Mock).mockReturnValue({
        data: {
          stats: { activeESIMs: 0, totalSpent: 0, totalDataUsed: 0 },
          esims: [],
          recentOrders: [],
          notificationCount: 0,
          user: { name: 'John' },
        },
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      });

      renderDashboard();
      expect(screen.getByText('Recent Orders')).toBeInTheDocument();
    });

    it('should render Quick Actions section', () => {
      (dashboardHooks.useDashboard as jest.Mock).mockReturnValue({
        data: {
          stats: { activeESIMs: 0, totalSpent: 0, totalDataUsed: 0 },
          esims: [],
          recentOrders: [],
          notificationCount: 0,
          user: { name: 'John' },
        },
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      });

      renderDashboard();
      expect(screen.getByText('Quick Actions')).toBeInTheDocument();
    });

    it('should render footer', () => {
      (dashboardHooks.useDashboard as jest.Mock).mockReturnValue({
        data: {
          stats: { activeESIMs: 0, totalSpent: 0, totalDataUsed: 0 },
          esims: [],
          recentOrders: [],
          notificationCount: 0,
          user: { name: 'John' },
        },
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      });

      renderDashboard();
      expect(screen.getByText('Help & Support')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should show loading skeletons when loading', () => {
      (dashboardHooks.useDashboard as jest.Mock).mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
        refetch: jest.fn(),
      });

      renderDashboard();
      // Loading state should show skeletons
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should show error message when error occurs', () => {
      const error = new Error('Failed to load dashboard');
      (dashboardHooks.useDashboard as jest.Mock).mockReturnValue({
        data: null,
        isLoading: false,
        error,
        refetch: jest.fn(),
      });

      renderDashboard();
      expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument();
      expect(screen.getByText('Failed to load dashboard')).toBeInTheDocument();
    });

    it('should show retry button on error', () => {
      const error = new Error('Failed to load');
      (dashboardHooks.useDashboard as jest.Mock).mockReturnValue({
        data: null,
        isLoading: false,
        error,
        refetch: jest.fn(),
      });

      renderDashboard();
      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });

    it('should call refetch when retry button is clicked', async () => {
      const refetch = jest.fn();
      const error = new Error('Failed to load');
      (dashboardHooks.useDashboard as jest.Mock).mockReturnValue({
        data: null,
        isLoading: false,
        error,
        refetch,
      });

      renderDashboard();
      const retryButton = screen.getByText('Try Again');
      await userEvent.click(retryButton);

      expect(refetch).toHaveBeenCalled();
    });
  });

  describe('Navigation', () => {
    beforeEach(() => {
      (dashboardHooks.useDashboard as jest.Mock).mockReturnValue({
        data: {
          stats: { activeESIMs: 0, totalSpent: 0, totalDataUsed: 0 },
          esims: [],
          recentOrders: [],
          notificationCount: 0,
          user: { name: 'John' },
        },
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      });
    });

    it('should navigate to packages when Buy New is clicked', async () => {
      renderDashboard();
      const buyButton = screen.getByLabelText('+ Buy New eSIM');
      await userEvent.click(buyButton);

      expect(mockNavigate).toHaveBeenCalledWith('/packages');
    });

    it('should navigate to support when Support is clicked', async () => {
      renderDashboard();
      const supportButton = screen.getByLabelText('Support');
      await userEvent.click(supportButton);

      expect(mockNavigate).toHaveBeenCalledWith('/support');
    });

    it('should navigate to settings when Settings is clicked', async () => {
      renderDashboard();
      const settingsButton = screen.getByLabelText('Settings');
      await userEvent.click(settingsButton);

      expect(mockNavigate).toHaveBeenCalledWith('/settings');
    });
  });

  describe('Data Display', () => {
    it('should display correct stats values', () => {
      (dashboardHooks.useDashboard as jest.Mock).mockReturnValue({
        data: {
          stats: { activeESIMs: 3, totalSpent: 99.99, totalDataUsed: 15.5 },
          esims: [],
          recentOrders: [],
          notificationCount: 0,
          user: { name: 'John' },
        },
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      });

      renderDashboard();
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('$99.99')).toBeInTheDocument();
      expect(screen.getByText('15.5')).toBeInTheDocument();
    });

    it('should display user name in header', () => {
      (dashboardHooks.useDashboard as jest.Mock).mockReturnValue({
        data: {
          stats: { activeESIMs: 0, totalSpent: 0, totalDataUsed: 0 },
          esims: [],
          recentOrders: [],
          notificationCount: 0,
          user: { name: 'Jane Smith' },
        },
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      });

      renderDashboard();
      expect(screen.getByText(/Welcome back, Jane Smith/)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper main element', () => {
      (dashboardHooks.useDashboard as jest.Mock).mockReturnValue({
        data: {
          stats: { activeESIMs: 0, totalSpent: 0, totalDataUsed: 0 },
          esims: [],
          recentOrders: [],
          notificationCount: 0,
          user: { name: 'John' },
        },
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      });

      const { container } = renderDashboard();
      expect(container.querySelector('main')).toBeInTheDocument();
    });

    it('should have proper heading hierarchy', () => {
      (dashboardHooks.useDashboard as jest.Mock).mockReturnValue({
        data: {
          stats: { activeESIMs: 0, totalSpent: 0, totalDataUsed: 0 },
          esims: [],
          recentOrders: [],
          notificationCount: 0,
          user: { name: 'John' },
        },
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      });

      renderDashboard();
      const headings = screen.getAllByRole('heading');
      expect(headings.length).toBeGreaterThan(0);
    });
  });
});
