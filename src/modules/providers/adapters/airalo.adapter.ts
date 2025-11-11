import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { ProviderAdapter, PackageFilters, Package, PackageDetails, OrderRequest, OrderResponse, OrderStatus, ActivationResponse, ESIMDetails, UsageData, HealthStatus } from '../../../common/interfaces/provider.interface';

@Injectable()
export class AiraloAdapter implements ProviderAdapter {
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(private configService: ConfigService) {
    this.baseUrl = 'https://sandbox-partners-api.airalo.com/v2';
    this.apiKey = this.configService.get('AIRALO_API_KEY');
  }

  async getPackages(filters: PackageFilters): Promise<Package[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/packages`, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` },
        params: {
          country: filters.countries?.join(','),
          limit: 100,
        },
      });

      return response.data.data.map(pkg => ({
        id: pkg.id,
        name: pkg.title,
        description: pkg.short_info,
        countries: [pkg.country.iso_name],
        dataAmount: pkg.data,
        dataUnit: 'GB' as const,
        validityDays: pkg.validity,
        price: pkg.price,
        currency: 'USD',
        hasVoice: false,
        hasSms: false,
      }));
    } catch (error) {
      throw new Error(`Airalo API error: ${error.message}`);
    }
  }

  async getPackageDetails(packageId: string): Promise<PackageDetails> {
    const response = await axios.get(`${this.baseUrl}/packages/${packageId}`, {
      headers: { 'Authorization': `Bearer ${this.apiKey}` },
    });

    const pkg = response.data.data;
    return {
      id: pkg.id,
      name: pkg.title,
      description: pkg.short_info,
      countries: [pkg.country.iso_name],
      dataAmount: pkg.data,
      dataUnit: 'GB',
      validityDays: pkg.validity,
      price: pkg.price,
      currency: 'USD',
      hasVoice: false,
      hasSms: false,
      features: pkg.info || [],
      terms: pkg.fair_usage_policy || '',
      coverage: pkg.operators || [],
    };
  }

  async createOrder(order: OrderRequest): Promise<OrderResponse> {
    const response = await axios.post(`${this.baseUrl}/orders`, {
      package_id: order.packageId,
      quantity: 1,
    }, {
      headers: { 'Authorization': `Bearer ${this.apiKey}` },
    });

    return {
      orderId: response.data.data.id,
      status: 'PROCESSING',
      esim: response.data.data.sims?.[0] ? {
        iccid: response.data.data.sims[0].iccid,
        qrCode: response.data.data.sims[0].qrcode,
        smdpAddress: response.data.data.sims[0].lpa,
        activationCode: response.data.data.sims[0].matching_id,
        status: 'INACTIVE',
      } : undefined,
    };
  }

  async getOrderStatus(orderId: string): Promise<OrderStatus> {
    const response = await axios.get(`${this.baseUrl}/orders/${orderId}`, {
      headers: { 'Authorization': `Bearer ${this.apiKey}` },
    });

    return {
      orderId: response.data.data.id,
      status: response.data.data.status,
      createdAt: new Date(response.data.data.created_at),
      updatedAt: new Date(response.data.data.updated_at),
    };
  }

  async activateESIM(esimId: string): Promise<ActivationResponse> {
    return {
      success: true,
      activationCode: esimId,
    };
  }

  async getESIMDetails(esimId: string): Promise<ESIMDetails> {
    const response = await axios.get(`${this.baseUrl}/sims/${esimId}`, {
      headers: { 'Authorization': `Bearer ${this.apiKey}` },
    });

    const sim = response.data.data;
    return {
      iccid: sim.iccid,
      qrCode: sim.qrcode,
      smdpAddress: sim.lpa,
      activationCode: sim.matching_id,
      status: sim.status,
    };
  }

  async getUsageData(esimId: string): Promise<UsageData> {
    const response = await axios.get(`${this.baseUrl}/sims/${esimId}/usage`, {
      headers: { 'Authorization': `Bearer ${this.apiKey}` },
    });

    return {
      dataUsed: response.data.data.data_usage_mb,
      dataTotal: response.data.data.data_limit_mb,
      validUntil: new Date(response.data.data.expires_at),
    };
  }

  async healthCheck(): Promise<HealthStatus> {
    const start = Date.now();
    try {
      await axios.get(`${this.baseUrl}/countries`, {
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