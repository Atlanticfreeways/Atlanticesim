import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { DataRetentionService } from './data-retention.service';

@Module({
  providers: [UsersService, DataRetentionService],
  controllers: [UsersController],
  exports: [UsersService, DataRetentionService],
})
export class UsersModule {}