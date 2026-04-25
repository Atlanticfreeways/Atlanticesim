import { Test, TestingModule } from '@nestjs/testing';
import { ProviderHealthService } from './provider-health.service';
import { PrismaService } from '../../config/prisma.service';
import { IProviderAdapter, ProviderHealth } from '../../common/interfaces/provider.interface';

describe('ProviderHealthService', () => {
  let service: ProviderHealthService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    provider: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  };

  const createMockAdapter = (isHealthy: boolean, responseTime = 100): IProviderAdapter => {
    return {
      checkHealth: jest.fn().mockResolvedValue({
        isAvailable: isHealthy,
        responseTime,
        lastChecked: new Date(),
        provider: 'test-provider',
      } as ProviderHealth),
      getProviderName: jest.fn().mockReturnValue('Test Provider'),
    } as any;
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProviderHealthService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<ProviderHealthService>(ProviderHealthService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('registerAdapter', () => {
    it('should register a provider adapter', () => {
      const mockAdapter = createMockAdapter(true);
      service.registerAdapter('test-provider', 'Test Provider', mockAdapter);

      const status = service.getProviderHealthStatus('test-provider');
      expect(status).toBeDefined();
      expect(status?.providerId).toBe('test-provider');
      expect(status?.providerName).toBe('Test Provider');
      expect(status?.isHealthy).toBe(true);
      expect(status?.consecutiveFailures).toBe(0);
    });

    it('should register multiple adapters', () => {
      const adapter1 = createMockAdapter(true);
      const adapter2 = createMockAdapter(true);

      service.registerAdapter('provider-1', 'Provider 1', adapter1);
      service.registerAdapter('provider-2', 'Provider 2', adapter2);

      const allStatus = service.getAllHealthStatus();
      expect(allStatus).toHaveLength(2);
    });
  });

  describe('checkProvider', () => {
    it('should check provider health successfully', async () => {
      const mockAdapter = createMockAdapter(true, 150);
      service.registerAdapter('test-provider', 'Test Provider', mockAdapter);

      const result = await service.checkProvider('test-provider');

      expect(result).toBeDefined();
      expect(result?.isHealthy).toBe(true);
      expect(result?.consecutiveFailures).toBe(0);
      expect(mockAdapter.checkHealth).toHaveBeenCalled();
    });

    it('should handle provider health check failure', async () => {
      const mockAdapter = createMockAdapter(false);
      service.registerAdapter('test-provider', 'Test Provider', mockAdapter);

      const result = await service.checkProvider('test-provider');

      expect(result).toBeDefined();
      expect(result?.isHealthy).toBe(false);
      expect(result?.consecutiveFailures).toBe(1);
    });

    it('should return null for non-existent provider', async () => {
      const result = await service.checkProvider('non-existent');
      expect(result).toBeNull();
    });

    it('should handle adapter throwing error', async () => {
      const mockAdapter = {
        checkHealth: jest.fn().mockRejectedValue(new Error('Connection failed')),
        getProviderName: jest.fn().mockReturnValue('Test Provider'),
      } as any;

      service.registerAdapter('test-provider', 'Test Provider', mockAdapter);

      const result = await service.checkProvider('test-provider');

      expect(result).toBeDefined();
      expect(result?.isHealthy).toBe(false);
      expect(result?.error).toBe('Connection failed');
    });
  });

  describe('isProviderHealthy', () => {
    it('should return true for healthy provider', () => {
      const mockAdapter = createMockAdapter(true);
      service.registerAdapter('test-provider', 'Test Provider', mockAdapter);

      expect(service.isProviderHealthy('test-provider')).toBe(true);
    });

    it('should return false for non-existent provider', () => {
      expect(service.isProviderHealthy('non-existent')).toBe(false);
    });
  });

  describe('getHealthyProviderIds', () => {
    it('should return only healthy provider IDs', async () => {
      const healthyAdapter = createMockAdapter(true);
      const unhealthyAdapter = createMockAdapter(false);

      service.registerAdapter('healthy-provider', 'Healthy', healthyAdapter);
      service.registerAdapter('unhealthy-provider', 'Unhealthy', unhealthyAdapter);

      await service.checkProvider('healthy-provider');
      await service.checkProvider('unhealthy-provider');

      const healthyIds = service.getHealthyProviderIds();
      expect(healthyIds).toContain('healthy-provider');
      expect(healthyIds).not.toContain('unhealthy-provider');
    });

    it('should return empty array when no providers are healthy', async () => {
      const unhealthyAdapter = createMockAdapter(false);
      service.registerAdapter('unhealthy-provider', 'Unhealthy', unhealthyAdapter);

      await service.checkProvider('unhealthy-provider');

      const healthyIds = service.getHealthyProviderIds();
      expect(healthyIds).toHaveLength(0);
    });
  });

  describe('consecutive failures and auto-disable', () => {
    it('should track consecutive failures', async () => {
      const mockAdapter = createMockAdapter(false);
      service.registerAdapter('test-provider', 'Test Provider', mockAdapter);

      // First failure
      await service.checkProvider('test-provider');
      let status = service.getProviderHealthStatus('test-provider');
      expect(status?.consecutiveFailures).toBe(1);

      // Second failure
      await service.checkProvider('test-provider');
      status = service.getProviderHealthStatus('test-provider');
      expect(status?.consecutiveFailures).toBe(2);

      // Third failure
      await service.checkProvider('test-provider');
      status = service.getProviderHealthStatus('test-provider');
      expect(status?.consecutiveFailures).toBe(3);
    });

    it('should reset consecutive failures on success', async () => {
      const mockAdapter = {
        checkHealth: jest.fn()
          .mockResolvedValueOnce({ isAvailable: false, responseTime: 100, lastChecked: new Date(), provider: 'test' })
          .mockResolvedValueOnce({ isAvailable: true, responseTime: 100, lastChecked: new Date(), provider: 'test' }),
        getProviderName: jest.fn().mockReturnValue('Test Provider'),
      } as any;

      service.registerAdapter('test-provider', 'Test Provider', mockAdapter);

      // Failure
      await service.checkProvider('test-provider');
      let status = service.getProviderHealthStatus('test-provider');
      expect(status?.consecutiveFailures).toBe(1);

      // Success - should reset
      await service.checkProvider('test-provider');
      status = service.getProviderHealthStatus('test-provider');
      expect(status?.consecutiveFailures).toBe(0);
      expect(status?.isHealthy).toBe(true);
    });

    it('should auto-disable provider after 5 consecutive failures', async () => {
      mockPrismaService.provider.findFirst.mockResolvedValue({
        id: 'provider-id',
        slug: 'test-provider',
        isActive: true,
      });
      mockPrismaService.provider.update.mockResolvedValue({});

      const mockAdapter = createMockAdapter(false);
      service.registerAdapter('test-provider', 'Test Provider', mockAdapter);

      // Trigger 5 consecutive failures
      for (let i = 0; i < 5; i++) {
        await service.checkProvider('test-provider');
      }

      expect(mockPrismaService.provider.update).toHaveBeenCalledWith({
        where: { id: 'provider-id' },
        data: { isActive: false },
      });
    });

    it('should not disable provider if already inactive', async () => {
      mockPrismaService.provider.findFirst.mockResolvedValue({
        id: 'provider-id',
        slug: 'test-provider',
        isActive: false,
      });

      const mockAdapter = createMockAdapter(false);
      service.registerAdapter('test-provider', 'Test Provider', mockAdapter);

      // Trigger 5 consecutive failures
      for (let i = 0; i < 5; i++) {
        await service.checkProvider('test-provider');
      }

      expect(mockPrismaService.provider.update).not.toHaveBeenCalled();
    });
  });

  describe('getAllHealthStatus', () => {
    it('should return all provider health statuses', () => {
      const adapter1 = createMockAdapter(true);
      const adapter2 = createMockAdapter(false);

      service.registerAdapter('provider-1', 'Provider 1', adapter1);
      service.registerAdapter('provider-2', 'Provider 2', adapter2);

      const allStatus = service.getAllHealthStatus();
      expect(allStatus).toHaveLength(2);
      expect(allStatus.find(s => s.providerId === 'provider-1')).toBeDefined();
      expect(allStatus.find(s => s.providerId === 'provider-2')).toBeDefined();
    });
  });

  describe('performHealthChecks', () => {
    it('should check all registered providers', async () => {
      const adapter1 = createMockAdapter(true);
      const adapter2 = createMockAdapter(true);

      service.registerAdapter('provider-1', 'Provider 1', adapter1);
      service.registerAdapter('provider-2', 'Provider 2', adapter2);

      await service.performHealthChecks();

      expect(adapter1.checkHealth).toHaveBeenCalled();
      expect(adapter2.checkHealth).toHaveBeenCalled();
    });

    it('should handle mixed success and failure', async () => {
      const healthyAdapter = createMockAdapter(true);
      const unhealthyAdapter = createMockAdapter(false);

      service.registerAdapter('healthy', 'Healthy Provider', healthyAdapter);
      service.registerAdapter('unhealthy', 'Unhealthy Provider', unhealthyAdapter);

      await service.performHealthChecks();

      const healthyIds = service.getHealthyProviderIds();
      expect(healthyIds).toContain('healthy');
      expect(healthyIds).not.toContain('unhealthy');
    });
  });
});
