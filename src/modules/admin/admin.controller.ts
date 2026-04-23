import { Controller, Get, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private adminService: AdminService) {}

  @ApiOperation({ summary: 'Get dashboard statistics' })
  @Get('dashboard')
  async getDashboard() {
    return this.adminService.getDashboardStats();
  }

  @ApiOperation({ summary: 'Get provider health status' })
  @Get('providers/health')
  async getProviderHealth() {
    return this.adminService.getProviderHealth();
  }

  @ApiOperation({ summary: 'Update provider configuration' })
  @Put('providers/:id/config')
  async updateProviderConfig(
    @Param('id') id: string,
    @Body() config: any,
  ) {
    return this.adminService.updateProviderConfig(id, config);
  }

  @ApiOperation({ summary: 'Get sales analytics' })
  @Get('analytics/sales')
  async getSalesAnalytics(@Query('days') days?: number) {
    return this.adminService.getSalesAnalytics(days ? parseInt(days.toString()) : 30);
  }

  @ApiOperation({ summary: 'Get user analytics' })
  @Get('analytics/users')
  async getUserAnalytics() {
    return this.adminService.getUserAnalytics();
  }

  @ApiOperation({ summary: 'Get current pricing settings' })
  @Get('pricing')
  async getPricing() {
    return this.adminService.getPricingSettings();
  }

  @ApiOperation({ summary: 'Update global pricing margins' })
  @Put('pricing/global')
  async updateGlobalPricing(@Body() data: any) {
    return this.adminService.updateGlobalPricing(data);
  }

  @ApiOperation({ summary: 'Update provider-specific pricing' })
  @Put('pricing/providers/:id')
  async updateProviderPricing(
    @Param('id') id: string,
    @Body() data: any,
  ) {
    return this.adminService.updateProviderPricing(id, data);
  }

  @ApiOperation({ summary: 'Set manual package price override' })
  @Put('pricing/packages/:id')
  async setPackageOverride(
    @Param('id') id: string,
    @Body('retailPrice') retailPrice: number,
  ) {
    return this.adminService.setPackageOverride(id, retailPrice);
  }
}