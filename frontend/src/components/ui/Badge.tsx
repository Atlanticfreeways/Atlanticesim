/**
 * Badge Component
 * Status indicator with multiple variants
 */

import React from 'react';
import { cn } from '@/utils/cn';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'error' | 'info' | 'default';
  size?: 'sm' | 'md';
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, children, variant = 'default', size = 'md', ...props }, ref) => {
    const variantClasses = {
      success: 'bg-green-100 text-green-800 border border-green-300',
      warning: 'bg-yellow-100 text-yellow-800 border border-yellow-300',
      error: 'bg-red-100 text-red-800 border border-red-300',
      info: 'bg-blue-100 text-blue-800 border border-blue-300',
      default: 'bg-gray-100 text-gray-800 border border-gray-300',
    };

    const sizeClasses = {
      sm: 'px-2 py-1 text-xs font-medium rounded',
      md: 'px-3 py-1.5 text-sm font-medium rounded-md',
    };

    return (
      <span
        ref={ref}
        className={cn(variantClasses[variant], sizeClasses[size], className)}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';
