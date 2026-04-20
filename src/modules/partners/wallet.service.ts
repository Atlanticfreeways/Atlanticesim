import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { TransactionType } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime';

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);

  constructor(private prisma: PrismaService) {}

  async getWallet(userId: string) {
    let wallet = await this.prisma.wallet.findUnique({
      where: { userId },
      include: { transactions: { take: 10, orderBy: { createdAt: 'desc' } } },
    });

    if (!wallet) {
      // Lazy create wallet for new partners
      wallet = await this.prisma.wallet.create({
        data: { userId, balance: 0.00 },
        include: { transactions: true },
      });
    }
    return wallet;
  }

  async deposit(userId: string, amount: number, description: string) {
    const wallet = await this.getWallet(userId);
    
    return this.prisma.$transaction(async (tx) => {
      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: { increment: amount },
        },
      });

      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          amount: new Decimal(amount),
          type: TransactionType.DEPOSIT,
          description,
        },
      });

      return updatedWallet;
    });
  }

  /**
   * Deduct wholesale price from partner wallet.
   * Ensures atomic balance check before deduction.
   */
  async deductForOrder(userId: string, wholesaleAmount: number, orderId: string) {
    const wallet = await this.getWallet(userId);

    if (wallet.balance.lessThan(wholesaleAmount)) {
      throw new BadRequestException('Insufficient wallet balance to process wholesale order.');
    }

    return this.prisma.$transaction(async (tx) => {
      // Verification inside transaction to prevent race conditions
      const currentWallet = await tx.wallet.findUnique({ where: { id: wallet.id } });
      if (currentWallet.balance.lessThan(wholesaleAmount)) {
        throw new BadRequestException('Insufficient balance detected during transaction.');
      }

      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: { decrement: wholesaleAmount },
        },
      });

      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          amount: new Decimal(wholesaleAmount).negated(),
          type: TransactionType.ORDER_PAYMENT,
          orderId,
          description: `Wholesale payment for order ${orderId}`,
        },
      });

      return updatedWallet;
    });
  }
}
