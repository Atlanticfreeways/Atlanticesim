import { Test, TestingModule } from '@nestjs/testing';
import { EsimsController } from './esims.controller';
import { EsimsService } from './esims.service';
import { UsagePredictorService } from './usage-predictor.service';
import { PrismaService } from '../../config/prisma.service';

describe('EsimsController', () => {
  let controller: EsimsController;
  let esimsService: EsimsService;
  let usagePredictor: UsagePredictorService;
  let prisma: PrismaService;

  const mockReq = { user: { userId: 'user-1' } };
  const mockEsim = {
    id: 'esim-1', dataUsed: 500, dataTotal: 1024,
    validUntil: new Date(), status: 'ACTIVE',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EsimsController],
      providers: [
        {
          provide: EsimsService,
          useValue: {
            getUserEsims: jest.fn().mockResolvedValue([mockEsim]),
            getEsimById: jest.fn().mockResolvedValue(mockEsim),
            getQrCode: jest.fn().mockResolvedValue({ qrCode: 'data:image/png;base64,...' }),
            getUsageData: jest.fn().mockResolvedValue({ dataUsed: 500, dataTotal: 1024 }),
            activateEsim: jest.fn().mockResolvedValue({ status: 'active' }),
          },
        },
        {
          provide: UsagePredictorService,
          useValue: {
            predictDepletion: jest.fn().mockResolvedValue([
              { metric: 'data', percentUsed: 48.8, isWarning: false, velocityPerHour: 5, predictedExhaustionDate: new Date() },
            ]),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            usageUpdate: {
              findMany: jest.fn().mockResolvedValue([
                { timestamp: new Date('2026-04-20T10:00:00Z'), dataUsed: 200 },
                { timestamp: new Date('2026-04-20T16:00:00Z'), dataUsed: 350 },
                { timestamp: new Date('2026-04-21T10:00:00Z'), dataUsed: 500 },
              ]),
            },
          },
        },
      ],
    }).compile();

    controller = module.get(EsimsController);
    esimsService = module.get(EsimsService);
    usagePredictor = module.get(UsagePredictorService);
    prisma = module.get(PrismaService);
  });

  describe('GET /esims/:id/usage/daily', () => {
    it('should return daily aggregated usage', async () => {
      const result = await controller.getUsageDaily('esim-1', mockReq);

      expect(esimsService.getEsimById).toHaveBeenCalledWith('esim-1', 'user-1');
      expect(result).toHaveLength(2); // 2 distinct days
      expect(result[0]).toHaveProperty('date');
      expect(result[0]).toHaveProperty('dataUsedMB');
      expect(result[0]).toHaveProperty('snapshots');
    });

    it('should return empty array when no snapshots exist', async () => {
      (prisma.usageUpdate.findMany as jest.Mock).mockResolvedValue([]);
      const result = await controller.getUsageDaily('esim-1', mockReq);
      expect(result).toEqual([]);
    });
  });

  describe('GET /esims/:id/usage/summary', () => {
    it('should return usage summary with predictions', async () => {
      const result = await controller.getUsageSummary('esim-1', mockReq);

      expect(result.esimId).toBe('esim-1');
      expect(result.dataUsed).toBe(500);
      expect(result.dataTotal).toBe(1024);
      expect(result.predictions).toHaveLength(1);
      expect(result.predictions[0].metric).toBe('data');
    });
  });

  describe('standard endpoints', () => {
    it('GET /esims should return user esims', async () => {
      const result = await controller.getUserEsims(mockReq);
      expect(result).toHaveLength(1);
    });

    it('GET /esims/:id should return esim by id', async () => {
      const result = await controller.getEsimById('esim-1', mockReq);
      expect(result.id).toBe('esim-1');
    });

    it('POST /esims/:id/activate should activate esim', async () => {
      const result = await controller.activateEsim('esim-1', mockReq);
      expect(result.status).toBe('active');
    });
  });
});
