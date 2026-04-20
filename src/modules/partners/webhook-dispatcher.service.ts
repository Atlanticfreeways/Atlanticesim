import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import axios from 'axios';
import * as crypto from 'crypto';

@Injectable()
export class WebhookDispatcherService {
  private readonly logger = new Logger(WebhookDispatcherService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Dispatch a webhook event to a specific user/partner
   * Logic: Fetch config -> Sign payload -> POST to URL
   */
  async dispatch(userId: string, event: string, payload: any) {
    const config = await this.prisma.webhookConfig.findUnique({
      where: { userId },
    });

    if (!config || !config.isActive) {
      return;
    }

    // Check if partner is subscribed to this specific event
    if (config.events.length > 0 && !config.events.includes(event)) {
        return;
    }

    const timestamp = Date.now().toString();
    const body = JSON.stringify({
        event,
        timestamp,
        data: payload
    });

    // HMAC Signature logic (Institutional Standard)
    const signature = crypto
      .createHmac('sha256', config.secret)
      .update(body)
      .digest('hex');

    this.logger.log(`[Webhooks] Dispatching ${event} to ${config.url} for User ${userId}`);

    try {
      await axios.post(config.url, body, {
        headers: {
          'Content-Type': 'application/json',
          'X-Atlantic-Signature': signature,
          'X-Atlantic-Timestamp': timestamp,
        },
        timeout: 5000,
      });
      this.logger.log(`[Webhooks] Successfully delivered ${event} to ${userId}`);
    } catch (error) {
      this.logger.error(`[Webhooks] Delivery FAILED for ${event} to ${userId}: ${error.message}`);
      // In a real system, we'd add this to a BullMQ 'webhook-retry' queue
      throw error; 
    }
  }
}
