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
export class AiraloAdapter extends BaseProviderAdapter {
  constructor(private configService: ConfigService) {
    super(
      'Airalo',
      configService.get('AIRALO_BASE_URL') || 'https://sandbox-api.airalo.com/v2',
      configService.get('AIRALO_API_KEY') || '',
    );
  }

  async searchPackages(filters: PackageFilters): Promise<Package[]> {
    // TODO: Implement actual API call
    this.logger.log(`Searching packages with filters: ${JSON.stringify(filters)}`);
    return [];
  }

  async getPackageDetails(packageId: string): Promise<Package> {
    // TODO: Implement actual API call
    throw new Error('Method not implemented.');
  }

  async createOrder(orderData: CreateOrderDto): Promise<Order> {
    // TODO: Implement actual API call
    throw new Error('Method not implemented.');
  }

  async getOrderStatus(orderId: string): Promise<OrderStatus> {
    // TODO: Implement actual API call
    throw new Error('Method not implemented.');
  }

  async activateESIM(esimId: string): Promise<ActivationResult> {
    // TODO: Implement actual API call
    throw new Error('Method not implemented.');
  }

  async getESIMDetails(esimId: string): Promise<ESIMDetails> {
    // TODO: Implement actual API call
    throw new Error('Method not implemented.');
  }

  async getQRCode(esimId: string): Promise<string> {
    // TODO: Implement actual API call
    throw new Error('Method not implemented.');
  }
}