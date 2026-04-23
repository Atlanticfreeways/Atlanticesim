import { Test, TestingModule } from '@nestjs/testing';
import { UsagePredictorService } from './usage-predictor.service';
import { PrismaService } from '../../config/prisma.service';

describe('UsagePredictorService', () => {
  let service: UsagePredictorService;
  let mockPrisma: any;

  beforeEach(async () => {
    mockPrisma = {
      eSim: { findUnique: jest.fn() },
      usageUpdate: { findMany: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsagePredictorService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<UsagePredictorService>(UsagePredictorService);
  });

  it('should return empty predictions for non-existent eSIM', async () => {
    mockPrisma.eSim.findUnique.mockResolvedValue(null);
    const result = await service.predictDepletion('fake-id');
    expect(result).toEqual([]);
  });

  it('should return null exhaustion date with insufficient snapshots', async () => {
    mockPrisma.eSim.findUnique.mockResolvedValue({ id: 'e1', dataUsed: 500, dataTotal: 5000 });
    mockPrisma.usageUpdate.findMany.mockResolvedValue([{ dataUsed: 500, timestamp: new Date() }]);

    const result = await service.predictDepletion('e1');
    expect(result).toHaveLength(1);
    expect(result[0].predictedExhaustionDate).toBeNull();
    expect(result[0].velocityPerHour).toBe(0);
  });

  it('should predict exhaustion date with sufficient snapshots', async () => {
    const now = Date.now();
    mockPrisma.eSim.findUnique.mockResolvedValue({ id: 'e1', dataUsed: 2000, dataTotal: 5000 });
    mockPrisma.usageUpdate.findMany.mockResolvedValue([
      { dataUsed: 1000, timestamp: new Date(now - 6 * 3600000) },
      { dataUsed: 2000, timestamp: new Date(now) },
    ]);

    const result = await service.predictDepletion('e1');
    expect(result).toHaveLength(1);
    expect(result[0].velocityPerHour).toBeCloseTo(166.67, 0);
    expect(result[0].predictedExhaustionDate).toBeInstanceOf(Date);
    expect(result[0].predictedExhaustionDate!.getTime()).toBeGreaterThan(now);
  });

  it('should flag warning when usage exceeds 80%', async () => {
    mockPrisma.eSim.findUnique.mockResolvedValue({ id: 'e1', dataUsed: 4500, dataTotal: 5000 });
    mockPrisma.usageUpdate.findMany.mockResolvedValue([{ dataUsed: 4500, timestamp: new Date() }]);

    const result = await service.predictDepletion('e1');
    expect(result[0].isWarning).toBe(true);
    expect(result[0].percentUsed).toBe(90);
  });

  it('should return immediate exhaustion when data is depleted', async () => {
    const now = Date.now();
    mockPrisma.eSim.findUnique.mockResolvedValue({ id: 'e1', dataUsed: 5000, dataTotal: 5000 });
    mockPrisma.usageUpdate.findMany.mockResolvedValue([
      { dataUsed: 4000, timestamp: new Date(now - 3600000) },
      { dataUsed: 5000, timestamp: new Date(now) },
    ]);

    const result = await service.predictDepletion('e1');
    expect(result[0].percentUsed).toBe(100);
    expect(result[0].isWarning).toBe(true);
  });
});
