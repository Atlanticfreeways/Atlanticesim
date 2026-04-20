import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { ProvidersService } from '../../providers/providers.service';
import { PrismaService } from '../../../config/prisma.service';
import { WalletService } from '../wallet.service';
import { PartnerProfileService } from '../partner-profile.service';
import { WebhookDispatcherService } from '../webhook-dispatcher.service';
import { OrderStatus, UserRole } from '@prisma/client';

@Processor('activations')
export class ActivationProcessor {
  private readonly logger = new Logger(ActivationProcessor.name);

  constructor(
    private readonly providersService: ProvidersService,
    private readonly prisma: PrismaService,
    private readonly walletService: WalletService,
    private readonly profileService: PartnerProfileService,
    private readonly webhookDispatcher: WebhookDispatcherService,
  ) {}

  @Process('activate-esim')
  async handleActivation(job: Job<{ orderId: string; providerId: string; packageId: string; userEmail: string; userId: string }>) {
    const { orderId, providerId, packageId, userEmail, userId } = job.data;
    this.logger.log(`[Queue] Initializing activation for Order: ${orderId}`);

    try {
      // 1. Set Order to PROCESSING
      const order = await this.prisma.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.PROCESSING },
        include: { user: true }
      });

      // 2. [B2B LOGIC] Handle Wholesale Wallet Deductions
      if (order.user.role === UserRole.BUSINESS_PARTNER) {
        this.logger.debug(`[Queue] B2B Order detected for ${order.userId}. Processing wallet deduction...`);
        
        const retailPrice = order.paymentAmount.toNumber();
        const wholesalePrice = await this.profileService.calculateWholesalePrice(userId, retailPrice);
        
        await this.walletService.deductForOrder(userId, wholesalePrice, orderId);
        this.logger.log(`[Queue] Wallet deduction successful: $${wholesalePrice} subtracted for Order ${orderId}`);
      }

      // 3. Fetch Adapter
      const adapter = this.providersService.getAdapter(providerId);
      
      // 3. Trigger Provider Activation
      this.logger.log(`[Queue] Calling ${providerId} API for Package ${packageId}...`);
      const providerOrder = await adapter.createOrder({
        packageId,
        userId,
        email: userEmail,
        quantity: 1
      });

      // 4. Update Order with Success Data
      await this.prisma.$transaction(async (tx) => {
        // Update Order
        const updatedOrder = await tx.order.update({
          where: { id: orderId },
          data: {
            status: OrderStatus.COMPLETED,
            transactionId: providerOrder.providerOrderId,
            meta: { providerMeta: providerOrder.meta }
          }
        });

        // Create eSIM Record
        if (providerOrder.esim) {
          await tx.eSim.create({
            data: {
              orderId: updatedOrder.id,
              userId,
              providerId,
              iccid: providerOrder.esim.iccid,
              qrCode: providerOrder.esim.qrCode,
              smdpAddress: providerOrder.esim.smdpAddress,
              activationCode: providerOrder.esim.activationCode,
              dataTotal: providerOrder.esim.dataTotal || 0, // Should be fetched from bundle logic if missing
            },
          });
        }
      });

      this.logger.log(`[Queue] Activation SUCCESS for Order: ${orderId}`);

      // 5. [B2B WEBHOOK] Notify Partner (Asynchronous fire-and-forget)
      this.webhookDispatcher.dispatch(userId, 'order.completed', {
          orderId,
          iccid: providerOrder.esim?.iccid,
          status: 'completed'
      }).catch(err => this.logger.warn(`[Queue] Webhook notification failed but order is safe: ${err.message}`));

    } catch (error) {
      this.logger.error(`[Queue] Activation ATTEMPT FAILED for Order: ${orderId}: ${error.message}`);
      
      // If it's the last attempt, mark the order as FAILED
      if (job.attemptsMade >= (job.opts.attempts || 1) - 1) {
          this.logger.error(`[Queue] Final attempt failed for Order: ${orderId}. Marking as FAILED.`);
          await this.prisma.order.update({
            where: { id: orderId },
            data: {
              status: OrderStatus.FAILED,
              meta: { error: error.message }
            }
          });

          // [B2B WEBHOOK] Notify Partner of Failure
          this.webhookDispatcher.dispatch(userId, 'order.failed', {
            orderId,
            error: error.message,
            status: 'failed'
          }).catch(err => this.logger.warn(`[Queue] Error webhook failed: ${err.message}`));
      }

      throw error; // Rethrow to trigger Bull retry
    }
  }
}
