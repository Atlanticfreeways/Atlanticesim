import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EsimCardAdapter } from './esimcard.adapter';

describe('EsimCardAdapter', () => {
    let adapter: EsimCardAdapter;

    const mockConfigService = { get: jest.fn() };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                EsimCardAdapter,
                { provide: ConfigService, useValue: mockConfigService },
            ],
        }).compile();

        adapter = module.get<EsimCardAdapter>(EsimCardAdapter);
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
            expect(result[0].providerId).toBe('esimcard');
        });

        it('should call API when API key is present', async () => {
            mockConfigService.get.mockReturnValue('test-key');
            const mockGet = jest.fn().mockResolvedValue({
                data: { packages: [{ id: 'pkg-1', name: 'Test', price: 25, data: '10', countries: ['US', 'GB'] }] },
            });
            (adapter as any).httpClient = { get: mockGet };

            const result = await adapter.searchPackages({ country: 'US' });
            expect(mockGet).toHaveBeenCalledWith('/packages', { params: { iso: 'US' } });
            expect(result).toHaveLength(1);
            expect(result[0].meta.packageType).toBeDefined();
            expect(result[0].meta.scopeType).toBeDefined();
        });

        it('should return empty array on API error', async () => {
            mockConfigService.get.mockReturnValue('test-key');
            (adapter as any).httpClient = { get: jest.fn().mockRejectedValue(new Error('fail')) };
            const result = await adapter.searchPackages({});
            expect(result).toEqual([]);
        });
    });

    describe('createOrder', () => {
        it('should create an order successfully', async () => {
            mockConfigService.get.mockReturnValue('test-key');
            (adapter as any).httpClient = {
                post: jest.fn().mockResolvedValue({
                    data: { id: 'ord-1', status: 'completed', price: 25, currency: 'USD', esims: [{ iccid: '891234', qr_code_url: 'http://qr', activation_code: 'AC1' }] },
                }),
            };

            const result = await adapter.createOrder({ packageId: 'pkg-1', userId: 'u1', email: 'test@example.com' });
            expect(result.id).toBe('ord-1');
            expect(result.esim?.iccid).toBe('891234');
        });
    });
});
