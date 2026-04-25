import { Test, TestingModule } from '@nestjs/testing';
import { WalletService } from './wallet.service';
import { PrismaService } from '../../config/prisma.service';
import { BadRequestException } from '@nestjs/common';
import { TransactionType } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

describe('WalletService', () => {
  let service: WalletService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    wallet: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    walletTransaction: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WalletService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<WalletService>(WalletService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getWallet', () => {
    const userId = 'user-123';

    it('should return existing wallet', async () => {
      const mockWallet = {
        id: 'wallet-123',
        userId,
        balance: new Decimal(100.00),
        transactions: [],
      };

      mockPrismaService.wallet.findUnique.mockResolvedValue(mockWallet);

      const result = await service.getWallet(userId);

      expect(result).toEqual(mockWallet);
      expect(mockPrismaService.wallet.findUnique).toHaveBeenCalledWith({
        where: { userId },
        include: { transactions: { take: 10, orderBy: { createdAt: 'desc' } } },
      });
    });

    it('should create wallet if not exists', async () => {
      const newWallet = {
        id: 'wallet-new',
        userId,
        balance: new Decimal(0.00),
        transactions: [],
      };

      mockPrismaService.wallet.findUnique.mockResolvedValue(null);
      mockPrismaService.wallet.create.mockResolvedValue(newWallet);

      const result = await service.getWallet(userId);

      expect(result).toEqual(newWallet);
      expect(mockPrismaService.wallet.create).toHaveBeenCalledWith({
        data: { userId, balance: 0.00 },
        include: { transactions: true },
      });
    });

    it('should include last 10 transactions', async () => {
      const mockWallet = {
        id: 'wallet-123',
        userId,
        balance: new Decimal(100.00),
        transactions: Array(10).fill({ id: 'tx', amount: 10 }),
      };

      mockPrismaService.wallet.findUnique.mockResolvedValue(mockWallet);

      const result = await service.getWallet(userId);

      expect(result.transactions).toHaveLength(10);
    });
  });

  describe('deposit', () => {
    const userId = 'user-123';
    const amount = 50.00;
    const description = 'Test deposit';

    it('should deposit funds successfully', async () => {
      const mockWallet = {
        id: 'wallet-123',
        userId,
        balance: new Decimal(100.00),
        transactions: [],
      };

      const updatedWallet = {
        ...mockWallet,
        balance: new Decimal(150.00),
      };

      mockPrismaService.wallet.findUnique.mockResolvedValue(mockWallet);
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        const tx = {
          wallet: {
            update: jest.fn().mockResolvedValue(updatedWallet),
          },
          walletTransaction: {
            create: jest.fn().mockResolvedValue({}),
          },
        };
        return callback(tx);
      });

      const result = await service.deposit(userId, amount, description);

      expect(result.balance).toEqual(new Decimal(150.00));
    });

    it('should create deposit transaction record', async () => {
      const mockWallet = {
        id: 'wallet-123',
        userId,
        balance: new Decimal(100.00),
        transactions: [],
      };

      mockPrismaService.wallet.findUnique.mockResolvedValue(mockWallet);

      let transactionData;
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        const tx = {
          wallet: {
            update: jest.fn().mockResolvedValue(mockWallet),
          },
          walletTransaction: {
            create: jest.fn().mockImplementation((data) => {
              transactionData = data;
              return Promise.resolve({});
            }),
          },
        };
        return callback(tx);
      });

      await service.deposit(userId, amount, description);

      expect(transactionData.data).toMatchObject({
        walletId: 'wallet-123',
        type: TransactionType.DEPOSIT,
        description,
      });
      expect(transactionData.data.amount).toBeInstanceOf(Decimal);
    });

    it('should handle zero deposit', async () => {
      const mockWallet = {
        id: 'wallet-123',
        userId,
        balance: new Decimal(100.00),
        transactions: [],
      };

      mockPrismaService.wallet.findUnique.mockResolvedValue(mockWallet);
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        const tx = {
          wallet: {
            update: jest.fn().mockResolvedValue(mockWallet),
          },
          walletTransaction: {
            create: jest.fn().mockResolvedValue({}),
          },
        };
        return callback(tx);
      });

      const result = await service.deposit(userId, 0, description);

      expect(result).toBeDefined();
    });
  });

  describe('deductForOrder', () => {
    const userId = 'user-123';
    const wholesaleAmount = 30.00;
    const orderId = 'order-456';

    it('should deduct funds successfully when balance sufficient', async () => {
      const mockWallet = {
        id: 'wallet-123',
        userId,
        balance: new Decimal(100.00),
        transactions: [],
      };

      const updatedWallet = {
        ...mockWallet,
        balance: new Decimal(70.00),
      };

      mockPrismaService.wallet.findUnique.mockResolvedValue(mockWallet);
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        const tx = {
          wallet: {
            findUnique: jest.fn().mockResolvedValue(mockWallet),
            update: jest.fn().mockResolvedValue(updatedWallet),
          },
          walletTransaction: {
            create: jest.fn().mockResolvedValue({}),
          },
        };
        return callback(tx);
      });

      const result = await service.deductForOrder(userId, wholesaleAmount, orderId);

      expect(result.balance).toEqual(new Decimal(70.00));
    });

    it('should throw error when balance insufficient', async () => {
      const mockWallet = {
        id: 'wallet-123',
        userId,
        balance: new Decimal(20.00), // Less than wholesaleAmount
        transactions: [],
      };

      mockPrismaService.wallet.findUnique.mockResolvedValue(mockWallet);

      await expect(
        service.deductForOrder(userId, wholesaleAmount, orderId)
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.deductForOrder(userId, wholesaleAmount, orderId)
      ).rejects.toThrow('Insufficient wallet balance');
    });

    it('should create order payment transaction record', async () => {
      const mockWallet = {
        id: 'wallet-123',
        userId,
        balance: new Decimal(100.00),
        transactions: [],
      };

      mockPrismaService.wallet.findUnique.mockResolvedValue(mockWallet);

      let transactionData;
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        const tx = {
          wallet: {
            findUnique: jest.fn().mockResolvedValue(mockWallet),
            update: jest.fn().mockResolvedValue(mockWallet),
          },
          walletTransaction: {
            create: jest.fn().mockImplementation((data) => {
              transactionData = data;
              return Promise.resolve({});
            }),
          },
        };
        return callback(tx);
      });

      await service.deductForOrder(userId, wholesaleAmount, orderId);

      expect(transactionData.data).toMatchObject({
        walletId: 'wallet-123',
        type: TransactionType.ORDER_PAYMENT,
        orderId,
      });
      expect(transactionData.data.description).toContain(orderId);
    });

    it('should handle race condition with double-check in transaction', async () => {
      const mockWallet = {
        id: 'wallet-123',
        userId,
        balance: new Decimal(100.00),
        transactions: [],
      };

      const insufficientWallet = {
        ...mockWallet,
        balance: new Decimal(20.00), // Changed during transaction
      };

      mockPrismaService.wallet.findUnique.mockResolvedValue(mockWallet);
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        const tx = {
          wallet: {
            findUnique: jest.fn().mockResolvedValue(insufficientWallet),
            update: jest.fn(),
          },
          walletTransaction: {
            create: jest.fn(),
          },
        };
        return callback(tx);
      });

      await expect(
        service.deductForOrder(userId, wholesaleAmount, orderId)
      ).rejects.toThrow('Insufficient balance detected during transaction');
    });

    it('should handle exact balance deduction', async () => {
      const exactAmount = 100.00;
      const mockWallet = {
        id: 'wallet-123',
        userId,
        balance: new Decimal(exactAmount),
        transactions: [],
      };

      const zeroWallet = {
        ...mockWallet,
        balance: new Decimal(0.00),
      };

      mockPrismaService.wallet.findUnique.mockResolvedValue(mockWallet);
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        const tx = {
          wallet: {
            findUnique: jest.fn().mockResolvedValue(mockWallet),
            update: jest.fn().mockResolvedValue(zeroWallet),
          },
          walletTransaction: {
            create: jest.fn().mockResolvedValue({}),
          },
        };
        return callback(tx);
      });

      const result = await service.deductForOrder(userId, exactAmount, orderId);

      expect(result.balance).toEqual(new Decimal(0.00));
    });

    it('should create negative amount transaction for deduction', async () => {
      const mockWallet = {
        id: 'wallet-123',
        userId,
        balance: new Decimal(100.00),
        transactions: [],
      };

      let transactionAmount;
      mockPrismaService.wallet.findUnique.mockResolvedValue(mockWallet);
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        const tx = {
          wallet: {
            findUnique: jest.fn().mockResolvedValue(mockWallet),
            update: jest.fn().mockResolvedValue(mockWallet),
          },
          walletTransaction: {
            create: jest.fn().mockImplementation((data) => {
              transactionAmount = data.data.amount;
              return Promise.resolve({});
            }),
          },
        };
        return callback(tx);
      });

      await service.deductForOrder(userId, wholesaleAmount, orderId);

      expect(transactionAmount).toBeInstanceOf(Decimal);
      expect(transactionAmount.isNegative()).toBe(true);
    });
  });

  describe('wallet creation on first access', () => {
    it('should create wallet on first deposit', async () => {
      const userId = 'new-user';
      const newWallet = {
        id: 'wallet-new',
        userId,
        balance: new Decimal(0.00),
        transactions: [],
      };

      mockPrismaService.wallet.findUnique.mockResolvedValue(null);
      mockPrismaService.wallet.create.mockResolvedValue(newWallet);
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        const tx = {
          wallet: {
            update: jest.fn().mockResolvedValue(newWallet),
          },
          walletTransaction: {
            create: jest.fn().mockResolvedValue({}),
          },
        };
        return callback(tx);
      });

      await service.deposit(userId, 50.00, 'First deposit');

      expect(mockPrismaService.wallet.create).toHaveBeenCalled();
    });

    it('should create wallet on first deduction attempt', async () => {
      const userId = 'new-user';
      const newWallet = {
        id: 'wallet-new',
        userId,
        balance: new Decimal(0.00),
        transactions: [],
      };

      mockPrismaService.wallet.findUnique.mockResolvedValue(null);
      mockPrismaService.wallet.create.mockResolvedValue(newWallet);

      await expect(
        service.deductForOrder(userId, 10.00, 'order-123')
      ).rejects.toThrow('Insufficient wallet balance');

      expect(mockPrismaService.wallet.create).toHaveBeenCalled();
    });
  });
});
