export interface ProviderAdapter {
  getPackages(filters: PackageFilters): Promise<Package[]>;
  getPackageDetails(packageId: string): Promise<PackageDetails>;
  createOrder(order: OrderRequest): Promise<OrderResponse>;
  getOrderStatus(orderId: string): Promise<OrderStatus>;
  activateESIM(esimId: string): Promise<ActivationResponse>;
  getESIMDetails(esimId: string): Promise<ESIMDetails>;
  getUsageData(esimId: string): Promise<UsageData>;
  healthCheck(): Promise<HealthStatus>;
}

export interface PackageFilters {
  countries?: string[];
  minData?: number;
  maxPrice?: number;
  hasVoice?: boolean;
  hasSms?: boolean;
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
}

export interface PackageDetails extends Package {
  features: string[];
  terms: string;
  coverage: string[];
}

export interface OrderRequest {
  packageId: string;
  userId: string;
  paymentMethod: string;
}

export interface OrderResponse {
  orderId: string;
  status: string;
  esim?: ESIMDetails;
}

export interface OrderStatus {
  orderId: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ActivationResponse {
  success: boolean;
  activationCode?: string;
  qrCode?: string;
}

export interface ESIMDetails {
  iccid: string;
  qrCode: string;
  smdpAddress: string;
  activationCode: string;
  status: string;
}

export interface UsageData {
  dataUsed: number;
  dataTotal: number;
  validUntil: Date;
}

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'down';
  responseTime: number;
  lastChecked: Date;
}