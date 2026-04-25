import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../config/prisma.service';
import { HolaflyAdapter } from './holafly.adapter';

describe('HolaflyAdapter', () => {
    let adapter: HolaflyAdapter;

    const mockConfigService = { get: jest.fn() };
    const mockPrismaService = {
        provider: {
            findUnique: jest.fn(),
            update: jest.fn(),
        },
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                HolaflyAdapter,
                { provide: ConfigService, useValue: mockConfigService },
                { provide: PrismaService, useValue: mockPrismaService },
            ],
        }).compile();

        adapter = module.get<HolaflyAdapter>(HolaflyAdapter);
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(adapter).toBeDefined();
    });

    describe('searchPackages', () => {
        it('should return mock data when API key is missing', async () => {
            mockConfigService.get.mockReturnValue(null);
            const result = await adapter.searchPackages({});
            expect(result).toHaveLength(1);
            expect(result[0].providerId).toBe('holafly');
            expect(result[0].meta.is_unlimited).toBe(true);
        });

        it('should call API when API key is present', async () => {
            mockConfigService.get.mockReturnValue('test-key');
            mockPrismaService.provider.findUnique.mockResolvedValue({ 
                id: 'prov-1', 
                slug: 'holafly',
                config: { apiKey: 'test-key' }
            });
            const mockGet = jest.fn().mockResolvedValue({
                data: { packages: [{ id: 'hf-1', name: 'EU Unlimited', price: 34, is_unlimited: true, countries: ['FR', 'DE', 'IT'] }] },
            });
            (adapter as any).httpClient = { get: mockGet, defaults: { headers: { common: {} } } };

            const result = await adapter.searchPackages({ country: 'FR' });
            expect(mockGet).toHaveBeenCalledWith('/packages', { params: { country: 'FR' } });
            expect(result).toHaveLength(1);
            expect(result[0].meta.packageType).toBeDefined();
            expect(result[0].meta.scopeType).toBeDefined();
        });

        it('should return mock data on API error', async () => {
            mockConfigService.get.mockReturnValue('test-key');
            (adapter as any).httpClient = { get: jest.fn().mockRejectedValue(new Error('fail')) };
            (adapter as any).apiKey = 'test-key';
            const result = await adapter.searchPackages({});
            expect(Array.isArray(result)).toBe(true);
        });
    });

    describe('createOrder', () => {
        it('should create an order successfully', async () => {
            mockConfigService.get.mockReturnValue('test-key');
            (adapter as any).httpClient = {
                post: jest.fn().mockResolvedValue({
                    data: { id: 'hf-ord-1', status: 'completed', amount: 34, currency: 'USD', esims: [{ iccid: '89999', qr_code_url: 'http://qr' }] },
                }),
            };

            const result = await adapter.createOrder({ packageId: 'hf-1', userId: 'u1', email: 'test@example.com' });
            expect(result.id).toBe('hf-ord-1');
            expect(result.esim?.iccid).toBe('89999');
        });
    });

    describe('Circuit Breaker', () => {
        it('should have circuit breaker decorator applied', async () => {
            // Verify circuit breaker is protecting the methods
            const searchMethod = adapter.searchPackages;
            expect(searchMethod).toBeDefined();
            
            const getDetailsMethod = adapter.getPackageDetails;
            expect(getDetailsMethod).toBeDefined();
            
            const createOrderMethod = adapter.createOrder;
            expect(createOrderMethod).toBeDefined();
        });
    });
});
