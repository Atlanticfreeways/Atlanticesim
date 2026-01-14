/**
 * StatsCard Component
 * Displays a single statistic with icon and value
 */

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';

interface StatsCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  unit?: string;
  isLoading?: boolean;
  trend?: {
    value: number;
    direction: 'up' | 'down';
  };
}

export const StatsCard: React.FC<StatsCardProps> = ({
  icon,
  label,
  value,
  unit,
  isLoading = false,
  trend,
}) => {
  if (isLoading) {
    return (
      <Card variant="elevated" padding="md">
        <div className="space-y-3">
          <Skeleton width={40} height={40} variant="circular" />
          <Skeleton width="100%" height={20} />
          <Skeleton width="60%" height={16} />
        </div>
      </Card>
    );
  }

  return (
    <Card variant="elevated" padding="md">
      <div className="space-y-3">
        {/* Icon */}
        <div className="text-3xl">{icon}</div>

        {/* Label */}
        <p className="text-sm text-gray-600 font-medium">{label}</p>

        {/* Value */}
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-gray-900">{value}</span>
          {unit && <span className="text-sm text-gray-500">{unit}</span>}
        </div>

        {/* Trend */}
        {trend && (
          <div className={`text-sm font-medium ${trend.direction === 'up' ? 'text-green-600' : 'text-red-600'}`}>
            {trend.direction === 'up' ? '↑' : '↓'} {Math.abs(trend.value)}%
          </div>
        )}
      </div>
    </Card>
  );
};
