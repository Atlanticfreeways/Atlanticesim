import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { LoggerService } from '../services/logger.service';

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  constructor(private logger: LoggerService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const { method, path, ip } = req;
    const user = (req as any).user;
    const userId = user?.id;
    const startTime = Date.now();

    // Log incoming request
    this.logger.logRequest(method, path, userId);

    // Capture response
    const originalSend = res.send;
    res.send = function (data: any) {
      const duration = Date.now() - startTime;
      const statusCode = res.statusCode;

      // Log response
      this.logger.logResponse(method, path, statusCode, duration);

      // Call original send
      return originalSend.call(this, data);
    };

    next();
  }
}
