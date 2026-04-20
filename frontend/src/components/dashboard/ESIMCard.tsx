/**
 * ESIMCard Component
 * Displays individual eSIM information with actions
 */

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { ESIM } from '@/types/dashboard';

interface ESIMCardProps {
  esim: ESIM;
  isLoading?: boolean;
  onViewDetails?: (esimId: string) => void;
  onShowQR?: (esimId: string) => void;
  onManage?: (esimId: string) => void;
}

export const ESIMCard: React.FC<ESIMCardProps> = ({
  esim,
  isLoading = false,
  onViewDetails,
  onShowQR,
  onManage,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (isLoading) {
    return (
      <Card variant="elevated" padding="md">
        <div className="space-y-3">
          <Skeleton width="100%" height={24} />
          <Skeleton width="80%" height={20} />
          <Skeleton width="100%" height={40} />
        </div>
      </Card>
    );
  }

  // Calculate data usage percentage
  const dataUsagePercent = (esim.dataUsed / esim.dataAmount) * 100;

  // Determine status badge variant
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'EXPIRING_SOON':
        return 'warning';
      case 'EXPIRED':
      case 'DEPLETED':
        return 'error';
      default:
        return 'info';
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <Card variant="elevated" padding="md">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🌍</span>
            <div>
              <h3 className="font-bold text-gray-900">{esim.country}</h3>
              <p className="text-sm text-gray-500">{esim.provider}</p>
            </div>
          </div>
          <Badge variant={getStatusVariant(esim.status)} size="sm">
            {esim.status.replace(/_/g, ' ')}
          </Badge>
        </div>

        {/* Data Usage */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">Data Usage</span>
            <span className="text-sm font-bold text-gray-900">
              {esim.dataUsed.toFixed(2)} / {esim.dataAmount} {esim.dataUnit}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                dataUsagePercent > 80 ? 'bg-red-500' : dataUsagePercent > 50 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(dataUsagePercent, 100)}%` }}
            />
          </div>
        </div>

        {/* Expiry Date */}
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">Plan valid until</span>
          <span className="font-medium text-gray-900">{formatDate(esim.expiresAt)}</span>
        </div>

        {/* AI Prediction */}
        {esim.predictionExhaustionDate && (
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 space-y-1">
            <div className="flex items-center gap-2 text-blue-800 text-xs font-bold uppercase tracking-wider">
              <span className="animate-pulse">✨</span> AI Prediction
            </div>
            <p className="text-xs text-blue-700">
              Based on your usage velocity, we expect you'll run out of data on{' '}
              <span className="font-bold underline">
                {new Date(esim.predictionExhaustionDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </span>
            </p>
          </div>
        )}

        {/* Expandable Details */}
        {isExpanded && (
          <div className="pt-3 border-t border-gray-200 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">ICCID</span>
              <span className="font-mono text-gray-900">{esim.iccid.slice(-8)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Activated</span>
              <span className="text-gray-900">{formatDate(esim.activatedAt)}</span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onViewDetails?.(esim.id)}
            className="flex-1"
          >
            Details
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onShowQR?.(esim.id)}
            className="flex-1"
          >
            QR Code
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? '−' : '+'}
          </Button>
        </div>

        {/* Manage Button */}
        {isExpanded && (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => onManage?.(esim.id)}
            fullWidth
          >
            Manage eSIM
          </Button>
        )}
      </div>
    </Card>
  );
};
