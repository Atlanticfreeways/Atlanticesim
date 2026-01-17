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
export class BreezeAdapter extends BaseProviderAdapter {
  constructor(private configService: ConfigService) {
    super(
      'Breeze',
      configService.get('BREEZE_API_URL') || 'https://api.breeze.com/v1',
      configService.get('BREEZE_API_KEY') || '',
    );
  }

  async searchPackages(filters: PackageFilters): Promise<Package[]> {
    this.logger.log(`Searching packages with filters: ${JSON.stringify(filters)}`);

    // If no API key is present, return mock data
    if (!this.configService.get('BREEZE_API_KEY')) {
      this.logger.warn('No API key found for Breeze. Returning mock data.');
      return this.getMockPackages(filters);
    }

    try {
      const params: any = {};
      if (filters.country) params.iso = filters.country;

      const response = await this.httpClient.get('/bundles', { params });

      return (response.data.bundles || []).map((bundle: any) => this.mapToPackage(bundle));
    } catch (error) {
      this.logger.error(`Failed to search packages: ${error.message}`);
      return [];
    }
  }

  async getPackageDetails(packageId: string): Promise<Package> {
    try {
      const response = await this.httpClient.get(`/bundles/${packageId}`);
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
        bundle_code: orderData.packageId,
        count: orderData.quantity || 1,
      };

      const response = await this.httpClient.post('/purchases', payload);
      const data = response.data;

      return {
        id: data.id,
        providerId: 'breeze',
        packageId: orderData.packageId,
        userId: orderData.userId,
        status: this.mapOrderStatus(data.status),
        totalAmount: data.cost,
        currency: data.currency || 'USD',
        providerOrderId: data.reference,
        createdAt: new Date(),
        updatedAt: new Date(),
        esim: data.esim ? this.mapEsimDetails(data.esim) : undefined,
        meta: data,
      };
    } catch (error) {
      this.logger.error(`Failed to create order: ${error.message}`);
      throw error;
    }
  }

  async getOrderStatus(orderId: string): Promise<OrderStatus> {
    const response = await this.httpClient.get(`/purchases/${orderId}`);
    const data = response.data;

    return {
      orderId: orderId,
      providerOrderId: data.reference,
      status: this.mapOrderStatus(data.status),
      updatedAt: new Date(),
      esim: data.esim ? this.mapEsimDetails(data.esim) : undefined,
    };
  }

  async activateESIM(esimId: string): Promise<ActivationResult> {
    return {
      esimId,
      iccid: 'UNKNOWN',
      qrCode: '',
      status: 'active',
    };
  }

  async getESIMDetails(esimId: string): Promise<ESIMDetails> {
    // Breeze might not have a direct eSIM endpoint, inferring from order
    return {
      id: esimId,
      iccid: esimId, // In some cases ID is ICCID
      status: 'active',
      providerId: 'breeze',
    };
  }

  async getQRCode(esimId: string): Promise<string> {
    return '';
  }

  // --- Helpers ---

  private mapToPackage(bundle: any): Package {
    return {
      id: bundle.code || bundle.id,
      providerId: 'breeze',
      providerName: 'Breeze',
      title: bundle.name,
      description: bundle.description || '',
      country: bundle.iso || 'Global',
      dataAmount: this.normalizeDataAmount(bundle.volume),
      dataUnit: 'GB',
      duration: bundle.validity_days || 30,
      price: parseFloat(bundle.price),
      currency: bundle.currency || 'USD',
      coverage: bundle.supported_countries || [],
      isActive: true,
      meta: {
        network_speed: bundle.speed,
      }
    };
  }

  private normalizeDataAmount(amount: any): number {
    // Breeze might send bytes or MB/GB as string
    if (typeof amount === 'string') {
      if (amount.includes('GB')) {
        return parseFloat(amount.replace('GB', ''));
      }
      if (amount.includes('MB')) {
        return parseFloat(amount.replace('MB', '')) / 1024;
      }
      const num = parseFloat(amount);
      return isNaN(num) ? 0 : num;
    }
    return amount || 0;
  }

  private mapOrderStatus(status: string): Order['status'] {
    switch (status?.toLowerCase()) {
      case 'success': // Breeze specific
      case 'completed':
        return 'completed';
      case 'pending':
        return 'pending';
      case 'failed':
        return 'failed';
      default:
        return 'processing';
    }
  }

  private mapEsimDetails(esim: any): ESIMDetails {
    return {
      id: esim.iccid,
      iccid: esim.iccid,
      status: 'active',
      providerId: 'breeze',
      activationCode: esim.activation_code,
      smdpAddress: esim.smdp_address,
    } as any;
  }

  private getMockPackages(filters: PackageFilters): Package[] {
    if (filters.country === 'US' || !filters.country) {
      return [
        {
          id: 'breeze-us-10gb',
          providerId: 'breeze',
          providerName: 'Breeze',
          title: 'Breeze USA 10GB',
          description: 'Premium USA Data',
          country: 'US',
          dataAmount: 10,
          dataUnit: 'GB',
          duration: 30,
          price: 15.00,
          currency: 'USD',
          coverage: ['US', 'CA', 'MX'],
          isActive: true,
        }
      ];
    }
    return [];
  }
}