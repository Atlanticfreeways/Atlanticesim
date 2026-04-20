import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiSecurity, ApiResponse } from '@nestjs/swagger';
import { ApiKeyGuard } from '../auth/guards/api-key.guard';
import { ProvidersService } from '../providers/providers.service';
import { Throttle } from '@nestjs/throttler';

@ApiTags('B2B Partner API')
@Controller('partners')
@ApiSecurity('x-api-key')
@UseGuards(ApiKeyGuard)
@Throttle({ default: { limit: 60, ttl: 60000 } }) // B2B endpoints are more forgiving: 60 per min
export class PartnersController {
  constructor(private readonly providersService: ProvidersService) {}

  @ApiOperation({ summary: 'Retrieve aggressive aggregate pricing across eSIM networks' })
  @ApiResponse({ status: 200, description: 'Catalog retrieved' })
  @Get('packages')
  async getPackages(@Query('country') country: string, @Request() req) {
    // Because they logged in via API Token, we know req.user exists and role == BUSINESS_PARTNER
    // The ProvidersService has heavy memory caching so this hit is practically free.
    const filters = country ? { country } : {};
    return this.providersService.searchFromAllProviders(filters);
  }
}
