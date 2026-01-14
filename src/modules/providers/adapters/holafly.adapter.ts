import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { ProviderAdapter, PackageFilters, Package, PackageDetails, OrderRequest, OrderResponse, OrderStatus, ActivationResponse, ESIMDetails, UsageData, HealthStatus } from '../../../common/interfaces/provider.interface';

@Injectable()
export class HolaflyAdapter implements ProviderAdapter {
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(private configService: ConfigService) {
    this.baseUrl = 'https://api.holafly.com/v1';
    this.apiKey = this.configService.get('HOLAFLY_API_KEY');
  }

  async getPackages(filters: PackageFilters): Promise<Package[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/esim-plans`, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` },
        params: {
          destination: filters.countries?.join(','),
          unlimited: false, // Holafly focuses on data-only plans
        },
      });

      return response.data.data.map(plan => ({
        id: plan.id,
        name: plan.name,
        description: plan.description,
        countries: plan.destinations,
        dataAmount: plan.data_gb,
        dataUnit: 'GB' as const,
        validityDays: plan.duration_days,
        price: plan.price,
        currency: 'USD',
        hasVoice: false, // Holafly is primarily data-only
        hasSms: false,
      }));
    } catch (error) {
      throw new Error(`Holafly API error: ${error.message}`);
    }
  }

  async getPackageDetails(packageId: string): Promise<PackageDetails> {
    const response = await axios.get(`${this.baseUrl}/esim-plans/${packageId}`, {
      headers: { 'Authorization': `Bearer ${this.apiKey}` },
    });

    const plan = response.data.data;
    return {
      id: plan.id,
      name: plan.name,
      description: plan.description,
      countries: plan.destinations,
      dataAmount: plan.data_gb,
      dataUnit: 'GB',
      validityDays: plan.duration_days,
      price: plan.price,
      currency: 'USD',
      hasVoice: false,
      hasSms: false,
      features: plan.features || [],
      terms: plan.terms || '',
      coverage: plan.coverage_areas || [],
    };
  }

  async createOrder(order: OrderRequest): Promise<OrderResponse> {
    const response = await axios.post(`${this.baseUrl}/orders`, {
      plan_id: order.packageId,
      customer_reference: order.userId,
    }, {
      headers: { 'Authorization': `Bearer ${this.apiKey}` },
    });

    return {
      orderId: response.data.data.order_id,
      status: 'PROCESSING',
      esim: {
        iccid: response.data.data.esim.iccid,
        qrCode: response.data.data.esim.qr_code,
        smdpAddress: response.data.data.esim.smdp_address,
        activationCode: response.data.data.esim.activation_code,
        status: 'INACTIVE',
      },
    };
  }

  async getOrderStatus(orderId: string): Promise<OrderStatus> {
    const response = await axios.get(`${this.baseUrl}/orders/${orderId}`, {
      headers: { 'Authorization': `Bearer ${this.apiKey}` },
    });

    return {
      orderId: response.data.data.order_id,
      status: response.data.data.status.toUpperCase(),
      createdAt: new Date(response.data.data.created_at),
      updatedAt: new Date(response.data.data.updated_at),
    };
  }

  async activateESIM(esimId: string): Promise<ActivationResponse> {
    // Holafly eSIMs are typically auto-activated
    return {
      success: true,
      activationCode: esimId,
    };
  }

  async getESIMDetails(esimId: string): Promise<ESIMDetails> {
    const response = await axios.get(`${this.baseUrl}/esims/${esimId}`, {
      headers: { 'Authorization': `Bearer ${this.apiKey}` },
    });

    return {
      iccid: response.data.data.iccid,
      qrCode: response.data.data.qr_code,
      smdpAddress: response.data.data.smdp_address,
      activationCode: response.data.data.activation_code,
      status: response.data.data.status.toUpperCase(),
    };
  }

  async getUsageData(esimId: string): Promise<UsageData> {
    const response = await axios.get(`${this.baseUrl}/esims/${esimId}/usage`, {
      headers: { 'Authorization': `Bearer ${this.apiKey}` },
    });

    return {
      dataUsed: response.data.data.data_used_mb,
      dataTotal: response.data.data.data_limit_mb,
      validUntil: new Date(response.data.data.expires_at),
    };
  }

  async healthCheck(): Promise<HealthStatus> {
    const start = Date.now();
    try {
      await axios.get(`${this.baseUrl}/health`, {
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