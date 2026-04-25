import { Test, TestingModule } from '@nestjs/testing';
import { ProviderRouterService } from './provider-router.service';
import { PrismaService } from '../../config/prisma.service';
import { ProviderHealthService } from './provider-health.service';

describe('ProviderRouterService', () => {
  let service: ProviderRouterService;
  let mockPrisma: any;
  let mockHealth: any;

  const mockProviders = [
    { slug: 'airalo', priority: 10, isActive: true, supportedPackageTypes: ['DATA_ONLY'], preferredRegions: ['EUROPE', 'NORTH_AMERICA'] },
    { slug: 'esim-go', priority: 15, isActive: true, supportedPackageTypes: ['DATA_ONLY', 'ALL_INCLUSIVE'], preferredRegions: ['EUROPE', 'ASIA_PACIFIC'] },
    { slug: 'holafly', priority: 25, isActive: true, supportedPackageTypes: ['DATA_WITH_ALL_UNLIMITED'], preferredRegions: ['SOUTH_AMERICA'] },
  ];

  beforeEach(async () => {
    mockHealth = { getHealthyProviderIds: jest.fn().mockReturnValue(['airalo', 'esim-go', 'holafly']) };
    mockPrisma = { provider: { findMany: jest.fn().mockResolvedValue(mockProviders) } };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProviderRouterService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ProviderHealthService, useValue: mockHealth },
      ],
    }).compile();

    service = module.get<ProviderRouterService>(ProviderRouterService);
  });

  it('should return highest priority provider by default', async () => {
    const result = await service.resolveOptimalProvider();
    expect(result).toBe('airalo');
  });

  it('should filter by packageType', async () => {
    const result = await service.resolveOptimalProvider(undefined, 'DATA_WITH_ALL_UNLIMITED');
    expect(result).toBe('holafly');
  });

  it('should prefer providers matching country region', async () => {
    const result = await service.resolveOptimalProvider('BR'); // South America
    expect(result).toBe('holafly');
  });

  it('should exclude specified providers for fallback', async () => {
    const result = await service.resolveOptimalProvider(undefined, undefined, ['airalo']);
    expect(result).toBe('esim-go');
  });

  it('should throw when no healthy providers', async () => {
    mockHealth.getHealthyProviderIds.mockReturnValue([]);
    await expect(service.resolveOptimalProvider()).rejects.toThrow('No healthy providers available');
  });

  it('should throw when no active providers in DB', async () => {
    mockPrisma.provider.findMany.mockResolvedValue([]);
    await expect(service.resolveOptimalProvider()).rejects.toThrow('No active providers available');
  });
});
