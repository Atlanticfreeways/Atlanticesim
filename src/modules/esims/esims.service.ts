import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { ProvidersService } from '../providers/providers.service';
import { ESimStatus } from '@prisma/client';
import * as QRCode from 'qrcode';

@Injectable()
export class EsimsService {
  constructor(
    private prisma: PrismaService,
    private providersService: ProvidersService,
  ) {}

  async getUserEsims(userId: string) {
    return this.prisma.eSim.findMany({
      where: { userId },
      include: {
        order: {
          include: {
            package: true,
            provider: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getEsimById(esimId: string, userId: string) {
    const esim = await this.prisma.eSim.findFirst({
      where: { id: esimId, userId },
      include: {
        order: {
          include: {
            package: true,
            provider: true,
          },
        },
      },
    });

    if (!esim) {
      throw new NotFoundException('eSIM not found');
    }

    return esim;
  }

  async getQrCode(esimId: string, userId: string) {
    const esim = await this.getEsimById(esimId, userId);
    
    if (!esim.qrCode) {
      // Generate QR code if not exists
      const qrData = `LPA:1$${esim.smdpAddress}$${esim.activationCode}`;
      const qrCodeDataUrl = await QRCode.toDataURL(qrData);
      
      await this.prisma.eSim.update({
        where: { id: esimId },
        data: { qrCode: qrCodeDataUrl },
      });
      
      return { qrCode: qrCodeDataUrl };
    }

    return { qrCode: esim.qrCode };
  }

  async getUsageData(esimId: string, userId: string) {
    const esim = await this.getEsimById(esimId, userId);
    
    try {
      const adapter = this.providersService.getAdapter(esim.order.provider.slug);
      const usage = await adapter.getUsageData(esim.iccid);
      
      // Update local usage data
      await this.prisma.eSim.update({
        where: { id: esimId },
        data: {
          dataUsed: usage.dataUsed,
          validUntil: usage.validUntil,
        },
      });
      
      return usage;
    } catch (error) {
      // Return cached data if provider unavailable
      return {
        dataUsed: esim.dataUsed,
        dataTotal: esim.dataTotal,
        validUntil: esim.validUntil,
      };
    }
  }

  async activateEsim(esimId: string, userId: string) {
    const esim = await this.getEsimById(esimId, userId);
    
    if (esim.status !== ESimStatus.INACTIVE) {
      throw new Error('eSIM is already activated or cannot be activated');
    }

    const adapter = this.providersService.getAdapter(esim.order.provider.slug);
    const result = await adapter.activateESIM(esim.iccid);

    if (result.success) {
      await this.prisma.eSim.update({
        where: { id: esimId },
        data: {
          status: ESimStatus.ACTIVE,
          activatedAt: new Date(),
        },
      });
    }

    return result;
  }
}