import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BreezeAdapter } from './breeze.adapter';

describe('BreezeAdapter', () => {
    let adapter: BreezeAdapter;
    let configService: ConfigService;

    const mockConfigService = {
        get: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                BreezeAdapter,
                {
                    provide: ConfigService,
                    useValue: mockConfigService,
                },
            ],
        }).compile();

        adapter = module.get<BreezeAdapter>(BreezeAdapter);
        configService = module.get<ConfigService>(ConfigService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(adapter).toBeDefined();
    });

    describe('searchPackages', () => {
        it('should return mock data when API key is missing', async () => {
            mockConfigService.get.mockReturnValue(null); // No API Key

            const result = await adapter.searchPackages({ country: 'US' });

            expect(result).toHaveLength(1);
            expect(result[0].providerId).toBe('breeze');
        });

        it('should call API when API key is present', async () => {
            mockConfigService.get.mockImplementation((key) => {
                if (key === 'BREEZE_API_KEY') return 'test-key';
                return null;
            });

            const mockGet = jest.fn().mockResolvedValue({
                data: {
                    bundles: [
                        {
                            code: 'bundle-1',
                            name: 'Test Plan',
                            price: '15.00',
                            volume: '1GB',
                        }
                    ]
                }
            });
            (adapter as any).httpClient = { get: mockGet };

            const result = await adapter.searchPackages({ country: 'US' });

            expect(mockGet).toHaveBeenCalledWith('/bundles', { params: { iso: 'US' } });
            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('bundle-1');
        });

        it('should return empty array on API error', async () => {
            mockConfigService.get.mockReturnValue('test-key');

            const mockGet = jest.fn().mockRejectedValue(new Error('API Error'));
            (adapter as any).httpClient = { get: mockGet };

            const result = await adapter.searchPackages({ country: 'US' });

            expect(result).toEqual([]);
        });
    });

    describe('createOrder', () => {
        it('should create an order successfully', async () => {
            mockConfigService.get.mockReturnValue('test-key');

            const mockPost = jest.fn().mockResolvedValue({
                data: {
                    id: 'ord-123',
                    status: 'success',
                    cost: 20,
                    currency: 'USD',
                    esim: { iccid: '89123456789' }
                }
            });
            (adapter as any).httpClient = { post: mockPost };

            const result = await adapter.createOrder({
                packageId: 'bundle-1',
                userId: 'user-1',
                email: 'test@example.com'
            });

            expect(mockPost).toHaveBeenCalled();
            expect(result.id).toBe('ord-123');
            expect(result.status).toBe('completed');
        });
    });
});
