import { Module } from '@nestjs/common';
import { EsimsService } from './esims.service';
import { EsimsController } from './esims.controller';
import { ProvidersModule } from '../providers/providers.module';

@Module({
  imports: [ProvidersModule],
  providers: [EsimsService],
  controllers: [EsimsController],
  exports: [EsimsService],
})
export class EsimsModule {}