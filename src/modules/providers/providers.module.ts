import { Module } from '@nestjs/common';
import { ProvidersService } from './providers.service';
import { AiraloAdapter } from './adapters/airalo.adapter';
import { MayaMobileAdapter } from './adapters/maya-mobile.adapter';
import { EsimcardAdapter } from './adapters/esimcard.adapter';
import { BreezeAdapter } from './adapters/breeze.adapter';
import { HolaflyAdapter } from './adapters/holafly.adapter';

@Module({
  providers: [
    ProvidersService,
    AiraloAdapter,
    MayaMobileAdapter,
    EsimcardAdapter,
    BreezeAdapter,
    HolaflyAdapter,
  ],
  exports: [ProvidersService],
})
export class ProvidersModule {}