import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../config/prisma.service';
import { ProvidersService } from '../providers/providers.service';
import { WebhookDispatcherService } from '../partners/webhook-dispatcher.service';
import { ESimStatus } from '@prisma/client';

@Injectable()
export class UsageSyncService {
  private readonly logger = new Logger(UsageSyncService.name);
  private readonly BATCH_SIZE = 10;

  constructor(
    private prisma: PrismaService,
    private providersService: ProvidersService,
    private webhookDispatcher: WebhookDispatcherService,
  ) {}

  @Cron('0 */6 * * *')
  async syncAllUsage() {
    this.logger.log('Starting usage sync for all active eSIMs...');

    const fourHoursAgo = new Date(Date.now() - 4 * 3600000);
    const esims = await this.prisma.eSim.findMany({
      where: {
        status: ESimStatus.ACTIVE,
        OR: [
          { lastUsageCheck: null },
          { lastUsageCheck: { lt: fourHoursAgo } },
        ],
      },
      include: { provider: true },
    });

    if (esims.length === 0) {
      this.logger.log('No eSIMs due for usage sync');
      return { synced: 0, errors: 0 };
    }

    // Group by provider
    const byProvider = new Map<string, typeof esims>();
    for (const esim of esims) {
      const slug = esim.provider.slug;
      if (!byProvider.has(slug)) byProvider.set(slug, []);
      byProvider.get(slug)!.push(esim);
    }

    let synced = 0;
    let errors = 0;

    for (const [slug, providerEsims] of byProvider) {
      try {
        const adapter = this.providersService.getAdapter(slug);

        for (let i = 0; i < providerEsims.length; i += this.BATCH_SIZE) {
          const batch = providerEsims.slice(i, i + this.BATCH_SIZE);
          const results = await Promise.allSettled(
            batch.map(async (esim) => {
              const details = await adapter.getESIMDetails(esim.iccid);
              const dataUsed = details.dataTotal && details.dataRemaining !== undefined
                ? Math.max(0, details.dataTotal - details.dataRemaining)
                : esim.dataUsed;

              await this.prisma.$transaction([
                this.prisma.usageUpdate.create({
                  data: { esimId: esim.id, dataUsed },
                }),
                this.prisma.eSim.update({
                  where: { id: esim.id },
                  data: {
                    dataUsed,
                    validUntil: details.expiresAt,
                    lastUsageCheck: new Date(),
                  },
                }),
              ]);

              // Dispatch webhook at 80% usage
              if (esim.dataTotal > 0) {
                const percentUsed = (dataUsed / esim.dataTotal) * 100;
                const prevPercent = (esim.dataUsed / esim.dataTotal) * 100;
                if (percentUsed >= 80 && prevPercent < 80) {
                  this.webhookDispatcher.dispatch(esim.userId, 'esim.usage.warning', {
                    esimId: esim.id,
                    iccid: esim.iccid,
                    dataUsed,
                    dataTotal: esim.dataTotal,
                    percentUsed: Math.round(percentUsed),
                  }).catch(err => this.logger.warn(`Webhook dispatch failed: ${err.message}`));
                }
              }
            }),
          );

          synced += results.filter(r => r.status === 'fulfilled').length;
          errors += results.filter(r => r.status === 'rejected').length;

          if (i + this.BATCH_SIZE < providerEsims.length) {
            await new Promise(r => setTimeout(r, 2000));
          }
        }
      } catch (error) {
        this.logger.error(`Usage sync failed for provider ${slug}: ${error.message}`);
        errors += providerEsims.length;
      }
    }

    this.logger.log(`Usage sync complete: ${synced} synced, ${errors} errors`);
    return { synced, errors };
  }
}
