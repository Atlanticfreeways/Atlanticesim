import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';

@Injectable()
export class UsagePredictorService {
  private readonly logger = new Logger(UsagePredictorService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Calculate consumption velocity (MB per hour) for an eSIM
   */
  async predictDepletion(esimId: string): Promise<{ predictedExhaustionDate: Date | null; velocityPerHour: number }> {
    const historicalData = await this.prisma.usageUpdate.findMany({
      where: { esimId },
      orderBy: { timestamp: 'asc' },
      take: 20, // Analyze last 20 snapshots
    });

    if (historicalData.length < 2) {
      return { predictedExhaustionDate: null, velocityPerHour: 0 };
    }

    const first = historicalData[0];
    const last = historicalData[historicalData.length - 1];

    const timeDiffMs = last.timestamp.getTime() - first.timestamp.getTime();
    const dataDiffMB = last.dataUsed - first.dataUsed;

    if (timeDiffMs === 0 || dataDiffMB <= 0) {
      return { predictedExhaustionDate: null, velocityPerHour: 0 };
    }

    const velocityPerHour = (dataDiffMB / timeDiffMs) * 3600000;
    
    // Get total data remaining
    const esim = await this.prisma.eSim.findUnique({ where: { id: esimId } });
    const remainingMB = esim.dataTotal - last.dataUsed;

    if (remainingMB <= 0) {
        return { predictedExhaustionDate: new Date(), velocityPerHour };
    }

    const hoursRemaining = remainingMB / velocityPerHour;
    const predictedExhaustionDate = new Date(Date.now() + hoursRemaining * 3600000);

    return { predictedExhaustionDate, velocityPerHour };
  }
}
