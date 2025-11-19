/**
 * MyESIMsSection Component
 * Displays user's active eSIMs in a responsive grid layout
 *
 * Features:
 * - Responsive grid (1 col mobile, 2 col tablet, 3 col desktop)
 * - Loading skeleton state
 * - Empty state handling
 * - Pass-through callbacks to ESIMCard
 * - Smooth animations
 * - Accessible grid structure
 */

import React from 'react';
import { Card } from '@/components/ui/Card';
import { ESIMCard } from './ESIMCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { ESIM } from '@/types/dashboard';

interface MyESIMsSectionProps {
  /** Array of eSIMs to display */
  esims: ESIM[];
  /** Loading state */
  isLoading?: boolean;
  /** Callback when eSIM details button is clicked */
  onViewDetails?: (esimId: string) => void;
  /** Callback when QR code button is clicked */
  onShowQR?: (esimId: string) => void;
  /** Callback when manage button is clicked */
  onManage?: (esimId: string) => void;
}

/**
 * Loading skeleton for grid
 */
const ESIMGridSkeleton: React.FC = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {Array.from({ length: 3 }).map((_, i) => (
      <div key={i} className="space-y-3 p-4 border border-gray-200 rounded-lg">
        <Skeleton width="100%" height={24} />
        <Skeleton width="80%" height={20} />
        <Skeleton width="100%" height={40} />
        <Skeleton width="100%" height={20} />
      </div>
    ))}
  </div>
);

/**
 * Empty state component
 */
const EmptyState: React.FC = () => (
  <div className="text-center py-12">
    <p className="text-gray-500 text-lg font-medium">No active eSIMs</p>
    <p className="text-gray-400 text-sm mt-2">
      Get started by purchasing your first eSIM
    </p>
  </div>
);

/**
 * MyESIMsSection Component
 */
export const MyESIMsSection: React.FC<MyESIMsSectionProps> = ({
  esims,
  isLoading = false,
  onViewDetails,
  onShowQR,
  onManage,
}) => {
  if (isLoading) {
    return (
      <Card variant="elevated" padding="lg">
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-gray-900">My eSIMs</h2>
          <ESIMGridSkeleton />
        </div>
      </Card>
    );
  }

  const isEmpty = !esims || esims.length === 0;

  return (
    <Card variant="elevated" padding="lg">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">My eSIMs</h2>
          <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            {esims.length} active
          </span>
        </div>

        {/* Content */}
        {isEmpty ? (
          <EmptyState />
        ) : (
          <div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            role="region"
            aria-label="Active eSIMs"
          >
            {esims.map((esim) => (
              <ESIMCard
                key={esim.id}
                esim={esim}
                onViewDetails={onViewDetails}
                onShowQR={onShowQR}
                onManage={onManage}
              />
            ))}
          </div>
        )}

        {/* Footer Info */}
        {!isEmpty && (
          <div className="pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              💡 Tip: Click on any eSIM card to view more details or manage your subscription
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};

MyESIMsSection.displayName = 'MyESIMsSection';
