import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { ProviderAdapter, PackageFilters, Package, PackageDetails, OrderRequest, OrderResponse, OrderStatus, ActivationResponse, ESIMDetails, UsageData, HealthStatus } from '../../../common/interfaces/provider.interface';

@Injectable()
export class MayaMobileAdapter implements ProviderAdapter {
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(private configService: ConfigService) {
    this.baseUrl = 'https://api.mayamobile.com/v1';
    this.apiKey = this.configService.get('MAYA_MOBILE_API_KEY');
  }

  async getPackages(filters: PackageFilters): Promise<Package[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/packages`, {
        headers: { 'X-API-Key': this.apiKey },
        params: {
          countries: filters.countries?.join(','),
          voice: filters.hasVoice,
        },
      });

      return response.data.packages.map(pkg => ({
        id: pkg.package_id,
        name: pkg.name,
        description: pkg.description,
        countries: pkg.coverage_countries,
        dataAmount: pkg.data_mb / 1024,
        dataUnit: 'GB' as const,
        validityDays: pkg.validity_days,
        price: pkg.price_usd,
        currency: 'USD',
        hasVoice: pkg.voice_included,
        hasSms: pkg.sms_included,
        voiceMinutes: pkg.voice_minutes,
        smsCount: pkg.sms_count,
      }));
    } catch (error) {
      throw new Error(`Maya Mobile API error: ${error.message}`);
    }
  }

  async getPackageDetails(packageId: string): Promise<PackageDetails> {
    const response = await axios.get(`${this.baseUrl}/packages/${packageId}`, {
      headers: { 'X-API-Key': this.apiKey },
    });

    const pkg = response.data;
    return {
      id: pkg.package_id,
      name: pkg.name,
      description: pkg.description,
      countries: pkg.coverage_countries,
      dataAmount: pkg.data_mb / 1024,
      dataUnit: 'GB',
      validityDays: pkg.validity_days,
      price: pkg.price_usd,
      currency: 'USD',
      hasVoice: pkg.voice_included,
      hasSms: pkg.sms_included,
      voiceMinutes: pkg.voice_minutes,
      smsCount: pkg.sms_count,
      features: pkg.features || [],
      terms: pkg.terms || '',
      coverage: pkg.network_operators || [],
    };
  }

  async createOrder(order: OrderRequest): Promise<OrderResponse> {
    const response = await axios.post(`${this.baseUrl}/orders`, {
      package_id: order.packageId,
      customer_id: order.userId,
    }, {
      headers: { 'X-API-Key': this.apiKey },
    });

    return {
      orderId: response.data.order_id,
      status: 'PROCESSING',
      esim: {
        iccid: response.data.esim.iccid,
        qrCode: response.data.esim.qr_code,
        smdpAddress: response.data.esim.smdp_address,
        activationCode: response.data.esim.activation_code,
        status: 'INACTIVE',
      },
    };
  }

  async getOrderStatus(orderId: string): Promise<OrderStatus> {
    const response = await axios.get(`${this.baseUrl}/orders/${orderId}`, {
      headers: { 'X-API-Key': this.apiKey },
    });

    return {
      orderId: response.data.order_id,
      status: response.data.status,
      createdAt: new Date(response.data.created_at),
      updatedAt: new Date(response.data.updated_at),
    };
  }

  async activateESIM(esimId: string): Promise<ActivationResponse> {
    const response = await axios.post(`${this.baseUrl}/esims/${esimId}/activate`, {}, {
      headers: { 'X-API-Key': this.apiKey },
    });

    return {
      success: response.data.success,
      activationCode: response.data.activation_code,
    };
  }

  async getESIMDetails(esimId: string): Promise<ESIMDetails> {
    const response = await axios.get(`${this.baseUrl}/esims/${esimId}`, {
      headers: { 'X-API-Key': this.apiKey },
    });

    return {
      iccid: response.data.iccid,
      qrCode: response.data.qr_code,
      smdpAddress: response.data.smdp_address,
      activationCode: response.data.activation_code,
      status: response.data.status,
    };
  }

  async getUsageData(esimId: string): Promise<UsageData> {
    const response = await axios.get(`${this.baseUrl}/esims/${esimId}/usage`, {
      headers: { 'X-API-Key': this.apiKey },
    });

    return {
      dataUsed: response.data.data_used_mb,
      dataTotal: response.data.data_limit_mb,
      validUntil: new Date(response.data.expires_at),
    };
  }

  async healthCheck(): Promise<HealthStatus> {
    const start = Date.now();
    try {
      await axios.get(`${this.baseUrl}/health`, {
        headers: { 'X-API-Key': this.apiKey },
        timeout: 5000,
      });
      
      return {
        status: 'healthy',
        responseTime: Date.now() - start,
        lastChecked: new Date(),
      };
    } catch (error) {
      return {
        status: 'down',
        responseTime: Date.now() - start,
        lastChecked: new Date(),
      };
    }
  }
}