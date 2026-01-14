/**
 * RecentOrdersTable Component
 * Displays user's recent orders in a responsive table format
 * 
 * Features:
 * - Responsive design (stacks on mobile)
 * - Loading skeleton state
 * - Empty state handling
 * - Status badge with color coding
 * - View all orders link
 * - Accessible table structure
 */

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Order } from '@/types/dashboard';

interface RecentOrdersTableProps {
  /** Array of orders to display */
  orders: Order[];
  /** Loading state */
  isLoading?: boolean;
  /** Callback when "View All Orders" is clicked */
  onViewAll?: () => void;
  /** Callback when individual order is clicked */
  onViewOrder?: (orderId: string) => void;
}

/**
 * Get badge variant based on order status
 */
const getStatusVariant = (status: Order['status']): 'success' | 'warning' | 'error' | 'info' => {
  switch (status) {
    case 'COMPLETED':
      return 'success';
    case 'PENDING':
      return 'warning';
    case 'FAILED':
    case 'CANCELLED':
      return 'error';
    default:
      return 'info';
  }
};

/**
 * Format date to readable string
 */
const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

/**
 * Format currency
 */
const formatCurrency = (amount: number, currency: string): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
};

/**
 * Loading skeleton for table
 */
const OrderTableSkeleton: React.FC = () => (
  <div className="space-y-3">
    {Array.from({ length: 3 }).map((_, i) => (
      <div key={i} className="flex gap-4 p-4 border border-gray-200 rounded-lg">
        <Skeleton width="20%" height={20} />
        <Skeleton width="25%" height={20} />
        <Skeleton width="15%" height={20} />
        <Skeleton width="15%" height={20} />
        <Skeleton width="15%" height={20} />
      </div>
    ))}
  </div>
);

/**
 * Empty state component
 */
const EmptyState: React.FC = () => (
  <div className="text-center py-8">
    <p className="text-gray-500 text-sm">No orders yet</p>
    <p className="text-gray-400 text-xs mt-1">Your orders will appear here</p>
  </div>
);

/**
 * Desktop table view
 */
const DesktopTable: React.FC<{
  orders: Order[];
  onViewOrder?: (orderId: string) => void;
}> = ({ orders, onViewOrder }) => (
  <div className="hidden md:block overflow-x-auto">
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-gray-200">
          <th className="text-left py-3 px-4 font-semibold text-gray-700">Order ID</th>
          <th className="text-left py-3 px-4 font-semibold text-gray-700">Package</th>
          <th className="text-left py-3 px-4 font-semibold text-gray-700">Price</th>
          <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
          <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
        </tr>
      </thead>
      <tbody>
        {orders.map((order) => (
          <tr
            key={order.id}
            className="border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
            onClick={() => onViewOrder?.(order.id)}
          >
            <td className="py-3 px-4 text-gray-900 font-mono text-xs">
              #{order.id.slice(-6)}
            </td>
            <td className="py-3 px-4 text-gray-900">{order.packageName}</td>
            <td className="py-3 px-4 text-gray-900 font-semibold">
              {formatCurrency(order.price, order.currency)}
            </td>
            <td className="py-3 px-4">
              <Badge variant={getStatusVariant(order.status)} size="sm">
                {order.status}
              </Badge>
            </td>
            <td className="py-3 px-4 text-gray-600">{formatDate(order.createdAt)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

/**
 * Mobile card view
 */
const MobileCards: React.FC<{
  orders: Order[];
  onViewOrder?: (orderId: string) => void;
}> = ({ orders, onViewOrder }) => (
  <div className="md:hidden space-y-3">
    {orders.map((order) => (
      <div
        key={order.id}
        className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => onViewOrder?.(order.id)}
      >
        <div className="flex justify-between items-start mb-2">
          <div>
            <p className="font-semibold text-gray-900">{order.packageName}</p>
            <p className="text-xs text-gray-500 font-mono">#{order.id.slice(-6)}</p>
          </div>
          <Badge variant={getStatusVariant(order.status)} size="sm">
            {order.status}
          </Badge>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">{formatDate(order.createdAt)}</span>
          <span className="font-semibold text-gray-900">
            {formatCurrency(order.price, order.currency)}
          </span>
        </div>
      </div>
    ))}
  </div>
);

/**
 * RecentOrdersTable Component
 */
export const RecentOrdersTable: React.FC<RecentOrdersTableProps> = ({
  orders,
  isLoading = false,
  onViewAll,
  onViewOrder,
}) => {
  if (isLoading) {
    return (
      <Card variant="elevated" padding="lg">
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-gray-900">Recent Orders</h2>
          <OrderTableSkeleton />
        </div>
      </Card>
    );
  }

  const isEmpty = !orders || orders.length === 0;

  return (
    <Card variant="elevated" padding="lg">
      <div className="space-y-4">
        {/* Header */}
        <h2 className="text-lg font-bold text-gray-900">Recent Orders</h2>

        {/* Content */}
        {isEmpty ? (
          <EmptyState />
        ) : (
          <>
            {/* Desktop Table */}
            <DesktopTable orders={orders} onViewOrder={onViewOrder} />

            {/* Mobile Cards */}
            <MobileCards orders={orders} onViewOrder={onViewOrder} />
          </>
        )}

        {/* Footer - View All Button */}
        {!isEmpty && (
          <div className="pt-4 border-t border-gray-200">
            <Button
              variant="ghost"
              size="sm"
              onClick={onViewAll}
              className="w-full"
            >
              View All Orders →
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};

RecentOrdersTable.displayName = 'RecentOrdersTable';
