import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { AuthService, AuthenticationError, RegisterUserRequest, LoginRequest } from '@/lib/auth/auth-service';
import bcrypt from 'bcryptjs';

// Mock bcrypt
vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn(),
  },
}));

// Mock uuid
vi.mock('uuid', () => ({
  v4: vi.fn(() => 'test-uuid-123'),
}));

// Mock database connection
const mockConnection = {
  execute: vi.fn(),
  beginTransaction: vi.fn(),
  commit: vi.fn(),
  rollback: vi.fn(),
  release: vi.fn(),
};

const mockDbInstance = {
  getConnection: vi.fn().mockResolvedValue(mockConnection),
};

vi.mock('@/lib/database/connection', () => ({
  DatabaseConnection: {
    getInstance: vi.fn(() => mockDbInstance),
  },
}));

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Reset mock implementations
    mockConnection.execute.mockReset();
    mockConnection.beginTransaction.mockReset();
    mockConnection.commit.mockReset();
    mockConnection.rollback.mockReset();
    mockConnection.release.mockReset();
    mockDbInstance.getConnection.mockResolvedValue(mockConnection);

    authService = AuthService.getInstance();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('registerUser', () => {
    const validRegisterRequest: RegisterUserRequest = {
      email: 'test@example.com',
      password: 'SecurePass123',
      firstName: 'John',
      lastName: 'Doe',
      role: 'manager',
      assignedCabinets: ['cabinet-1'],
    };

    it('should successfully register a new user', async () => {
      // Mock bcrypt hash
      (bcrypt.hash as any).mockResolvedValue('hashed-password');
      
      // Mock database responses
      mockConnection.execute
        .mockResolvedValueOnce([[]]) // Check existing user (empty result)
        .mockResolvedValueOnce([]) // Insert user
        .mockResolvedValueOnce([]) // Insert cabinet assignment
        .mockResolvedValueOnce([[{
          id: 'test-uuid-123',
          email: 'test@example.com',
          first_name: 'John',
          last_name: 'Doe',
          role: 'manager',
          is_active: true,
          assigned_cabinets: 'cabinet-1',
          last_login_at: null,
          created_at: new Date(),
          updated_at: new Date(),
        }]]); // Get user by ID

      const result = await authService.registerUser(validRegisterRequest);

      expect(result).toMatchObject({
        id: 'test-uuid-123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'manager',
        isActive: true,
        assignedCabinets: ['cabinet-1'],
      });

      expect(mockConnection.beginTransaction).toHaveBeenCalled();
      expect(mockConnection.commit).toHaveBeenCalled();
      expect(bcrypt.hash).toHaveBeenCalledWith('SecurePass123', 12);
    });

    it('should throw error for invalid email format', async () => {
      const invalidRequest = { ...validRegisterRequest, email: 'invalid-email' };

      await expect(authService.registerUser(invalidRequest)).rejects.toThrow(
        new AuthenticationError('Invalid email format', 'INVALID_EMAIL')
      );
    });

    it('should throw error for weak password', async () => {
      const weakPasswordRequest = { ...validRegisterRequest, password: '123' };

      await expect(authService.registerUser(weakPasswordRequest)).rejects.toThrow(
        new AuthenticationError('Password must be at least 8 characters long', 'WEAK_PASSWORD')
      );
    });

    it('should throw error for password without complexity', async () => {
      const simplePasswordRequest = { ...validRegisterRequest, password: 'simplepassword' };

      await expect(authService.registerUser(simplePasswordRequest)).rejects.toThrow(
        new AuthenticationError(
          'Password must contain at least one uppercase letter, one lowercase letter, and one number',
          'WEAK_PASSWORD'
        )
      );
    });

    it('should throw error if user already exists', async () => {
      // Mock existing user found
      mockConnection.execute.mockResolvedValueOnce([[{
        id: 'existing-user-id',
        email: 'test@example.com',
      }]]);

      await expect(authService.registerUser(validRegisterRequest)).rejects.toThrow(
        new AuthenticationError('User with this email already exists', 'USER_EXISTS')
      );
    });

    it('should rollback transaction on error', async () => {
      (bcrypt.hash as any).mockResolvedValue('hashed-password');
      mockConnection.execute
        .mockResolvedValueOnce([[]]) // Check existing user
        .mockRejectedValueOnce(new Error('Database error')); // Insert user fails

      await expect(authService.registerUser(validRegisterRequest)).rejects.toThrow('Database error');

      expect(mockConnection.beginTransaction).toHaveBeenCalled();
      expect(mockConnection.rollback).toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const validLoginRequest: LoginRequest = {
      email: 'test@example.com',
      password: 'SecurePass123',
    };

    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      first_name: 'John',
      last_name: 'Doe',
      role: 'manager',
      is_active: true,
      assigned_cabinets: 'cabinet-1,cabinet-2',
      last_login_at: null,
      created_at: new Date(),
      updated_at: new Date(),
    };

    it('should successfully login with valid credentials', async () => {
      // Mock database responses
      mockConnection.execute
        .mockResolvedValueOnce([[mockUser]]) // Get user by email
        .mockResolvedValueOnce([[{ password_hash: 'hashed-password' }]]) // Get password hash
        .mockResolvedValueOnce([]); // Update last login

      // Mock bcrypt compare
      (bcrypt.compare as any).mockResolvedValue(true);

      const result = await authService.login(validLoginRequest);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.email).toBe('test@example.com');
      expect(result.user.assignedCabinets).toEqual(['cabinet-1', 'cabinet-2']);

      expect(bcrypt.compare).toHaveBeenCalledWith('SecurePass123', 'hashed-password');
    });

    it('should throw error for non-existent user', async () => {
      mockConnection.execute.mockResolvedValueOnce([[]]);

      await expect(authService.login(validLoginRequest)).rejects.toThrow(
        new AuthenticationError('Invalid email or password', 'INVALID_CREDENTIALS')
      );
    });

    it('should throw error for inactive user', async () => {
      const inactiveUser = { ...mockUser, is_active: false };
      mockConnection.execute.mockResolvedValueOnce([[inactiveUser]]);

      await expect(authService.login(validLoginRequest)).rejects.toThrow(
        new AuthenticationError('Account is deactivated', 'ACCOUNT_DEACTIVATED')
      );
    });

    it('should throw error for invalid password', async () => {
      mockConnection.execute
        .mockResolvedValueOnce([[mockUser]])
        .mockResolvedValueOnce([[{ password_hash: 'hashed-password' }]]);

      (bcrypt.compare as any).mockResolvedValue(false);

      await expect(authService.login(validLoginRequest)).rejects.toThrow(
        new AuthenticationError('Invalid email or password', 'INVALID_CREDENTIALS')
      );
    });

    it('should throw error for invalid email format', async () => {
      const invalidRequest = { ...validLoginRequest, email: 'invalid-email' };

      await expect(authService.login(invalidRequest)).rejects.toThrow(
        new AuthenticationError('Invalid email format', 'INVALID_EMAIL')
      );
    });
  });

  describe('refreshToken', () => {
    it('should successfully refresh token with valid refresh token', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        role: 'manager',
        is_active: true,
        assigned_cabinets: 'cabinet-1',
      };

      mockConnection.execute.mockResolvedValueOnce([[mockUser]]);

      // Mock JWT manager
      const mockJWTManager = {
        verifyRefreshToken: vi.fn().mockReturnValue({ userId: 'user-123' }),
        generateAccessToken: vi.fn().mockReturnValue('new-access-token'),
        generateRefreshToken: vi.fn().mockReturnValue('new-refresh-token'),
      };

      // Replace JWT manager instance
      (authService as any).jwtManager = mockJWTManager;

      const result = await authService.refreshToken({ refreshToken: 'valid-refresh-token' });

      expect(result).toEqual({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      });

      expect(mockJWTManager.verifyRefreshToken).toHaveBeenCalledWith('valid-refresh-token');
    });

    it('should throw error for invalid refresh token', async () => {
      const mockJWTManager = {
        verifyRefreshToken: vi.fn().mockReturnValue(null),
      };

      (authService as any).jwtManager = mockJWTManager;

      await expect(authService.refreshToken({ refreshToken: 'invalid-token' })).rejects.toThrow(
        new AuthenticationError('Invalid or expired refresh token', 'INVALID_REFRESH_TOKEN')
      );
    });

    it('should throw error if user not found', async () => {
      mockConnection.execute.mockResolvedValueOnce([[]]);

      const mockJWTManager = {
        verifyRefreshToken: vi.fn().mockReturnValue({ userId: 'non-existent-user' }),
      };

      (authService as any).jwtManager = mockJWTManager;

      await expect(authService.refreshToken({ refreshToken: 'valid-token' })).rejects.toThrow(
        new AuthenticationError('User not found or deactivated', 'USER_NOT_FOUND')
      );
    });
  });

  describe('changePassword', () => {
    it('should successfully change password', async () => {
      mockConnection.execute
        .mockResolvedValueOnce([[{ password_hash: 'old-hashed-password' }]]) // Get current hash
        .mockResolvedValueOnce([]); // Update password

      (bcrypt.compare as any).mockResolvedValue(true);
      (bcrypt.hash as any).mockResolvedValue('new-hashed-password');

      await authService.changePassword('user-123', 'oldPassword123', 'NewPassword456');

      expect(bcrypt.compare).toHaveBeenCalledWith('oldPassword123', 'old-hashed-password');
      expect(bcrypt.hash).toHaveBeenCalledWith('NewPassword456', 12);
    });

    it('should throw error for incorrect current password', async () => {
      mockConnection.execute.mockResolvedValueOnce([[{ password_hash: 'hashed-password' }]]);
      (bcrypt.compare as any).mockResolvedValue(false);

      await expect(
        authService.changePassword('user-123', 'wrongPassword', 'NewPassword456')
      ).rejects.toThrow(
        new AuthenticationError('Current password is incorrect', 'INVALID_CURRENT_PASSWORD')
      );
    });

    it('should throw error for weak new password', async () => {
      await expect(
        authService.changePassword('user-123', 'oldPassword123', 'weak')
      ).rejects.toThrow(
        new AuthenticationError('Password must be at least 8 characters long', 'WEAK_PASSWORD')
      );
    });
  });

  describe('validateToken', () => {
    it('should return user for valid token', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        role: 'manager',
        is_active: true,
        assigned_cabinets: 'cabinet-1',
      };

      mockConnection.execute.mockResolvedValueOnce([[mockUser]]);

      const mockJWTManager = {
        verifyAccessToken: vi.fn().mockReturnValue({ userId: 'user-123' }),
      };

      (authService as any).jwtManager = mockJWTManager;

      const result = await authService.validateToken('valid-token');

      expect(result).toMatchObject({
        id: 'user-123',
        email: 'test@example.com',
        role: 'manager',
        isActive: true,
      });
    });

    it('should return null for invalid token', async () => {
      const mockJWTManager = {
        verifyAccessToken: vi.fn().mockReturnValue(null),
      };

      (authService as any).jwtManager = mockJWTManager;

      const result = await authService.validateToken('invalid-token');

      expect(result).toBeNull();
    });

    it('should return null for inactive user', async () => {
      const inactiveUser = {
        id: 'user-123',
        is_active: false,
      };

      mockConnection.execute.mockResolvedValueOnce([[inactiveUser]]);

      const mockJWTManager = {
        verifyAccessToken: vi.fn().mockReturnValue({ userId: 'user-123' }),
      };

      (authService as any).jwtManager = mockJWTManager;

      const result = await authService.validateToken('valid-token');

      expect(result).toBeNull();
    });
  });

  describe('deactivateUser', () => {
    it('should successfully deactivate user', async () => {
      mockConnection.execute.mockResolvedValueOnce([]);

      await authService.deactivateUser('user-123');

      expect(mockConnection.execute).toHaveBeenCalledWith(
        'UPDATE users SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        ['user-123']
      );
    });
  });
});