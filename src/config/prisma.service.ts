import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(PrismaService.name);

  constructor(private readonly config: ConfigService) {
    const url = config.get<string>('DATABASE_URL');
    super({ datasources: { db: { url } }, log: ['warn', 'error'] });
  }

  async onModuleInit() {
    const maxRetries = 5;
    let retries = 0;

    while (retries < maxRetries) {
      try {
        this.logger.log('Connecting to database...');
        await this.$connect();
        this.logger.log('✅ Database connected');
        return;
      } catch (error) {
        retries++;
        this.logger.error(`❌ Connection failed (${retries}/${maxRetries}): ${error.message}`);

        if (retries === maxRetries) {
          throw new Error(`Database unreachable after ${maxRetries} attempts: ${error.message}`);
        }

        const wait = Math.pow(2, retries) * 1000;
        this.logger.warn(`⏳ Retrying in ${wait}ms...`);
        await new Promise(resolve => setTimeout(resolve, wait));
      }
    }
  }
}
