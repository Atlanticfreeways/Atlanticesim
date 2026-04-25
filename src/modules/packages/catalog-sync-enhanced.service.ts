import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from '../../config/prisma.service';
import { ProvidersService } from '../providers/providers.service';
import { ProviderHealthServiceEnhanced } from '../providers/provider-health-enhanced.service';
import { PackageClassifierEnhanced } from '../../common/utils/package-classifier-enhanced.util';

@Injectable()
export class CatalogSyncServiceEnhanced {
  private readonly logger = new Logger(CatalogSyncServiceEnhanced.name);
  private isSyncing = false;

  constructor(
    private prisma: PrismaService,
    private providersService: ProvidersService,
    private healthService: ProviderHealthServiceEnhanced,
  ) {}

  @Cron('0 */6 * * *')
  async syncAll(): Promise<void> {
    if (this.isSyncing) {
      this.logger.warn('Sync already in progress, skipping');
      return;
    }

    this.isSyncing = true;
    const startTime = Date.now();

    try {
      this.logger.log('Starting 6-hour catalog sync...');
      const healthyIds = await this.healthService.getHealthyProviderIds();
      let totalUpserted = 0;
      let totalDeactivated = 0;
      let totalFailed = 0;

      for (const providerId of healthyIds) {
        try {
          const result = await this.syncProvider(providerId);
          totalUpserted += result.upserted;
          totalDeactivated += result.deactivated;
          totalFailed += result.failed;
        } catch (error) {
          this.logger.error(`Sync failed for ${providerId}: ${error.message}`);
          await this.healthService.recordFailure(providerId, error.message);
          totalFailed++;
        }
      }

      const duration = Date.now() - startTime;
      this.logger.log(
        `Catalog sync complete: ${totalUpserted} upserted, ${totalDeactivated} deactivated, ${totalFailed} failed (${duration}ms)`,
      );
    } finally {
      this.isSyncing = false;
    }
  }

  async syncProvider(providerId: string): Promise<{
    upserted: number;
    deactivated: number;
    failed: number;
  }> {
    const syncStartTime = Date.now();
    const syncRecord = await this.prisma.syncHistory.create({
      data: {
        providerId,
        syncStartedAt: new Date(),
      },
    });

    try {
      this.logger.log(`Syncing catalog for ${providerId}...`);
      const adapter = this.providersService.getAdapter(providerId);
      const packages = await adapter.searchPackages({});

      const provider = await this.prisma.provider.findUnique({
        where: { id: providerId },
      });

      if (!provider) throw new Error(`Provider ${providerId} not found in DB`);

      const syncedIds: string[] = [];
      let failedCount = 0;

      for (const pkg of packages) {
        try {
          const classification = PackageClassifierEnhanced.classify({
            hasData: pkg.dataAmount > 0 || pkg.meta?.unlimited,
            hasVoice: !!(pkg.meta?.voiceMinutes && pkg.meta.voiceMinutes > 0),
            hasSms: !!(pkg.meta?.smsCount && pkg.meta.smsCount > 0),
            isUnlimited: !!(pkg.meta?.unlimited || pkg.meta?.is_unlimited),
            countries: pkg.coverage || [],
            dataAmount: pkg.dataAmount,
            voiceMinutes: pkg.meta?.voiceMinutes,
            smsCount: pkg.meta?.smsCount,
            description: pkg.description,
            provider: provider.slug,
          });

          const costPerGb =
            pkg.dataAmount > 0 ? pkg.wholesalePrice / pkg.dataAmount : null;

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
              countries: pkg.coverage || [],
              dataAmount: Math.round(
                pkg.dataUnit === 'GB' ? pkg.dataAmount * 1024 : pkg.dataAmount,
              ),
              dataUnit: 'MB',
              isUnlimited: classification.capabilities.dataScore === 100,
              validityDays: pkg.duration,
              price: new Decimal(pkg.wholesalePrice),
              currency: pkg.currency,
              hasVoice: classification.capabilities.voiceScore > 50,
              hasSms: classification.capabilities.smsScore > 50,
              voiceMinutes: pkg.meta?.voiceMinutes || null,
              smsCount: pkg.meta?.smsCount || null,
              packageType: classification.packageType,
              scopeType: classification.scopeType,
              fairUsageNote: classification.fup.warnings.join('; ') || null,
              throttleAfterGb: classification.fup.throttleAfterGb || null,
              throttleSpeedMbps: classification.fup.throttleSpeedMbps || null,
              costPerGb: costPerGb ? new Decimal(costPerGb) : null,
              providerApiVersion: (provider.config as any)?.apiVersion || null,
              isActive: true,
              lastSyncedAt: new Date(),
              lastSyncError: null,
            },
            create: {
              providerId: provider.id,
              providerPackageId: pkg.id,
              name: pkg.title,
              description: pkg.description || '',
              countries: pkg.coverage || [],
              dataAmount: Math.round(
                pkg.dataUnit === 'GB' ? pkg.dataAmount * 1024 : pkg.dataAmount,
              ),
              dataUnit: 'MB',
              isUnlimited: classification.capabilities.dataScore === 100,
              validityDays: pkg.duration,
              price: new Decimal(pkg.wholesalePrice),
              currency: pkg.currency,
              hasVoice: classification.capabilities.voiceScore > 50,
              hasSms: classification.capabilities.smsScore > 50,
              voiceMinutes: pkg.meta?.voiceMinutes || null,
              smsCount: pkg.meta?.smsCount || null,
              packageType: classification.packageType,
              scopeType: classification.scopeType,
              fairUsageNote: classification.fup.warnings.join('; ') || null,
              throttleAfterGb: classification.fup.throttleAfterGb || null,
              throttleSpeedMbps: classification.fup.throttleSpeedMbps || null,
              costPerGb: costPerGb ? new Decimal(costPerGb) : null,
              providerApiVersion: (provider.config as any)?.apiVersion || null,
              isActive: true,
              lastSyncedAt: new Date(),
            },
          });

          syncedIds.push(record.id);
        } catch (error) {
          this.logger.error(
            `Failed to sync package ${pkg.id} from ${providerId}: ${error.message}`,
          );
          failedCount++;
        }
      }

      // Deactivate stale packages
      const deactivated = await this.prisma.package.updateMany({
        where: {
          providerId: provider.id,
          isActive: true,
          id: { notIn: syncedIds },
        },
        data: { isActive: false },
      });

      const duration = Date.now() - syncStartTime;

      // Update sync history
      await this.prisma.syncHistory.update({
        where: { id: syncRecord.id },
        data: {
          syncCompletedAt: new Date(),
          packagesSynced: syncedIds.length,
          packagesFailed: failedCount,
          syncDurationMs: duration,
        },
      });

      // Record success in health service
      await this.healthService.recordSuccess(providerId, duration);

      this.logger.log(
        `${providerId}: ${syncedIds.length} upserted, ${deactivated.count} deactivated, ${failedCount} failed (${duration}ms)`,
      );

      return {
        upserted: syncedIds.length,
        deactivated: deactivated.count,
        failed: failedCount,
      };
    } catch (error) {
      const duration = Date.now() - syncStartTime;

      await this.prisma.syncHistory.update({
        where: { id: syncRecord.id },
        data: {
          syncCompletedAt: new Date(),
          errorMessage: error.message,
          syncDurationMs: duration,
        },
      });

      await this.healthService.recordFailure(providerId, error.message);
      throw error;
    }
  }
}
