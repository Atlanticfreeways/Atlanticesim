import { Controller, Get, Query, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PackagesService } from './packages.service';
import { SearchPackagesDto } from './dto/search-packages.dto';

@ApiTags('Packages')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('packages')
export class PackagesController {
  constructor(private packagesService: PackagesService) {}

  @ApiOperation({ summary: 'Search packages' })
  @Get()
  async searchPackages(@Query() query: SearchPackagesDto) {
    const filters: any = {};
    if (query.countries) filters.countries = query.countries.split(',');
    if (query.region) filters.region = query.region;
    if (query.minData !== undefined) filters.minData = query.minData;
    if (query.maxData !== undefined) filters.maxData = query.maxData;
    if (query.minPrice !== undefined) filters.minPrice = query.minPrice;
    if (query.maxPrice !== undefined) filters.maxPrice = query.maxPrice;
    if (query.packageType) filters.packageType = query.packageType;
    if (query.scopeType) filters.scopeType = query.scopeType;
    if (query.isUnlimited !== undefined) filters.isUnlimited = query.isUnlimited;
    if (query.hasVoice !== undefined) filters.hasVoice = query.hasVoice;
    if (query.hasSms !== undefined) filters.hasSms = query.hasSms;
    if (query.duration !== undefined) filters.duration = query.duration;
    if (query.sortBy) filters.sortBy = query.sortBy;
    if (query.page) filters.page = query.page;
    if (query.limit) filters.limit = query.limit;

    return this.packagesService.searchPackages(filters);
  }

  @ApiOperation({ summary: 'Get package details' })
  @Get(':id')
  async getPackageDetails(
    @Param('id') id: string,
    @Query('providerId') providerId: string,
  ) {
    return this.packagesService.getPackageDetails(id, providerId);
  }

  @ApiOperation({ summary: 'Compare packages' })
  @Get('compare')
  async comparePackages(@Query('ids') ids: string) {
    const packageIds = ids.split(',');
    return this.packagesService.comparePackages(packageIds);
  }
}
