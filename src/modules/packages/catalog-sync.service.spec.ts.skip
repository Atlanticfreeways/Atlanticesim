import { Test, TestingModule } from '@nestjs/testing';
import { CatalogSyncService } from './catalog-sync.service';
import { PrismaService } from '../../config/prisma.service';
import { ProvidersService } from '../providers/providers.service';
import { ProviderHealthService } from '../providers/provider-health.service';

describe('CatalogSyncService', () => {
  let service: CatalogSyncService;
  let mockPrisma: any;
  let mockProviders: any;
  let mockHealth: any;

  beforeEach(async () => {
    mockPrisma = {
      provider: { findUnique: jest.fn().mockResolvedValue({ id: 'prov-1', slug: 'airalo' }) },
      package: {
        upsert: jest.fn().mockResolvedValue({ id: 'pkg-1' }),
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
    };

    const mockAdapter = {
      searchPackages: jest.fn().mockResolvedValue([
        {
          id: 'ext-pkg-1', title: 'US 5GB', description: 'Test', dataAmount: 5, dataUnit: 'GB',
          duration: 30, wholesalePrice: 10, currency: 'USD', coverage: ['US'], meta: {},
        },
      ]),
    };

    mockProviders = { getAdapter: jest.fn().mockReturnValue(mockAdapter) };
    mockHealth = { getHealthyProviderIds: jest.fn().mockReturnValue(['airalo']) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CatalogSyncService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ProvidersService, useValue: mockProviders },
        { provide: ProviderHealthService, useValue: mockHealth },
      ],
    }).compile();

    service = module.get<CatalogSyncService>(CatalogSyncService);
  });

  it('should sync packages from healthy providers', async () => {
    const result = await service.syncAll();
    expect(result.totalUpserted).toBe(1);
    expect(result.totalDeactivated).toBe(0);
    expect(mockPrisma.package.upsert).toHaveBeenCalledTimes(1);
  });

  it('should deactivate stale packages', async () => {
    mockPrisma.package.updateMany.mockResolvedValue({ count: 3 });
    const result = await service.syncAll();
    expect(result.totalDeactivated).toBe(3);
  });

  it('should handle provider sync failure gracefully', async () => {
    mockProviders.getAdapter.mockImplementation(() => { throw new Error('Adapter not found'); });
    const result = await service.syncAll();
    expect(result.totalUpserted).toBe(0);
  });

  it('should skip sync when no healthy providers', async () => {
    mockHealth.getHealthyProviderIds.mockReturnValue([]);
    const result = await service.syncAll();
    expect(result.totalUpserted).toBe(0);
    expect(result.totalDeactivated).toBe(0);
  });
});
