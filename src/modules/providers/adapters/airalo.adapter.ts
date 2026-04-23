import { Injectable, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { BaseProviderAdapter } from '../../../common/providers/base-provider.adapter';
import { WithCircuitBreaker } from '../../../common/providers/circuit-breaker.decorator';
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

import { PrismaService } from '../../../config/prisma.service';

@Injectable()
export class AiraloAdapter extends BaseProviderAdapter {
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor(
    private configService: ConfigService,
    private prismaService: PrismaService,
    @Optional() httpClient?: any,
  ) {
    super(
      'Airalo',
      configService.get('AIRALO_API_URL') || 'https://sandbox-api.airalo.com/v2',
      '', // We will lazy-load via Prisma
      httpClient,
      prismaService
    );
  }

  /**
   * Airalo uses OAuth2 with Client ID and Client Secret
   */
  protected async setupAuthHeader(): Promise<void> {
    const token = await this.getAccessToken();
    this.httpClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  private async getAccessToken(): Promise<string> {
    const now = Date.now();

    // Return cached token if valid (with 5 min buffer)
    if (this.accessToken && now < this.tokenExpiry - 300000) {
      return this.accessToken;
    }

    this.logger.log('Fetching new Airalo access token...');

    // Fetch credentials from DB or fallback to config
    const providerRecord = await this.prisma.provider.findUnique({ where: { slug: 'airalo' } });
    let clientId = this.configService.get('AIRALO_CLIENT_ID');
    let clientSecret = this.configService.get('AIRALO_CLIENT_SECRET');

    if (providerRecord && providerRecord.config) {
      const config = providerRecord.config as any;
      if (config.clientId) clientId = config.clientId;
      // Depending on implementation, Airalo might only use apiKey field or break it into client_id/secret.
      // Assuming apiKey stores the client_id:client_secret or similar if needed. We'll fallback to config service mostly here.
    }

    if (!clientId || !clientSecret) {
      this.logger.error('Airalo Client ID or Secret missing in configuration. Cannot safely initialize provider.');
      throw new Error('Institutional Configuration Error: Airalo credentials missing.');
    }

    try {
      const response = await axios.post(`${this.baseUrl}/token`, {
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'client_credentials',
      });

      this.accessToken = response.data.data.access_token;
      // Expires_in is in seconds
      this.tokenExpiry = now + (response.data.data.expires_in * 1000);

      this.logger.log('Airalo token refreshed successfully');
      return this.accessToken;
    } catch (error) {
      this.logger.error('Failed to get Airalo access token', error.stack);
      throw new Error(`Airalo Auth Error: ${error.message}`);
    }
  }

  @WithCircuitBreaker()
  async searchPackages(filters: PackageFilters): Promise<Package[]> {
    await this.setupAuthHeader();

    try {
      const response = await this.httpClient.get('/packages', {
        params: {
          limit: 50,
          ...filters
        }
      });

      if (!response.data || !response.data.data) {
        return [];
      }

      return response.data.data.map((pkg: any) => this.mapToPackage(pkg));
    } catch (error) {
      this.logger.error(`Failed to search Airalo packages: ${error.message}`);
      return [];
    }
  }

  private mapToPackage(apiPkg: any): Package {
    const countries = apiPkg.operator?.countries?.map((c: any) => c.slug) ?? [apiPkg.slug];
    const isUnlimited = apiPkg.type === 'unlimited';

    const { packageType, scopeType } = PackageClassifier.classify({
      hasData: true,
      hasVoice: false,
      hasSms: false,
      isUnlimited,
      countries,
    });

    return {
      id: apiPkg.id.toString(),
      providerId: 'airalo',
      providerName: 'Airalo',
      title: apiPkg.operator.title,
      description: apiPkg.operator.description || '',
      country: apiPkg.slug,
      dataAmount: apiPkg.data_amount,
      dataUnit: apiPkg.data_unit === 'GB' ? 'GB' : 'MB',
      duration: apiPkg.validity,
      wholesalePrice: apiPkg.price,
      retailPrice: apiPkg.price,
      currency: 'USD',
      coverage: countries,
      isActive: true,
      meta: {
        operator: apiPkg.operator.title,
        type: apiPkg.type,
        packageType,
        scopeType,
      }
    };
  }

  @WithCircuitBreaker()
  async getPackageDetails(packageId: string): Promise<Package> {
    await this.setupAuthHeader();
    const response = await this.httpClient.get(`/packages/${packageId}`);
    return this.mapToPackage(response.data.data);
  }

  @WithCircuitBreaker()
  async createOrder(orderData: CreateOrderDto): Promise<Order> {
    await this.setupAuthHeader();

    try {
      const response = await this.httpClient.post('/orders', {
        package_id: orderData.packageId,
        quantity: orderData.quantity || 1,
      });

      const airaloOrder = response.data.data;

      return {
        id: airaloOrder.id.toString(),
        providerId: 'airalo',
        packageId: orderData.packageId,
        userId: orderData.userId,
        status: 'completed',
        totalAmount: airaloOrder.price,
        currency: 'USD',
        providerOrderId: airaloOrder.id.toString(),
        createdAt: new Date(),
        updatedAt: new Date(),
        esim: airaloOrder.sims && airaloOrder.sims.length > 0 ? {
          id: airaloOrder.sims[0].iccid,
          iccid: airaloOrder.sims[0].iccid,
          status: 'pending',
          providerId: 'airalo',
          qrCode: airaloOrder.sims[0].qrcode_url,
          activationCode: airaloOrder.sims[0].activation_code,
          smdpAddress: airaloOrder.sims[0].smdp_address,
        } : undefined
      };
    } catch (error) {
      this.logger.error(`Failed to create Airalo order: ${error.message}`);
      throw error;
    }
  }

  async getOrderStatus(orderId: string): Promise<OrderStatus> {
    await this.setupAuthHeader();
    const response = await this.httpClient.get(`/orders/${orderId}`);
    const airaloOrder = response.data.data;

    return {
      orderId: orderId,
      providerOrderId: airaloOrder.id.toString(),
      status: airaloOrder.status === 'completed' ? 'completed' : 'processing',
      updatedAt: new Date(),
    };
  }

  async activateESIM(esimId: string): Promise<ActivationResult> {
    const details = await this.getESIMDetails(esimId);
    return {
      esimId: details.id,
      iccid: details.iccid,
      qrCode: '',
      status: details.status === 'active' ? 'active' : 'pending',
      activatedAt: details.activatedAt
    };
  }

  async getESIMDetails(esimId: string): Promise<ESIMDetails> {
    await this.setupAuthHeader();
    const response = await this.httpClient.get(`/sims/${esimId}`);
    const sim = response.data.data;

    return {
      id: sim.iccid,
      iccid: sim.iccid,
      status: sim.status === 'active' ? 'active' : 'inactive',
      dataRemaining: sim.usage?.remaining,
      dataTotal: sim.usage?.total,
      expiresAt: sim.expiry ? new Date(sim.expiry) : undefined,
      activatedAt: sim.activated_at ? new Date(sim.activated_at) : undefined,
      providerId: 'airalo'
    };
  }

  async getQRCode(esimId: string): Promise<string> {
    const details = await this.getESIMDetails(esimId);
    // Return empty if QR code URL isn't directly in SIM details; usually it's in the order
    return '';
  }
}