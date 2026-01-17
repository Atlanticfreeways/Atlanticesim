import { Controller, Get, Injectable } from '@nestjs/common';
import {
    HealthCheck,
    HealthCheckService,
    PrismaHealthIndicator,
    HealthIndicator,
    HealthIndicatorResult,
    HealthCheckError
} from '@nestjs/terminus';
import { ProviderHealthService } from '../providers/provider-health.service';
import { PrismaService } from '../../config/prisma.service';

@Injectable()
export class ProvidersHealthIndicator extends HealthIndicator {
    constructor(private readonly providerHealthService: ProviderHealthService) {
        super();
    }

    async isHealthy(key: string): Promise<HealthIndicatorResult> {
        const healthStatus = this.providerHealthService.getAllHealthStatus();
        const healthyCount = healthStatus.filter(p => p.isHealthy).length;
        // Or check if adapter status returns boolean? Let's assume the previous service returns objects.

        // We consider system "healthy" if at least one provider is up, or maybe we just report status.
        // Let's report status but not fail the whole check unless CRITICAL.
        // Actually, if 0 providers are healthy, it's critical.

        const isHealthy = healthyCount > 0;

        const result = this.getStatus(key, isHealthy, {
            healthyCount,
            totalCount: healthStatus.length,
            status: isHealthy ? 'up' : 'down',
        });

        if (isHealthy) {
            return result;
        }
        // If no providers, we might want to throw error to indicate service degradation
        throw new HealthCheckError('All providers down', result);
    }
}

@Controller('health')
export class HealthController {
    constructor(
        private health: HealthCheckService,
        private db: PrismaHealthIndicator,
        private providersIndicator: ProvidersHealthIndicator,
        private prisma: PrismaService,
    ) { }

    @Get()
    @HealthCheck()
    check() {
        return this.health.check([
            () => this.db.pingCheck('database', this.prisma),
            () => this.providersIndicator.isHealthy('providers'),
        ]);
    }
}
