import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ActivationProcessor } from './processors/activation.processor';
import { ProvidersModule } from '../providers/providers.module';
import { PartnersModule } from '../partners/partners.module';

@Module({
  imports: [
    BullModule.registerQueue(
      {
        name: 'activations',
      },
      {
        name: 'notifications',
      }
    ),
    ProvidersModule,
    PartnersModule,
  ],
  providers: [ActivationProcessor],
  exports: [BullModule],
})
export class QueuesModule {}
