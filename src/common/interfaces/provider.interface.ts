export interface PackageFilters {
  country?: string;
  region?: string;
  minData?: number; // in GB
  maxData?: number;
  minPrice?: number;
  maxPrice?: number;
  duration?: number; // in days
  dataUnit?: 'MB' | 'GB';
  isUnlimited?: boolean;
}

export interface Package {
  id: string;
  providerId: string;
  providerName: string;
  title: string;
  description: string;
  country: string;
  region?: string;
  dataAmount: number;
  dataUnit: 'MB' | 'GB';
  duration: number; // days
  wholesalePrice: number;
  retailPrice: number;
  currency: string;
  coverage: string[];
  features?: string[];
  isActive: boolean;
  meta?: Record<string, any>;
}

export interface CreateOrderDto {
  packageId: string;
  userId: string;
  email: string;
  quantity?: number;
  metadata?: Record<string, any>;
}

export interface Order {
  id: string;
  providerId: string;
  packageId: string;
  userId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  totalAmount: number;
  currency: string;
  providerOrderId: string;
  createdAt: Date;
  updatedAt: Date;
  meta?: Record<string, any>;
  esim?: ESIMDetails & { activationCode?: string; smdpAddress?: string; qrCode?: string };
}

export interface OrderStatus {
  orderId: string;
  providerOrderId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  esim?: ESIMDetails;
  message?: string;
  updatedAt: Date;
}

export interface ActivationResult {
  esimId: string;
  iccid: string;
  qrCode: string; // Base64 encoded or URL
  activationCode?: string;
  smdpAddress?: string;
  status: 'active' | 'inactive' | 'pending';
  activatedAt?: Date;
  apn?: string;
  instructions?: string;
}

export interface ESIMDetails {
  id: string;
  iccid: string;
  status: 'active' | 'inactive' | 'expired' | 'pending';
  dataRemaining?: number;
  dataTotal?: number;
  expiresAt?: Date;
  activatedAt?: Date;
  providerId: string;
}

export interface ProviderHealth {
  isAvailable: boolean;
  responseTime?: number; // ms
  lastChecked: Date;
  errorMessage?: string;
  provider: string;
}

/**
 * Base interface that all provider adapters must implement
 */
export interface IProviderAdapter {
  /**
   * Get provider name
   */
  getProviderName(): string;

  /**
   * Check if provider API is available
   */
  checkHealth(): Promise<ProviderHealth>;

  /**
   * Search for available packages
   */
  searchPackages(filters: PackageFilters): Promise<Package[]>;

  /**
   * Get details of a specific package
   */
  getPackageDetails(packageId: string): Promise<Package>;

  /**
   * Create an order for a package
   */
  createOrder(orderData: CreateOrderDto): Promise<Order>;

  /**
   * Get order status
   */
  getOrderStatus(orderId: string): Promise<OrderStatus>;

  /**
   * Activate an eSIM
   */
  activateESIM(esimId: string): Promise<ActivationResult>;

  /**
   * Get eSIM details and usage
   */
  getESIMDetails(esimId: string): Promise<ESIMDetails>;

  /**
   * Get QR code for eSIM activation
   */
  getQRCode(esimId: string): Promise<string>;

  /**
   * Optional: Cancel an order
   */
  cancelOrder?(orderId: string): Promise<boolean>;

  /**
   * Optional: Refresh eSIM data usage
   */
  refreshUsage?(esimId: string): Promise<ESIMDetails>;
}