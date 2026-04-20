import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { ProvidersModule } from '../providers/providers.module';
import { PackagesModule } from '../packages/packages.module';
import { UsersModule } from '../users/users.module';
import { BullModule } from '@nestjs/bull';

@Module({
  imports: [
    ProvidersModule,
    PackagesModule,
    UsersModule,
    BullModule.registerQueue({ name: 'activations' }),
  ],
  providers: [OrdersService],
  controllers: [OrdersController],
  exports: [OrdersService],
})
export class OrdersModule {}