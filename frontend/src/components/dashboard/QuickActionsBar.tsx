/**
 * QuickActionsBar Component
 * Displays quick action buttons for common dashboard tasks
 *
 * Features:
 * - 4 primary action buttons
 * - Responsive grid layout (2x2 mobile, 1x4 desktop)
 * - Icon support for each button
 * - Hover effects and transitions
 * - Accessible button structure
 * - Touch-friendly on mobile
 */

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface QuickActionsBarProps {
  /** Callback when "Buy New eSIM" button is clicked */
  onBuyNew?: () => void;
  /** Callback when "Top Up Data" button is clicked */
  onTopUp?: () => void;
  /** Callback when "Support" button is clicked */
  onSupport?: () => void;
  /** Callback when "Settings" button is clicked */
  onSettings?: () => void;
  /** Optional loading state */
  isLoading?: boolean;
}

/**
 * Action button configuration
 */
interface ActionButton {
  id: string;
  label: string;
  icon: string;
  variant: 'primary' | 'secondary' | 'outline' | 'ghost';
  callback?: () => void;
  disabled?: boolean;
}

/**
 * QuickActionsBar Component
 */
export const QuickActionsBar: React.FC<QuickActionsBarProps> = ({
  onBuyNew,
  onTopUp,
  onSupport,
  onSettings,
  isLoading = false,
}) => {
  /**
   * Define action buttons
   */
  const actions: ActionButton[] = [
    {
      id: 'buy-new',
      label: '+ Buy New eSIM',
      icon: '📱',
      variant: 'primary',
      callback: onBuyNew,
      disabled: isLoading,
    },
    {
      id: 'top-up',
      label: 'Top Up Data',
      icon: '⬆️',
      variant: 'secondary',
      callback: onTopUp,
      disabled: isLoading,
    },
    {
      id: 'support',
      label: 'Support',
      icon: '💬',
      variant: 'outline',
      callback: onSupport,
      disabled: isLoading,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: '⚙️',
      variant: 'ghost',
      callback: onSettings,
      disabled: isLoading,
    },
  ];

  return (
    <Card variant="elevated" padding="lg">
      <div className="space-y-4">
        {/* Header */}
        <h2 className="text-lg font-bold text-gray-900">Quick Actions</h2>

        {/* Actions Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {actions.map((action) => (
            <button
              key={action.id}
              onClick={action.callback}
              disabled={action.disabled}
              className="group relative"
              aria-label={action.label}
              title={action.label}
            >
              <Button
                variant={action.variant}
                size="md"
                fullWidth
                disabled={action.disabled}
                className="flex flex-col items-center justify-center gap-2 h-auto py-4"
              >
                <span className="text-2xl group-hover:scale-110 transition-transform">
                  {action.icon}
                </span>
                <span className="text-xs md:text-sm font-medium text-center leading-tight">
                  {action.label}
                </span>
              </Button>
            </button>
          ))}
        </div>

        {/* Help Text */}
        <p className="text-xs text-gray-500 text-center pt-2">
          Quick access to common actions
        </p>
      </div>
    </Card>
  );
};

QuickActionsBar.displayName = 'QuickActionsBar';
