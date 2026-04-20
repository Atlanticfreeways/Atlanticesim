import { Injectable, Logger } from '@nestjs/common';
import { OrdersService } from '../orders/orders.service';
import { CreateOrderDto } from '../orders/dto/create-order.dto';

@Injectable()
export class BulkOrderService {
  private readonly logger = new Logger(BulkOrderService.name);

  constructor(private ordersService: OrdersService) {}

  /**
   * Process multiple orders in a single batch
   * Institutional Standard: Mapping quantity to individual activations
   */
  async processBulkOrder(userId: string, bulkParams: { packageId: string; providerId: string; quantity: number }) {
    this.logger.log(`[Bulk] Processing request for ${bulkParams.quantity} eSIMs for User ${userId}`);
    
    const orders = [];
    for (let i = 0; i < bulkParams.quantity; i++) {
        // Create an individual order for each quantity to ensure background activation isolation
        const orderDto: CreateOrderDto = {
            packageId: bulkParams.packageId,
            providerId: bulkParams.providerId,
            paymentMethod: 'wallet',
            idempotencyKey: `bulk_${userId}_${Date.now()}_${i}`
        };

        const order = await this.ordersService.createOrder(userId, orderDto);
        orders.push(order);
    }

    return {
        totalRequested: bulkParams.quantity,
        ordersCreated: orders.length,
        batchId: Date.now().toString(),
    };
  }
}
