import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { EsimsService } from './esims.service';
import { PrismaService } from '../../config/prisma.service';
import { ProvidersService } from '../providers/providers.service';
import { ESimStatus } from '@prisma/client';
import * as QRCode from 'qrcode';

jest.mock('qrcode');

describe('EsimsService', () => {
  let service: EsimsService;
  let prismaService: PrismaService;
  let providersService: ProvidersService;

  const mockESim = {
    id: 'esim-1',
    orderId: 'order-1',
    userId: 'user-1',
    providerId: 'provider-1',
    iccid: 'iccid-123',
    qrCode: 'qr-code-data-url',
    smdpAddress: 'smdp.example.com',
    activationCode: 'act-code-123',
    dataTotal: 10240,
    dataUsed: 2048,
    status: ESimStatus.ACTIVE,
    activatedAt: new Date(),
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    createdAt: new Date(),
    updatedAt: new Date(),
    order: {
      id: 'order-1',
      userId: 'user-1',
      packageId: 'pkg-1',
      providerId: 'provider-1',
      paymentAmount: 29.99,
      paymentCurrency: 'USD',
      paymentMethod: 'card',
      status: 'CONFIRMED',
      transactionId: 'txn-123',
      createdAt: new Date(),
      updatedAt: new Date(),
      package: {
        id: 'pkg-1',
        name: '10GB Plan',
        dataAmount: 10,
        dataUnit: 'GB',
        price: 29.99,
        currency: 'USD',
      },
      provider: {
        id: 'provider-1',
        name: 'Provider A',
        slug: 'provider-a',
      },
    },
  };

  const mockInactiveESim = {
    ...mockESim,
    status: ESimStatus.INACTIVE,
    activatedAt: null,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EsimsService,
        {
          provide: PrismaService,
          useValue: {
            eSim: {
              findMany: jest.fn(),
              findFirst: jest.fn(),
              update: jest.fn(),
            },
          },
        },
        {
          provide: ProvidersService,
          useValue: {
            getAdapter: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<EsimsService>(EsimsService);
    prismaService = module.get<PrismaService>(PrismaService);
    providersService = module.get<ProvidersService>(ProvidersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserEsims', () => {
    it('should retrieve all user esims', async () => {
      const userId = 'user-1';
      const mockESims = [mockESim, { ...mockESim, id: 'esim-2' }];

      (prismaService.eSim.findMany as jest.Mock).mockResolvedValue(mockESims);

      const result = await service.getUserEsims(userId);

      expect(prismaService.eSim.findMany).toHaveBeenCalledWith({
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
      expect(result).toEqual(mockESims);
      expect(result.length).toBe(2);
    });

    it('should return empty array if user has no esims', async () => {
      const userId = 'user-no-esims';

      (prismaService.eSim.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.getUserEsims(userId);

      expect(result).toEqual([]);
    });

    it('should order results by creation date descending', async () => {
      const userId = 'user-1';

      (prismaService.eSim.findMany as jest.Mock).mockResolvedValue([mockESim]);

      await service.getUserEsims(userId);

      expect(prismaService.eSim.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        }),
      );
    });

    it('should include related order data', async () => {
      const userId = 'user-1';

      (prismaService.eSim.findMany as jest.Mock).mockResolvedValue([mockESim]);

      const result = await service.getUserEsims(userId);

      expect(result[0]).toHaveProperty('order');
      expect(result[0].order).toHaveProperty('package');
      expect(result[0].order).toHaveProperty('provider');
    });
  });

  describe('getEsimById', () => {
    it('should retrieve esim by id for authorized user', async () => {
      const esimId = 'esim-1';
      const userId = 'user-1';

      (prismaService.eSim.findFirst as jest.Mock).mockResolvedValue(mockESim);

      const result = await service.getEsimById(esimId, userId);

      expect(prismaService.eSim.findFirst).toHaveBeenCalledWith({
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
      expect(result).toEqual(mockESim);
    });

    it('should throw NotFoundException if esim not found', async () => {
      const esimId = 'nonexistent';
      const userId = 'user-1';

      (prismaService.eSim.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.getEsimById(esimId, userId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if esim belongs to different user', async () => {
      const esimId = 'esim-1';
      const userId = 'different-user';

      (prismaService.eSim.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.getEsimById(esimId, userId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should include all related data', async () => {
      const esimId = 'esim-1';
      const userId = 'user-1';

      (prismaService.eSim.findFirst as jest.Mock).mockResolvedValue(mockESim);

      const result = await service.getEsimById(esimId, userId);

      expect(result).toHaveProperty('order');
      expect(result.order).toHaveProperty('package');
      expect(result.order).toHaveProperty('provider');
    });
  });

  describe('getQrCode', () => {
    it('should return existing qr code', async () => {
      const esimId = 'esim-1';
      const userId = 'user-1';

      (prismaService.eSim.findFirst as jest.Mock).mockResolvedValue(mockESim);

      const result = await service.getQrCode(esimId, userId);

      expect(result).toHaveProperty('qrCode');
      expect(result.qrCode).toBe('qr-code-data-url');
    });

    it('should generate qr code if not exists', async () => {
      const esimId = 'esim-1';
      const userId = 'user-1';
      const esimWithoutQR = { ...mockESim, qrCode: null };
      const generatedQRCode = 'generated-qr-code-data-url';

      (prismaService.eSim.findFirst as jest.Mock).mockResolvedValue(
        esimWithoutQR,
      );
      (QRCode.toDataURL as jest.Mock).mockResolvedValue(generatedQRCode);
      (prismaService.eSim.update as jest.Mock).mockResolvedValue({
        ...esimWithoutQR,
        qrCode: generatedQRCode,
      });

      const result = await service.getQrCode(esimId, userId);

      expect(QRCode.toDataURL).toHaveBeenCalled();
      expect(prismaService.eSim.update).toHaveBeenCalled();
      expect(result.qrCode).toBe(generatedQRCode);
    });

    it('should generate qr code with correct data format', async () => {
      const esimId = 'esim-1';
      const userId = 'user-1';
      const esimWithoutQR = { ...mockESim, qrCode: null };

      (prismaService.eSim.findFirst as jest.Mock).mockResolvedValue(
        esimWithoutQR,
      );
      (QRCode.toDataURL as jest.Mock).mockResolvedValue('qr-code');
      (prismaService.eSim.update as jest.Mock).mockResolvedValue(mockESim);

      await service.getQrCode(esimId, userId);

      const expectedQRData = `LPA:1$${esimWithoutQR.smdpAddress}$${esimWithoutQR.activationCode}`;
      expect(QRCode.toDataURL).toHaveBeenCalledWith(
        expect.stringContaining('LPA:1'),
      );
    });

    it('should throw NotFoundException if esim not found', async () => {
      const esimId = 'nonexistent';
      const userId = 'user-1';

      (prismaService.eSim.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.getQrCode(esimId, userId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getUsageData', () => {
    it('should retrieve usage data from provider', async () => {
      const esimId = 'esim-1';
      const userId = 'user-1';
      const mockUsage = {
        dataUsed: 2048,
        dataTotal: 10240,
        validUntil: new Date(),
      };

      const mockAdapter = {
        getUsageData: jest.fn().mockResolvedValue(mockUsage),
      };

      (prismaService.eSim.findFirst as jest.Mock).mockResolvedValue(mockESim);
      (providersService.getAdapter as jest.Mock).mockReturnValue(mockAdapter);
      (prismaService.eSim.update as jest.Mock).mockResolvedValue(mockESim);

      const result = await service.getUsageData(esimId, userId);

      expect(mockAdapter.getUsageData).toHaveBeenCalledWith('iccid-123');
      expect(result).toEqual(mockUsage);
    });

    it('should update local usage data', async () => {
      const esimId = 'esim-1';
      const userId = 'user-1';
      const mockUsage = {
        dataUsed: 5000,
        dataTotal: 10240,
        validUntil: new Date(),
      };

      const mockAdapter = {
        getUsageData: jest.fn().mockResolvedValue(mockUsage),
      };

      (prismaService.eSim.findFirst as jest.Mock).mockResolvedValue(mockESim);
      (providersService.getAdapter as jest.Mock).mockReturnValue(mockAdapter);
      (prismaService.eSim.update as jest.Mock).mockResolvedValue(mockESim);

      await service.getUsageData(esimId, userId);

      expect(prismaService.eSim.update).toHaveBeenCalledWith({
        where: { id: esimId },
        data: {
          dataUsed: mockUsage.dataUsed,
          validUntil: mockUsage.validUntil,
        },
      });
    });

    it('should return cached data if provider unavailable', async () => {
      const esimId = 'esim-1';
      const userId = 'user-1';

      const mockAdapter = {
        getUsageData: jest
          .fn()
          .mockRejectedValue(new Error('Provider error')),
      };

      (prismaService.eSim.findFirst as jest.Mock).mockResolvedValue(mockESim);
      (providersService.getAdapter as jest.Mock).mockReturnValue(mockAdapter);

      const result = await service.getUsageData(esimId, userId);

      expect(result.dataUsed).toBe(mockESim.dataUsed);
      expect(result.dataTotal).toBe(mockESim.dataTotal);
    });

    it('should throw NotFoundException if esim not found', async () => {
      const esimId = 'nonexistent';
      const userId = 'user-1';

      (prismaService.eSim.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.getUsageData(esimId, userId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('activateEsim', () => {
    it('should activate inactive esim successfully', async () => {
      const esimId = 'esim-1';
      const userId = 'user-1';
      const activationResult = { success: true };

      const mockAdapter = {
        activateESIM: jest.fn().mockResolvedValue(activationResult),
      };

      (prismaService.eSim.findFirst as jest.Mock).mockResolvedValue(
        mockInactiveESim,
      );
      (providersService.getAdapter as jest.Mock).mockReturnValue(mockAdapter);
      (prismaService.eSim.update as jest.Mock).mockResolvedValue(mockESim);

      const result = await service.activateEsim(esimId, userId);

      expect(mockAdapter.activateESIM).toHaveBeenCalledWith('iccid-123');
      expect(prismaService.eSim.update).toHaveBeenCalledWith({
        where: { id: esimId },
        data: {
          status: ESimStatus.ACTIVE,
          activatedAt: expect.any(Date),
        },
      });
      expect(result).toEqual(activationResult);
    });

    it('should throw error if esim already active', async () => {
      const esimId = 'esim-1';
      const userId = 'user-1';

      (prismaService.eSim.findFirst as jest.Mock).mockResolvedValue(mockESim);

      await expect(service.activateEsim(esimId, userId)).rejects.toThrow(
        'eSIM is already activated or cannot be activated',
      );
    });

    it('should call provider activation method', async () => {
      const esimId = 'esim-1';
      const userId = 'user-1';
      const activationResult = { success: true };

      const mockAdapter = {
        activateESIM: jest.fn().mockResolvedValue(activationResult),
      };

      (prismaService.eSim.findFirst as jest.Mock).mockResolvedValue(
        mockInactiveESim,
      );
      (providersService.getAdapter as jest.Mock).mockReturnValue(mockAdapter);
      (prismaService.eSim.update as jest.Mock).mockResolvedValue(mockESim);

      await service.activateEsim(esimId, userId);

      expect(providersService.getAdapter).toHaveBeenCalledWith('provider-a');
      expect(mockAdapter.activateESIM).toHaveBeenCalledWith('iccid-123');
    });

    it('should throw NotFoundException if esim not found', async () => {
      const esimId = 'nonexistent';
      const userId = 'user-1';

      (prismaService.eSim.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.activateEsim(esimId, userId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should not update status if activation fails', async () => {
      const esimId = 'esim-1';
      const userId = 'user-1';
      const activationResult = { success: false };

      const mockAdapter = {
        activateESIM: jest.fn().mockResolvedValue(activationResult),
      };

      (prismaService.eSim.findFirst as jest.Mock).mockResolvedValue(
        mockInactiveESim,
      );
      (providersService.getAdapter as jest.Mock).mockReturnValue(mockAdapter);

      await service.activateEsim(esimId, userId);

      expect(prismaService.eSim.update).not.toHaveBeenCalled();
    });
  });

  describe('service initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should have all required methods', () => {
      expect(service.getUserEsims).toBeDefined();
      expect(service.getEsimById).toBeDefined();
      expect(service.getQrCode).toBeDefined();
      expect(service.getUsageData).toBeDefined();
      expect(service.activateEsim).toBeDefined();
    });

    it('should inject PrismaService', () => {
      expect(prismaService).toBeDefined();
    });

    it('should inject ProvidersService', () => {
      expect(providersService).toBeDefined();
    });
  });
});
