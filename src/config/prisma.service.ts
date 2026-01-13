import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: ['query', 'info', 'warn', 'error'],
    });
  }

  async onModuleInit() {
    const maxRetries = 5;
    let retries = 0;

    while (retries < maxRetries) {
      try {
        this.logger.log('Attempting to connect to database...');
        this.logger.log(`DATABASE_URL: ${process.env.DATABASE_URL?.replace(/password=[^@]+/, 'password=***')}`);
        
        await this.$connect();
        
        this.logger.log('✅ Successfully connected to database');
        return;
      } catch (error) {
        retries++;
        this.logger.error(`❌ Database connection failed (attempt ${retries}/${maxRetries})`);
        this.logger.error(`Error: ${error.message}`);
        
        if (retries === maxRetries) {
          this.logger.error('❌ Max retries reached. Database connection failed.');
          throw new Error(`Failed to connect to database after ${maxRetries} attempts: ${error.message}`);
        }
        
        const waitTime = Math.pow(2, retries) * 1000; // Exponential backoff
        this.logger.warn(`⏳ Retrying in ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
}