import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MonitoringService implements OnModuleInit {
  private readonly logger = new Logger(MonitoringService.name);

  constructor(private config: ConfigService) {}

  async onModuleInit() {
    this.initXRay();
    this.initSentry();
    this.initCloudWatch();
  }

  private initXRay() {
    if (this.config.get('XRAY_ENABLED') !== 'true') return;
    try {
      const AWSXRay = require('aws-xray-sdk');
      AWSXRay.captureHTTPsGlobal(require('http'));
      AWSXRay.captureHTTPsGlobal(require('https'));
      AWSXRay.capturePromise();
      this.logger.log('AWS X-Ray tracing enabled');
    } catch (e) {
      this.logger.warn(`X-Ray init skipped: ${e.message}`);
    }
  }

  private initSentry() {
    const dsn = this.config.get('SENTRY_DSN');
    if (!dsn) return;
    try {
      const Sentry = require('@sentry/node');
      Sentry.init({
        dsn,
        environment: this.config.get('NODE_ENV') || 'production',
        tracesSampleRate: 0.1,
        beforeSend(event: any) {
          if (event.user) {
            delete event.user.email;
            delete event.user.ip_address;
          }
          return event;
        },
      });
      this.logger.log('Sentry error tracking enabled');
    } catch (e) {
      this.logger.warn(`Sentry init skipped: ${e.message}`);
    }
  }

  private initCloudWatch() {
    const logGroup = this.config.get('CLOUDWATCH_LOG_GROUP');
    if (!logGroup) return;
    try {
      const winston = require('winston');
      const WinstonCloudWatch = require('winston-cloudwatch');
      const transport = new WinstonCloudWatch({
        logGroupName: logGroup,
        logStreamName: `app-${new Date().toISOString().split('T')[0]}`,
        awsRegion: this.config.get('AWS_REGION') || 'us-east-1',
        jsonMessage: true,
      });
      winston.add(transport);
      this.logger.log(`CloudWatch logging enabled → ${logGroup}`);
    } catch (e) {
      this.logger.warn(`CloudWatch init skipped: ${e.message}`);
    }
  }
}
