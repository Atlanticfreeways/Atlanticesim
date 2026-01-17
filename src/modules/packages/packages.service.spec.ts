import { Test, TestingModule } from '@nestjs/testing';
import { PackagesService } from './packages.service';
import { ProvidersService } from '../providers/providers.service';
import { PrismaService } from '../../config/prisma.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { NotFoundException } from '@nestjs/common';

const mockPrismaService = {};
const mockProvidersService = {
    searchFromAllProviders: jest.fn(),
    getAdapter: jest.fn(),
    getAllProviders: jest.fn(),
};
const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
};

describe('PackagesService', () => {
    let service: PackagesService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PackagesService,
                { provide: PrismaService, useValue: mockPrismaService },
                { provide: ProvidersService, useValue: mockProvidersService },
                { provide: CACHE_MANAGER, useValue: mockCacheManager },
            ],
        }).compile();

        service = module.get<PackagesService>(PackagesService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('searchPackages', () => {
        it('should return cached packages if available', async () => {
            const filters = { country: 'US' };
            const cachedPackages = [{ id: 'pkg1' }];
            mockCacheManager.get.mockResolvedValue(cachedPackages);

            const result = await service.searchPackages(filters);
            expect(result).toEqual(cachedPackages);
            expect(mockProvidersService.searchFromAllProviders).not.toHaveBeenCalled();
        });

        it('should call providersService.searchFromAllProviders if cache miss', async () => {
            const filters = { country: 'US' };
            mockCacheManager.get.mockResolvedValue(null);
            const packages = [{ id: 'pkg1', price: 10 }];
            mockProvidersService.searchFromAllProviders.mockResolvedValue(packages);

            const result = await service.searchPackages(filters);
            expect(result).toEqual(packages);
            expect(mockCacheManager.set).toHaveBeenCalled();
        });
    });

    describe('getPackageDetails', () => {
        it('should return cached package details if available', async () => {
            mockCacheManager.get.mockResolvedValue({ id: 'pkg1' });
            const result = await service.getPackageDetails('pkg1', 'provider1');
            expect(result).toEqual({ id: 'pkg1' });
        });

        it('should fetch from provider if cache miss', async () => {
            mockCacheManager.get.mockResolvedValue(null);
            const pkg = { id: 'pkg1' };
            const mockAdapter = { getPackageDetails: jest.fn().mockResolvedValue(pkg) };
            mockProvidersService.getAdapter.mockReturnValue(mockAdapter);

            const result = await service.getPackageDetails('pkg1', 'provider1');
            expect(result).toEqual(pkg);
            expect(mockCacheManager.set).toHaveBeenCalled();
        });

        it('should throw NotFoundException if package not found', async () => {
            mockCacheManager.get.mockResolvedValue(null);
            const mockAdapter = { getPackageDetails: jest.fn().mockResolvedValue(null) };
            mockProvidersService.getAdapter.mockReturnValue(mockAdapter);

            await expect(service.getPackageDetails('pkg1', 'provider1')).rejects.toThrow(NotFoundException);
        });
    });
});
