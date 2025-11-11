import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { ProviderAdapter, PackageFilters, Package, PackageDetails, OrderRequest, OrderResponse, OrderStatus, ActivationResponse, ESIMDetails, UsageData, HealthStatus } from '../../../common/interfaces/provider.interface';

@Injectable()
export class BreezeAdapter implements ProviderAdapter {
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(private configService: ConfigService) {
    this.baseUrl = 'https://api.esimgo.com/v2';
    this.apiKey = this.configService.get('BREEZE_API_KEY');
  }

  async getPackages(filters: PackageFilters): Promise<Package[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/products`, {
        headers: { 'X-API-Key': this.apiKey },
        params: {
          countries: filters.countries?.join(','),
          type: filters.hasVoice ? 'voice_data' : 'data_only',
        },
      });

      return response.data.products.map(product => ({
        id: product.product_id,
        name: product.name,
        description: product.description,
        countries: product.coverage_countries,
        dataAmount: product.data_allowance_mb / 1024,
        dataUnit: 'GB' as const,
        validityDays: product.validity_period_days,
        price: product.retail_price,
        currency: 'USD',
        hasVoice: product.voice_included,
        hasSms: product.sms_included,
        voiceMinutes: product.voice_allowance_minutes,
        smsCount: product.sms_allowance_count,
      }));
    } catch (error) {
      throw new Error(`Breeze API error: ${error.message}`);
    }
  }

  async getPackageDetails(packageId: string): Promise<PackageDetails> {
    const response = await axios.get(`${this.baseUrl}/products/${packageId}`, {
      headers: { 'X-API-Key': this.apiKey },
    });

    const product = response.data;
    return {
      id: product.product_id,
      name: product.name,
      description: product.description,
      countries: product.coverage_countries,
      dataAmount: product.data_allowance_mb / 1024,
      dataUnit: 'GB',
      validityDays: product.validity_period_days,
      price: product.retail_price,
      currency: 'USD',
      hasVoice: product.voice_included,
      hasSms: product.sms_included,
      voiceMinutes: product.voice_allowance_minutes,
      smsCount: product.sms_allowance_count,
      features: product.features || [],
      terms: product.terms_conditions || '',
      coverage: product.network_operators || [],
    };
  }

  async createOrder(order: OrderRequest): Promise<OrderResponse> {
    const response = await axios.post(`${this.baseUrl}/orders`, {
      product_id: order.packageId,
      reference: order.userId,
    }, {
      headers: { 'X-API-Key': this.apiKey },
    });

    return {
      orderId: response.data.order_id,
      status: 'PROCESSING',
      esim: {
        iccid: response.data.esim_profile.iccid,
        qrCode: response.data.esim_profile.qr_code,
        smdpAddress: response.data.esim_profile.sm_dp_address,
        activationCode: response.data.esim_profile.activation_code,
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
      status: response.data.order_status.toUpperCase(),
      createdAt: new Date(response.data.created_date),
      updatedAt: new Date(response.data.last_updated),
    };
  }

  async activateESIM(esimId: string): Promise<ActivationResponse> {
    const response = await axios.put(`${this.baseUrl}/esim-profiles/${esimId}/activate`, {}, {
      headers: { 'X-API-Key': this.apiKey },
    });

    return {
      success: response.data.activation_successful,
      activationCode: response.data.confirmation_code,
    };
  }

  async getESIMDetails(esimId: string): Promise<ESIMDetails> {
    const response = await axios.get(`${this.baseUrl}/esim-profiles/${esimId}`, {
      headers: { 'X-API-Key': this.apiKey },
    });

    return {
      iccid: response.data.iccid,
      qrCode: response.data.qr_code,
      smdpAddress: response.data.sm_dp_address,
      activationCode: response.data.activation_code,
      status: response.data.profile_status.toUpperCase(),
    };
  }

  async getUsageData(esimId: string): Promise<UsageData> {
    const response = await axios.get(`${this.baseUrl}/esim-profiles/${esimId}/usage`, {
      headers: { 'X-API-Key': this.apiKey },
    });

    return {
      dataUsed: response.data.data_consumed_mb,
      dataTotal: response.data.data_allowance_mb,
      validUntil: new Date(response.data.expiry_date),
    };
  }

  async healthCheck(): Promise<HealthStatus> {
    const start = Date.now();
    try {
      await axios.get(`${this.baseUrl}/ping`, {
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