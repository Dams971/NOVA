import { describe, it, expect, beforeEach, vi } from 'vitest';
import jwt from 'jsonwebtoken';
import JWTManager, { JWTPayload } from '@/lib/auth/jwt';
import { NextRequest } from 'next/server';

// Mock jsonwebtoken
vi.mock('jsonwebtoken', () => ({
  default: {
    sign: vi.fn(),
    verify: vi.fn(),
  },
}));

describe('JWTManager', () => {
  let jwtManager: JWTManager;

  beforeEach(() => {
    jwtManager = JWTManager.getInstance();
    vi.clearAllMocks();
  });

  describe('generateAccessToken', () => {
    it('should generate access token with correct payload', () => {
      const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
        userId: 'user-123',
        email: 'test@example.com',
        role: 'manager',
        assignedCabinets: ['cabinet-1', 'cabinet-2'],
      };

      (jwt.sign as any).mockReturnValue('access-token');

      const token = jwtManager.generateAccessToken(payload);

      expect(token).toBe('access-token');
      expect(jwt.sign).toHaveBeenCalledWith(
        payload,
        'test-jwt-secret-key',
        {
          expiresIn: '15m',
          issuer: 'nova-platform',
        }
      );
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate refresh token with user ID', () => {
      (jwt.sign as any).mockReturnValue('refresh-token');

      const token = jwtManager.generateRefreshToken('user-123');

      expect(token).toBe('refresh-token');
      expect(jwt.sign).toHaveBeenCalledWith(
        { userId: 'user-123' },
        'test-refresh-secret-key',
        {
          expiresIn: '7d',
          issuer: 'nova-platform',
        }
      );
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify valid access token', () => {
      const mockPayload: JWTPayload = {
        userId: 'user-123',
        email: 'test@example.com',
        role: 'manager',
        assignedCabinets: ['cabinet-1'],
        iat: 1234567890,
        exp: 1234567890,
      };

      (jwt.verify as any).mockReturnValue(mockPayload);

      const result = jwtManager.verifyAccessToken('valid-token');

      expect(result).toEqual(mockPayload);
      expect(jwt.verify).toHaveBeenCalledWith('valid-token', 'test-jwt-secret-key');
    });

    it('should return null for invalid token', () => {
      (jwt.verify as any).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const result = jwtManager.verifyAccessToken('invalid-token');

      expect(result).toBeNull();
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify valid refresh token', () => {
      const mockPayload = { userId: 'user-123' };

      (jwt.verify as any).mockReturnValue(mockPayload);

      const result = jwtManager.verifyRefreshToken('valid-refresh-token');

      expect(result).toEqual(mockPayload);
      expect(jwt.verify).toHaveBeenCalledWith('valid-refresh-token', 'test-refresh-secret-key');
    });

    it('should return null for invalid refresh token', () => {
      (jwt.verify as any).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const result = jwtManager.verifyRefreshToken('invalid-token');

      expect(result).toBeNull();
    });
  });

  describe('extractTokenFromRequest', () => {
    it('should extract token from Authorization header', () => {
      const mockRequest = {
        headers: {
          get: vi.fn().mockReturnValue('Bearer valid-token'),
        },
      } as unknown as NextRequest;

      const token = jwtManager.extractTokenFromRequest(mockRequest);

      expect(token).toBe('valid-token');
      expect(mockRequest.headers.get).toHaveBeenCalledWith('authorization');
    });

    it('should return null if no Authorization header', () => {
      const mockRequest = {
        headers: {
          get: vi.fn().mockReturnValue(null),
        },
      } as unknown as NextRequest;

      const token = jwtManager.extractTokenFromRequest(mockRequest);

      expect(token).toBeNull();
    });

    it('should return null if Authorization header does not start with Bearer', () => {
      const mockRequest = {
        headers: {
          get: vi.fn().mockReturnValue('Basic some-token'),
        },
      } as unknown as NextRequest;

      const token = jwtManager.extractTokenFromRequest(mockRequest);

      expect(token).toBeNull();
    });
  });

  describe('createAuthContext', () => {
    it('should create auth context for valid token', () => {
      const mockPayload: JWTPayload = {
        userId: 'user-123',
        email: 'test@example.com',
        role: 'manager',
        assignedCabinets: ['cabinet-1', 'cabinet-2'],
      };

      (jwt.verify as any).mockReturnValue(mockPayload);

      const authContext = jwtManager.createAuthContext('valid-token');

      expect(authContext).toMatchObject({
        user: mockPayload,
        isAuthenticated: true,
      });

      // Test hasRole method
      expect(authContext?.hasRole('manager')).toBe(true);
      expect(authContext?.hasRole('admin')).toBe(false);
      expect(authContext?.hasRole('super_admin')).toBe(false);

      // Test hasCabinetAccess method
      expect(authContext?.hasCabinetAccess('cabinet-1')).toBe(true);
      expect(authContext?.hasCabinetAccess('cabinet-3')).toBe(false);
    });

    it('should allow super_admin to access any role', () => {
      const mockPayload: JWTPayload = {
        userId: 'user-123',
        email: 'admin@example.com',
        role: 'super_admin',
        assignedCabinets: [],
      };

      (jwt.verify as any).mockReturnValue(mockPayload);

      const authContext = jwtManager.createAuthContext('valid-token');

      expect(authContext?.hasRole('manager')).toBe(true);
      expect(authContext?.hasRole('admin')).toBe(true);
      expect(authContext?.hasRole('staff')).toBe(true);
      expect(authContext?.hasRole('super_admin')).toBe(true);
    });

    it('should allow super_admin to access any cabinet', () => {
      const mockPayload: JWTPayload = {
        userId: 'user-123',
        email: 'admin@example.com',
        role: 'super_admin',
        assignedCabinets: [],
      };

      (jwt.verify as any).mockReturnValue(mockPayload);

      const authContext = jwtManager.createAuthContext('valid-token');

      expect(authContext?.hasCabinetAccess('any-cabinet-id')).toBe(true);
    });

    it('should return null for invalid token', () => {
      (jwt.verify as any).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const authContext = jwtManager.createAuthContext('invalid-token');

      expect(authContext).toBeNull();
    });
  });

  describe('singleton pattern', () => {
    it('should return the same instance', () => {
      const instance1 = JWTManager.getInstance();
      const instance2 = JWTManager.getInstance();

      expect(instance1).toBe(instance2);
    });
  });
});