import { Injectable, NotFoundException, BadRequestException, Inject, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { PrismaService } from '../../config/prisma.service';
import { ProvidersService } from '../providers/providers.service';
import { PackageFilters, Package } from '../../common/interfaces/provider.interface';

@Injectable()
export class PackagesService {
  private readonly logger = new Logger(PackagesService.name);

  constructor(
    private prisma: PrismaService,
    private providersService: ProvidersService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) { }

  async searchPackages(filters: PackageFilters): Promise<Package[]> {
    const cacheKey = `packages:search:${JSON.stringify(filters)}`;
    const cached = await this.cacheManager.get<Package[]>(cacheKey);

    if (cached) {
      this.logger.debug(`Returning ${cached.length} packages from cache`);
      return cached;
    }

    this.logger.log(`Searching packages with filters: ${JSON.stringify(filters)}`);

    // Use robust search from ProvidersService (handles health checks & fallbacks)
    const packages = await this.providersService.searchFromAllProviders(filters);

    // Cache results for 5 minutes
    if (packages.length > 0) {
      await this.cacheManager.set(cacheKey, packages, 300000);
    }

    return packages.sort((a, b) => a.price - b.price);
  }

  async getPackageDetails(packageId: string, providerId: string): Promise<Package> {
    if (!providerId) {
      throw new BadRequestException('providerId query parameter is required');
    }

    const cacheKey = `package:${providerId}:${packageId}`;
    const cached = await this.cacheManager.get<Package>(cacheKey);

    if (cached) {
      return cached;
    }

    try {
      const adapter = this.providersService.getAdapter(providerId);
      const pkg = await adapter.getPackageDetails(packageId);

      if (!pkg) {
        throw new NotFoundException(`Package with ID ${packageId} not found`);
      }

      await this.cacheManager.set(cacheKey, pkg, 300000);
      return pkg;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Failed to get package details: ${error.message}`);
      throw new NotFoundException(`Package with ID ${packageId} not found or provider unavailable`);
    }
  }

  async comparePackages(packageIds: string[]) {
    // Implementation for package comparison
    return { message: 'Package comparison feature coming soon' };
  }
}