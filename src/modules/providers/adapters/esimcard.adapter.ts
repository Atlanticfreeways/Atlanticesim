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
import { PackageClassifier } from '../../../common/utils/package-classifier.util';
import { WithCircuitBreaker } from '../../../common/providers/circuit-breaker.decorator';

@Injectable()
export class EsimCardAdapter extends BaseProviderAdapter {
  constructor(
    private configService: ConfigService,
    private prismaService: PrismaService,
  ) {
    super(
      'esimcard',
      configService.get('ESIMCARD_API_URL') || 'https://api.esimcard.com/v1',
      '',
      undefined,
      prismaService
    );
  }

  @WithCircuitBreaker()
  async searchPackages(filters: PackageFilters): Promise<Package[]> {
    this.logger.log(`Searching packages with filters: ${JSON.stringify(filters)}`);
    await this.setupAuthHeader();

    if (!this.apiKey) {
      this.logger.warn('No API key found for eSIMCard. Returning mock data.');
      return this.getMockPackages(filters);
    }

    try {
      const params: any = {};
      if (filters.country) params.iso = filters.country;

      const response = await this.httpClient.get('/packages', { params });
      return (response.data?.packages || []).map((pkg: any) => this.mapToPackage(pkg));
    } catch (error) {
      this.logger.error(`Failed to search eSIMCard packages: ${error.message}`);
      return [];
    }
  }

  @WithCircuitBreaker()
  async getPackageDetails(packageId: string): Promise<Package> {
    await this.setupAuthHeader();
    try {
      const response = await this.httpClient.get(`/packages/${packageId}`);
      return this.mapToPackage(response.data);
    } catch (error) {
      throw new Error(`Failed to fetch eSIMCard package details: ${error.message}`);
    }
  }

  @WithCircuitBreaker()
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
        providerId: 'esimcard',
        packageId: orderData.packageId,
        userId: orderData.userId,
        status: data.status === 'completed' ? 'completed' : 'processing',
        totalAmount: data.price,
        currency: data.currency || 'USD',
        providerOrderId: data.id,
        createdAt: new Date(),
        updatedAt: new Date(),
        esim: data.esims?.length > 0 ? {
          id: data.esims[0].iccid,
          iccid: data.esims[0].iccid,
          status: 'pending',
          providerId: 'esimcard',
          qrCode: data.esims[0].qr_code_url,
          activationCode: data.esims[0].activation_code,
        } : undefined,
      };
    } catch (error) {
      this.logger.error(`Failed to create eSIMCard order: ${error.message}`);
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
      providerId: 'esimcard',
    };
  }

  async getQRCode(esimId: string): Promise<string> {
    return '';
  }

  private mapToPackage(pkg: any): Package {
    const countries = pkg.countries || [];
    const hasData = (typeof pkg.data === 'string' ? parseFloat(pkg.data) : (pkg.data || 0)) > 0;
    const hasVoice = (pkg.voice_minutes ?? 0) > 0;
    const hasSms = (pkg.sms_count ?? 0) > 0;
    const isUnlimited = pkg.is_unlimited === true;

    const { packageType, scopeType } = PackageClassifier.classify({
      hasData, hasVoice, hasSms, isUnlimited, countries,
    });

    return {
      id: pkg.id,
      providerId: 'esimcard',
      providerName: 'eSIMCard',
      title: pkg.name || pkg.title,
      description: pkg.description || '',
      country: pkg.iso || 'Global',
      dataAmount: typeof pkg.data === 'string' ? parseFloat(pkg.data) : (pkg.data || 0),
      dataUnit: 'GB',
      duration: pkg.validity || 30,
      wholesalePrice: pkg.price || 0,
      retailPrice: pkg.price || 0,
      currency: pkg.currency || 'USD',
      coverage: countries,
      isActive: true,
      meta: {
        network: pkg.network || [],
        packageType,
        scopeType,
      }
    };
  }

  private getMockPackages(filters: PackageFilters): Package[] {
    return [
      {
        id: 'esimcard-global-10gb',
        providerId: 'esimcard',
        providerName: 'eSIMCard',
        title: 'Global 10GB (Mock)',
        description: 'Mock eSIMCard Package',
        country: 'Global',
        dataAmount: 10,
        dataUnit: 'GB',
        duration: 30,
        wholesalePrice: 25.00,
        retailPrice: 25.00,
        currency: 'USD',
        coverage: ['US', 'GB', 'FR', 'DE'],
        isActive: true,
        meta: { network: ['5G', '4G'] },
      }
    ];
  }
}