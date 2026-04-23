import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../config/prisma.service';

@Injectable()
export class DataRetentionService {
  private readonly logger = new Logger(DataRetentionService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * GDPR Article 17 — Right to erasure.
   * Anonymizes all PII for a user while preserving aggregate business data.
   */
  async eraseUserData(userId: string): Promise<{ success: boolean; erasedRecords: number }> {
    this.logger.log(`GDPR erasure request for user ${userId}`);
    let erasedRecords = 0;

    await this.prisma.$transaction(async (tx) => {
      // Anonymize user record
      await tx.user.update({
        where: { id: userId },
        data: {
          email: `deleted-${userId}@erased.local`,
          name: 'DELETED USER',
          phone: null,
          password: 'ERASED',
          isActive: false,
        },
      });
      erasedRecords++;

      // Delete preferences
      const prefs = await tx.userPreferences.deleteMany({ where: { userId } });
      erasedRecords += prefs.count;

      // Revoke API tokens
      const tokens = await tx.apiToken.updateMany({
        where: { userId },
        data: { isActive: false, tokenHash: 'REVOKED' },
      });
      erasedRecords += tokens.count;

      // Delete webhook config
      const webhooks = await tx.webhookConfig.deleteMany({ where: { userId } });
      erasedRecords += webhooks.count;

      // Anonymize partner profile
      await tx.partnerProfile.updateMany({
        where: { userId },
        data: { companyName: 'DELETED', supportEmail: null, logoUrl: null, customDomain: null },
      });

      // Anonymize eSIM QR codes (sensitive activation data)
      await tx.eSim.updateMany({
        where: { userId },
        data: { qrCode: null, activationCode: null, smdpAddress: null },
      });

      this.logger.log(`GDPR erasure complete for ${userId}: ${erasedRecords} records affected`);
    });

    return { success: true, erasedRecords };
  }

  /**
   * GDPR Article 20 — Right to data portability.
   * Exports all user data in a structured JSON format.
   */
  async exportUserData(userId: string): Promise<Record<string, any>> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        preferences: true,
        orders: { include: { package: true, provider: true } },
        esims: true,
        wallet: { include: { transactions: true } },
        partnerProfile: true,
        webhookConfig: true,
      },
    });

    if (!user) return { error: 'User not found' };

    // Strip internal fields
    const { password, ...safeUser } = user;

    return {
      exportDate: new Date().toISOString(),
      gdprArticle: '20 — Data Portability',
      user: safeUser,
    };
  }

  /**
   * Data retention policy — runs weekly.
   * Purges usage snapshots older than 90 days and anonymizes orders older than 2 years.
   */
  @Cron('0 2 * * 0') // Sunday 2 AM
  async enforceRetentionPolicy() {
    this.logger.log('Enforcing data retention policy...');

    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 3600000);
    const twoYearsAgo = new Date(Date.now() - 730 * 24 * 3600000);

    // Purge old usage snapshots (keep 90 days)
    const purgedUsage = await this.prisma.usageUpdate.deleteMany({
      where: { timestamp: { lt: ninetyDaysAgo } },
    });

    // Anonymize very old orders (keep 2 years of identifiable data)
    const oldOrders = await this.prisma.order.updateMany({
      where: {
        createdAt: { lt: twoYearsAgo },
        meta: { not: { path: ['anonymized'], equals: true } },
      },
      data: { meta: { anonymized: true } },
    });

    this.logger.log(
      `Retention policy: ${purgedUsage.count} usage records purged, ${oldOrders.count} orders anonymized`,
    );

    return { purgedUsage: purgedUsage.count, anonymizedOrders: oldOrders.count };
  }
}
