/**
 * Skeleton Component
 * Loading placeholder with animation
 */

import React from 'react';
import { cn } from '@/utils/cn';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: string | number;
  height?: string | number;
  variant?: 'text' | 'circular' | 'rectangular';
}

export const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, width, height, variant = 'rectangular', ...props }, ref) => {
    const variantClasses = {
      text: 'rounded',
      circular: 'rounded-full',
      rectangular: 'rounded-lg',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'bg-gray-200 animate-pulse',
          variantClasses[variant],
          className
        )}
        style={{
          width: typeof width === 'number' ? `${width}px` : width,
          height: typeof height === 'number' ? `${height}px` : height,
        }}
        {...props}
      />
    );
  }
);

Skeleton.displayName = 'Skeleton';
