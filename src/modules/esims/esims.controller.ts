import { Controller, Get, Post, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { EsimsService } from './esims.service';
import { UsagePredictorService } from './usage-predictor.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PrismaService } from '../../config/prisma.service';
import { UsageDailyResponseDto, UsageSummaryResponseDto } from './dto/usage-response.dto';

@ApiTags('eSIMs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('esims')
export class EsimsController {
  constructor(
    private esimsService: EsimsService,
    private usagePredictor: UsagePredictorService,
    private prisma: PrismaService,
  ) {}

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

  @ApiOperation({ summary: 'Get daily usage breakdown' })
  @ApiResponse({ status: 200, type: [UsageDailyResponseDto] })
  @Get(':id/usage/daily')
  async getUsageDaily(@Param('id') id: string, @Request() req) {
    await this.esimsService.getEsimById(id, req.user.userId); // auth check

    const snapshots = await this.prisma.usageUpdate.findMany({
      where: { esimId: id },
      orderBy: { timestamp: 'asc' },
    });

    const daily = new Map<string, { dataMB: number; count: number }>();
    for (const s of snapshots) {
      const day = s.timestamp.toISOString().split('T')[0];
      if (!daily.has(day)) daily.set(day, { dataMB: 0, count: 0 });
      const entry = daily.get(day)!;
      entry.dataMB = s.dataUsed;
      entry.count++;
    }

    return Array.from(daily.entries()).map(([date, data]) => ({
      date,
      dataUsedMB: data.dataMB,
      snapshots: data.count,
    }));
  }

  @ApiOperation({ summary: 'Get usage summary with depletion predictions' })
  @ApiResponse({ status: 200, type: UsageSummaryResponseDto })
  @Get(':id/usage/summary')
  async getUsageSummary(@Param('id') id: string, @Request() req) {
    const esim = await this.esimsService.getEsimById(id, req.user.userId);
    const predictions = await this.usagePredictor.predictDepletion(id);

    return {
      esimId: id,
      dataUsed: esim.dataUsed,
      dataTotal: esim.dataTotal,
      validUntil: esim.validUntil,
      status: esim.status,
      predictions,
    };
  }

  @ApiOperation({ summary: 'Activate eSIM' })
  @Post(':id/activate')
  async activateEsim(@Param('id') id: string, @Request() req) {
    return this.esimsService.activateEsim(id, req.user.userId);
  }
}
