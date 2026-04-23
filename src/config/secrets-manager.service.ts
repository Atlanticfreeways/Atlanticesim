import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SecretsManagerService implements OnModuleInit {
  private readonly logger = new Logger(SecretsManagerService.name);
  private client: any;
  private GetSecretValueCommand: any;

  constructor(private config: ConfigService) {}

  async onModuleInit() {
    if (this.config.get('SECRET_MANAGER_ENABLED') !== 'true') {
      this.logger.log('Secrets Manager disabled — using .env');
      return;
    }

    try {
      const sdk = require('@aws-sdk/client-secrets-manager');
      const region = this.config.get('AWS_REGION') || 'us-east-1';
      this.client = new sdk.SecretsManagerClient({ region });
      this.GetSecretValueCommand = sdk.GetSecretValueCommand;

      const env = this.config.get('NODE_ENV') || 'production';
      await this.loadSecret(`atlantic-esim/${env}/app`);
      await this.loadSecret(`atlantic-esim/${env}/providers`);
      await this.loadSecret(`atlantic-esim/${env}/database`);

      this.logger.log('All secrets loaded from AWS Secrets Manager');
    } catch (error) {
      this.logger.error(`Failed to load secrets: ${error.message}`);
      this.logger.warn('Falling back to .env values');
    }
  }

  private async loadSecret(secretId: string): Promise<void> {
    try {
      const response = await this.client.send(
        new this.GetSecretValueCommand({ SecretId: secretId }),
      );
      if (response.SecretString) {
        const secrets = JSON.parse(response.SecretString);
        for (const [key, value] of Object.entries(secrets)) {
          process.env[key] = value as string;
        }
        this.logger.log(`Loaded secret: ${secretId} (${Object.keys(secrets).length} keys)`);
      }
    } catch (error) {
      this.logger.warn(`Secret ${secretId} not found: ${error.message}`);
    }
  }

  async getSecret(secretId: string): Promise<Record<string, string> | null> {
    if (!this.client) return null;
    try {
      const response = await this.client.send(
        new this.GetSecretValueCommand({ SecretId: secretId }),
      );
      return response.SecretString ? JSON.parse(response.SecretString) : null;
    } catch {
      return null;
    }
  }
}
