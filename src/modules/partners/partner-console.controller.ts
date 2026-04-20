import { Controller, Get, Post, Put, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WalletService } from './wallet.service';
import { PartnerProfileService } from './partner-profile.service';
import { UserRole } from '@prisma/client';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Partner Console')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.BUSINESS_PARTNER)
@Controller('partners')
export class PartnerConsoleController {
  constructor(
    private readonly walletService: WalletService,
    private readonly profileService: PartnerProfileService,
  ) {}

  @ApiOperation({ summary: 'Get partner wallet balance' })
  @Get('wallet')
  async getWallet(@Request() req) {
    return this.walletService.getWallet(req.user.userId);
  }

  @ApiOperation({ summary: 'Initiate wallet top-up session' })
  @Post('wallet/topup')
  async topUpWallet(@Request() req, @Body('amount') amount: number) {
    // In a real system, this would return a Stripe or Paystack session
    // For now, we simulate a successful deposit for testing the B2B ledger
    return this.walletService.deposit(req.user.userId, amount, 'Manual Balance Top-up');
  }

  @ApiOperation({ summary: 'Get partner profile & branding' })
  @Get('profile')
  async getProfile(@Request() req) {
    return this.profileService.getProfile(req.user.userId);
  }

  @ApiOperation({ summary: 'Update white-label branding' })
  @Put('branding')
  async updateBranding(@Request() req, @Body() brandingDto: { logoUrl: string, primaryColor: string }) {
    return this.profileService.updateBranding(req.user.userId, brandingDto.logoUrl, brandingDto.primaryColor);
  }
}
