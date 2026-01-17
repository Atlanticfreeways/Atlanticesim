import { Test, TestingModule } from '@nestjs/testing';
import { ProvidersService } from './providers.service';
import { AiraloAdapter } from './adapters/airalo.adapter';
import { EsimGoAdapter } from './adapters/esim-go.adapter';
import { MayaMobileAdapter } from './adapters/maya-mobile.adapter';
import { EsimCardAdapter } from './adapters/esimcard.adapter';
import { BreezeAdapter } from './adapters/breeze.adapter';
import { HolaflyAdapter } from './adapters/holafly.adapter';
import { PrismaService } from '../../config/prisma.service';
import { ConfigService } from '@nestjs/config';

describe('ProvidersService Integration', () => {
    let service: ProvidersService;
    let airaloAdapter: AiraloAdapter;
    let esimGoAdapter: EsimGoAdapter;

    beforeEach(async () => {
        // Create mocks for all dependencies
        const mockPrismaService = {};
        const mockConfigService = { get: jest.fn() };

        const mockAdapter = {
            searchPackages: jest.fn().mockResolvedValue([]),
            getAdapterName: jest.fn().mockReturnValue('Mock'),
            checkHealth: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ProvidersService,
                { provide: PrismaService, useValue: mockPrismaService },
                { provide: ConfigService, useValue: mockConfigService },
                {
                    provide: AiraloAdapter,
                    useValue: { ...mockAdapter, searchPackages: jest.fn().mockResolvedValue([{ id: 'airalo-1', providerId: 'airalo' }]) }
                },
                {
                    provide: EsimGoAdapter,
                    useValue: { ...mockAdapter, searchPackages: jest.fn().mockResolvedValue([{ id: 'esimgo-1', providerId: 'esim-go' }]) }
                },
                { provide: MayaMobileAdapter, useValue: mockAdapter },
                { provide: EsimCardAdapter, useValue: mockAdapter },
                { provide: BreezeAdapter, useValue: mockAdapter },
                { provide: HolaflyAdapter, useValue: mockAdapter },
            ],
        }).compile();

        service = module.get<ProvidersService>(ProvidersService);
        airaloAdapter = module.get<AiraloAdapter>(AiraloAdapter);
        esimGoAdapter = module.get<EsimGoAdapter>(EsimGoAdapter);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('searchFromAllProviders', () => {
        it('should aggregate results from all adapters', async () => {
            const results = await service.searchFromAllProviders({ country: 'US' });

            expect(results).toHaveLength(2);
            expect(results).toEqual(expect.arrayContaining([
                expect.objectContaining({ id: 'airalo-1' }),
                expect.objectContaining({ id: 'esimgo-1' }),
            ]));

            expect(airaloAdapter.searchPackages).toHaveBeenCalled();
            expect(esimGoAdapter.searchPackages).toHaveBeenCalled();
        });

        it('should handle adapter failures gracefully', async () => {
            // Mock one adapter to fail
            jest.spyOn(esimGoAdapter, 'searchPackages').mockRejectedValueOnce(new Error('Network Error'));

            const results = await service.searchFromAllProviders({ country: 'US' });

            // Should still return results from Airalo
            expect(results).toHaveLength(1);
            expect(results[0].id).toBe('airalo-1');
        });
    });
});
