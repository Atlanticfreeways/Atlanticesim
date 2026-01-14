import { Module } from '@nestjs/common';
import { PackagesService } from './packages.service';
import { PackagesController } from './packages.controller';
import { ProvidersModule } from '../providers/providers.module';

@Module({
  imports: [ProvidersModule],
  providers: [PackagesService],
  controllers: [PackagesController],
  exports: [PackagesService],
})
export class PackagesModule {}