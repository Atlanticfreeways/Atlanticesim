import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { ProviderHealthService } from './provider-health.service';
import { PackageType } from '@prisma/client';
import { getRegion } from '../../common/utils/country-regions';

@Injectable()
export class ProviderRouterService {
  private readonly logger = new Logger(ProviderRouterService.name);

  constructor(
    private prisma: PrismaService,
    private healthService: ProviderHealthService,
  ) {}

  async resolveOptimalProvider(
    country?: string,
    packageType?: string,
    excludeSlugs: string[] = [],
  ): Promise<string> {
    const healthyIds = this.healthService.getHealthyProviderIds()
      .filter(id => !excludeSlugs.includes(id));

    if (healthyIds.length === 0) {
      throw new Error('No healthy providers available');
    }

    const providers = await this.prisma.provider.findMany({
      where: {
        slug: { in: healthyIds },
        isActive: true,
      },
      orderBy: { priority: 'asc' },
    });

    if (providers.length === 0) {
      throw new Error('No active providers available');
    }

    let candidates = providers;

    // Filter by supportedPackageTypes if specified
    if (packageType) {
      const filtered = candidates.filter(p =>
        p.supportedPackageTypes.length === 0 ||
        p.supportedPackageTypes.includes(packageType as PackageType),
      );
      if (filtered.length > 0) candidates = filtered;
    }

    // Boost providers whose preferredRegions match the country's region
    if (country) {
      const region = getRegion(country);
      if (region) {
        const regionMatch = candidates.filter(p =>
          p.preferredRegions.includes(region),
        );
        if (regionMatch.length > 0) candidates = regionMatch;
      }
    }

    const selected = candidates[0];
    this.logger.log(`Routed to provider: ${selected.slug} (priority=${selected.priority})`);
    return selected.slug;
  }
}
