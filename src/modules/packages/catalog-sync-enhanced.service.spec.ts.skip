import { Test, TestingModule } from '@nestjs/testing';
import { CatalogSyncServiceEnhanced } from './catalog-sync-enhanced.service';
import { PrismaService } from '../../config/prisma.service';
import { ProvidersService } from '../providers/providers.service';
import { ProviderHealthService } from '../providers/provider-health-enhanced.service';

describe('CatalogSyncServiceEnhanced', () => {
  let service: CatalogSyncServiceEnhanced;
  let prisma: PrismaService;
  let providersService: ProvidersService;
  let healthService: ProviderHealthService;

  const mockPrisma = {
    syncHistory: {
      create: jest.fn(),
      update: jest.fn(),
    },
    package: {
      upsert: jest.fn(),
      updateMany: jest.fn(),
    },
    provider: {
      findUnique: jest.fn(),
    },
  };

  const mockProvidersService = {
    getAdapter: jest.fn(),
    getHealthyProviderIds: jest.fn(),
  };

  const mockHealthService = {
    getHealthyProviderIds: jest.fn(),
    recordSuccess: jest.fn(),
    recordFailure: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CatalogSyncServiceEnhanced,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
        {
          provide: ProvidersService,
          useValue: mockProvidersService,
        },
        {
          provide: ProviderHealthService,
          useValue: mockHealthService,
        },
      ],
    }).compile();

    service = module.get<CatalogSyncServiceEnhanced>(CatalogSyncServiceEnhanced);
    prisma = module.get<PrismaService>(PrismaService);
    providersService = module.get<ProvidersService>(ProvidersService);
    healthService = module.get<ProviderHealthService>(ProviderHealthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('syncProvider', () => {
    it('should sync packages from provider', async () => {
      const providerId = 'airalo';
      const mockAdapter = {
        searchPackages: jest.fn().mockResolvedValue([
          {
            id: 'pkg-1',
            title: 'US 10GB',
            dataAmount: 10,
            dataUnit: 'GB',
            duration: 30,
            wholesalePrice: 24.99,
            currency: 'USD',
            coverage: ['US'],
            description: 'Test package',
            meta: {
              voiceMinutes: 500,
              smsCount: 100,
            },
          },
        ]),
      };

      mockProvidersService.getAdapter.mockReturnValue(mockAdapter);
      mockPrisma.provider.findUnique.mockResolvedValue({
        id: providerId,
        slug: 'airalo',
        config: {},
      });
      mockPrisma.syncHistory.create.mockResolvedValue({
        id: 'sync-1',
        providerId,
        syncStartedAt: new Date(),
      });
      mockPrisma.package.upsert.mockResolvedValue({
        id: 'pkg-1',
        providerId,
      });
      mockPrisma.package.updateMany.mockResolvedValue({ count: 0 });

      const result = await service.syncProvider(providerId);

      expect(result.upserted).toBe(1);
      expect(result.deactivated).toBe(0);
      expect(mockPrisma.syncHistory.update).toHaveBeenCalled();
    });

    it('should handle per-package errors gracefully', async () => {
      const providerId = 'airalo';
      const mockAdapter = {
        searchPackages: jest.fn().mockResolvedValue([
          {
            id: 'pkg-1',
            title: 'Package 1',
            dataAmount: 10,
            dataUnit: 'GB',
            duration: 30,
            wholesalePrice: 24.99,
            currency: 'USD',
            coverage: ['US'],
          },
          {
            id: 'pkg-2',
            title: 'Package 2',
            dataAmount: 5,
            dataUnit: 'GB',
            duration: 30,
            wholesalePrice: 14.99,
            currency: 'USD',
            coverage: ['US'],
          },
        ]),
      };

      mockProvidersService.getAdapter.mockReturnValue(mockAdapter);
      mockPrisma.provider.findUnique.mockResolvedValue({
        id: providerId,
        slug: 'airalo',
        config: {},
      });
      mockPrisma.syncHistory.create.mockResolvedValue({
        id: 'sync-1',
        providerId,
      });

      // First package succeeds, second fails
      mockPrisma.package.upsert
        .mockResolvedValueOnce({ id: 'pkg-1' })
        .mockRejectedValueOnce(new Error('DB error'))
        .mockResolvedValueOnce({ id: 'pkg-2' });

      mockPrisma.package.updateMany.mockResolvedValue({ count: 0 });

      const result = await service.syncProvider(providerId);

      // Should continue despite error
      expect(result.upserted).toBeGreaterThan(0);
      expect(result.failed).toBe(1);
    });

    it('should deactivate stale packages', async () => {
      const providerId = 'airalo';
      const mockAdapter = {
        searchPackages: jest.fn().mockResolvedValue([
          {
            id: 'pkg-1',
            title: 'Package 1',
            dataAmount: 10,
            dataUnit: 'GB',
            duration: 30,
            wholesalePrice: 24.99,
            currency: 'USD',
            coverage: ['US'],
          },
        ]),
      };

      mockProvidersService.getAdapter.mockReturnValue(mockAdapter);
      mockPrisma.provider.findUnique.mockResolvedValue({
        id: providerId,
        slug: 'airalo',
        config: {},
      });
      mockPrisma.syncHistory.create.mockResolvedValue({
        id: 'sync-1',
        providerId,
      });
      mockPrisma.package.upsert.mockResolvedValue({ id: 'pkg-1' });
      mockPrisma.package.updateMany.mockResolvedValue({ count: 5 });

      const result = await service.syncProvider(providerId);

      expect(result.deactivated).toBe(5);
      expect(mockPrisma.package.updateMany).toHaveBeenCalledWith({
        where: {
          providerId: providerId,
          isActive: true,
          id: { notIn: expect.any(Array) },
        },
        data: { isActive: false, deprecatedAt: expect.any(Date) },
      });
    });

    it('should extract FUP information', async () => {
      const providerId = 'airalo';
      const mockAdapter = {
        searchPackages: jest.fn().mockResolvedValue([
          {
            id: 'pkg-1',
            title: 'Unlimited Package',
            dataAmount: -1,
            dataUnit: 'GB',
            duration: 30,
            wholesalePrice: 49.99,
            currency: 'USD',
            coverage: ['US'],
            description: 'Unlimited data with fair usage policy. Speeds reduce to 512 Mbps after 2GB daily usage.',
            meta: {
              unlimited: true,
            },
          },
        ]),
      };

      mockProvidersService.getAdapter.mockReturnValue(mockAdapter);
      mockPrisma.provider.findUnique.mockResolvedValue({
        id: providerId,
        slug: 'airalo',
        config: {},
      });
      mockPrisma.syncHistory.create.mockResolvedValue({
        id: 'sync-1',
        providerId,
      });
      mockPrisma.package.upsert.mockResolvedValue({ id: 'pkg-1' });
      mockPrisma.package.updateMany.mockResolvedValue({ count: 0 });

      await service.syncProvider(providerId);

      expect(mockPrisma.package.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: expect.objectContaining({
            fairUsageNote: expect.stringContaining('512 Mbps'),
            throttleAfterGb: 2,
            throttleSpeedMbps: 512,
          }),
        }),
      );
    });

    it('should calculate cost per GB', async () => {
      const providerId = 'airalo';
      const mockAdapter = {
        searchPackages: jest.fn().mockResolvedValue([
          {
            id: 'pkg-1',
            title: '10GB Package',
            dataAmount: 10,
            dataUnit: 'GB',
            duration: 30,
            wholesalePrice: 50,
            currency: 'USD',
            coverage: ['US'],
          },
        ]),
      };

      mockProvidersService.getAdapter.mockReturnValue(mockAdapter);
      mockPrisma.provider.findUnique.mockResolvedValue({
        id: providerId,
        slug: 'airalo',
        config: {},
      });
      mockPrisma.syncHistory.create.mockResolvedValue({
        id: 'sync-1',
        providerId,
      });
      mockPrisma.package.upsert.mockResolvedValue({ id: 'pkg-1' });
      mockPrisma.package.updateMany.mockResolvedValue({ count: 0 });

      await service.syncProvider(providerId);

      expect(mockPrisma.package.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: expect.objectContaining({
            costPerGb: expect.any(Object), // Decimal type
          }),
        }),
      );
    });

    it('should record success in health service', async () => {
      const providerId = 'airalo';
      const mockAdapter = {
        searchPackages: jest.fn().mockResolvedValue([]),
      };

      mockProvidersService.getAdapter.mockReturnValue(mockAdapter);
      mockPrisma.provider.findUnique.mockResolvedValue({
        id: providerId,
        slug: 'airalo',
        config: {},
      });
      mockPrisma.syncHistory.create.mockResolvedValue({
        id: 'sync-1',
        providerId,
      });
      mockPrisma.package.updateMany.mockResolvedValue({ count: 0 });

      await service.syncProvider(providerId);

      expect(mockHealthService.recordSuccess).toHaveBeenCalledWith(
        providerId,
        expect.any(Number),
      );
    });

    it('should record failure in health service on error', async () => {
      const providerId = 'airalo';
      const error = new Error('API Error');

      mockProvidersService.getAdapter.mockReturnValue({
        searchPackages: jest.fn().mockRejectedValue(error),
      });
      mockPrisma.provider.findUnique.mockResolvedValue({
        id: providerId,
        slug: 'airalo',
        config: {},
      });
      mockPrisma.syncHistory.create.mockResolvedValue({
        id: 'sync-1',
        providerId,
      });

      await expect(service.syncProvider(providerId)).rejects.toThrow();

      expect(mockHealthService.recordFailure).toHaveBeenCalledWith(
        providerId,
        error.message,
      );
    });

    it('should update sync history with results', async () => {
      const providerId = 'airalo';
      const mockAdapter = {
        searchPackages: jest.fn().mockResolvedValue([
          {
            id: 'pkg-1',
            title: 'Package',
            dataAmount: 10,
            dataUnit: 'GB',
            duration: 30,
            wholesalePrice: 24.99,
            currency: 'USD',
            coverage: ['US'],
          },
        ]),
      };

      mockProvidersService.getAdapter.mockReturnValue(mockAdapter);
      mockPrisma.provider.findUnique.mockResolvedValue({
        id: providerId,
        slug: 'airalo',
        config: {},
      });
      mockPrisma.syncHistory.create.mockResolvedValue({
        id: 'sync-1',
        providerId,
      });
      mockPrisma.package.upsert.mockResolvedValue({ id: 'pkg-1' });
      mockPrisma.package.updateMany.mockResolvedValue({ count: 0 });

      await service.syncProvider(providerId);

      expect(mockPrisma.syncHistory.update).toHaveBeenCalledWith({
        where: { id: 'sync-1' },
        data: expect.objectContaining({
          syncCompletedAt: expect.any(Date),
          packagesSynced: 1,
          packagesFailed: 0,
          syncDurationMs: expect.any(Number),
        }),
      });
    });
  });

  describe('syncAll', () => {
    it('should prevent concurrent syncs', async () => {
      mockHealthService.getHealthyProviderIds.mockResolvedValue(['airalo']);

      // Set isSyncing to true
      service['isSyncing'] = true;

      const loggerSpy = jest.spyOn(service['logger'], 'warn');

      await service.syncAll();

      expect(loggerSpy).toHaveBeenCalledWith('Sync already in progress, skipping');
    });

    it('should sync all healthy providers', async () => {
      mockHealthService.getHealthyProviderIds.mockResolvedValue(['airalo', 'esimgo']);

      const mockAdapter = {
        searchPackages: jest.fn().mockResolvedValue([]),
      };

      mockProvidersService.getAdapter.mockReturnValue(mockAdapter);
      mockPrisma.provider.findUnique.mockResolvedValue({
        id: 'airalo',
        slug: 'airalo',
        config: {},
      });
      mockPrisma.syncHistory.create.mockResolvedValue({
        id: 'sync-1',
        providerId: 'airalo',
      });
      mockPrisma.package.updateMany.mockResolvedValue({ count: 0 });

      await service.syncAll();

      expect(mockHealthService.getHealthyProviderIds).toHaveBeenCalled();
    });

    it('should continue on provider sync failure', async () => {
      mockHealthService.getHealthyProviderIds.mockResolvedValue(['airalo', 'esimgo']);

      mockProvidersService.getAdapter.mockReturnValue({
        searchPackages: jest.fn().mockRejectedValue(new Error('API Error')),
      });
      mockPrisma.provider.findUnique.mockResolvedValue({
        id: 'airalo',
        slug: 'airalo',
        config: {},
      });
      mockPrisma.syncHistory.create.mockResolvedValue({
        id: 'sync-1',
        providerId: 'airalo',
      });

      // Should not throw
      await expect(service.syncAll()).resolves.not.toThrow();
    });
  });

  describe('sync history tracking', () => {
    it('should create sync history record at start', async () => {
      const providerId = 'airalo';
      const mockAdapter = {
        searchPackages: jest.fn().mockResolvedValue([]),
      };

      mockProvidersService.getAdapter.mockReturnValue(mockAdapter);
      mockPrisma.provider.findUnique.mockResolvedValue({
        id: providerId,
        slug: 'airalo',
        config: {},
      });
      mockPrisma.syncHistory.create.mockResolvedValue({
        id: 'sync-1',
        providerId,
        syncStartedAt: new Date(),
      });
      mockPrisma.package.updateMany.mockResolvedValue({ count: 0 });

      await service.syncProvider(providerId);

      expect(mockPrisma.syncHistory.create).toHaveBeenCalledWith({
        data: {
          providerId,
          syncStartedAt: expect.any(Date),
        },
      });
    });

    it('should record error message on failure', async () => {
      const providerId = 'airalo';
      const errorMessage = 'Connection timeout';

      mockProvidersService.getAdapter.mockReturnValue({
        searchPackages: jest.fn().mockRejectedValue(new Error(errorMessage)),
      });
      mockPrisma.provider.findUnique.mockResolvedValue({
        id: providerId,
        slug: 'airalo',
        config: {},
      });
      mockPrisma.syncHistory.create.mockResolvedValue({
        id: 'sync-1',
        providerId,
      });

      await expect(service.syncProvider(providerId)).rejects.toThrow();

      expect(mockPrisma.syncHistory.update).toHaveBeenCalledWith({
        where: { id: 'sync-1' },
        data: expect.objectContaining({
          errorMessage: errorMessage,
        }),
      });
    });
  });
});
