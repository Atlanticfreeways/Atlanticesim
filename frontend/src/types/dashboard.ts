/**
 * Dashboard Types
 * Centralized type definitions for dashboard features
 */

export interface ESIMStatus {
  ACTIVE: 'ACTIVE';
  EXPIRING_SOON: 'EXPIRING_SOON';
  EXPIRED: 'EXPIRED';
  DEPLETED: 'DEPLETED';
  SUSPENDED: 'SUSPENDED';
}

export interface ESIM {
  id: string;
  iccid: string;
  status: keyof ESIMStatus;
  country: string;
  countryCode: string;
  dataAmount: number;
  dataUnit: 'MB' | 'GB';
  dataUsed: number;
  validityDays: number;
  activatedAt: string;
  expiresAt: string;
  provider: string;
  qrCode?: string;
  predictionExhaustionDate?: string;
}

export interface Order {
  id: string;
  packageId: string;
  packageName: string;
  price: number;
  currency: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  activeESIMs: number;
  totalSpent: number;
  totalDataUsed: number;
  currency: string;
  walletBalance?: number;
}

  stats: DashboardStats;
  esims: ESIM[];
  recentOrders: Order[];
  partnerProfile?: {
    companyName?: string;
    apiKey?: string;
    webhookUrl?: string;
    wholesaleMargin?: number;
  };
}

export interface DashboardError {
  code: string;
  message: string;
  timestamp: string;
}
