import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BaseProviderAdapter } from '../../../common/providers/base-provider.adapter';
import { PrismaService } from '../../../config/prisma.service';
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
export class HolaflyAdapter extends BaseProviderAdapter {
  constructor(
    private configService: ConfigService,
    private prismaService: PrismaService,
  ) {
    super(
      'holafly',
      configService.get('HOLAFLY_API_URL') || 'https://api.holafly.com/v1',
      '',
      undefined,
      prismaService
    );
  }

  async searchPackages(filters: PackageFilters): Promise<Package[]> {
    this.logger.log(`Searching packages with filters: ${JSON.stringify(filters)}`);
    await this.setupAuthHeader();

    if (!this.apiKey) {
      this.logger.warn('No API key found for Holafly. Returning mock data.');
      return this.getMockPackages(filters);
    }

    try {
      const params: any = {};
      if (filters.country) params.country = filters.country;

      const response = await this.httpClient.get('/packages', { params });
      return (response.data?.packages || []).map((pkg: any) => this.mapToPackage(pkg));
    } catch (error) {
      this.logger.error(`Failed to search Holafly packages: ${error.message}`);
      return [];
    }
  }

  async getPackageDetails(packageId: string): Promise<Package> {
    await this.setupAuthHeader();
    try {
      const response = await this.httpClient.get(`/packages/${packageId}`);
      return this.mapToPackage(response.data);
    } catch (error) {
      throw new Error(`Failed to fetch Holafly package details: ${error.message}`);
    }
  }

  async createOrder(orderData: CreateOrderDto): Promise<Order> {
    await this.setupAuthHeader();
    try {
      const payload = {
        package_id: orderData.packageId,
        quantity: orderData.quantity || 1,
      };

      const response = await this.httpClient.post('/orders', payload);
      const data = response.data;

      return {
        id: data.id,
        providerId: 'holafly',
        packageId: orderData.packageId,
        userId: orderData.userId,
        status: data.status === 'completed' ? 'completed' : 'processing',
        totalAmount: data.amount,
        currency: data.currency || 'USD',
        providerOrderId: data.id,
        createdAt: new Date(),
        updatedAt: new Date(),
        esim: data.esims?.length > 0 ? {
          id: data.esims[0].iccid,
          iccid: data.esims[0].iccid,
          status: 'pending',
          providerId: 'holafly',
          qrCode: data.esims[0].qr_code_url,
        } : undefined,
      };
    } catch (error) {
      this.logger.error(`Failed to create Holafly order: ${error.message}`);
      throw error;
    }
  }

  async getOrderStatus(orderId: string): Promise<OrderStatus> {
    await this.setupAuthHeader();
    const response = await this.httpClient.get(`/orders/${orderId}`);
    return {
      orderId,
      providerOrderId: response.data.id,
      status: response.data.status === 'completed' ? 'completed' : 'processing',
      updatedAt: new Date(),
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
    await this.setupAuthHeader();
    const response = await this.httpClient.get(`/esims/${esimId}`);
    const sim = response.data;
    return {
      id: sim.iccid,
      iccid: sim.iccid,
      status: sim.status === 'active' ? 'active' : 'inactive',
      providerId: 'holafly',
    };
  }

  async getQRCode(esimId: string): Promise<string> {
    return '';
  }

  private mapToPackage(pkg: any): Package {
    return {
      id: pkg.id,
      providerId: 'holafly',
      providerName: 'Holafly',
      title: pkg.name,
      description: pkg.description || '',
      country: pkg.country || 'Global',
      dataAmount: typeof pkg.data_limit === 'string' ? parseFloat(pkg.data_limit) : (pkg.data_limit || 0),
      dataUnit: 'GB',
      duration: pkg.validity_days || 30,
      price: pkg.price || 0,
      currency: pkg.currency || 'USD',
      coverage: pkg.countries || [],
      isActive: true,
      meta: {
        is_unlimited: pkg.is_unlimited || false,
      }
    };
  }

  private getMockPackages(filters: PackageFilters): Package[] {
    return [
      {
        id: 'holafly-eu-15gb',
        providerId: 'holafly',
        providerName: 'Holafly',
        title: 'Europe Unlimited (Mock)',
        description: 'Mock Holafly Package',
        country: 'EU',
        dataAmount: 999, // Represents Unlimited usually
        dataUnit: 'GB',
        duration: 15,
        price: 34.00,
        currency: 'USD',
        coverage: ['FR', 'DE', 'IT', 'ES'],
        isActive: true,
        meta: { is_unlimited: true },
      }
    ];
  }
}