import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../../config/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';

describe('UsersService', () => {
  let service: UsersService;
  let prismaService: PrismaService;

  const mockUser = {
    id: '1',
    email: 'test@example.com',
    password: 'hashedPassword123',
    name: 'Test User',
    phone: '+1234567890',
    role: 'END_USER',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUserWithoutPassword = {
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
    phone: '+1234567890',
    role: 'END_USER',
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              create: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new user successfully', async () => {
      const createUserDto: CreateUserDto = {
        email: 'newuser@example.com',
        password: 'hashedPassword',
        name: 'New User',
        phone: '+1234567890',
      };

      const createdUser = { ...mockUser, ...createUserDto };
      (prismaService.user.create as jest.Mock).mockResolvedValue(createdUser);

      const result = await service.create(createUserDto);

      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: createUserDto,
      });
      expect(result).toEqual(createdUser);
      expect(result.email).toBe(createUserDto.email);
    });

    it('should handle user creation with minimal data', async () => {
      const createUserDto: CreateUserDto = {
        email: 'minimal@example.com',
        password: 'hashedPassword',
        name: 'Minimal User',
      };

      (prismaService.user.create as jest.Mock).mockResolvedValue({
        ...mockUser,
        ...createUserDto,
      });

      const result = await service.create(createUserDto);

      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: createUserDto,
      });
      expect(result).toBeDefined();
    });

    it('should throw error if user creation fails', async () => {
      const createUserDto: CreateUserDto = {
        email: 'duplicate@example.com',
        password: 'hashedPassword',
        name: 'Duplicate User',
      };

      (prismaService.user.create as jest.Mock).mockRejectedValue(
        new Error('Unique constraint failed on the fields: (`email`)'),
      );

      await expect(service.create(createUserDto)).rejects.toThrow(
        'Unique constraint failed on the fields: (`email`)',
      );
    });

    it('should preserve all user data during creation', async () => {
      const createUserDto: CreateUserDto = {
        email: 'complete@example.com',
        password: 'hashedPassword',
        name: 'Complete User',
        phone: '+9876543210',
      };

      const createdUser = { id: '2', ...createUserDto, role: 'END_USER', createdAt: new Date() };
      (prismaService.user.create as jest.Mock).mockResolvedValue(createdUser);

      const result = await service.create(createUserDto);

      expect(result.email).toBe(createUserDto.email);
      expect(result.name).toBe(createUserDto.name);
      expect(result.phone).toBe(createUserDto.phone);
    });
  });

  describe('findByEmail', () => {
    it('should find user by email successfully', async () => {
      const email = 'test@example.com';

      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.findByEmail(email);

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email },
      });
      expect(result).toEqual(mockUser);
      expect(result.email).toBe(email);
    });

    it('should return null if user not found', async () => {
      const email = 'nonexistent@example.com';

      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await service.findByEmail(email);

      expect(result).toBeNull();
    });

    it('should handle case-sensitive email search', async () => {
      const email = 'Test@Example.com';

      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await service.findByEmail(email);

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email },
      });
      expect(result).toBeNull();
    });

    it('should return complete user object including password', async () => {
      const email = 'test@example.com';

      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.findByEmail(email);

      expect(result).toHaveProperty('password');
      expect(result.password).toBe(mockUser.password);
    });
  });

  describe('findById', () => {
    it('should find user by id successfully', async () => {
      const id = '1';

      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(
        mockUserWithoutPassword,
      );

      const result = await service.findById(id);

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          role: true,
          createdAt: true,
        },
      });
      expect(result).toEqual(mockUserWithoutPassword);
    });

    it('should return null if user not found', async () => {
      const id = 'nonexistent-id';

      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await service.findById(id);

      expect(result).toBeNull();
    });

    it('should not include password in response', async () => {
      const id = '1';

      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(
        mockUserWithoutPassword,
      );

      const result = await service.findById(id);

      expect(result).not.toHaveProperty('password');
    });

    it('should include all required user fields', async () => {
      const id = '1';

      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(
        mockUserWithoutPassword,
      );

      const result = await service.findById(id);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('email');
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('phone');
      expect(result).toHaveProperty('role');
      expect(result).toHaveProperty('createdAt');
    });
  });

  describe('updateProfile', () => {
    it('should update user profile successfully', async () => {
      const id = '1';
      const updateData = { name: 'Updated Name', phone: '+9999999999' };
      const updatedUser = { ...mockUserWithoutPassword, ...updateData };

      (prismaService.user.update as jest.Mock).mockResolvedValue(updatedUser);

      const result = await service.updateProfile(id, updateData);

      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id },
        data: updateData,
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          role: true,
        },
      });
      expect(result.name).toBe(updateData.name);
      expect(result.phone).toBe(updateData.phone);
    });

    it('should update only name field', async () => {
      const id = '1';
      const updateData = { name: 'New Name' };
      const updatedUser = { ...mockUserWithoutPassword, name: updateData.name };

      (prismaService.user.update as jest.Mock).mockResolvedValue(updatedUser);

      const result = await service.updateProfile(id, updateData);

      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id },
        data: updateData,
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          role: true,
        },
      });
      expect(result.name).toBe(updateData.name);
    });

    it('should update only phone field', async () => {
      const id = '1';
      const updateData = { phone: '+1111111111' };
      const updatedUser = { ...mockUserWithoutPassword, phone: updateData.phone };

      (prismaService.user.update as jest.Mock).mockResolvedValue(updatedUser);

      const result = await service.updateProfile(id, updateData);

      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id },
        data: updateData,
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          role: true,
        },
      });
      expect(result.phone).toBe(updateData.phone);
    });

    it('should not include password in update response', async () => {
      const id = '1';
      const updateData = { name: 'Updated Name' };
      const updatedUser = { ...mockUserWithoutPassword, ...updateData };

      (prismaService.user.update as jest.Mock).mockResolvedValue(updatedUser);

      const result = await service.updateProfile(id, updateData);

      expect(result).not.toHaveProperty('password');
    });

    it('should throw error if user not found during update', async () => {
      const id = 'nonexistent-id';
      const updateData = { name: 'Updated Name' };

      (prismaService.user.update as jest.Mock).mockRejectedValue(
        new Error('An operation failed because it depends on one or more records that were required but not found.'),
      );

      await expect(service.updateProfile(id, updateData)).rejects.toThrow();
    });

    it('should preserve other user fields during update', async () => {
      const id = '1';
      const updateData = { name: 'Updated Name' };
      const updatedUser = {
        ...mockUserWithoutPassword,
        name: updateData.name,
      };

      (prismaService.user.update as jest.Mock).mockResolvedValue(updatedUser);

      const result = await service.updateProfile(id, updateData);

      expect(result.id).toBe(mockUserWithoutPassword.id);
      expect(result.email).toBe(mockUserWithoutPassword.email);
      expect(result.role).toBe(mockUserWithoutPassword.role);
    });
  });
});
