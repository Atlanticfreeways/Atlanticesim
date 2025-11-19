import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;

  const mockUser = {
    id: '1',
    email: 'test@example.com',
    password: 'hashedPassword123',
    name: 'Test User',
    role: 'END_USER',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockJwtToken = 'jwt.token.here';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            create: jest.fn(),
            findByEmail: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
            verify: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const email = 'newuser@example.com';
      const password = 'Password123!';
      const name = 'New User';

      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      (usersService.create as jest.Mock).mockResolvedValue(mockUser);
      (jwtService.sign as jest.Mock).mockReturnValue(mockJwtToken);

      const result = await service.register(email, password, name);

      expect(bcrypt.hash).toHaveBeenCalledWith(password, 10);
      expect(usersService.create).toHaveBeenCalled();
      expect(result).toHaveProperty('access_token');
    });

    it('should throw error if user already exists', async () => {
      const email = 'existing@example.com';
      const password = 'Password123!';
      const name = 'Existing User';

      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      (usersService.create as jest.Mock).mockRejectedValue(
        new Error('User already exists'),
      );

      await expect(service.register(email, password, name)).rejects.toThrow(
        'User already exists',
      );
    });

    it('should hash password with bcrypt', async () => {
      const email = 'test@example.com';
      const password = 'Password123!';
      const name = 'Test User';

      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      (usersService.create as jest.Mock).mockResolvedValue(mockUser);
      (jwtService.sign as jest.Mock).mockReturnValue(mockJwtToken);

      await service.register(email, password, name);

      expect(bcrypt.hash).toHaveBeenCalledWith(password, 10);
    });
  });

  describe('validateUser', () => {
    it('should validate user with correct credentials', async () => {
      const email = 'test@example.com';
      const password = 'Password123!';

      (usersService.findByEmail as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser(email, password);

      expect(usersService.findByEmail).toHaveBeenCalledWith(email);
      expect(bcrypt.compare).toHaveBeenCalledWith(password, mockUser.password);
      expect(result).toBeDefined();
      expect(result.email).toBe(email);
    });

    it('should return null if user not found', async () => {
      const email = 'nonexistent@example.com';
      const password = 'Password123!';

      (usersService.findByEmail as jest.Mock).mockResolvedValue(null);

      const result = await service.validateUser(email, password);

      expect(result).toBeNull();
    });

    it('should return null if password is incorrect', async () => {
      const email = 'test@example.com';
      const password = 'WrongPassword123!';

      (usersService.findByEmail as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.validateUser(email, password);

      expect(result).toBeNull();
    });

    it('should not expose password in result', async () => {
      const email = 'test@example.com';
      const password = 'Password123!';

      (usersService.findByEmail as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser(email, password);

      expect(result).not.toHaveProperty('password');
    });
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      (jwtService.sign as jest.Mock).mockReturnValue(mockJwtToken);

      const result = await service.login(mockUser);

      expect(jwtService.sign).toHaveBeenCalled();
      expect(result).toHaveProperty('access_token');
      expect(result.access_token).toBe(mockJwtToken);
      expect(result.user).toHaveProperty('email');
      expect(result.user).not.toHaveProperty('password');
    });

    it('should include user data in response', async () => {
      (jwtService.sign as jest.Mock).mockReturnValue(mockJwtToken);

      const result = await service.login(mockUser);

      expect(result.user.id).toBe(mockUser.id);
      expect(result.user.email).toBe(mockUser.email);
      expect(result.user.name).toBe(mockUser.name);
      expect(result.user.role).toBe(mockUser.role);
    });

    it('should create JWT payload with correct data', async () => {
      (jwtService.sign as jest.Mock).mockReturnValue(mockJwtToken);

      await service.login(mockUser);

      expect(jwtService.sign).toHaveBeenCalledWith({
        email: mockUser.email,
        sub: mockUser.id,
        role: mockUser.role,
      });
    });
  });
});
