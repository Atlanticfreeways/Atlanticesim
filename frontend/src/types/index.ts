export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: 'END_USER' | 'BUSINESS_PARTNER' | 'ADMIN' | 'SUPPORT_AGENT';
}

export interface Package {
  id: string;
  name: string;
  description: string;
  countries: string[];
  dataAmount: number;
  dataUnit: 'MB' | 'GB';
  validityDays: number;
  price: number;
  currency: string;
  hasVoice: boolean;
  hasSms: boolean;
  voiceMinutes?: number;
  smsCount?: number;
  providerId: string;
  providerName: string;
  isBestValue?: boolean;
}

export interface Order {
  id: string;
  status: 'PENDING' | 'PROCESSING' | 'CONFIRMED' | 'ACTIVATED' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  paymentAmount: number;
  paymentCurrency: string;
  createdAt: string;
  package: Package;
  esim?: ESim;
}

export interface ESim {
  id: string;
  iccid: string;
  status: 'INACTIVE' | 'ACTIVE' | 'EXPIRED' | 'DEPLETED';
  qrCode?: string;
  dataUsed: number;
  dataTotal: number;
  validUntil?: string;
  activatedAt?: string;
  predictionDepletionDate?: string;
  velocityPerHour?: number;
}

export interface Wallet {
  id: string;
  balance: number;
  currency: string;
}

export interface PartnerProfile {
  id: string;
  companyName?: string;
  logoUrl?: string;
  primaryColor?: string;
  wholesaleMargin: number;
}