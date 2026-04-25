import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { Cron } from '@nestjs/schedule';

export interface ProviderHealthMetrics {
  providerId: string;
  healthScore: number;
  latencyMs: number;
  errorRate: number;
  isDegraded: boolean;
  consecutiveFailures: number;
}

@Injectable()
export class ProviderHealthServiceEnhanced {
  private readonly logger = new Logger(ProviderHealthServiceEnhanced.name);
  private readonly healthCache = new Map<string, ProviderHealthMetrics>();

  constructor(private prisma: PrismaService) {}

  /**
   * Record a successful provider call
   */
  async recordSuccess(providerId: string, latencyMs: number): Promise<void> {
    const health = await this.prisma.providerHealth.upsert(
      {
        where: { providerId },
        update: {
          healthScore: { increment: 0.05 },
          latencyMs,
          consecutiveFailures: 0,
          isDegraded: false,
          lastCheckAt: new Date(),
        },
        create: {
          providerId,
          healthScore: 1.0,
          latencyMs,
          lastCheckAt: new Date(),
        },
      },
    );

    // Cap health score at 1.0
    if (Number(health.healthScore) > 1.0) {
      await this.prisma.providerHealth.update({
        where: { providerId },
        data: { healthScore: 1.0 },
      });
    }

    this.healthCache.set(providerId, this.mapToMetrics(health));
  }

  /**
   * Record a failed provider call
   */
  async recordFailure(providerId: string, error?: string): Promise<void> {
    const health = await this.prisma.providerHealth.upsert(
      {
        where: { providerId },
        update: {
          healthScore: { decrement: 0.1 },
          consecutiveFailures: { increment: 1 },
          isDegraded: true,
          lastCheckAt: new Date(),
        },
        create: {
          providerId,
          healthScore: 0.9,
          consecutiveFailures: 1,
          isDegraded: true,
          lastCheckAt: new Date(),
        },
      },
    );

    // Floor health score at 0.0
    if (Number(health.healthScore) < 0.0) {
      await this.prisma.providerHealth.update({
        where: { providerId },
        data: { healthScore: 0.0 },
      });
    }

    this.healthCache.set(providerId, this.mapToMetrics(health));

    if (health.consecutiveFailures >= 3) {
      this.logger.warn(
        `Provider ${providerId} has ${health.consecutiveFailures} consecutive failures`,
      );
    }
  }

  /**
   * Get health metrics for a provider
   */
  async getHealth(providerId: string): Promise<ProviderHealthMetrics | null> {
    const cached = this.healthCache.get(providerId);
    if (cached) return cached;

    const health = await this.prisma.providerHealth.findUnique({
      where: { providerId },
    });

    if (!health) return null;

    const metrics = this.mapToMetrics(health);
    this.healthCache.set(providerId, metrics);
    return metrics;
  }

  /**
   * Get all healthy provider IDs (health score > 0.5)
   */
  async getHealthyProviderIds(): Promise<string[]> {
    const healthyProviders = await this.prisma.providerHealth.findMany({
      where: { healthScore: { gt: 0.5 } },
      select: { providerId: true },
    });

    return healthyProviders.map((p) => p.providerId);
  }

  /**
   * Get providers ranked by health score (best first)
   */
  async getRankedProviders(): Promise<ProviderHealthMetrics[]> {
    const providers = await this.prisma.providerHealth.findMany({
      orderBy: { healthScore: 'desc' },
    });

    return providers.map((p) => this.mapToMetrics(p));
  }

  /**
   * Check if provider is degraded
   */
  async isDegraded(providerId: string): Promise<boolean> {
    const health = await this.getHealth(providerId);
    return health?.isDegraded ?? false;
  }

  /**
   * Periodic health check (every 30 minutes)
   */
  @Cron('0 */30 * * * *')
  async periodicHealthCheck(): Promise<void> {
    this.logger.debug('Running periodic provider health check');

    // Reset consecutive failures for providers with no recent errors
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

    await this.prisma.providerHealth.updateMany({
      where: {
        lastCheckAt: { lt: thirtyMinutesAgo },
        consecutiveFailures: { gt: 0 },
      },
      data: {
        consecutiveFailures: 0,
        isDegraded: false,
      },
    });

    // Clear cache to force refresh
    this.healthCache.clear();
  }

  /**
   * Get error rate for a provider (from sync history)
   */
  async getErrorRate(providerId: string, windowMinutes = 60): Promise<number> {
    const since = new Date(Date.now() - windowMinutes * 60 * 1000);

    const syncs = await this.prisma.syncHistory.findMany({
      where: {
        providerId,
        syncStartedAt: { gte: since },
      },
    });

    if (syncs.length === 0) return 0;

    const failedSyncs = syncs.filter((s) => s.packagesFailed > 0).length;
    return (failedSyncs / syncs.length) * 100;
  }

  private mapToMetrics(health: any): ProviderHealthMetrics {
    return {
      providerId: health.providerId,
      healthScore: Number(health.healthScore),
      latencyMs: health.latencyMs || 0,
      errorRate: Number(health.errorRate),
      isDegraded: health.isDegraded,
      consecutiveFailures: health.consecutiveFailures,
    };
  }
}
