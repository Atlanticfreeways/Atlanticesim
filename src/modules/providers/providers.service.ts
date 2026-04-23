import { Injectable, Logger, OnModuleInit, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { PrismaService } from '../../config/prisma.service';
import { AiraloAdapter } from './adapters/airalo.adapter';
import { MayaMobileAdapter } from './adapters/maya-mobile.adapter';
import { EsimCardAdapter } from './adapters/esimcard.adapter';
import { BreezeAdapter } from './adapters/breeze.adapter';
import { HolaflyAdapter } from './adapters/holafly.adapter';
import { IProviderAdapter } from '../../common/interfaces/provider.interface';
import { EsimGoAdapter } from './adapters/esim-go.adapter';
import { ProviderHealthService } from './provider-health.service';

@Injectable()
export class ProvidersService implements OnModuleInit {
  private readonly logger = new Logger(ProvidersService.name);
  private adapters: Map<string, IProviderAdapter> = new Map();

  constructor(
    private prisma: PrismaService,
    private healthService: ProviderHealthService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private airaloAdapter: AiraloAdapter,
    private esimGoAdapter: EsimGoAdapter,
    private mayaMobileAdapter: MayaMobileAdapter,
    private esimcardAdapter: EsimCardAdapter,
    private breezeAdapter: BreezeAdapter,
    private holaflyAdapter: HolaflyAdapter,
  ) {
    this.adapters.set('airalo', airaloAdapter);
    this.adapters.set('esim-go', esimGoAdapter);
    this.adapters.set('maya-mobile', mayaMobileAdapter);
    this.adapters.set('esimcard', esimcardAdapter);
    this.adapters.set('breeze', breezeAdapter);
    this.adapters.set('holafly', holaflyAdapter);
  }

  async onModuleInit() {
    // Register all adapters with health service
    this.healthService.registerAdapter('airalo', 'Airalo', this.airaloAdapter);
    this.healthService.registerAdapter('esim-go', 'eSIM Go', this.esimGoAdapter);
    this.healthService.registerAdapter('maya-mobile', 'Maya Mobile', this.mayaMobileAdapter);
    this.healthService.registerAdapter('esimcard', 'eSIMCard', this.esimcardAdapter);
    this.healthService.registerAdapter('breeze', 'Breeze', this.breezeAdapter);
    this.healthService.registerAdapter('holafly', 'Holafly', this.holaflyAdapter);

    this.logger.log('All provider adapters registered with health monitoring');
  }

  getAdapter(providerId: string): IProviderAdapter {
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
    return adapter.checkHealth();
  }

  /**
   * Search packages from all healthy providers
   * Automatically filters out unhealthy providers to prevent cascading failures
   */
  async searchFromAllProviders(filters: any): Promise<any[]> {
    // 1. Deterministic Cache Key Generation
    const cacheKey = `packages:search:${JSON.stringify(filters)}`;
    const cachedPackages = await this.cacheManager.get<any[]>(cacheKey);

    if (cachedPackages) {
      this.logger.debug(`[CACHE HIT] Returning ${cachedPackages.length} packages from cache for key: ${cacheKey}`);
      return cachedPackages;
    }

    this.logger.debug(`[CACHE MISS] Fetching fresh packages for key: ${cacheKey}`);

    // Get only healthy provider IDs
    const healthyProviderIds = this.healthService.getHealthyProviderIds();

    if (healthyProviderIds.length === 0) {
      this.logger.warn('⚠️  No healthy providers available for search');
      // Fallback: try all adapters anyway (last resort)
      return this.searchFromAllProvidersUnsafe(filters);
    }

    // Filter adapters to only healthy ones
    const healthyAdapters = healthyProviderIds
      .map(id => this.adapters.get(id))
      .filter(adapter => adapter !== undefined) as IProviderAdapter[];

    this.logger.debug(
      `Searching packages from ${healthyAdapters.length} healthy providers: ${healthyProviderIds.join(', ')}`
    );

    const results = await Promise.allSettled(
      healthyAdapters.map(adapter =>
        Promise.race([
          adapter.searchPackages(filters),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Search timeout')), 15000)
          ),
        ])
      )
    );

    const packages = results.flatMap(result => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        this.logger.warn(`Search failed for a provider: ${result.reason.message}`);
        return [];
      }
    });

    this.logger.log(`Retrieved ${packages.length} packages from ${healthyAdapters.length} providers`);
    
    // 2. AI Smart-Select: Identify Best Value routes
    const smartPackages = this.applySmartSelect(packages);
    
    // Store result in cache (TTL is set globally to 5 minutes)
    await this.cacheManager.set(cacheKey, smartPackages);
    
    return smartPackages;
  }

  /**
   * AI Post-Processor: Flags the cheapest packages in their respective tiers
   */
  private applySmartSelect(packages: any[]): any[] {
    // Tier packages by dataAmount (e.g., 1000MB, 5000MB)
    const tiers: Record<number, any[]> = {};
    
    packages.forEach(pkg => {
      // Normalize to MB for comparison
      const normalizedSize = pkg.dataUnit === 'GB' ? pkg.dataAmount * 1024 : pkg.dataAmount;
      if (!tiers[normalizedSize]) tiers[normalizedSize] = [];
      tiers[normalizedSize].push(pkg);
    });

    // In each tier, find the cheapest price
    Object.keys(tiers).forEach(size => {
      const tierPackages = tiers[Number(size)];
      if (tierPackages.length > 0) {
        const minPrice = Math.min(...tierPackages.map(p => p.wholesalePrice));
        tierPackages.forEach(p => {
          if (p.wholesalePrice === minPrice) p.isBestValue = true;
        });
      }
    });

    return packages;
  }

  /**
   * Fallback search that tries all adapters regardless of health status
   * Used only when no providers are marked as healthy
   */
  private async searchFromAllProvidersUnsafe(filters: any): Promise<any[]> {
    this.logger.warn('🚨 Attempting unsafe search from all providers (health checks bypassed)');

    const allAdapters = Array.from(this.adapters.values());
    const results = await Promise.allSettled(
      allAdapters.map(adapter => adapter.searchPackages(filters))
    );

    return results.flatMap(result =>
      result.status === 'fulfilled' ? result.value : []
    );
  }

  /**
   * Get health status for all providers
   */
  getProvidersHealthStatus() {
    return this.healthService.getAllHealthStatus();
  }
}