import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { ProvidersService } from '../providers/providers.service';
import { PackageFilters } from '../../common/interfaces/provider.interface';

@Injectable()
export class PackagesService {
  constructor(
    private prisma: PrismaService,
    private providersService: ProvidersService,
  ) { }

  async searchPackages(filters: PackageFilters) {
    const providers = await this.providersService.getAllProviders();
    const allPackages = [];

    for (const provider of providers) {
      try {
        const adapter = this.providersService.getAdapter(provider.slug);
        const packages = await adapter.searchPackages(filters);

        const enrichedPackages = packages.map(pkg => ({
          ...pkg,
          providerId: provider.id,
          providerName: provider.name,
        }));

        allPackages.push(...enrichedPackages);
      } catch (error) {
        console.error(`Error fetching packages from ${provider.name}:`, error.message);
      }
    }

    return allPackages.sort((a, b) => a.price - b.price);
  }

  async getPackageDetails(packageId: string, providerId: string) {
    const adapter = this.providersService.getAdapter(providerId);
    return adapter.getPackageDetails(packageId);
  }

  async comparePackages(packageIds: string[]) {
    // Implementation for package comparison
    return { message: 'Package comparison feature coming soon' };
  }
}