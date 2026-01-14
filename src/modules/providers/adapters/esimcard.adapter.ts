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
export class EsimCardAdapter extends BaseProviderAdapter {
  constructor(private configService: ConfigService) {
    super(
      'eSIMCard',
      configService.get('ESIMCARD_API_URL') || 'https://api.esimcard.com',
      configService.get('ESIMCARD_API_KEY') || '',
    );
  }

  async searchPackages(filters: PackageFilters): Promise<Package[]> {
    this.logger.log(`Searching packages with filters: ${JSON.stringify(filters)}`);
    return [];
  }

  async getPackageDetails(packageId: string): Promise<Package> {
    throw new Error('Method not implemented.');
  }

  async createOrder(orderData: CreateOrderDto): Promise<Order> {
    throw new Error('Method not implemented.');
  }

  async getOrderStatus(orderId: string): Promise<OrderStatus> {
    throw new Error('Method not implemented.');
  }

  async activateESIM(esimId: string): Promise<ActivationResult> {
    throw new Error('Method not implemented.');
  }

  async getESIMDetails(esimId: string): Promise<ESIMDetails> {
    throw new Error('Method not implemented.');
  }

  async getQRCode(esimId: string): Promise<string> {
    throw new Error('Method not implemented.');
  }
}