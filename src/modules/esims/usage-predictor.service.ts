import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';

export interface DepletionPrediction {
  metric: 'data' | 'voice' | 'sms';
  predictedExhaustionDate: Date | null;
  velocityPerHour: number;
  percentUsed: number;
  isWarning: boolean;
}

@Injectable()
export class UsagePredictorService {
  private readonly logger = new Logger(UsagePredictorService.name);

  constructor(private prisma: PrismaService) {}

  async predictDepletion(esimId: string): Promise<DepletionPrediction[]> {
    const esim = await this.prisma.eSim.findUnique({ 
      where: { id: esimId },
      include: { order: { include: { package: true } } }
    });
    if (!esim) return [];

    const predictions: DepletionPrediction[] = [];

    // Data depletion
    if (esim.dataTotal > 0) {
      predictions.push(await this.predictMetric(esimId, 'data', esim.dataUsed, esim.dataTotal));
    }

    // Voice depletion (if package has voice)
    const voiceMinutes = esim.order?.package?.voiceMinutes;
    if (voiceMinutes && voiceMinutes > 0) {
      // Voice usage would need to be tracked in ESim model or separate table
      // For now, we'll use a placeholder of 0 used
      predictions.push(await this.predictMetric(esimId, 'voice', 0, voiceMinutes));
    }

    // SMS depletion (if package has SMS)
    const smsCount = esim.order?.package?.smsCount;
    if (smsCount && smsCount > 0) {
      // SMS usage would need to be tracked in ESim model or separate table
      // For now, we'll use a placeholder of 0 used
      predictions.push(await this.predictMetric(esimId, 'sms', 0, smsCount));
    }

    return predictions;
  }

  private async predictMetric(
    esimId: string,
    metric: 'data' | 'voice' | 'sms',
    used: number,
    total: number,
  ): Promise<DepletionPrediction> {
    const percentUsed = total > 0 ? (used / total) * 100 : 0;

    const snapshots = await this.prisma.usageUpdate.findMany({
      where: { esimId },
      orderBy: { timestamp: 'asc' },
      take: 20,
    });

    if (snapshots.length < 2) {
      return { metric, predictedExhaustionDate: null, velocityPerHour: 0, percentUsed, isWarning: percentUsed >= 80 };
    }

    const first = snapshots[0];
    const last = snapshots[snapshots.length - 1];
    const timeDiffMs = last.timestamp.getTime() - first.timestamp.getTime();
    const usageDiff = last.dataUsed - first.dataUsed;

    if (timeDiffMs === 0 || usageDiff <= 0) {
      return { metric, predictedExhaustionDate: null, velocityPerHour: 0, percentUsed, isWarning: percentUsed >= 80 };
    }

    const velocityPerHour = (usageDiff / timeDiffMs) * 3600000;
    const remaining = total - used;

    if (remaining <= 0) {
      return { metric, predictedExhaustionDate: new Date(), velocityPerHour, percentUsed: 100, isWarning: true };
    }

    const hoursRemaining = remaining / velocityPerHour;
    const predictedExhaustionDate = new Date(Date.now() + hoursRemaining * 3600000);

    return { metric, predictedExhaustionDate, velocityPerHour, percentUsed, isWarning: percentUsed >= 80 };
  }
}
