import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { ProvidersModule } from '../providers/providers.module';
import { PackagesModule } from '../packages/packages.module';

@Module({
  imports: [ProvidersModule, PackagesModule],
  providers: [OrdersService],
  controllers: [OrdersController],
  exports: [OrdersService],
})
export class OrdersModule {}