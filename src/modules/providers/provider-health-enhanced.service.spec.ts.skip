import { Test, TestingModule } from '@nestjs/testing';
import { ProviderHealthService } from './provider-health-enhanced.service';
import { PrismaService } from '../../config/prisma.service';

describe('ProviderHealthService', () => {
  let service: ProviderHealthService;
  let prisma: PrismaService;

  const mockPrisma = {
    providerHealth: {
      upsert: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    syncHistory: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProviderHealthService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<ProviderHealthService>(ProviderHealthService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('recordSuccess', () => {
    it('should increment health score on success', async () => {
      const providerId = 'airalo';
      const latencyMs = 150;

      mockPrisma.providerHealth.upsert.mockResolvedValue({
        providerId,
        healthScore: 0.95,
        latencyMs,
        consecutiveFailures: 0,
        isDegraded: false,
      });

      await service.recordSuccess(providerId, latencyMs);

      expect(mockPrisma.providerHealth.upsert).toHaveBeenCalledWith({
        where: { providerId },
        update: expect.objectContaining({
          healthScore: { increment: 0.05 },
          latencyMs,
          consecutiveFailures: 0,
          isDegraded: false,
        }),
        create: expect.any(Object),
      });
    });

    it('should cap health score at 1.0', async () => {
      const providerId = 'airalo';

      mockPrisma.providerHealth.upsert.mockResolvedValue({
        providerId,
        healthScore: 1.05,
      });

      await service.recordSuccess(providerId, 100);

      expect(mockPrisma.providerHealth.update).toHaveBeenCalledWith({
        where: { providerId },
        data: { healthScore: 1.0 },
      });
    });

    it('should create new health record if not exists', async () => {
      const providerId = 'esimgo';

      mockPrisma.providerHealth.upsert.mockResolvedValue({
        providerId,
        healthScore: 1.0,
        latencyMs: 200,
      });

      await service.recordSuccess(providerId, 200);

      expect(mockPrisma.providerHealth.upsert).toHaveBeenCalled();
    });
  });

  describe('recordFailure', () => {
    it('should decrement health score on failure', async () => {
      const providerId = 'airalo';
      const error = 'Connection timeout';

      mockPrisma.providerHealth.upsert.mockResolvedValue({
        providerId,
        healthScore: 0.8,
        consecutiveFailures: 1,
        isDegraded: true,
      });

      await service.recordFailure(providerId, error);

      expect(mockPrisma.providerHealth.upsert).toHaveBeenCalledWith({
        where: { providerId },
        update: expect.objectContaining({
          healthScore: { decrement: 0.1 },
          consecutiveFailures: { increment: 1 },
          isDegraded: true,
        }),
        create: expect.any(Object),
      });
    });

    it('should floor health score at 0.0', async () => {
      const providerId = 'airalo';

      mockPrisma.providerHealth.upsert.mockResolvedValue({
        providerId,
        healthScore: -0.05,
      });

      await service.recordFailure(providerId, 'Error');

      expect(mockPrisma.providerHealth.update).toHaveBeenCalledWith({
        where: { providerId },
        data: { healthScore: 0.0 },
      });
    });

    it('should log warning on 3+ consecutive failures', async () => {
      const providerId = 'airalo';
      const loggerSpy = jest.spyOn(service['logger'], 'warn');

      mockPrisma.providerHealth.upsert.mockResolvedValue({
        providerId,
        healthScore: 0.7,
        consecutiveFailures: 3,
        isDegraded: true,
      });

      await service.recordFailure(providerId, 'Error');

      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('3 consecutive failures'),
      );
    });
  });

  describe('getHealth', () => {
    it('should return health metrics from cache', async () => {
      const providerId = 'airalo';
      const metrics = {
        providerId,
        healthScore: 0.9,
        latencyMs: 150,
        errorRate: 0.5,
        isDegraded: false,
        consecutiveFailures: 0,
      };

      mockPrisma.providerHealth.findUnique.mockResolvedValue({
        providerId,
        healthScore: 0.9,
        latencyMs: 150,
        errorRate: 0.5,
        isDegraded: false,
        consecutiveFailures: 0,
      });

      const result = await service.getHealth(providerId);

      expect(result).toEqual(metrics);
    });

    it('should return null if provider not found', async () => {
      mockPrisma.providerHealth.findUnique.mockResolvedValue(null);

      const result = await service.getHealth('unknown');

      expect(result).toBeNull();
    });
  });

  describe('getHealthyProviderIds', () => {
    it('should return only providers with health score > 0.5', async () => {
      mockPrisma.providerHealth.findMany.mockResolvedValue([
        { providerId: 'airalo', healthScore: 0.9 },
        { providerId: 'esimgo', healthScore: 0.7 },
        { providerId: 'holafly', healthScore: 0.3 },
      ]);

      const result = await service.getHealthyProviderIds();

      expect(result).toEqual(['airalo', 'esimgo']);
      expect(result).not.toContain('holafly');
    });

    it('should return empty array if no healthy providers', async () => {
      mockPrisma.providerHealth.findMany.mockResolvedValue([]);

      const result = await service.getHealthyProviderIds();

      expect(result).toEqual([]);
    });
  });

  describe('getRankedProviders', () => {
    it('should return providers sorted by health score descending', async () => {
      mockPrisma.providerHealth.findMany.mockResolvedValue([
        { providerId: 'airalo', healthScore: 0.95 },
        { providerId: 'esimgo', healthScore: 0.85 },
        { providerId: 'holafly', healthScore: 0.75 },
      ]);

      const result = await service.getRankedProviders();

      expect(result[0].providerId).toBe('airalo');
      expect(result[1].providerId).toBe('esimgo');
      expect(result[2].providerId).toBe('holafly');
    });
  });

  describe('isDegraded', () => {
    it('should return true if provider is degraded', async () => {
      mockPrisma.providerHealth.findUnique.mockResolvedValue({
        providerId: 'airalo',
        isDegraded: true,
      });

      const result = await service.isDegraded('airalo');

      expect(result).toBe(true);
    });

    it('should return false if provider is healthy', async () => {
      mockPrisma.providerHealth.findUnique.mockResolvedValue({
        providerId: 'airalo',
        isDegraded: false,
      });

      const result = await service.isDegraded('airalo');

      expect(result).toBe(false);
    });

    it('should return false if provider not found', async () => {
      mockPrisma.providerHealth.findUnique.mockResolvedValue(null);

      const result = await service.isDegraded('unknown');

      expect(result).toBe(false);
    });
  });

  describe('getErrorRate', () => {
    it('should calculate error rate from sync history', async () => {
      mockPrisma.syncHistory.findMany.mockResolvedValue([
        { providerId: 'airalo', packagesFailed: 0 },
        { providerId: 'airalo', packagesFailed: 0 },
        { providerId: 'airalo', packagesFailed: 5 },
        { providerId: 'airalo', packagesFailed: 0 },
      ]);

      const result = await service.getErrorRate('airalo', 60);

      expect(result).toBe(25); // 1 out of 4 syncs failed
    });

    it('should return 0 if no syncs found', async () => {
      mockPrisma.syncHistory.findMany.mockResolvedValue([]);

      const result = await service.getErrorRate('unknown', 60);

      expect(result).toBe(0);
    });
  });

  describe('periodicHealthCheck', () => {
    it('should reset consecutive failures for recovered providers', async () => {
      mockPrisma.providerHealth.updateMany.mockResolvedValue({ count: 2 });

      await service.periodicHealthCheck();

      expect(mockPrisma.providerHealth.updateMany).toHaveBeenCalledWith({
        where: {
          lastCheckAt: { lt: expect.any(Date) },
          consecutiveFailures: { gt: 0 },
        },
        data: {
          consecutiveFailures: 0,
          isDegraded: false,
        },
      });
    });
  });

  describe('health score scenarios', () => {
    it('should handle rapid success recovery', async () => {
      const providerId = 'airalo';

      // Start degraded
      mockPrisma.providerHealth.upsert.mockResolvedValueOnce({
        providerId,
        healthScore: 0.4,
        isDegraded: true,
      });

      await service.recordFailure(providerId, 'Error');

      // Recover with successes
      for (let i = 0; i < 10; i++) {
        mockPrisma.providerHealth.upsert.mockResolvedValueOnce({
          providerId,
          healthScore: Math.min(0.4 + (i + 1) * 0.05, 1.0),
          isDegraded: false,
        });

        await service.recordSuccess(providerId, 100);
      }

      expect(mockPrisma.providerHealth.upsert).toHaveBeenCalledTimes(11);
    });

    it('should handle cascading failures', async () => {
      const providerId = 'airalo';

      // Simulate cascading failures
      for (let i = 0; i < 5; i++) {
        mockPrisma.providerHealth.upsert.mockResolvedValueOnce({
          providerId,
          healthScore: Math.max(1.0 - (i + 1) * 0.1, 0.0),
          consecutiveFailures: i + 1,
          isDegraded: i + 1 >= 3,
        });

        await service.recordFailure(providerId, `Error ${i + 1}`);
      }

      expect(mockPrisma.providerHealth.upsert).toHaveBeenCalledTimes(5);
    });
  });
});
