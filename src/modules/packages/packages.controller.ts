import { Controller, Get, Query, Param, UseGuards, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PackagesService } from './packages.service';
import { SearchPackagesDto } from './dto/search-packages.dto';

@ApiTags('Packages')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('packages')
export class PackagesController {
  constructor(private packagesService: PackagesService) { }

  @ApiOperation({ summary: 'Search packages' })
  @Get()
  async searchPackages(@Query() query: SearchPackagesDto) {
    const filters = {
      countries: query.countries ? query.countries.split(',') : undefined,
      minData: query.minData,
      maxPrice: query.maxPrice,
      hasVoice: query.hasVoice,
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