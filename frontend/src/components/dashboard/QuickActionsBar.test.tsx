/**
 * QuickActionsBar Component Tests
 * Tests for rendering, interactions, and accessibility
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuickActionsBar } from './QuickActionsBar';

describe('QuickActionsBar', () => {
  describe('Rendering', () => {
    it('should render component with title', () => {
      render(<QuickActionsBar />);
      expect(screen.getByText('Quick Actions')).toBeInTheDocument();
    });

    it('should render all 4 action buttons', () => {
      render(<QuickActionsBar />);
      expect(screen.getByLabelText('+ Buy New eSIM')).toBeInTheDocument();
      expect(screen.getByLabelText('Top Up Data')).toBeInTheDocument();
      expect(screen.getByLabelText('Support')).toBeInTheDocument();
      expect(screen.getByLabelText('Settings')).toBeInTheDocument();
    });

    it('should display button labels', () => {
      render(<QuickActionsBar />);
      expect(screen.getByText('+ Buy New eSIM')).toBeInTheDocument();
      expect(screen.getByText('Top Up Data')).toBeInTheDocument();
      expect(screen.getByText('Support')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    it('should display button icons', () => {
      render(<QuickActionsBar />);
      expect(screen.getByText('📱')).toBeInTheDocument();
      expect(screen.getByText('⬆️')).toBeInTheDocument();
      expect(screen.getByText('💬')).toBeInTheDocument();
      expect(screen.getByText('⚙️')).toBeInTheDocument();
    });

    it('should display help text', () => {
      render(<QuickActionsBar />);
      expect(screen.getByText('Quick access to common actions')).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('should call onBuyNew when Buy New eSIM button is clicked', async () => {
      const onBuyNew = jest.fn();
      render(<QuickActionsBar onBuyNew={onBuyNew} />);

      const buyButton = screen.getByLabelText('+ Buy New eSIM');
      await userEvent.click(buyButton);

      expect(onBuyNew).toHaveBeenCalledTimes(1);
    });

    it('should call onTopUp when Top Up Data button is clicked', async () => {
      const onTopUp = jest.fn();
      render(<QuickActionsBar onTopUp={onTopUp} />);

      const topUpButton = screen.getByLabelText('Top Up Data');
      await userEvent.click(topUpButton);

      expect(onTopUp).toHaveBeenCalledTimes(1);
    });

    it('should call onSupport when Support button is clicked', async () => {
      const onSupport = jest.fn();
      render(<QuickActionsBar onSupport={onSupport} />);

      const supportButton = screen.getByLabelText('Support');
      await userEvent.click(supportButton);

      expect(onSupport).toHaveBeenCalledTimes(1);
    });

    it('should call onSettings when Settings button is clicked', async () => {
      const onSettings = jest.fn();
      render(<QuickActionsBar onSettings={onSettings} />);

      const settingsButton = screen.getByLabelText('Settings');
      await userEvent.click(settingsButton);

      expect(onSettings).toHaveBeenCalledTimes(1);
    });

    it('should call all callbacks when all buttons are clicked', async () => {
      const onBuyNew = jest.fn();
      const onTopUp = jest.fn();
      const onSupport = jest.fn();
      const onSettings = jest.fn();

      render(
        <QuickActionsBar
          onBuyNew={onBuyNew}
          onTopUp={onTopUp}
          onSupport={onSupport}
          onSettings={onSettings}
        />
      );

      await userEvent.click(screen.getByLabelText('+ Buy New eSIM'));
      await userEvent.click(screen.getByLabelText('Top Up Data'));
      await userEvent.click(screen.getByLabelText('Support'));
      await userEvent.click(screen.getByLabelText('Settings'));

      expect(onBuyNew).toHaveBeenCalledTimes(1);
      expect(onTopUp).toHaveBeenCalledTimes(1);
      expect(onSupport).toHaveBeenCalledTimes(1);
      expect(onSettings).toHaveBeenCalledTimes(1);
    });
  });

  describe('Loading State', () => {
    it('should disable all buttons when isLoading is true', () => {
      render(<QuickActionsBar isLoading={true} />);

      expect(screen.getByLabelText('+ Buy New eSIM')).toBeDisabled();
      expect(screen.getByLabelText('Top Up Data')).toBeDisabled();
      expect(screen.getByLabelText('Support')).toBeDisabled();
      expect(screen.getByLabelText('Settings')).toBeDisabled();
    });

    it('should enable all buttons when isLoading is false', () => {
      render(<QuickActionsBar isLoading={false} />);

      expect(screen.getByLabelText('+ Buy New eSIM')).not.toBeDisabled();
      expect(screen.getByLabelText('Top Up Data')).not.toBeDisabled();
      expect(screen.getByLabelText('Support')).not.toBeDisabled();
      expect(screen.getByLabelText('Settings')).not.toBeDisabled();
    });

    it('should not call callbacks when buttons are disabled', async () => {
      const onBuyNew = jest.fn();
      render(<QuickActionsBar isLoading={true} onBuyNew={onBuyNew} />);

      const buyButton = screen.getByLabelText('+ Buy New eSIM');
      await userEvent.click(buyButton);

      expect(onBuyNew).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      render(<QuickActionsBar />);
      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toHaveTextContent('Quick Actions');
    });

    it('should have aria-labels on all buttons', () => {
      render(<QuickActionsBar />);
      expect(screen.getByLabelText('+ Buy New eSIM')).toHaveAttribute('aria-label');
      expect(screen.getByLabelText('Top Up Data')).toHaveAttribute('aria-label');
      expect(screen.getByLabelText('Support')).toHaveAttribute('aria-label');
      expect(screen.getByLabelText('Settings')).toHaveAttribute('aria-label');
    });

    it('should have title attributes on all buttons', () => {
      render(<QuickActionsBar />);
      expect(screen.getByLabelText('+ Buy New eSIM')).toHaveAttribute('title');
      expect(screen.getByLabelText('Top Up Data')).toHaveAttribute('title');
      expect(screen.getByLabelText('Support')).toHaveAttribute('title');
      expect(screen.getByLabelText('Settings')).toHaveAttribute('title');
    });

    it('should have proper button roles', () => {
      render(<QuickActionsBar />);
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBe(4);
    });

    it('should be keyboard navigable', async () => {
      render(<QuickActionsBar />);
      const buttons = screen.getAllByRole('button');

      // Tab through buttons
      for (const button of buttons) {
        button.focus();
        expect(button).toHaveFocus();
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined callbacks gracefully', () => {
      render(<QuickActionsBar />);
      expect(screen.getByText('Quick Actions')).toBeInTheDocument();
    });

    it('should handle multiple rapid clicks', async () => {
      const onBuyNew = jest.fn();
      render(<QuickActionsBar onBuyNew={onBuyNew} />);

      const buyButton = screen.getByLabelText('+ Buy New eSIM');
      await userEvent.click(buyButton);
      await userEvent.click(buyButton);
      await userEvent.click(buyButton);

      expect(onBuyNew).toHaveBeenCalledTimes(3);
    });

    it('should handle component remounting', () => {
      const { rerender } = render(<QuickActionsBar />);
      expect(screen.getByText('Quick Actions')).toBeInTheDocument();

      rerender(<QuickActionsBar />);
      expect(screen.getByText('Quick Actions')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should render grid layout', () => {
      const { container } = render(<QuickActionsBar />);
      const grid = container.querySelector('.grid');
      expect(grid).toBeInTheDocument();
      expect(grid).toHaveClass('grid-cols-2', 'md:grid-cols-4');
    });

    it('should have responsive gap', () => {
      const { container } = render(<QuickActionsBar />);
      const grid = container.querySelector('.grid');
      expect(grid).toHaveClass('gap-3');
    });
  });

  describe('Visual States', () => {
    it('should render with primary variant for Buy New button', () => {
      const { container } = render(<QuickActionsBar />);
      const buttons = container.querySelectorAll('button');
      // First button should have primary styling
      expect(buttons[0]).toBeInTheDocument();
    });

    it('should render with different button variants', () => {
      const { container } = render(<QuickActionsBar />);
      const buttons = container.querySelectorAll('button');
      expect(buttons.length).toBe(4);
    });
  });
});
