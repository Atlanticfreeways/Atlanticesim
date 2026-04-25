import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../config/prisma.service';

export interface AlertConfig {
  name: string;
  condition: string;
  threshold: number;
  severity: 'info' | 'warning' | 'critical';
  window: number; // minutes
}

export interface MonitoringMetrics {
  syncDuration: number;
  syncSuccessRate: number;
  packageCount: number;
  queryLatencyP95: number;
  fupCoverage: number;
  providerHealthScores: Record<string, number>;
  cacheHitRate: number;
  errorRate: number;
}

@Injectable()
export class MonitoringServiceEnhanced {
  private readonly logger = new Logger(MonitoringServiceEnhanced.name);

  private readonly alertConfigs: AlertConfig[] = [
    {
      name: 'sync_duration_exceeded',
      condition: 'syncDurationMs > 600000',
      threshold: 600000,
      severity: 'warning',
      window: 60,
    },
    {
      name: 'sync_failure',
      condition: 'syncCompletedAt is null after 30 minutes',
      threshold: 30,
      severity: 'critical',
      window: 30,
    },
    {
      name: 'package_count_anomaly',
      condition: 'abs(current_count - avg_count) > 20%',
      threshold: 20,
      severity: 'warning',
      window: 360,
    },
    {
      name: 'query_latency_high',
      condition: 'p95_latency > 500ms',
      threshold: 500,
      severity: 'warning',
      window: 5,
    },
    {
      name: 'fup_coverage_low',
      condition: 'fup_coverage < 75%',
      threshold: 75,
      severity: 'warning',
      window: 60,
    },
    {
      name: 'provider_health_degraded',
      condition: 'healthScore < 0.5',
      threshold: 0.5,
      severity: 'critical',
      window: 5,
    },
    {
      name: 'data_freshness_stale',
      condition: 'max(last_sync_at) > 7 hours',
      threshold: 420,
      severity: 'critical',
      window: 60,
    },
    {
      name: 'error_rate_high',
      condition: 'error_rate > 1%',
      threshold: 1,
      severity: 'warning',
      window: 5,
    },
    {
      name: 'cache_hit_rate_low',
      condition: 'cache_hit_rate < 50%',
      threshold: 50,
      severity: 'info',
      window: 60,
    },
  ];

  constructor(private prisma: PrismaService) {}

  /**
   * Get current monitoring metrics
   */
  async getMetrics(): Promise<MonitoringMetrics> {
    const [syncMetrics, packageMetrics, providerMetrics] = await Promise.all([
      this.getSyncMetrics(),
      this.getPackageMetrics(),
      this.getProviderMetrics(),
    ]);

    return {
      syncDuration: syncMetrics.avgDuration,
      syncSuccessRate: syncMetrics.successRate,
      packageCount: packageMetrics.totalCount,
      queryLatencyP95: 0, // Would be populated from APM
      fupCoverage: packageMetrics.fupCoverage,
      providerHealthScores: providerMetrics.healthScores,
      cacheHitRate: 0, // Would be populated from cache manager
      errorRate: syncMetrics.errorRate,
    };
  }

  /**
   * Check if any alerts should be triggered
   */
  async checkAlerts(): Promise<AlertConfig[]> {
    const metrics = await this.getMetrics();
    const triggeredAlerts: AlertConfig[] = [];

    for (const alert of this.alertConfigs) {
      const shouldTrigger = this.evaluateAlert(alert, metrics);
      if (shouldTrigger) {
        triggeredAlerts.push(alert);
        this.logger.warn(`ALERT: ${alert.name} (${alert.severity})`);
      }
    }

    return triggeredAlerts;
  }

  private async getSyncMetrics() {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const syncs = await this.prisma.syncHistory.findMany({
      where: { syncStartedAt: { gte: oneHourAgo } },
    });

    const completedSyncs = syncs.filter((s) => s.syncCompletedAt);
    const failedSyncs = syncs.filter((s) => !s.syncCompletedAt || s.errorMessage);

    const avgDuration =
      completedSyncs.length > 0
        ? completedSyncs.reduce((sum, s) => sum + (s.syncDurationMs || 0), 0) /
          completedSyncs.length
        : 0;

    const successRate =
      syncs.length > 0 ? ((syncs.length - failedSyncs.length) / syncs.length) * 100 : 100;

    const totalFailed = syncs.reduce((sum, s) => sum + (s.packagesFailed || 0), 0);
    const totalSynced = syncs.reduce((sum, s) => sum + (s.packagesSynced || 0), 0);
    const errorRate = totalSynced > 0 ? (totalFailed / totalSynced) * 100 : 0;

    return { avgDuration, successRate, errorRate };
  }

  private async getPackageMetrics() {
    const [totalCount, fupCount] = await Promise.all([
      this.prisma.package.count({ where: { isActive: true } }),
      this.prisma.package.count({
        where: { isActive: true, fairUsageNote: { not: null } },
      }),
    ]);

    const fupCoverage = totalCount > 0 ? (fupCount / totalCount) * 100 : 0;

    return { totalCount, fupCoverage };
  }

  private async getProviderMetrics() {
    const providers = await this.prisma.providerHealth.findMany();

    const healthScores: Record<string, number> = {};
    for (const provider of providers) {
      healthScores[provider.providerId] = Number(provider.healthScore);
    }

    return { healthScores };
  }

  private evaluateAlert(alert: AlertConfig, metrics: MonitoringMetrics): boolean {
    switch (alert.name) {
      case 'sync_duration_exceeded':
        return metrics.syncDuration > alert.threshold;

      case 'fup_coverage_low':
        return metrics.fupCoverage < alert.threshold;

      case 'query_latency_high':
        return metrics.queryLatencyP95 > alert.threshold;

      case 'error_rate_high':
        return metrics.errorRate > alert.threshold;

      case 'cache_hit_rate_low':
        return metrics.cacheHitRate < alert.threshold;

      case 'provider_health_degraded':
        return Object.values(metrics.providerHealthScores).some(
          (score) => score < alert.threshold,
        );

      default:
        return false;
    }
  }

  /**
   * Get alert configurations
   */
  getAlertConfigs(): AlertConfig[] {
    return this.alertConfigs;
  }
}
