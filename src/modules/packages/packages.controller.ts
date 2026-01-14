import { Controller, Get, Query, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { PackagesService } from './packages.service';

@ApiTags('Packages')
@Controller('packages')
export class PackagesController {
  constructor(private packagesService: PackagesService) {}

  @ApiOperation({ summary: 'Search packages' })
  @ApiQuery({ name: 'countries', required: false, type: String })
  @ApiQuery({ name: 'minData', required: false, type: Number })
  @ApiQuery({ name: 'maxPrice', required: false, type: Number })
  @Get()
  async searchPackages(
    @Query('countries') countries?: string,
    @Query('minData') minData?: number,
    @Query('maxPrice') maxPrice?: number,
    @Query('hasVoice') hasVoice?: boolean,
  ) {
    const filters = {
      countries: countries ? countries.split(',') : undefined,
      minData,
      maxPrice,
      hasVoice,
    };
    
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