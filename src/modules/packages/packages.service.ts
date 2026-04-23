import { Injectable, NotFoundException, BadRequestException, Inject, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { PrismaService } from '../../config/prisma.service';
import { ProvidersService } from '../providers/providers.service';
import { PricingService } from './pricing.service';
import { PackageFilters, Package } from '../../common/interfaces/provider.interface';
import { Prisma } from '@prisma/client';

@Injectable()
export class PackagesService {
  private readonly logger = new Logger(PackagesService.name);

  constructor(
    private prisma: PrismaService,
    private providersService: ProvidersService,
    private pricingService: PricingService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async searchPackages(filters: any): Promise<any[]> {
    const cacheKey = `packages:search:${JSON.stringify(filters)}`;
    const cached = await this.cacheManager.get<any[]>(cacheKey);
    if (cached) return cached;

    // DB-first search
    const dbResults = await this.searchFromDB(filters);

    if (dbResults.length > 0) {
      this.logger.debug(`DB-first: returning ${dbResults.length} packages`);
      await this.cacheManager.set(cacheKey, dbResults, 300000);
      return dbResults;
    }

    // Live fallback
    this.logger.log('DB empty for filters, falling back to live search');
    const liveResults = await this.searchLive(filters);
    if (liveResults.length > 0) {
      await this.cacheManager.set(cacheKey, liveResults, 300000);
    }
    return liveResults;
  }

  private async searchFromDB(filters: any): Promise<any[]> {
    const where: Prisma.PackageWhereInput = { isActive: true };

    if (filters.countries) {
      const codes = Array.isArray(filters.countries) ? filters.countries : [filters.countries];
      where.countries = { hasSome: codes };
    }
    if (filters.packageType) where.packageType = filters.packageType;
    if (filters.scopeType) where.scopeType = filters.scopeType;
    if (filters.isUnlimited !== undefined) where.isUnlimited = filters.isUnlimited;
    if (filters.hasVoice !== undefined) where.hasVoice = filters.hasVoice;
    if (filters.hasSms !== undefined) where.hasSms = filters.hasSms;
    if (filters.duration) where.validityDays = filters.duration;
    if (filters.minData || filters.maxData) {
      where.dataAmount = {};
      if (filters.minData) where.dataAmount.gte = filters.minData;
      if (filters.maxData) where.dataAmount.lte = filters.maxData;
    }
    if (filters.minPrice || filters.maxPrice) {
      where.price = {};
      if (filters.minPrice) where.price.gte = filters.minPrice;
      if (filters.maxPrice) where.price.lte = filters.maxPrice;
    }

    const orderBy: Prisma.PackageOrderByWithRelationInput =
      filters.sortBy === 'data' ? { dataAmount: 'desc' } :
      filters.sortBy === 'duration' ? { validityDays: 'desc' } :
      { price: 'asc' };

    const page = filters.page || 1;
    const limit = filters.limit || 50;

    const packages = await this.prisma.package.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: { provider: true },
    });

    return Promise.all(packages.map(async (pkg) => {
      const wholesale = Number(pkg.price);
      const retailPrice = await this.pricingService.calculateRetailPrice(wholesale, pkg.providerId, pkg.id);
      return {
        id: pkg.providerPackageId,
        providerId: pkg.provider.slug,
        providerName: pkg.provider.name,
        title: pkg.name,
        description: pkg.description,
        country: pkg.countries[0] || '',
        dataAmount: pkg.dataAmount,
        dataUnit: pkg.dataUnit,
        duration: pkg.validityDays,
        wholesalePrice: wholesale,
        retailPrice: this.pricingService.formatPrice(retailPrice),
        price: this.pricingService.formatPrice(retailPrice),
        currency: pkg.currency,
        coverage: pkg.countries,
        isActive: pkg.isActive,
        meta: {
          packageType: pkg.packageType,
          scopeType: pkg.scopeType,
          voiceMinutes: pkg.voiceMinutes,
          smsCount: pkg.smsCount,
          isUnlimited: pkg.isUnlimited,
        },
      };
    }));
  }

  private async searchLive(filters: any): Promise<any[]> {
    const rawPackages = await this.providersService.searchFromAllProviders(filters);
    const packages = await Promise.all(
      rawPackages.map(async (pkg) => {
        const retailPrice = await this.pricingService.calculateRetailPrice(pkg.wholesalePrice, pkg.providerId, pkg.id);
        return {
          ...pkg,
          retailPrice: this.pricingService.formatPrice(retailPrice),
          price: this.pricingService.formatPrice(retailPrice),
        };
      }),
    );
    return packages.sort((a, b) => a.retailPrice - b.retailPrice);
  }

  async getPackageDetails(packageId: string, providerId: string): Promise<Package> {
    if (!providerId) {
      throw new BadRequestException('providerId query parameter is required');
    }

    const cacheKey = `package:${providerId}:${packageId}`;
    const cached = await this.cacheManager.get<Package>(cacheKey);
    if (cached) return cached;

    try {
      const adapter = this.providersService.getAdapter(providerId);
      const pkg = await adapter.getPackageDetails(packageId);
      if (!pkg) throw new NotFoundException(`Package with ID ${packageId} not found`);

      const retailPrice = await this.pricingService.calculateRetailPrice(pkg.wholesalePrice, providerId, packageId);
      const detailedPkg = {
        ...pkg,
        retailPrice: this.pricingService.formatPrice(retailPrice),
        price: this.pricingService.formatPrice(retailPrice),
      };

      await this.cacheManager.set(cacheKey, detailedPkg, 300000);
      return detailedPkg;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;
      this.logger.error(`Failed to get package details: ${error.message}`);
      throw new NotFoundException(`Package with ID ${packageId} not found or provider unavailable`);
    }
  }

  async comparePackages(packageIds: string[]) {
    return { message: 'Package comparison feature coming soon' };
  }
}
