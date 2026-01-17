import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../config/prisma.service';
import { IProviderAdapter, ProviderHealth } from '../../common/interfaces/provider.interface';

export interface ProviderHealthStatus {
    providerId: string;
    providerName: string;
    isHealthy: boolean;
    lastCheck: Date;
    lastSuccess?: Date;
    consecutiveFailures: number;
    health?: ProviderHealth;
    error?: string;
}

@Injectable()
export class ProviderHealthService implements OnModuleInit {
    private readonly logger = new Logger(ProviderHealthService.name);
    private healthStatus: Map<string, ProviderHealthStatus> = new Map();
    private adapters: Map<string, IProviderAdapter> = new Map();

    // Configuration
    private readonly MAX_CONSECUTIVE_FAILURES = 3;
    private readonly HEALTH_CHECK_INTERVAL_MS = 60000; // 1 minute
    private readonly DISABLE_THRESHOLD = 5; // Disable after 5 consecutive failures

    constructor(private prisma: PrismaService) { }

    async onModuleInit() {
        this.logger.log('Provider Health Service initialized');
        // Initial health check on startup
        setTimeout(() => this.performHealthChecks(), 5000);
    }

    /**
     * Register a provider adapter for health monitoring
     */
    registerAdapter(providerId: string, providerName: string, adapter: IProviderAdapter) {
        this.adapters.set(providerId, adapter);
        this.healthStatus.set(providerId, {
            providerId,
            providerName,
            isHealthy: true, // Assume healthy until proven otherwise
            lastCheck: new Date(),
            consecutiveFailures: 0,
        });
        this.logger.log(`Registered adapter for health monitoring: ${providerName} (${providerId})`);
    }

    /**
     * Background health check - runs every minute
     */
    @Cron(CronExpression.EVERY_MINUTE)
    async performHealthChecks() {
        this.logger.debug('Starting background health checks for all providers');

        const healthCheckPromises = Array.from(this.adapters.entries()).map(
            async ([providerId, adapter]) => {
                try {
                    const health = await this.checkProviderHealth(providerId, adapter);
                    await this.updateHealthStatus(providerId, health, null);
                } catch (error) {
                    await this.updateHealthStatus(providerId, null, error);
                }
            }
        );

        await Promise.allSettled(healthCheckPromises);

        const healthySummary = Array.from(this.healthStatus.values())
            .filter(s => s.isHealthy).length;
        const totalProviders = this.healthStatus.size;

        this.logger.log(`Health check complete: ${healthySummary}/${totalProviders} providers healthy`);
    }

    /**
     * Check health of a specific provider
     */
    private async checkProviderHealth(
        providerId: string,
        adapter: IProviderAdapter
    ): Promise<ProviderHealth> {
        const startTime = Date.now();

        try {
            const health = await Promise.race([
                adapter.checkHealth(),
                new Promise<never>((_, reject) =>
                    setTimeout(() => reject(new Error('Health check timeout')), 10000)
                ),
            ]);

            return health;
        } catch (error) {
            this.logger.warn(`Health check failed for ${providerId}: ${error.message}`);
            throw error;
        }
    }

    /**
     * Update health status based on check result
     */
    private async updateHealthStatus(
        providerId: string,
        health: ProviderHealth | null,
        error: Error | null
    ) {
        const current = this.healthStatus.get(providerId);
        if (!current) return;

        const now = new Date();
        const isHealthy = health?.isAvailable ?? false;

        const updated: ProviderHealthStatus = {
            ...current,
            lastCheck: now,
            isHealthy,
            health: health || undefined,
            error: error?.message,
        };

        if (isHealthy) {
            updated.consecutiveFailures = 0;
            updated.lastSuccess = now;
        } else {
            updated.consecutiveFailures = current.consecutiveFailures + 1;
        }

        this.healthStatus.set(providerId, updated);

        // Auto-disable provider if it fails too many times
        if (updated.consecutiveFailures >= this.DISABLE_THRESHOLD) {
            await this.disableProvider(providerId, `${this.DISABLE_THRESHOLD} consecutive health check failures`);
        }

        // Log status changes
        if (current.isHealthy !== isHealthy) {
            const status = isHealthy ? '✅ RECOVERED' : '❌ DEGRADED';
            this.logger.warn(
                `Provider ${current.providerName} (${providerId}) status changed: ${status}`
            );
        }
    }

    /**
     * Disable a provider in the database
     */
    private async disableProvider(providerId: string, reason: string) {
        try {
            const provider = await this.prisma.provider.findFirst({
                where: { slug: providerId },
            });

            if (provider && provider.isActive) {
                await this.prisma.provider.update({
                    where: { id: provider.id },
                    data: { isActive: false },
                });

                this.logger.error(
                    `🚨 Provider ${providerId} has been DISABLED due to: ${reason}`
                );
            }
        } catch (error) {
            this.logger.error(`Failed to disable provider ${providerId}: ${error.message}`);
        }
    }

    /**
     * Get current health status for all providers
     */
    getAllHealthStatus(): ProviderHealthStatus[] {
        return Array.from(this.healthStatus.values());
    }

    /**
     * Get health status for a specific provider
     */
    getProviderHealthStatus(providerId: string): ProviderHealthStatus | undefined {
        return this.healthStatus.get(providerId);
    }

    /**
     * Check if a provider is currently healthy
     */
    isProviderHealthy(providerId: string): boolean {
        const status = this.healthStatus.get(providerId);
        return status?.isHealthy ?? false;
    }

    /**
     * Get list of healthy provider IDs
     */
    getHealthyProviderIds(): string[] {
        return Array.from(this.healthStatus.values())
            .filter(status => status.isHealthy)
            .map(status => status.providerId);
    }

    /**
     * Manually trigger health check for a provider
     */
    async checkProvider(providerId: string): Promise<ProviderHealthStatus | null> {
        const adapter = this.adapters.get(providerId);
        if (!adapter) {
            this.logger.warn(`No adapter found for provider: ${providerId}`);
            return null;
        }

        try {
            const health = await this.checkProviderHealth(providerId, adapter);
            await this.updateHealthStatus(providerId, health, null);
        } catch (error) {
            await this.updateHealthStatus(providerId, null, error);
        }

        return this.healthStatus.get(providerId) || null;
    }
}
