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
    try {
      this.logger.log('Attempting to connect to database...');
      this.logger.log(`DATABASE_URL: ${process.env.DATABASE_URL?.replace(/password=[^@]+/, 'password=***')}`);
      
      await this.$connect();
      
      this.logger.log('✅ Successfully connected to database');
      
      // Test query
      const result = await this.$queryRaw`SELECT current_database() as db, current_user as "user"`;
      this.logger.log(`Connected to database: ${JSON.stringify(result)}`);
    } catch (error) {
      this.logger.error('❌ Failed to connect to database');
      this.logger.error(`Error: ${error.message}`);
      this.logger.error(`Code: ${error.code}`);
      this.logger.error(`Full error: ${JSON.stringify(error, null, 2)}`);
      throw error;
    }
  }
}