import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { AiraloAdapter } from './airalo.adapter';

// Mock axios just for the token POST call
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('AiraloAdapter', () => {
    let adapter: AiraloAdapter;
    let mockHttpClient: any;

    const mockConfig = {
        AIRALO_API_URL: 'https://sandbox-api.airalo.com/v2',
        AIRALO_API_KEY: 'test-api-key',
        AIRALO_CLIENT_ID: 'test-client-id',
        AIRALO_CLIENT_SECRET: 'test-client-secret',
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
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                {
                    provide: AiraloAdapter,
                    useFactory: (configService: ConfigService) => {
                        return new AiraloAdapter(configService, mockHttpClient);
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

        adapter = module.get<AiraloAdapter>(AiraloAdapter);
    });

    describe('Authentication', () => {
        it('should fetch a new token if not present', async () => {
            const mockTokenResponse = {
                data: {
                    data: {
                        access_token: 'new-token',
                        expires_in: 3600,
                    },
                },
            };

            mockedAxios.post.mockResolvedValueOnce(mockTokenResponse);
            mockHttpClient.get.mockResolvedValueOnce({ data: { data: [] } });

            await adapter.searchPackages({});

            expect(mockedAxios.post).toHaveBeenCalledWith(
                expect.stringContaining('/token'),
                expect.objectContaining({
                    client_id: 'test-client-id',
                    client_secret: 'test-client-secret',
                }),
            );
        });
    });

    describe('searchPackages', () => {
        it('should map Airalo packages to unified format', async () => {
            const mockAiraloPkg = {
                id: 123,
                slug: 'france',
                data_amount: 1,
                data_unit: 'GB',
                validity: 7,
                price: 4.5,
                operator: {
                    title: 'Orange France',
                    description: 'High speed LTE',
                },
                type: 'local',
            };

            mockedAxios.post.mockResolvedValueOnce({
                data: { data: { access_token: 'tk', expires_in: 3600 } },
            });

            mockHttpClient.get.mockResolvedValueOnce({
                data: { data: [mockAiraloPkg] },
            });

            const result = await adapter.searchPackages({ country: 'FR' });

            expect(result).toHaveLength(1);
            expect(result[0]).toMatchObject({
                id: '123',
                title: 'Orange France',
                price: 4.5,
                dataAmount: 1,
                dataUnit: 'GB',
            });
        });
    });

    describe('createOrder', () => {
        it('should create order and map response correctly', async () => {
            const mockAiraloOrder = {
                id: 999,
                price: 15.0,
                sims: [{
                    iccid: '1234567890',
                    qrcode_url: 'http://qr',
                    activation_code: 'ACT123',
                    smdp_address: 'smdp.io'
                }]
            };

            mockedAxios.post.mockResolvedValueOnce({
                data: { data: { access_token: 'tk', expires_in: 3600 } },
            });

            mockHttpClient.post.mockResolvedValueOnce({
                data: { data: mockAiraloOrder },
            });

            const result = await adapter.createOrder({
                packageId: '123',
                userId: 'user1',
                email: 'test@example.com'
            });

            expect(result.id).toBe('999');
            expect(result.esim?.iccid).toBe('1234567890');
            expect(result.esim?.qrCode).toBe('http://qr');
        });
    });
});
