import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Request } from 'express';

@Injectable()
export class CustomThrottleGuard extends ThrottlerGuard {
  protected getTracker(req: Request): string {
    // Use user ID if authenticated, otherwise use IP address
    const user = (req as any).user;
    if (user && user.id) {
      return user.id;
    }
    return req.ip || req.socket.remoteAddress || 'unknown';
  }

  protected getLimit(req: Request): number {
    // Different limits for different endpoints
    const path = req.path;

    // Auth endpoints: 5 requests per 15 minutes
    if (path.includes('/auth/')) {
      return 5;
    }

    // Payment endpoints: 10 requests per 15 minutes
    if (path.includes('/payments/')) {
      return 10;
    }

    // Default: 100 requests per 15 minutes
    return 100;
  }
}
