import { Order } from '@prisma/client';

export interface PaymentGateway {
  getName(): string;
  createPayment(order: Order): Promise<{ checkoutUrl: string; transactionId: string }>;
  verifyPayment(transactionId: string): Promise<boolean>;
  refundPayment(transactionId: string): Promise<boolean>;
}
