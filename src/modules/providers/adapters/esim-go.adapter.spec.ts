import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { EsimGoAdapter } from './esim-go.adapter';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('EsimGoAdapter', () => {
    let adapter: EsimGoAdapter;
    let mockHttpClient: any;

    const mockConfig = {
        ESIM_GO_BASE_URL: 'https://api.esim-go.com/v2.4',
        eSIM_Go_API_KEY: 'test-api-key',
    };

    beforeEach(async () => {
        jest.clearAllMocks();

        mockHttpClient = {
            get: jest.fn(),
            post: jest.fn(),
            defaults: {
                headers: {
                    common: {},
                },
            },
            interceptors: {
                request: { use: jest.fn(), eject: jest.fn() },
                response: { use: jest.fn(), eject: jest.fn() },
            },
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                {
                    provide: EsimGoAdapter,
                    useFactory: (configService: ConfigService) => {
                        return new EsimGoAdapter(configService, mockHttpClient);
                    },
                    inject: [ConfigService],
                },
                {
                    provide: ConfigService,
                    useValue: {
                        get: jest.fn((key) => mockConfig[key]),
                    },
                },
            ],
        }).compile();

        adapter = module.get<EsimGoAdapter>(EsimGoAdapter);
    });

    describe('Authentication', () => {
        it('should set X-API-Key header', async () => {
            mockHttpClient.get.mockResolvedValueOnce({ data: [] });
            await adapter.searchPackages({});
            expect(mockHttpClient.defaults.headers.common['X-API-Key']).toBe('test-api-key');
        });
    });

    describe('searchPackages', () => {
        it('should map catalogue response to packages', async () => {
            const mockBundle = {
                name: 'esim_1GB_7D_US_U',
                description: '1GB 7 Days US',
                countries: [{ iso: 'US' }],
                dataAmount: 1000,
                duration: 7,
                price: 5.0,
                unlimited: false,
                speed: ['4G']
            };

            mockHttpClient.get.mockResolvedValueOnce({ data: [mockBundle] });

            const result = await adapter.searchPackages({ country: 'US' });

            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('esim_1GB_7D_US_U');
            expect(result[0].dataUnit).toBe('MB');
            expect(result[0].meta.unlimited).toBe(false);
            expect(mockHttpClient.get).toHaveBeenCalledWith('/catalogue', expect.objectContaining({
                params: expect.objectContaining({ countries: 'US' })
            }));
        });
    });

    describe('createOrder', () => {
        it('should create order and fetch assignment details', async () => {
            const mockApplyResponse = {
                esims: [{ iccid: '8900000000000000001', status: 'ACTIVE' }],
                applyReference: 'ref-123'
            };

            const mockAssignmentResponse = [{
                iccid: '8900000000000000001',
                matchingId: 'MATCH-123',
                smdpAddress: 'smdp.test.com'
            }];

            mockHttpClient.post.mockResolvedValueOnce({ data: mockApplyResponse });
            mockHttpClient.get.mockResolvedValueOnce({ data: mockAssignmentResponse });

            const result = await adapter.createOrder({
                packageId: 'esim_1GB_7D_US_U',
                userId: 'user-1',
                email: 'test@example.com'
            });

            // Adapter prioritizes reference ID for order ID
            expect(result.id).toBe('ref-123');
            expect(result.esim.activationCode).toBe('MATCH-123');
            expect(result.esim.smdpAddress).toBe('smdp.test.com');
            // Verify LPA string construction
            expect(result.esim.qrCode).toBe('LPA:1$smdp.test.com$MATCH-123');

            expect(mockHttpClient.post).toHaveBeenCalledWith('/esims/apply', {
                bundles: [{ name: 'esim_1GB_7D_US_U' }]
            });
            expect(mockHttpClient.get).toHaveBeenCalledWith('/esims/assignments', {
                params: { reference: 'ref-123' }
            });
        });
    });
});
