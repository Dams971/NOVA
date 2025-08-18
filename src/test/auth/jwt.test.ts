import { SignJWT, jwtVerify } from 'jose';
import { NextRequest } from 'next/server';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import JWTManager, { JWTPayload } from '@/lib/auth/jwt';

// Mock jose
vi.mock('jose', () => ({
  SignJWT: vi.fn(),
  jwtVerify: vi.fn(),
}));

describe('JWTManager', () => {
  let jwtManager: JWTManager;

  beforeEach(() => {
    jwtManager = JWTManager.getInstance();
    vi.clearAllMocks();
  });

  describe('generateAccessToken', () => {
    it('should generate access token with correct payload', async () => {
      const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
        userId: 'user-123',
        email: 'test@example.com',
        role: 'manager',
        assignedCabinets: ['cabinet-1', 'cabinet-2'],
      };

      const mockSignJWT = {
        setProtectedHeader: vi.fn().mockReturnThis(),
        setExpirationTime: vi.fn().mockReturnThis(),
        setIssuedAt: vi.fn().mockReturnThis(),
        setIssuer: vi.fn().mockReturnThis(),
        sign: vi.fn().mockResolvedValue('access-token'),
      };

      (SignJWT as any).mockReturnValue(mockSignJWT);

      const token = await jwtManager.generateAccessToken(payload);

      expect(token).toBe('access-token');
      expect(SignJWT).toHaveBeenCalledWith(payload);
      expect(mockSignJWT.setProtectedHeader).toHaveBeenCalledWith({ alg: 'HS256' });
      expect(mockSignJWT.setExpirationTime).toHaveBeenCalledWith('15m');
      expect(mockSignJWT.setIssuedAt).toHaveBeenCalled();
      expect(mockSignJWT.setIssuer).toHaveBeenCalledWith('nova-platform');
      expect(mockSignJWT.sign).toHaveBeenCalled();
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate refresh token with user ID', async () => {
      const mockSignJWT = {
        setProtectedHeader: vi.fn().mockReturnThis(),
        setExpirationTime: vi.fn().mockReturnThis(),
        setIssuedAt: vi.fn().mockReturnThis(),
        setIssuer: vi.fn().mockReturnThis(),
        sign: vi.fn().mockResolvedValue('refresh-token'),
      };

      (SignJWT as any).mockReturnValue(mockSignJWT);

      const token = await jwtManager.generateRefreshToken('user-123');

      expect(token).toBe('refresh-token');
      expect(SignJWT).toHaveBeenCalledWith({ userId: 'user-123' });
      expect(mockSignJWT.setProtectedHeader).toHaveBeenCalledWith({ alg: 'HS256' });
      expect(mockSignJWT.setExpirationTime).toHaveBeenCalledWith('7d');
      expect(mockSignJWT.setIssuedAt).toHaveBeenCalled();
      expect(mockSignJWT.setIssuer).toHaveBeenCalledWith('nova-platform');
      expect(mockSignJWT.sign).toHaveBeenCalled();
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify valid access token', async () => {
      const mockPayload: JWTPayload = {
        userId: 'user-123',
        email: 'test@example.com',
        role: 'manager',
        assignedCabinets: ['cabinet-1'],
        iat: 1234567890,
        exp: 1234567890,
      };

      (jwtVerify as any).mockResolvedValue({ payload: mockPayload });

      const result = await jwtManager.verifyAccessToken('valid-token');

      expect(result).toEqual(mockPayload);
      expect(jwtVerify).toHaveBeenCalledWith('valid-token', expect.anything());
    });

    it('should return null for invalid token', async () => {
      (jwtVerify as any).mockRejectedValue(new Error('Invalid token'));

      const result = await jwtManager.verifyAccessToken('invalid-token');

      expect(result).toBeNull();
      expect(jwtVerify).toHaveBeenCalledWith('invalid-token', expect.anything());
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify valid refresh token', async () => {
      const mockPayload = { userId: 'user-123' };

      (jwtVerify as any).mockResolvedValue({ payload: mockPayload });

      const result = await jwtManager.verifyRefreshToken('valid-refresh-token');

      expect(result).toEqual(mockPayload);
      expect(jwtVerify).toHaveBeenCalledWith('valid-refresh-token', expect.anything());
    });

    it('should return null for invalid refresh token', async () => {
      (jwtVerify as any).mockRejectedValue(new Error('Invalid token'));

      const result = await jwtManager.verifyRefreshToken('invalid-refresh-token');

      expect(result).toBeNull();
      expect(jwtVerify).toHaveBeenCalledWith('invalid-refresh-token', expect.anything());
    });
  });

  describe('extractTokenFromRequest', () => {
    it('should extract token from Authorization header', () => {
      const mockRequest = {
        headers: {
          get: vi.fn().mockReturnValue('Bearer test-token-123'),
        },
      } as unknown as NextRequest;

      const token = jwtManager.extractTokenFromRequest(mockRequest);

      expect(token).toBe('test-token-123');
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
      expect(mockRequest.headers.get).toHaveBeenCalledWith('authorization');
    });

    it('should return null if Authorization header does not start with Bearer', () => {
      const mockRequest = {
        headers: {
          get: vi.fn().mockReturnValue('Basic test-token-123'),
        },
      } as unknown as NextRequest;

      const token = jwtManager.extractTokenFromRequest(mockRequest);

      expect(token).toBeNull();
      expect(mockRequest.headers.get).toHaveBeenCalledWith('authorization');
    });
  });

  describe('createAuthContext', () => {
    it('should create auth context from valid token', async () => {
      const mockPayload: JWTPayload = {
        userId: 'user-123',
        email: 'test@example.com',
        role: 'manager',
        assignedCabinets: ['cabinet-1', 'cabinet-2'],
        iat: 1234567890,
        exp: 1234567890,
      };

      (jwtVerify as any).mockResolvedValue({ payload: mockPayload });

      const authContext = await jwtManager.createAuthContext('valid-token');

      expect(authContext).toBeDefined();
      expect(authContext!.user).toEqual(mockPayload);
      expect(authContext!.isAuthenticated).toBe(true);
      expect(authContext!.hasRole('manager')).toBe(true);
      expect(authContext!.hasRole('super_admin')).toBe(false);
      expect(authContext!.hasCabinetAccess('cabinet-1')).toBe(true);
      expect(authContext!.hasCabinetAccess('cabinet-3')).toBe(false);
    });

    it('should handle super_admin role correctly', async () => {
      const mockPayload: JWTPayload = {
        userId: 'admin-123',
        email: 'admin@example.com',
        role: 'super_admin',
        assignedCabinets: [],
        iat: 1234567890,
        exp: 1234567890,
      };

      (jwtVerify as any).mockResolvedValue({ payload: mockPayload });

      const authContext = await jwtManager.createAuthContext('admin-token');

      expect(authContext).toBeDefined();
      expect(authContext!.hasRole('admin')).toBe(true);
      expect(authContext!.hasRole('manager')).toBe(true);
      expect(authContext!.hasRole('staff')).toBe(true);
      expect(authContext!.hasCabinetAccess('any-cabinet')).toBe(true);
    });

    it('should return null for invalid token', async () => {
      (jwtVerify as any).mockRejectedValue(new Error('Invalid token'));

      const authContext = await jwtManager.createAuthContext('invalid-token');

      expect(authContext).toBeNull();
    });
  });

  describe('Singleton pattern', () => {
    it('should return the same instance', () => {
      const instance1 = JWTManager.getInstance();
      const instance2 = JWTManager.getInstance();

      expect(instance1).toBe(instance2);
    });
  });
});