import { Test, TestingModule } from '@nestjs/testing';
import { MonitoringService } from '../../config/monitoring-alerts.service';
import { PrismaService } from '../../config/prisma.service';

describe('MonitoringService', () => {
  let service: MonitoringService;
  let prisma: PrismaService;

  const mockPrisma = {
    syncHistory: {
      findMany: jest.fn(),
    },
    package: {
      count: jest.fn(),
    },
    providerHealth: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MonitoringService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<MonitoringService>(MonitoringService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getMetrics', () => {
    it('should collect all monitoring metrics', async () => {
      mockPrisma.syncHistory.findMany.mockResolvedValue([
        {
          providerId: 'airalo',
          syncStartedAt: new Date(),
          syncCompletedAt: new Date(),
          packagesSynced: 100,
          packagesFailed: 0,
          syncDurationMs: 5000,
        },
      ]);

      mockPrisma.package.count
        .mockResolvedValueOnce(1000) // total count
        .mockResolvedValueOnce(850); // with FUP

      mockPrisma.providerHealth.findMany.mockResolvedValue([
        { providerId: 'airalo', healthScore: 0.95 },
        { providerId: 'esimgo', healthScore: 0.85 },
      ]);

      const metrics = await service.getMetrics();

      expect(metrics).toHaveProperty('syncDuration');
      expect(metrics).toHaveProperty('syncSuccessRate');
      expect(metrics).toHaveProperty('packageCount');
      expect(metrics).toHaveProperty('fupCoverage');
      expect(metrics).toHaveProperty('providerHealthScores');
      expect(metrics.packageCount).toBe(1000);
      expect(metrics.fupCoverage).toBeGreaterThan(80);
    });

    it('should calculate sync success rate', async () => {
      mockPrisma.syncHistory.findMany.mockResolvedValue([
        {
          providerId: 'airalo',
          syncStartedAt: new Date(),
          syncCompletedAt: new Date(),
          packagesSynced: 100,
          packagesFailed: 0,
          syncDurationMs: 5000,
        },
        {
          providerId: 'airalo',
          syncStartedAt: new Date(),
          syncCompletedAt: null,
          packagesSynced: 0,
          packagesFailed: 0,
          syncDurationMs: null,
        },
      ]);

      mockPrisma.package.count
        .mockResolvedValueOnce(1000)
        .mockResolvedValueOnce(850);

      mockPrisma.providerHealth.findMany.mockResolvedValue([]);

      const metrics = await service.getMetrics();

      expect(metrics.syncSuccessRate).toBe(50); // 1 out of 2 succeeded
    });

    it('should calculate FUP coverage', async () => {
      mockPrisma.syncHistory.findMany.mockResolvedValue([]);

      mockPrisma.package.count
        .mockResolvedValueOnce(1000) // total
        .mockResolvedValueOnce(900); // with FUP

      mockPrisma.providerHealth.findMany.mockResolvedValue([]);

      const metrics = await service.getMetrics();

      expect(metrics.fupCoverage).toBe(90);
    });

    it('should handle zero packages', async () => {
      mockPrisma.syncHistory.findMany.mockResolvedValue([]);
      mockPrisma.package.count
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);
      mockPrisma.providerHealth.findMany.mockResolvedValue([]);

      const metrics = await service.getMetrics();

      expect(metrics.fupCoverage).toBe(0);
    });

    it('should collect provider health scores', async () => {
      mockPrisma.syncHistory.findMany.mockResolvedValue([]);
      mockPrisma.package.count
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);

      mockPrisma.providerHealth.findMany.mockResolvedValue([
        { providerId: 'airalo', healthScore: 0.95 },
        { providerId: 'esimgo', healthScore: 0.85 },
        { providerId: 'holafly', healthScore: 0.75 },
      ]);

      const metrics = await service.getMetrics();

      expect(metrics.providerHealthScores['airalo']).toBe(0.95);
      expect(metrics.providerHealthScores['esimgo']).toBe(0.85);
      expect(metrics.providerHealthScores['holafly']).toBe(0.75);
    });
  });

  describe('checkAlerts', () => {
    it('should trigger sync duration alert', async () => {
      mockPrisma.syncHistory.findMany.mockResolvedValue([
        {
          providerId: 'airalo',
          syncStartedAt: new Date(),
          syncCompletedAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
          packagesSynced: 100,
          packagesFailed: 0,
          syncDurationMs: 900000, // 15 minutes
        },
      ]);

      mockPrisma.package.count
        .mockResolvedValueOnce(1000)
        .mockResolvedValueOnce(850);

      mockPrisma.providerHealth.findMany.mockResolvedValue([]);

      const alerts = await service.checkAlerts();

      const syncDurationAlert = alerts.find((a) => a.name === 'sync_duration_exceeded');
      expect(syncDurationAlert).toBeDefined();
      expect(syncDurationAlert?.severity).toBe('warning');
    });

    it('should trigger FUP coverage alert', async () => {
      mockPrisma.syncHistory.findMany.mockResolvedValue([]);

      mockPrisma.package.count
        .mockResolvedValueOnce(1000)
        .mockResolvedValueOnce(700); // 70% coverage

      mockPrisma.providerHealth.findMany.mockResolvedValue([]);

      const alerts = await service.checkAlerts();

      const fupAlert = alerts.find((a) => a.name === 'fup_coverage_low');
      expect(fupAlert).toBeDefined();
      expect(fupAlert?.severity).toBe('warning');
    });

    it('should trigger provider health alert', async () => {
      mockPrisma.syncHistory.findMany.mockResolvedValue([]);
      mockPrisma.package.count
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);

      mockPrisma.providerHealth.findMany.mockResolvedValue([
        { providerId: 'airalo', healthScore: 0.4 }, // Below 0.5
      ]);

      const alerts = await service.checkAlerts();

      const healthAlert = alerts.find((a) => a.name === 'provider_health_degraded');
      expect(healthAlert).toBeDefined();
      expect(healthAlert?.severity).toBe('critical');
    });

    it('should not trigger alerts when metrics are healthy', async () => {
      mockPrisma.syncHistory.findMany.mockResolvedValue([
        {
          providerId: 'airalo',
          syncStartedAt: new Date(),
          syncCompletedAt: new Date(Date.now() + 3 * 60 * 1000), // 3 minutes
          packagesSynced: 100,
          packagesFailed: 0,
          syncDurationMs: 180000,
        },
      ]);

      mockPrisma.package.count
        .mockResolvedValueOnce(1000)
        .mockResolvedValueOnce(900); // 90% FUP coverage

      mockPrisma.providerHealth.findMany.mockResolvedValue([
        { providerId: 'airalo', healthScore: 0.95 },
      ]);

      const alerts = await service.checkAlerts();

      expect(alerts.length).toBe(0);
    });

    it('should trigger error rate alert', async () => {
      mockPrisma.syncHistory.findMany.mockResolvedValue([
        {
          providerId: 'airalo',
          syncStartedAt: new Date(),
          syncCompletedAt: new Date(),
          packagesSynced: 100,
          packagesFailed: 2, // 2% error rate
          syncDurationMs: 5000,
        },
      ]);

      mockPrisma.package.count
        .mockResolvedValueOnce(1000)
        .mockResolvedValueOnce(850);

      mockPrisma.providerHealth.findMany.mockResolvedValue([]);

      const alerts = await service.checkAlerts();

      const errorRateAlert = alerts.find((a) => a.name === 'error_rate_high');
      expect(errorRateAlert).toBeDefined();
      expect(errorRateAlert?.severity).toBe('warning');
    });
  });

  describe('getAlertConfigs', () => {
    it('should return all alert configurations', () => {
      const configs = service.getAlertConfigs();

      expect(configs.length).toBeGreaterThan(0);
      expect(configs).toContainEqual(
        expect.objectContaining({
          name: 'sync_duration_exceeded',
          severity: 'warning',
        }),
      );
    });

    it('should have critical alerts for important metrics', () => {
      const configs = service.getAlertConfigs();

      const criticalAlerts = configs.filter((c) => c.severity === 'critical');
      expect(criticalAlerts.length).toBeGreaterThan(0);
    });

    it('should have warning alerts for performance metrics', () => {
      const configs = service.getAlertConfigs();

      const warningAlerts = configs.filter((c) => c.severity === 'warning');
      expect(warningAlerts.length).toBeGreaterThan(0);
    });
  });

  describe('alert severity levels', () => {
    it('should classify sync failure as critical', () => {
      const configs = service.getAlertConfigs();
      const syncFailureAlert = configs.find((c) => c.name === 'sync_failure');

      expect(syncFailureAlert?.severity).toBe('critical');
    });

    it('should classify data freshness as critical', () => {
      const configs = service.getAlertConfigs();
      const freshnessAlert = configs.find((c) => c.name === 'data_freshness_stale');

      expect(freshnessAlert?.severity).toBe('critical');
    });

    it('should classify provider health as critical', () => {
      const configs = service.getAlertConfigs();
      const healthAlert = configs.find((c) => c.name === 'provider_health_degraded');

      expect(healthAlert?.severity).toBe('critical');
    });

    it('should classify query latency as warning', () => {
      const configs = service.getAlertConfigs();
      const latencyAlert = configs.find((c) => c.name === 'query_latency_high');

      expect(latencyAlert?.severity).toBe('warning');
    });

    it('should classify cache hit rate as info', () => {
      const configs = service.getAlertConfigs();
      const cacheAlert = configs.find((c) => c.name === 'cache_hit_rate_low');

      expect(cacheAlert?.severity).toBe('info');
    });
  });

  describe('metric calculations', () => {
    it('should calculate average sync duration', async () => {
      mockPrisma.syncHistory.findMany.mockResolvedValue([
        {
          providerId: 'airalo',
          syncStartedAt: new Date(),
          syncCompletedAt: new Date(),
          packagesSynced: 100,
          packagesFailed: 0,
          syncDurationMs: 5000,
        },
        {
          providerId: 'airalo',
          syncStartedAt: new Date(),
          syncCompletedAt: new Date(),
          packagesSynced: 100,
          packagesFailed: 0,
          syncDurationMs: 7000,
        },
      ]);

      mockPrisma.package.count
        .mockResolvedValueOnce(1000)
        .mockResolvedValueOnce(850);

      mockPrisma.providerHealth.findMany.mockResolvedValue([]);

      const metrics = await service.getMetrics();

      expect(metrics.syncDuration).toBe(6000); // Average of 5000 and 7000
    });

    it('should handle syncs with no completion time', async () => {
      mockPrisma.syncHistory.findMany.mockResolvedValue([
        {
          providerId: 'airalo',
          syncStartedAt: new Date(),
          syncCompletedAt: null, // Not completed
          packagesSynced: 0,
          packagesFailed: 0,
          syncDurationMs: null,
        },
      ]);

      mockPrisma.package.count
        .mockResolvedValueOnce(1000)
        .mockResolvedValueOnce(850);

      mockPrisma.providerHealth.findMany.mockResolvedValue([]);

      const metrics = await service.getMetrics();

      expect(metrics.syncDuration).toBe(0);
    });
  });

  describe('alert thresholds', () => {
    it('should have reasonable sync duration threshold', () => {
      const configs = service.getAlertConfigs();
      const syncAlert = configs.find((c) => c.name === 'sync_duration_exceeded');

      expect(syncAlert?.threshold).toBe(600000); // 10 minutes
    });

    it('should have reasonable FUP coverage threshold', () => {
      const configs = service.getAlertConfigs();
      const fupAlert = configs.find((c) => c.name === 'fup_coverage_low');

      expect(fupAlert?.threshold).toBe(75);
    });

    it('should have reasonable error rate threshold', () => {
      const configs = service.getAlertConfigs();
      const errorAlert = configs.find((c) => c.name === 'error_rate_high');

      expect(errorAlert?.threshold).toBe(1);
    });

    it('should have reasonable provider health threshold', () => {
      const configs = service.getAlertConfigs();
      const healthAlert = configs.find((c) => c.name === 'provider_health_degraded');

      expect(healthAlert?.threshold).toBe(0.5);
    });
  });
});
