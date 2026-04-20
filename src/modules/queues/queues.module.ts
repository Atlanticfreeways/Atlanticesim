import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ActivationProcessor } from './processors/activation.processor';
import { ProvidersModule } from '../providers/providers.module';

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
    ProvidersModule, // To access the adapters for async activation
  ],
  providers: [ActivationProcessor],
  exports: [BullModule],
})
export class QueuesModule {}
