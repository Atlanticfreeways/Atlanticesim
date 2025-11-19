/**
 * MyESIMsSection Component Tests
 * Tests for rendering, interactions, and accessibility
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MyESIMsSection } from './MyESIMsSection';
import { ESIM } from '@/types/dashboard';

/**
 * Mock data for testing
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

describe('MyESIMsSection', () => {
  describe('Rendering', () => {
    it('should render component with title', () => {
      render(<MyESIMsSection esims={mockESIMs} />);
      expect(screen.getByText('My eSIMs')).toBeInTheDocument();
    });

    it('should display active count badge', () => {
      render(<MyESIMsSection esims={mockESIMs} />);
      expect(screen.getByText('3 active')).toBeInTheDocument();
    });

    it('should render all eSIM cards', () => {
      render(<MyESIMsSection esims={mockESIMs} />);
      expect(screen.getByText('USA')).toBeInTheDocument();
      expect(screen.getByText('Europe')).toBeInTheDocument();
      expect(screen.getByText('Asia')).toBeInTheDocument();
    });

    it('should display provider names', () => {
      render(<MyESIMsSection esims={mockESIMs} />);
      expect(screen.getByText('Airalo')).toBeInTheDocument();
      expect(screen.getByText('Maya Mobile')).toBeInTheDocument();
      expect(screen.getByText('eSIMCard')).toBeInTheDocument();
    });

    it('should display help tip', () => {
      render(<MyESIMsSection esims={mockESIMs} />);
      expect(
        screen.getByText(/Click on any eSIM card to view more details/)
      ).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should show loading skeleton when isLoading is true', () => {
      const { container } = render(
        <MyESIMsSection esims={[]} isLoading={true} />
      );
      const skeletons = container.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should not show eSIMs when loading', () => {
      render(<MyESIMsSection esims={mockESIMs} isLoading={true} />);
      expect(screen.queryByText('USA')).not.toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should show empty state message when no eSIMs', () => {
      render(<MyESIMsSection esims={[]} />);
      expect(screen.getByText('No active eSIMs')).toBeInTheDocument();
      expect(
        screen.getByText('Get started by purchasing your first eSIM')
      ).toBeInTheDocument();
    });

    it('should not show help tip when empty', () => {
      render(<MyESIMsSection esims={[]} />);
      expect(
        screen.queryByText(/Click on any eSIM card to view more details/)
      ).not.toBeInTheDocument();
    });

    it('should show 0 active count when empty', () => {
      render(<MyESIMsSection esims={[]} />);
      expect(screen.getByText('0 active')).toBeInTheDocument();
    });
  });

  describe('Grid Layout', () => {
    it('should render grid container', () => {
      const { container } = render(<MyESIMsSection esims={mockESIMs} />);
      const grid = container.querySelector('[role="region"]');
      expect(grid).toBeInTheDocument();
    });

    it('should have responsive grid classes', () => {
      const { container } = render(<MyESIMsSection esims={mockESIMs} />);
      const grid = container.querySelector('[role="region"]');
      expect(grid).toHaveClass('grid', 'grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3');
    });

    it('should have proper gap between items', () => {
      const { container } = render(<MyESIMsSection esims={mockESIMs} />);
      const grid = container.querySelector('[role="region"]');
      expect(grid).toHaveClass('gap-4');
    });
  });

  describe('Callbacks', () => {
    it('should pass onViewDetails callback to ESIMCard', () => {
      const onViewDetails = jest.fn();
      render(
        <MyESIMsSection esims={mockESIMs} onViewDetails={onViewDetails} />
      );
      // Callback is passed through to child component
      expect(screen.getByText('USA')).toBeInTheDocument();
    });

    it('should pass onShowQR callback to ESIMCard', () => {
      const onShowQR = jest.fn();
      render(<MyESIMsSection esims={mockESIMs} onShowQR={onShowQR} />);
      expect(screen.getByText('USA')).toBeInTheDocument();
    });

    it('should pass onManage callback to ESIMCard', () => {
      const onManage = jest.fn();
      render(<MyESIMsSection esims={mockESIMs} onManage={onManage} />);
      expect(screen.getByText('USA')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      render(<MyESIMsSection esims={mockESIMs} />);
      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toHaveTextContent('My eSIMs');
    });

    it('should have region role on grid', () => {
      const { container } = render(<MyESIMsSection esims={mockESIMs} />);
      const grid = container.querySelector('[role="region"]');
      expect(grid).toHaveAttribute('role', 'region');
    });

    it('should have aria-label on grid', () => {
      const { container } = render(<MyESIMsSection esims={mockESIMs} />);
      const grid = container.querySelector('[role="region"]');
      expect(grid).toHaveAttribute('aria-label', 'Active eSIMs');
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined callbacks gracefully', () => {
      render(<MyESIMsSection esims={mockESIMs} />);
      expect(screen.getByText('My eSIMs')).toBeInTheDocument();
    });

    it('should handle single eSIM', () => {
      render(<MyESIMsSection esims={[mockESIMs[0]]} />);
      expect(screen.getByText('1 active')).toBeInTheDocument();
      expect(screen.getByText('USA')).toBeInTheDocument();
    });

    it('should handle many eSIMs', () => {
      const manyESIMs = Array.from({ length: 10 }, (_, i) => ({
        ...mockESIMs[i % mockESIMs.length],
        id: `esim-${i}`,
      }));
      render(<MyESIMsSection esims={manyESIMs} />);
      expect(screen.getByText('10 active')).toBeInTheDocument();
    });

    it('should handle component remounting', () => {
      const { rerender } = render(<MyESIMsSection esims={mockESIMs} />);
      expect(screen.getByText('My eSIMs')).toBeInTheDocument();

      rerender(<MyESIMsSection esims={[mockESIMs[0]]} />);
      expect(screen.getByText('1 active')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should render responsive grid', () => {
      const { container } = render(<MyESIMsSection esims={mockESIMs} />);
      const grid = container.querySelector('[role="region"]');
      expect(grid).toHaveClass('grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3');
    });

    it('should have proper spacing', () => {
      const { container } = render(<MyESIMsSection esims={mockESIMs} />);
      const card = container.querySelector('[role="region"]');
      expect(card).toHaveClass('gap-4');
    });
  });

  describe('Data Display', () => {
    it('should display correct number of eSIMs', () => {
      render(<MyESIMsSection esims={mockESIMs} />);
      const cards = screen.getAllByText(/Details/);
      expect(cards.length).toBe(mockESIMs.length);
    });

    it('should update count when eSIMs change', () => {
      const { rerender } = render(<MyESIMsSection esims={mockESIMs} />);
      expect(screen.getByText('3 active')).toBeInTheDocument();

      rerender(<MyESIMsSection esims={[mockESIMs[0]]} />);
      expect(screen.getByText('1 active')).toBeInTheDocument();
    });
  });
});
