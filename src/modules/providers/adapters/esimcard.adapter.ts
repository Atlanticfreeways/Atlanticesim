import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { ProviderAdapter, PackageFilters, Package, PackageDetails, OrderRequest, OrderResponse, OrderStatus, ActivationResponse, ESIMDetails, UsageData, HealthStatus } from '../../../common/interfaces/provider.interface';

@Injectable()
export class EsimcardAdapter implements ProviderAdapter {
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(private configService: ConfigService) {
    this.baseUrl = 'https://api.esimcard.com/v1';
    this.apiKey = this.configService.get('ESIMCARD_API_KEY');
  }

  async getPackages(filters: PackageFilters): Promise<Package[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/plans`, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` },
        params: {
          country: filters.countries?.join(','),
          voice: filters.hasVoice,
        },
      });

      return response.data.plans.map(plan => ({
        id: plan.plan_id,
        name: plan.title,
        description: plan.description,
        countries: plan.countries,
        dataAmount: plan.data_gb,
        dataUnit: 'GB' as const,
        validityDays: plan.validity_days,
        price: plan.price,
        currency: 'USD',
        hasVoice: plan.voice_enabled,
        hasSms: plan.sms_enabled,
        voiceMinutes: plan.voice_minutes,
        smsCount: plan.sms_count,
      }));
    } catch (error) {
      throw new Error(`eSIMCard API error: ${error.message}`);
    }
  }

  async getPackageDetails(packageId: string): Promise<PackageDetails> {
    const response = await axios.get(`${this.baseUrl}/plans/${packageId}`, {
      headers: { 'Authorization': `Bearer ${this.apiKey}` },
    });

    const plan = response.data;
    return {
      id: plan.plan_id,
      name: plan.title,
      description: plan.description,
      countries: plan.countries,
      dataAmount: plan.data_gb,
      dataUnit: 'GB',
      validityDays: plan.validity_days,
      price: plan.price,
      currency: 'USD',
      hasVoice: plan.voice_enabled,
      hasSms: plan.sms_enabled,
      voiceMinutes: plan.voice_minutes,
      smsCount: plan.sms_count,
      features: plan.features || [],
      terms: plan.terms || '',
      coverage: plan.operators || [],
    };
  }

  async createOrder(order: OrderRequest): Promise<OrderResponse> {
    const response = await axios.post(`${this.baseUrl}/orders`, {
      plan_id: order.packageId,
      customer_email: order.userId,
    }, {
      headers: { 'Authorization': `Bearer ${this.apiKey}` },
    });

    return {
      orderId: response.data.order_id,
      status: 'PROCESSING',
      esim: {
        iccid: response.data.esim.iccid,
        qrCode: response.data.esim.qr_code_url,
        smdpAddress: response.data.esim.smdp_address,
        activationCode: response.data.esim.activation_code,
        status: 'INACTIVE',
      },
    };
  }

  async getOrderStatus(orderId: string): Promise<OrderStatus> {
    const response = await axios.get(`${this.baseUrl}/orders/${orderId}`, {
      headers: { 'Authorization': `Bearer ${this.apiKey}` },
    });

    return {
      orderId: response.data.order_id,
      status: response.data.status.toUpperCase(),
      createdAt: new Date(response.data.created_at),
      updatedAt: new Date(response.data.updated_at),
    };
  }

  async activateESIM(esimId: string): Promise<ActivationResponse> {
    const response = await axios.post(`${this.baseUrl}/esims/${esimId}/activate`, {}, {
      headers: { 'Authorization': `Bearer ${this.apiKey}` },
    });

    return {
      success: response.data.success,
      activationCode: response.data.activation_code,
    };
  }

  async getESIMDetails(esimId: string): Promise<ESIMDetails> {
    const response = await axios.get(`${this.baseUrl}/esims/${esimId}`, {
      headers: { 'Authorization': `Bearer ${this.apiKey}` },
    });

    return {
      iccid: response.data.iccid,
      qrCode: response.data.qr_code_url,
      smdpAddress: response.data.smdp_address,
      activationCode: response.data.activation_code,
      status: response.data.status.toUpperCase(),
    };
  }

  async getUsageData(esimId: string): Promise<UsageData> {
    const response = await axios.get(`${this.baseUrl}/esims/${esimId}/usage`, {
      headers: { 'Authorization': `Bearer ${this.apiKey}` },
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
      await axios.get(`${this.baseUrl}/status`, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` },
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