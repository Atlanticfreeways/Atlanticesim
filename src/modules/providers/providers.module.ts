import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ProvidersService } from './providers.service';
import { ProviderHealthService } from './provider-health.service';
import { ProviderRouterService } from './provider-router.service';
import { ProviderHealthController } from './provider-health.controller';
import { AiraloAdapter } from './adapters/airalo.adapter';
import { MayaMobileAdapter } from './adapters/maya-mobile.adapter';
import { EsimCardAdapter } from './adapters/esimcard.adapter';
import { BreezeAdapter } from './adapters/breeze.adapter';
import { HolaflyAdapter } from './adapters/holafly.adapter';
import { EsimGoAdapter } from './adapters/esim-go.adapter';

@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [ProviderHealthController],
  providers: [
    ProvidersService,
    ProviderHealthService,
    ProviderRouterService,
    AiraloAdapter,
    EsimGoAdapter,
    MayaMobileAdapter,
    EsimCardAdapter,
    BreezeAdapter,
    HolaflyAdapter,
  ],
  exports: [ProvidersService, ProviderHealthService, ProviderRouterService],
})
export class ProvidersModule {}
