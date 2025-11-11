import { Controller, Get, Post, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { EsimsService } from './esims.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('eSIMs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('esims')
export class EsimsController {
  constructor(private esimsService: EsimsService) {}

  @ApiOperation({ summary: 'Get user eSIMs' })
  @Get()
  async getUserEsims(@Request() req) {
    return this.esimsService.getUserEsims(req.user.userId);
  }

  @ApiOperation({ summary: 'Get eSIM details' })
  @Get(':id')
  async getEsimById(@Param('id') id: string, @Request() req) {
    return this.esimsService.getEsimById(id, req.user.userId);
  }

  @ApiOperation({ summary: 'Get QR code' })
  @Get(':id/qr')
  async getQrCode(@Param('id') id: string, @Request() req) {
    return this.esimsService.getQrCode(id, req.user.userId);
  }

  @ApiOperation({ summary: 'Get usage data' })
  @Get(':id/usage')
  async getUsageData(@Param('id') id: string, @Request() req) {
    return this.esimsService.getUsageData(id, req.user.userId);
  }

  @ApiOperation({ summary: 'Activate eSIM' })
  @Post(':id/activate')
  async activateEsim(@Param('id') id: string, @Request() req) {
    return this.esimsService.activateEsim(id, req.user.userId);
  }
}