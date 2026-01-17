import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ProviderHealthService } from './provider-health.service';

@ApiTags('Provider Health')
@Controller('providers/health')
export class ProviderHealthController {
    constructor(private healthService: ProviderHealthService) { }

    @ApiOperation({ summary: 'Get health status of all providers' })
    @Get()
    getAllHealthStatus() {
        return {
            timestamp: new Date().toISOString(),
            providers: this.healthService.getAllHealthStatus(),
        };
    }

    @ApiOperation({ summary: 'Get health status of a specific provider' })
    @Get(':providerId')
    getProviderHealth(@Param('providerId') providerId: string) {
        const status = this.healthService.getProviderHealthStatus(providerId);

        if (!status) {
            return {
                error: 'Provider not found',
                providerId,
            };
        }

        return {
            timestamp: new Date().toISOString(),
            ...status,
        };
    }

    @ApiOperation({ summary: 'Manually trigger health check for a provider' })
    @Get(':providerId/check')
    async checkProvider(@Param('providerId') providerId: string) {
        const result = await this.healthService.checkProvider(providerId);

        if (!result) {
            return {
                error: 'Provider not found or check failed',
                providerId,
            };
        }

        return {
            timestamp: new Date().toISOString(),
            ...result,
        };
    }
}
