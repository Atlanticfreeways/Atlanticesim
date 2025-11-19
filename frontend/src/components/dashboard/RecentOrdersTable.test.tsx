/**
 * RecentOrdersTable Component Tests
 * Tests for rendering, interactions, and edge cases
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RecentOrdersTable } from './RecentOrdersTable';
import { Order } from '@/types/dashboard';

/**
 * Mock data for testing
 */
const mockOrders: Order[] = [
  {
    id: '1',
    packageId: 'pkg-1',
    packageName: 'USA 5GB - 30 Days',
    price: 19.99,
    currency: 'USD',
    status: 'COMPLETED',
    createdAt: '2025-11-10T10:00:00Z',
    updatedAt: '2025-11-10T10:00:00Z',
  },
  {
    id: '2',
    packageId: 'pkg-2',
    packageName: 'Europe 10GB - 30 Days',
    price: 24.99,
    currency: 'USD',
    status: 'PENDING',
    createdAt: '2025-11-09T10:00:00Z',
    updatedAt: '2025-11-09T10:00:00Z',
  },
  {
    id: '3',
    packageId: 'pkg-3',
    packageName: 'Asia 3GB - 7 Days',
    price: 9.99,
    currency: 'USD',
    status: 'FAILED',
    createdAt: '2025-11-08T10:00:00Z',
    updatedAt: '2025-11-08T10:00:00Z',
  },
];

describe('RecentOrdersTable', () => {
  describe('Rendering', () => {
    it('should render component with title', () => {
      render(<RecentOrdersTable orders={mockOrders} />);
      expect(screen.getByText('Recent Orders')).toBeInTheDocument();
    });

    it('should render all orders', () => {
      render(<RecentOrdersTable orders={mockOrders} />);
      mockOrders.forEach((order) => {
        expect(screen.getByText(order.packageName)).toBeInTheDocument();
      });
    });

    it('should display order prices correctly', () => {
      render(<RecentOrdersTable orders={mockOrders} />);
      expect(screen.getByText('$19.99')).toBeInTheDocument();
      expect(screen.getByText('$24.99')).toBeInTheDocument();
      expect(screen.getByText('$9.99')).toBeInTheDocument();
    });

    it('should display status badges', () => {
      render(<RecentOrdersTable orders={mockOrders} />);
      expect(screen.getByText('COMPLETED')).toBeInTheDocument();
      expect(screen.getByText('PENDING')).toBeInTheDocument();
      expect(screen.getByText('FAILED')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should show loading skeleton when isLoading is true', () => {
      const { container } = render(
        <RecentOrdersTable orders={[]} isLoading={true} />
      );
      // Check for skeleton elements
      const skeletons = container.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should not show orders when loading', () => {
      render(<RecentOrdersTable orders={mockOrders} isLoading={true} />);
      // Orders should not be visible during loading
      expect(screen.queryByText(mockOrders[0].packageName)).not.toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should show empty state message when no orders', () => {
      render(<RecentOrdersTable orders={[]} />);
      expect(screen.getByText('No orders yet')).toBeInTheDocument();
      expect(screen.getByText('Your orders will appear here')).toBeInTheDocument();
    });

    it('should not show View All button when empty', () => {
      render(<RecentOrdersTable orders={[]} />);
      expect(screen.queryByText(/View All Orders/)).not.toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('should call onViewAll when View All button is clicked', async () => {
      const onViewAll = jest.fn();
      render(
        <RecentOrdersTable orders={mockOrders} onViewAll={onViewAll} />
      );

      const viewAllButton = screen.getByText(/View All Orders/);
      await userEvent.click(viewAllButton);

      expect(onViewAll).toHaveBeenCalledTimes(1);
    });

    it('should call onViewOrder when order is clicked', async () => {
      const onViewOrder = jest.fn();
      render(
        <RecentOrdersTable orders={mockOrders} onViewOrder={onViewOrder} />
      );

      const firstOrder = screen.getByText(mockOrders[0].packageName);
      await userEvent.click(firstOrder);

      expect(onViewOrder).toHaveBeenCalledWith(mockOrders[0].id);
    });

    it('should call onViewOrder for each order clicked', async () => {
      const onViewOrder = jest.fn();
      render(
        <RecentOrdersTable orders={mockOrders} onViewOrder={onViewOrder} />
      );

      const firstOrder = screen.getByText(mockOrders[0].packageName);
      const secondOrder = screen.getByText(mockOrders[1].packageName);

      await userEvent.click(firstOrder);
      await userEvent.click(secondOrder);

      expect(onViewOrder).toHaveBeenCalledTimes(2);
      expect(onViewOrder).toHaveBeenNthCalledWith(1, mockOrders[0].id);
      expect(onViewOrder).toHaveBeenNthCalledWith(2, mockOrders[1].id);
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      render(<RecentOrdersTable orders={mockOrders} />);
      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toHaveTextContent('Recent Orders');
    });

    it('should have accessible table structure', () => {
      const { container } = render(<RecentOrdersTable orders={mockOrders} />);
      const table = container.querySelector('table');
      expect(table).toBeInTheDocument();
      expect(table?.querySelector('thead')).toBeInTheDocument();
      expect(table?.querySelector('tbody')).toBeInTheDocument();
    });

    it('should have proper button roles', () => {
      render(<RecentOrdersTable orders={mockOrders} />);
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  describe('Date Formatting', () => {
    it('should format dates correctly', () => {
      render(<RecentOrdersTable orders={mockOrders} />);
      // Check that dates are formatted (not ISO strings)
      expect(screen.getByText(/Nov \d+, 2025/)).toBeInTheDocument();
    });
  });

  describe('Currency Formatting', () => {
    it('should format currency with dollar sign', () => {
      render(<RecentOrdersTable orders={mockOrders} />);
      expect(screen.getByText('$19.99')).toBeInTheDocument();
    });

    it('should handle different currencies', () => {
      const eurOrder: Order = {
        ...mockOrders[0],
        currency: 'EUR',
      };
      render(<RecentOrdersTable orders={[eurOrder]} />);
      // EUR format should be different from USD
      expect(screen.getByText(/€|EUR/)).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should render desktop table on large screens', () => {
      const { container } = render(<RecentOrdersTable orders={mockOrders} />);
      const table = container.querySelector('table');
      expect(table).toBeInTheDocument();
    });

    it('should render mobile cards on small screens', () => {
      const { container } = render(<RecentOrdersTable orders={mockOrders} />);
      // Mobile cards should be present (hidden on desktop but in DOM)
      const mobileCards = container.querySelectorAll('.md\\:hidden');
      expect(mobileCards.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined callbacks gracefully', () => {
      render(<RecentOrdersTable orders={mockOrders} />);
      // Should not throw error
      expect(screen.getByText('Recent Orders')).toBeInTheDocument();
    });

    it('should handle very long package names', () => {
      const longNameOrder: Order = {
        ...mockOrders[0],
        packageName: 'A'.repeat(100),
      };
      render(<RecentOrdersTable orders={[longNameOrder]} />);
      expect(screen.getByText('A'.repeat(100))).toBeInTheDocument();
    });

    it('should handle large order IDs', () => {
      const largeIdOrder: Order = {
        ...mockOrders[0],
        id: '1'.repeat(50),
      };
      render(<RecentOrdersTable orders={[largeIdOrder]} />);
      // Should display last 6 characters
      expect(screen.getByText(/111111/)).toBeInTheDocument();
    });
  });
});
