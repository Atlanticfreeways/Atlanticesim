import { Module } from '@nestjs/common';
import { PartnersController } from './partners.controller';
import { PartnerConsoleController } from './partner-console.controller';
import { ProvidersModule } from '../providers/providers.module';

@Module({
  imports: [ProvidersModule],
  controllers: [PartnersController, PartnerConsoleController],
  providers: [],
})
export class PartnersModule {}
