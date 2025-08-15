import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';

export interface JWTPayload {
  userId: string;
  email: string;
  role: 'super_admin' | 'admin' | 'manager' | 'staff';
  assignedCabinets: string[];
  iat?: number;
  exp?: number;
}

export interface AuthContext {
  user: JWTPayload;
  isAuthenticated: boolean;
  hasRole: (role: string) => boolean;
  hasCabinetAccess: (cabinetId: string) => boolean;
}

class JWTManager {
  private static instance: JWTManager;
  private readonly secretKey: string;
  private readonly refreshSecretKey: string;
  private readonly accessTokenExpiry: string;
  private readonly refreshTokenExpiry: string;

  private constructor() {
    this.secretKey = process.env.JWT_SECRET || 'nova-secret-key-change-in-production';
    this.refreshSecretKey = process.env.JWT_REFRESH_SECRET || 'nova-refresh-secret-key-change-in-production';
    this.accessTokenExpiry = process.env.JWT_ACCESS_EXPIRY || '15m';
    this.refreshTokenExpiry = process.env.JWT_REFRESH_EXPIRY || '7d';
  }

  public static getInstance(): JWTManager {
    if (!JWTManager.instance) {
      JWTManager.instance = new JWTManager();
    }
    return JWTManager.instance;
  }

  /**
   * Generate access token
   */
  public generateAccessToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
    return jwt.sign(payload, this.secretKey, {
      expiresIn: this.accessTokenExpiry,
      issuer: 'nova-platform'
    });
  }

  /**
   * Generate refresh token
   */
  public generateRefreshToken(userId: string): string {
    return jwt.sign({ userId }, this.refreshSecretKey, {
      expiresIn: this.refreshTokenExpiry,
      issuer: 'nova-platform'
    });
  }

  /**
   * Verify access token
   */
  public verifyAccessToken(token: string): JWTPayload | null {
    try {
      const decoded = jwt.verify(token, this.secretKey) as JWTPayload;
      return decoded;
    } catch (error) {
      console.error('JWT verification failed:', error);
      return null;
    }
  }

  /**
   * Verify refresh token
   */
  public verifyRefreshToken(token: string): { userId: string } | null {
    try {
      const decoded = jwt.verify(token, this.refreshSecretKey) as { userId: string };
      return decoded;
    } catch (error) {
      console.error('Refresh token verification failed:', error);
      return null;
    }
  }

  /**
   * Extract token from request headers
   */
  public extractTokenFromRequest(request: NextRequest): string | null {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7);
  }

  /**
   * Create auth context from token
   */
  public createAuthContext(token: string): AuthContext | null {
    const payload = this.verifyAccessToken(token);
    if (!payload) {
      return null;
    }

    return {
      user: payload,
      isAuthenticated: true,
      hasRole: (role: string) => payload.role === role || payload.role === 'super_admin',
      hasCabinetAccess: (cabinetId: string) => 
        payload.role === 'super_admin' || payload.assignedCabinets.includes(cabinetId)
    };
  }
}

export default JWTManager;