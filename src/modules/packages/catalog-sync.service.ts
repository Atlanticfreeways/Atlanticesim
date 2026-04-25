import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../config/prisma.service';
import { ProvidersService } from '../providers/providers.service';
import { ProviderHealthService } from '../providers/provider-health.service';
import { PackageClassifier } from '../../common/utils/package-classifier.util';

@Injectable()
export class CatalogSyncService {
  private readonly logger = new Logger(CatalogSyncService.name);

  constructor(
    private prisma: PrismaService,
    private providersService: ProvidersService,
    private healthService: ProviderHealthService,
  ) {}

  // Changed from daily (0 3 * * *) to 6-hour intervals (0 */6 * * *)
  // Runs at: 00:00, 06:00, 12:00, 18:00 UTC
  @Cron('0 */6 * * *')
  async syncAll() {
    this.logger.log('Starting 6-hour catalog sync...');
    const healthyIds = this.healthService.getHealthyProviderIds();
    let totalUpserted = 0;
    let totalDeactivated = 0;

    for (const slug of healthyIds) {
      try {
        const result = await this.syncProvider(slug);
        totalUpserted += result.upserted;
        totalDeactivated += result.deactivated;
      } catch (error) {
        this.logger.error(`Sync failed for ${slug}: ${error.message}`);
      }
    }

    this.logger.log(`Catalog sync complete: ${totalUpserted} upserted, ${totalDeactivated} deactivated`);
    return { totalUpserted, totalDeactivated };
  }

  async syncProvider(slug: string): Promise<{ upserted: number; deactivated: number }> {
    this.logger.log(`Syncing catalog for ${slug}...`);
    const adapter = this.providersService.getAdapter(slug);
    const packages = await adapter.searchPackages({});

    const provider = await this.prisma.provider.findUnique({ where: { slug } });
    if (!provider) throw new Error(`Provider ${slug} not found in DB`);

    const syncedIds: string[] = [];

    for (const pkg of packages) {
      const countries = pkg.coverage || [];
      const hasData = pkg.dataAmount > 0;
      const hasVoice = !!(pkg.meta?.voiceMinutes && pkg.meta.voiceMinutes > 0);
      const hasSms = !!(pkg.meta?.smsCount && pkg.meta.smsCount > 0);
      const isUnlimited = !!(pkg.meta?.unlimited || pkg.meta?.is_unlimited);

      const { packageType, scopeType } = PackageClassifier.classify({
        hasData, hasVoice, hasSms, isUnlimited, countries,
      });

      const record = await this.prisma.package.upsert({
        where: {
          providerId_providerPackageId: {
            providerId: provider.id,
            providerPackageId: pkg.id,
          },
        },
        update: {
          name: pkg.title,
          description: pkg.description || '',
          countries,
          dataAmount: Math.round(pkg.dataUnit === 'GB' ? pkg.dataAmount * 1024 : pkg.dataAmount),
          dataUnit: 'MB',
          isUnlimited,
          validityDays: pkg.duration,
          price: pkg.wholesalePrice,
          currency: pkg.currency,
          hasVoice,
          hasSms,
          voiceMinutes: pkg.meta?.voiceMinutes || null,
          smsCount: pkg.meta?.smsCount || null,
          packageType,
          scopeType,
          isActive: true,
          lastSyncedAt: new Date(),
        },
        create: {
          providerId: provider.id,
          providerPackageId: pkg.id,
          name: pkg.title,
          description: pkg.description || '',
          countries,
          dataAmount: Math.round(pkg.dataUnit === 'GB' ? pkg.dataAmount * 1024 : pkg.dataAmount),
          dataUnit: 'MB',
          isUnlimited,
          validityDays: pkg.duration,
          price: pkg.wholesalePrice,
          currency: pkg.currency,
          hasVoice,
          hasSms,
          voiceMinutes: pkg.meta?.voiceMinutes || null,
          smsCount: pkg.meta?.smsCount || null,
          packageType,
          scopeType,
          isActive: true,
          lastSyncedAt: new Date(),
        },
      });

      syncedIds.push(record.id);
    }

    // Deactivate stale packages not returned by provider
    const deactivated = await this.prisma.package.updateMany({
      where: {
        providerId: provider.id,
        isActive: true,
        id: { notIn: syncedIds },
      },
      data: { isActive: false },
    });

    this.logger.log(`${slug}: ${syncedIds.length} upserted, ${deactivated.count} deactivated`);
    return { upserted: syncedIds.length, deactivated: deactivated.count };
  }
}
