import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { ProvidersService } from '../../providers/providers.service';
import { ProviderRouterService } from '../../providers/provider-router.service';
import { PrismaService } from '../../../config/prisma.service';
import { WalletService } from '../../partners/wallet.service';
import { PartnerProfileService } from '../../partners/partner-profile.service';
import { WebhookDispatcherService } from '../../partners/webhook-dispatcher.service';
import { OrderStatus, UserRole } from '@prisma/client';

@Processor('activations')
export class ActivationProcessor {
  private readonly logger = new Logger(ActivationProcessor.name);

  constructor(
    private readonly providersService: ProvidersService,
    private readonly providerRouter: ProviderRouterService,
    private readonly prisma: PrismaService,
    private readonly walletService: WalletService,
    private readonly profileService: PartnerProfileService,
    private readonly webhookDispatcher: WebhookDispatcherService,
  ) {}

  @Process('activate-esim')
  async handleActivation(job: Job<{ orderId: string; providerId: string; packageId: string; userEmail: string; userId: string }>) {
    const { orderId, providerId, packageId, userEmail, userId } = job.data;
    this.logger.log(`[Queue] Activating Order: ${orderId} via ${providerId}`);

    try {
      const order = await this.prisma.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.PROCESSING },
        include: { user: true },
      });

      // B2B wallet deduction
      if (order.user.role === UserRole.BUSINESS_PARTNER) {
        const retailPrice = order.paymentAmount.toNumber();
        const wholesalePrice = await this.profileService.calculateWholesalePrice(userId, retailPrice);
        await this.walletService.deductForOrder(userId, wholesalePrice, orderId);
      }

      // Try primary provider
      let providerOrder;
      let usedProvider = providerId;
      try {
        const adapter = this.providersService.getAdapter(providerId);
        providerOrder = await adapter.createOrder({ packageId, userId, email: userEmail, quantity: 1 });
      } catch (primaryError) {
        this.logger.warn(`[Queue] Primary provider ${providerId} failed: ${primaryError.message}. Trying fallback...`);

        // Fallback: resolve alternate provider
        try {
          const fallbackSlug = await this.providerRouter.resolveOptimalProvider(undefined, undefined, [providerId]);
          const fallbackAdapter = this.providersService.getAdapter(fallbackSlug);
          providerOrder = await fallbackAdapter.createOrder({ packageId, userId, email: userEmail, quantity: 1 });
          usedProvider = fallbackSlug;
          this.logger.log(`[Queue] Fallback to ${fallbackSlug} succeeded for Order: ${orderId}`);
        } catch (fallbackError) {
          this.logger.error(`[Queue] Fallback also failed: ${fallbackError.message}`);
          throw primaryError; // Re-throw original to trigger Bull retry
        }
      }

      // Success — persist
      await this.prisma.$transaction(async (tx) => {
        await tx.order.update({
          where: { id: orderId },
          data: {
            status: OrderStatus.COMPLETED,
            providerId: usedProvider,
            transactionId: providerOrder.providerOrderId,
            meta: { providerMeta: providerOrder.meta },
          },
        });

        if (providerOrder.esim) {
          await tx.eSim.create({
            data: {
              orderId,
              userId,
              providerId: usedProvider,
              iccid: providerOrder.esim.iccid,
              qrCode: providerOrder.esim.qrCode,
              smdpAddress: providerOrder.esim.smdpAddress,
              activationCode: providerOrder.esim.activationCode,
              dataTotal: providerOrder.esim.dataTotal || 0,
            },
          });
        }
      });

      this.logger.log(`[Queue] Activation SUCCESS for Order: ${orderId} via ${usedProvider}`);

      this.webhookDispatcher.dispatch(userId, 'order.completed', {
        orderId, iccid: providerOrder.esim?.iccid, status: 'completed',
      }).catch(err => this.logger.warn(`[Queue] Webhook failed: ${err.message}`));

    } catch (error) {
      this.logger.error(`[Queue] Activation FAILED for Order: ${orderId}: ${error.message}`);

      if (job.attemptsMade >= (job.opts.attempts || 1) - 1) {
        await this.prisma.order.update({
          where: { id: orderId },
          data: { status: OrderStatus.FAILED, meta: { error: error.message } },
        });

        this.webhookDispatcher.dispatch(userId, 'order.failed', {
          orderId, error: error.message, status: 'failed',
        }).catch(err => this.logger.warn(`[Queue] Error webhook failed: ${err.message}`));
      }

      throw error;
    }
  }
}
