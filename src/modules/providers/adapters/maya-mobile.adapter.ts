import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BaseProviderAdapter } from '../../../common/providers/base-provider.adapter';
import {
  PackageFilters,
  Package,
  CreateOrderDto,
  Order,
  OrderStatus,
  ActivationResult,
  ESIMDetails,
} from '../../../common/interfaces/provider.interface';

@Injectable()
export class MayaMobileAdapter extends BaseProviderAdapter {
  constructor(private configService: ConfigService) {
    super(
      'MayaMobile',
      configService.get('MAYA_MOBILE_API_URL') || 'https://api.mayamobile.com/v1',
      configService.get('MAYA_MOBILE_API_KEY') || '',
    );
  }

  async searchPackages(filters: PackageFilters): Promise<Package[]> {
    this.logger.log(`Searching packages with filters: ${JSON.stringify(filters)}`);

    // If no API key is present, return empty or mock data depending on env
    if (!this.configService.get('MAYA_MOBILE_API_KEY')) {
      this.logger.warn('No API key found for Maya Mobile. Returning mock data.');
      return this.getMockPackages(filters);
    }

    try {
      const params: any = {};
      if (filters.country) params.country = filters.country;
      if (filters.region) params.region = filters.region;

      const response = await this.httpClient.get('/plans', { params });

      // Map Maya Mobile response to internal Package format
      // Assuming response.data.plans is the array
      return (response.data.plans || []).map((plan: any) => this.mapToPackage(plan));
    } catch (error) {
      this.logger.error(`Failed to search packages: ${error.message}`);
      // Return empty array instead of throwing to allow aggregation
      return [];
    }
  }

  async getPackageDetails(packageId: string): Promise<Package> {
    try {
      const response = await this.httpClient.get(`/plans/${packageId}`);
      return this.mapToPackage(response.data);
    } catch (error) {
      if (error.response?.status === 404) {
        throw new Error(`Package ${packageId} not found`);
      }
      throw error;
    }
  }

  async createOrder(orderData: CreateOrderDto): Promise<Order> {
    try {
      const payload = {
        plan_id: orderData.packageId,
        quantity: orderData.quantity || 1,
        callback_url: this.configService.get('WEBHOOK_URL'),
      };

      const response = await this.httpClient.post('/orders', payload);
      const orderDataResponse = response.data;

      return {
        id: orderDataResponse.id,
        providerId: 'maya-mobile',
        packageId: orderData.packageId,
        userId: orderData.userId,
        status: this.mapOrderStatus(orderDataResponse.status),
        totalAmount: orderDataResponse.price,
        currency: orderDataResponse.currency || 'USD',
        providerOrderId: orderDataResponse.id,
        createdAt: new Date(),
        updatedAt: new Date(),
        esim: orderDataResponse.esim ? this.mapEsimDetails(orderDataResponse.esim) : undefined,
        meta: orderDataResponse,
      };
    } catch (error) {
      this.logger.error(`Failed to create order: ${error.message}`);
      throw error;
    }
  }

  async getOrderStatus(orderId: string): Promise<OrderStatus> {
    const response = await this.httpClient.get(`/orders/${orderId}`);
    const data = response.data;

    return {
      orderId: orderId,
      providerOrderId: data.id,
      status: this.mapOrderStatus(data.status),
      updatedAt: new Date(),
      esim: data.esim ? this.mapEsimDetails(data.esim) : undefined,
    };
  }

  async activateESIM(esimId: string): Promise<ActivationResult> {
    // Maya esims usually activate on first use, but this might trigger a specific action
    return {
      esimId,
      iccid: 'UNKNOWN',
      qrCode: '',
      status: 'active',
    };
  }

  async getESIMDetails(esimId: string): Promise<ESIMDetails> {
    const response = await this.httpClient.get(`/esims/${esimId}`);
    return this.mapEsimDetails(response.data);
  }

  async getQRCode(esimId: string): Promise<string> {
    const details = await this.getESIMDetails(esimId);
    // Assuming API doesn't return QR code directly, we might need to construct it
    // Or return what we have
    return '';
  }

  // --- Helpers ---

  private mapToPackage(plan: any): Package {
    return {
      id: plan.uuid || plan.id,
      providerId: 'maya-mobile',
      providerName: 'Maya Mobile',
      title: plan.title || plan.name,
      description: plan.description || '',
      country: plan.country_code || 'Global',
      dataAmount: this.normalizeDataAmount(plan.data_amount),
      dataUnit: 'GB', // Maya usually deals in GB
      duration: plan.duration_days || 30,
      price: parseFloat(plan.retail_price || plan.price),
      currency: plan.currency || 'USD',
      coverage: plan.coverage_countries || [],
      isActive: true,
      meta: {
        network_type: plan.network_type,
        regions: plan.regions,
      }
    };
  }

  private normalizeDataAmount(amount: any): number {
    if (typeof amount === 'string') {
      const num = parseFloat(amount);
      return isNaN(num) ? 0 : num;
    }
    return amount || 0;
  }

  private mapOrderStatus(status: string): Order['status'] {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'completed':
        return 'completed';
      case 'pending':
        return 'pending';
      case 'failed':
        return 'failed';
      case 'cancelled':
        return 'cancelled';
      default:
        return 'processing';
    }
  }

  private mapEsimDetails(esim: any): ESIMDetails {
    return {
      id: esim.id,
      iccid: esim.iccid,
      status: esim.status === 'active' ? 'active' : 'inactive',
      providerId: 'maya-mobile',
      dataRemaining: esim.data_remaining,
      dataTotal: esim.data_total,
      expiresAt: esim.expires_at ? new Date(esim.expires_at) : undefined,
    };
  }

  private getMockPackages(filters: PackageFilters): Package[] {
    // Provide some mock data for development/testing
    if (filters.country === 'US' || !filters.country) {
      return [
        {
          id: 'maya-us-3gb',
          providerId: 'maya-mobile',
          providerName: 'Maya Mobile',
          title: 'USA 3GB 30 Days',
          description: 'High speed 5G/4G data in USA',
          country: 'US',
          dataAmount: 3,
          dataUnit: 'GB',
          duration: 30,
          price: 8.00,
          currency: 'USD',
          coverage: ['US'],
          isActive: true,
        },
        {
          id: 'maya-us-5gb',
          providerId: 'maya-mobile',
          providerName: 'Maya Mobile',
          title: 'USA 5GB 30 Days',
          description: 'High speed 5G/4G data in USA',
          country: 'US',
          dataAmount: 5,
          dataUnit: 'GB',
          duration: 30,
          price: 12.00,
          currency: 'USD',
          coverage: ['US'],
          isActive: true,
        }
      ];
    }
    return [];
  }
}