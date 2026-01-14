/**
 * DashboardFooter Component Tests
 * Tests for rendering, interactions, and accessibility
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DashboardFooter } from './DashboardFooter';

describe('DashboardFooter', () => {
  describe('Rendering', () => {
    it('should render footer element', () => {
      const { container } = render(<DashboardFooter />);
      expect(container.querySelector('footer')).toBeInTheDocument();
    });

    it('should display Help & Support section', () => {
      render(<DashboardFooter />);
      expect(screen.getByText('Help & Support')).toBeInTheDocument();
    });

    it('should display Legal section', () => {
      render(<DashboardFooter />);
      expect(screen.getByText('Legal')).toBeInTheDocument();
    });

    it('should display About section', () => {
      render(<DashboardFooter />);
      expect(screen.getByText('About')).toBeInTheDocument();
    });

    it('should display help links', () => {
      render(<DashboardFooter />);
      expect(screen.getByText('Help Center')).toBeInTheDocument();
      expect(screen.getByText('Contact Support')).toBeInTheDocument();
    });

    it('should display legal links', () => {
      render(<DashboardFooter />);
      expect(screen.getByText('Terms of Service')).toBeInTheDocument();
      expect(screen.getByText('Privacy Policy')).toBeInTheDocument();
    });

    it('should display copyright information', () => {
      render(<DashboardFooter />);
      const currentYear = new Date().getFullYear();
      expect(screen.getByText(new RegExp(`© ${currentYear}`))).toBeInTheDocument();
    });

    it('should display company name in copyright', () => {
      render(<DashboardFooter companyName="Test Company" />);
      expect(screen.getByText(/Test Company/)).toBeInTheDocument();
    });

    it('should display about text', () => {
      render(<DashboardFooter />);
      expect(
        screen.getByText(/Atlantic eSIM is your trusted eSIM provider/)
      ).toBeInTheDocument();
    });
  });

  describe('Callbacks', () => {
    it('should call onHelpClick when Help Center is clicked', async () => {
      const onHelpClick = jest.fn();
      render(<DashboardFooter onHelpClick={onHelpClick} />);

      const helpLink = screen.getByText('Help Center');
      await userEvent.click(helpLink);

      expect(onHelpClick).toHaveBeenCalledTimes(1);
    });

    it('should call onSupportClick when Contact Support is clicked', async () => {
      const onSupportClick = jest.fn();
      render(<DashboardFooter onSupportClick={onSupportClick} />);

      const supportLink = screen.getByText('Contact Support');
      await userEvent.click(supportLink);

      expect(onSupportClick).toHaveBeenCalledTimes(1);
    });

    it('should call onTermsClick when Terms of Service is clicked', async () => {
      const onTermsClick = jest.fn();
      render(<DashboardFooter onTermsClick={onTermsClick} />);

      const termsLink = screen.getByText('Terms of Service');
      await userEvent.click(termsLink);

      expect(onTermsClick).toHaveBeenCalledTimes(1);
    });

    it('should call onPrivacyClick when Privacy Policy is clicked', async () => {
      const onPrivacyClick = jest.fn();
      render(<DashboardFooter onPrivacyClick={onPrivacyClick} />);

      const privacyLink = screen.getByText('Privacy Policy');
      await userEvent.click(privacyLink);

      expect(onPrivacyClick).toHaveBeenCalledTimes(1);
    });

    it('should call all callbacks when all links are clicked', async () => {
      const onHelpClick = jest.fn();
      const onSupportClick = jest.fn();
      const onTermsClick = jest.fn();
      const onPrivacyClick = jest.fn();

      render(
        <DashboardFooter
          onHelpClick={onHelpClick}
          onSupportClick={onSupportClick}
          onTermsClick={onTermsClick}
          onPrivacyClick={onPrivacyClick}
        />
      );

      await userEvent.click(screen.getByText('Help Center'));
      await userEvent.click(screen.getByText('Contact Support'));
      await userEvent.click(screen.getByText('Terms of Service'));
      await userEvent.click(screen.getByText('Privacy Policy'));

      expect(onHelpClick).toHaveBeenCalledTimes(1);
      expect(onSupportClick).toHaveBeenCalledTimes(1);
      expect(onTermsClick).toHaveBeenCalledTimes(1);
      expect(onPrivacyClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Social Links', () => {
    it('should display social media links', () => {
      render(<DashboardFooter />);
      expect(screen.getByLabelText('Twitter')).toBeInTheDocument();
      expect(screen.getByLabelText('Facebook')).toBeInTheDocument();
      expect(screen.getByLabelText('LinkedIn')).toBeInTheDocument();
    });

    it('should have correct social media URLs', () => {
      render(<DashboardFooter />);
      expect(screen.getByLabelText('Twitter')).toHaveAttribute('href', 'https://twitter.com');
      expect(screen.getByLabelText('Facebook')).toHaveAttribute('href', 'https://facebook.com');
      expect(screen.getByLabelText('LinkedIn')).toHaveAttribute('href', 'https://linkedin.com');
    });

    it('should open social links in new tab', () => {
      render(<DashboardFooter />);
      expect(screen.getByLabelText('Twitter')).toHaveAttribute('target', '_blank');
      expect(screen.getByLabelText('Facebook')).toHaveAttribute('target', '_blank');
      expect(screen.getByLabelText('LinkedIn')).toHaveAttribute('target', '_blank');
    });

    it('should have rel="noopener noreferrer" on social links', () => {
      render(<DashboardFooter />);
      expect(screen.getByLabelText('Twitter')).toHaveAttribute('rel', 'noopener noreferrer');
      expect(screen.getByLabelText('Facebook')).toHaveAttribute('rel', 'noopener noreferrer');
      expect(screen.getByLabelText('LinkedIn')).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      render(<DashboardFooter />);
      const headings = screen.getAllByRole('heading', { level: 3 });
      expect(headings.length).toBe(3);
    });

    it('should have aria-labels on all links', () => {
      render(<DashboardFooter />);
      expect(screen.getByLabelText('Help Center')).toBeInTheDocument();
      expect(screen.getByLabelText('Contact Support')).toBeInTheDocument();
      expect(screen.getByLabelText('Terms of Service')).toBeInTheDocument();
      expect(screen.getByLabelText('Privacy Policy')).toBeInTheDocument();
    });

    it('should have aria-labels on social links', () => {
      render(<DashboardFooter />);
      expect(screen.getByLabelText('Twitter')).toBeInTheDocument();
      expect(screen.getByLabelText('Facebook')).toBeInTheDocument();
      expect(screen.getByLabelText('LinkedIn')).toBeInTheDocument();
    });

    it('should have proper button roles', () => {
      render(<DashboardFooter />);
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  describe('Props', () => {
    it('should use custom company name', () => {
      render(<DashboardFooter companyName="Custom Company" />);
      expect(screen.getByText(/Custom Company/)).toBeInTheDocument();
    });

    it('should use custom year', () => {
      render(<DashboardFooter year={2024} />);
      expect(screen.getByText(/© 2024/)).toBeInTheDocument();
    });

    it('should use current year by default', () => {
      render(<DashboardFooter />);
      const currentYear = new Date().getFullYear();
      expect(screen.getByText(new RegExp(`© ${currentYear}`))).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined callbacks gracefully', () => {
      render(<DashboardFooter />);
      expect(screen.getByText('Help Center')).toBeInTheDocument();
    });

    it('should handle very long company names', () => {
      const longName = 'A'.repeat(100);
      render(<DashboardFooter companyName={longName} />);
      expect(screen.getByText(new RegExp(longName))).toBeInTheDocument();
    });

    it('should handle component remounting', () => {
      const { rerender } = render(<DashboardFooter />);
      expect(screen.getByText('Help & Support')).toBeInTheDocument();

      rerender(<DashboardFooter companyName="New Company" />);
      expect(screen.getByText(/New Company/)).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should have responsive grid layout', () => {
      const { container } = render(<DashboardFooter />);
      const grid = container.querySelector('.grid');
      expect(grid).toHaveClass('grid-cols-1', 'md:grid-cols-3');
    });

    it('should have responsive flex layout for bottom section', () => {
      const { container } = render(<DashboardFooter />);
      const flex = container.querySelector('.flex-col');
      expect(flex).toHaveClass('flex-col', 'md:flex-row');
    });
  });

  describe('Styling', () => {
    it('should have footer styling', () => {
      const { container } = render(<DashboardFooter />);
      const footer = container.querySelector('footer');
      expect(footer).toHaveClass('bg-gray-50', 'border-t', 'border-gray-200');
    });

    it('should have proper spacing', () => {
      const { container } = render(<DashboardFooter />);
      const footer = container.querySelector('footer > div');
      expect(footer).toHaveClass('px-4', 'md:px-6', 'py-8');
    });
  });
});
