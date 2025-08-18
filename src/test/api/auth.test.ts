import { NextRequest } from 'next/server';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { AuthService, AuthenticationError } from '@/lib/auth/auth-service';

// Mock AuthService
vi.mock('@/lib/auth/auth-service', () => ({
  AuthService: {
    getInstance: vi.fn(),
  },
  AuthenticationError: class extends Error {
    constructor(message: string, public code: string) {
      super(message);
      this.name = 'AuthenticationError';
    }
  },
}));

// Mock middleware
vi.mock('@/lib/middleware/auth', () => ({
  withCORS: vi.fn((handler) => handler),
  withAuth: vi.fn((handler) => handler),
}));

describe('Auth API Endpoints', () => {
  let mockAuthService: any;

  beforeEach(() => {
    mockAuthService = {
      registerUser: vi.fn(),
      login: vi.fn(),
      refreshToken: vi.fn(),
    };

    (AuthService.getInstance as any).mockReturnValue(mockAuthService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should register user successfully', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'manager',
        isActive: true,
        assignedCabinets: ['cabinet-1'],
      };

      mockAuthService.registerUser.mockResolvedValue(mockUser);

      // Import the handler after mocking
      const { POST } = await import('@/app/api/auth/register/route');

      const request = new NextRequest('http://localhost/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'SecurePass123',
          firstName: 'John',
          lastName: 'Doe',
          role: 'manager',
          assignedCabinets: ['cabinet-1'],
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.user).toEqual(mockUser);
      expect(mockAuthService.registerUser).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'SecurePass123',
        firstName: 'John',
        lastName: 'Doe',
        role: 'manager',
        assignedCabinets: ['cabinet-1'],
      });
    });

    it('should return 400 for missing required fields', async () => {
      const { POST } = await import('@/app/api/auth/register/route');

      const request = new NextRequest('http://localhost/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          // Missing password and role
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Missing required fields: email, password, role');
      expect(data.code).toBe('MISSING_FIELDS');
    });

    it('should return 400 for invalid role', async () => {
      const { POST } = await import('@/app/api/auth/register/route');

      const request = new NextRequest('http://localhost/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'SecurePass123',
          role: 'invalid_role',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid role specified');
      expect(data.code).toBe('INVALID_ROLE');
    });

    it('should handle authentication errors', async () => {
      mockAuthService.registerUser.mockRejectedValue(
        new AuthenticationError('User with this email already exists', 'USER_EXISTS')
      );

      const { POST } = await import('@/app/api/auth/register/route');

      const request = new NextRequest('http://localhost/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: 'existing@example.com',
          password: 'SecurePass123',
          role: 'manager',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('User with this email already exists');
      expect(data.code).toBe('USER_EXISTS');
    });

    it('should return 405 for non-POST methods', async () => {
      const { POST } = await import('@/app/api/auth/register/route');

      const request = new NextRequest('http://localhost/api/auth/register', {
        method: 'GET',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(405);
      expect(data.error).toBe('Method not allowed');
      expect(data.code).toBe('METHOD_NOT_ALLOWED');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login user successfully', async () => {
      const mockLoginResponse = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          role: 'manager',
        },
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      };

      mockAuthService.login.mockResolvedValue(mockLoginResponse);

      const { POST } = await import('@/app/api/auth/login/route');

      const request = new NextRequest('http://localhost/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'SecurePass123',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.user).toEqual(mockLoginResponse.user);
      expect(data.accessToken).toBe('access-token');
      expect(data.refreshToken).toBe('refresh-token');
    });

    it('should return 400 for missing credentials', async () => {
      const { POST } = await import('@/app/api/auth/login/route');

      const request = new NextRequest('http://localhost/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          // Missing password
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Missing required fields: email, password');
      expect(data.code).toBe('MISSING_FIELDS');
    });

    it('should return 401 for invalid credentials', async () => {
      mockAuthService.login.mockRejectedValue(
        new AuthenticationError('Invalid email or password', 'INVALID_CREDENTIALS')
      );

      const { POST } = await import('@/app/api/auth/login/route');

      const request = new NextRequest('http://localhost/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'wrongpassword',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Invalid email or password');
      expect(data.code).toBe('INVALID_CREDENTIALS');
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should refresh token successfully', async () => {
      const mockRefreshResponse = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      };

      mockAuthService.refreshToken.mockResolvedValue(mockRefreshResponse);

      const { POST } = await import('@/app/api/auth/refresh/route');

      const request = new NextRequest('http://localhost/api/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({
          refreshToken: 'valid-refresh-token',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.accessToken).toBe('new-access-token');
      expect(data.refreshToken).toBe('new-refresh-token');
    });

    it('should return 400 for missing refresh token', async () => {
      const { POST } = await import('@/app/api/auth/refresh/route');

      const request = new NextRequest('http://localhost/api/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Missing required field: refreshToken');
      expect(data.code).toBe('MISSING_FIELDS');
    });

    it('should return 401 for invalid refresh token', async () => {
      mockAuthService.refreshToken.mockRejectedValue(
        new AuthenticationError('Invalid or expired refresh token', 'INVALID_REFRESH_TOKEN')
      );

      const { POST } = await import('@/app/api/auth/refresh/route');

      const request = new NextRequest('http://localhost/api/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({
          refreshToken: 'invalid-token',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Invalid or expired refresh token');
      expect(data.code).toBe('INVALID_REFRESH_TOKEN');
    });
  });

  describe('GET /api/auth/validate', () => {
    it('should validate token successfully', async () => {
      const { GET } = await import('@/app/api/auth/validate/route');

      const mockRequest = {
        method: 'GET',
        auth: {
          user: {
            userId: 'user-123',
            email: 'test@example.com',
            role: 'manager',
            assignedCabinets: ['cabinet-1'],
          },
        },
      } as any;

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.user.userId).toBe('user-123');
      expect(data.user.email).toBe('test@example.com');
    });

    it('should return 401 for missing auth context', async () => {
      const { GET } = await import('@/app/api/auth/validate/route');

      const mockRequest = {
        method: 'GET',
        auth: undefined,
      } as any;

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Invalid token');
      expect(data.code).toBe('INVALID_TOKEN');
    });

    it('should return 405 for non-GET methods', async () => {
      const { GET } = await import('@/app/api/auth/validate/route');

      const mockRequest = {
        method: 'POST',
        auth: {
          user: { userId: 'user-123' },
        },
      } as any;

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(405);
      expect(data.error).toBe('Method not allowed');
      expect(data.code).toBe('METHOD_NOT_ALLOWED');
    });
  });
});