import { Test, TestingModule } from '@nestjs/testing';
import { PackagesService } from './packages.service';
import { ProvidersService } from '../providers/providers.service';
import { PricingService } from './pricing.service';
import { PrismaService } from '../../config/prisma.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('PackagesService', () => {
  let service: PackagesService;
  let prisma: any;
  let providersService: any;
  let pricingService: any;
  let cacheManager: any;

  const mockDbPackage = {
    id: 'db-1', providerPackageId: 'pkg-ext-1', name: '5GB France',
    description: 'Data plan', countries: ['FR'], dataAmount: 5120,
    dataUnit: 'MB', isUnlimited: false, validityDays: 30,
    price: { toNumber: () => 10.0 }, currency: 'USD',
    packageType: 'DATA_ONLY', scopeType: 'LOCAL',
    voiceMinutes: null, smsCount: null, isActive: true,
    providerId: 'prov-1',
    provider: { slug: 'airalo', name: 'Airalo' },
  };

  beforeEach(async () => {
    prisma = {
      package: {
        findMany: jest.fn().mockResolvedValue([mockDbPackage]),
      },
    };
    providersService = {
      searchFromAllProviders: jest.fn().mockResolvedValue([]),
      getAdapter: jest.fn(),
    };
    pricingService = {
      calculateRetailPrice: jest.fn().mockResolvedValue(12.0),
      formatPrice: jest.fn((p) => p),
    };
    cacheManager = { get: jest.fn().mockResolvedValue(null), set: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PackagesService,
        { provide: PrismaService, useValue: prisma },
        { provide: ProvidersService, useValue: providersService },
        { provide: PricingService, useValue: pricingService },
        { provide: CACHE_MANAGER, useValue: cacheManager },
      ],
    }).compile();

    service = module.get(PackagesService);
  });

  describe('searchPackages', () => {
    it('should return cached results if available', async () => {
      cacheManager.get.mockResolvedValue([{ id: 'cached' }]);
      const result = await service.searchPackages({ countries: ['FR'] });
      expect(result).toEqual([{ id: 'cached' }]);
      expect(prisma.package.findMany).not.toHaveBeenCalled();
    });

    it('should search DB first and return results', async () => {
      const result = await service.searchPackages({ countries: ['FR'] });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('pkg-ext-1');
      expect(result[0].retailPrice).toBe(12.0);
      expect(prisma.package.findMany).toHaveBeenCalled();
    });

    it('should fall back to live search when DB returns empty', async () => {
      prisma.package.findMany.mockResolvedValue([]);
      providersService.searchFromAllProviders.mockResolvedValue([
        { id: 'live-1', wholesalePrice: 8, providerId: 'airalo' },
      ]);
      const result = await service.searchPackages({ countries: ['JP'] });
      expect(providersService.searchFromAllProviders).toHaveBeenCalled();
      expect(result).toHaveLength(1);
    });

    it('should apply packageType filter', async () => {
      await service.searchPackages({ packageType: 'DATA_ONLY' });
      expect(prisma.package.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ packageType: 'DATA_ONLY' }),
        }),
      );
    });

    it('should apply price range filter', async () => {
      await service.searchPackages({ minPrice: 5, maxPrice: 20 });
      expect(prisma.package.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            price: { gte: 5, lte: 20 },
          }),
        }),
      );
    });

    it('should apply pagination', async () => {
      await service.searchPackages({ page: 2, limit: 10 });
      expect(prisma.package.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 10, take: 10 }),
      );
    });

    it('should sort by data descending', async () => {
      await service.searchPackages({ sortBy: 'data' });
      expect(prisma.package.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { dataAmount: 'desc' } }),
      );
    });

    it('should cache results for 5 minutes', async () => {
      await service.searchPackages({ countries: ['FR'] });
      expect(cacheManager.set).toHaveBeenCalledWith(expect.any(String), expect.any(Array), 300000);
    });
  });

  describe('getPackageDetails', () => {
    it('should throw BadRequestException without providerId', async () => {
      await expect(service.getPackageDetails('pkg-1', '')).rejects.toThrow(BadRequestException);
    });

    it('should return cached details', async () => {
      cacheManager.get.mockResolvedValue({ id: 'cached-pkg' });
      const result = await service.getPackageDetails('pkg-1', 'airalo');
      expect(result).toEqual({ id: 'cached-pkg' });
    });

    it('should fetch from adapter on cache miss', async () => {
      const mockPkg = { id: 'pkg-1', wholesalePrice: 10, isActive: true };
      providersService.getAdapter.mockReturnValue({
        getPackageDetails: jest.fn().mockResolvedValue(mockPkg),
      });
      const result = await service.getPackageDetails('pkg-1', 'airalo');
      expect(result.id).toBe('pkg-1');
    });

    it('should throw NotFoundException when adapter returns null', async () => {
      providersService.getAdapter.mockReturnValue({
        getPackageDetails: jest.fn().mockResolvedValue(null),
      });
      await expect(service.getPackageDetails('bad', 'airalo')).rejects.toThrow(NotFoundException);
    });
  });
});
