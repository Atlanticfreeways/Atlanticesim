import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { AiraloAdapter } from './adapters/airalo.adapter';
import { MayaMobileAdapter } from './adapters/maya-mobile.adapter';
import { EsimcardAdapter } from './adapters/esimcard.adapter';
import { BreezeAdapter } from './adapters/breeze.adapter';
import { HolaflyAdapter } from './adapters/holafly.adapter';
import { ProviderAdapter } from '../../common/interfaces/provider.interface';

@Injectable()
export class ProvidersService {
  private adapters: Map<string, ProviderAdapter> = new Map();

  constructor(
    private prisma: PrismaService,
    private airaloAdapter: AiraloAdapter,
    private mayaMobileAdapter: MayaMobileAdapter,
    private esimcardAdapter: EsimcardAdapter,
    private breezeAdapter: BreezeAdapter,
    private holaflyAdapter: HolaflyAdapter,
  ) {
    this.adapters.set('airalo', airaloAdapter);
    this.adapters.set('maya-mobile', mayaMobileAdapter);
    this.adapters.set('esimcard', esimcardAdapter);
    this.adapters.set('breeze', breezeAdapter);
    this.adapters.set('holafly', holaflyAdapter);
  }

  getAdapter(providerId: string): ProviderAdapter {
    const adapter = this.adapters.get(providerId);
    if (!adapter) {
      throw new Error(`Provider adapter not found: ${providerId}`);
    }
    return adapter;
  }

  async getAllProviders() {
    return this.prisma.provider.findMany({
      where: { isActive: true },
    });
  }

  async getProviderHealth(providerId: string) {
    const adapter = this.getAdapter(providerId);
    return adapter.healthCheck();
  }
}