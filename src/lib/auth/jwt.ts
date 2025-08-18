import { SignJWT, jwtVerify } from 'jose';
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
  private readonly secretKey: Uint8Array;
  private readonly refreshSecretKey: Uint8Array;
  private readonly accessTokenExpiry: string;
  private readonly refreshTokenExpiry: string;

  private constructor() {
    const secretString = process.env.JWT_SECRET || 'nova-secret-key-change-in-production';
    const refreshSecretString = process.env.JWT_REFRESH_SECRET || 'nova-refresh-secret-key-change-in-production';
    
    this.secretKey = new TextEncoder().encode(secretString);
    this.refreshSecretKey = new TextEncoder().encode(refreshSecretString);
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
  public async generateAccessToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): Promise<string> {
    return await new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime(this.accessTokenExpiry)
      .setIssuedAt()
      .setIssuer('nova-platform')
      .sign(this.secretKey);
  }

  /**
   * Generate refresh token
   */
  public async generateRefreshToken(userId: string): Promise<string> {
    return await new SignJWT({ userId })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime(this.refreshTokenExpiry)
      .setIssuedAt()
      .setIssuer('nova-platform')
      .sign(this.refreshSecretKey);
  }

  /**
   * Verify access token
   */
  public async verifyAccessToken(token: string): Promise<JWTPayload | null> {
    try {
      const { payload } = await jwtVerify(token, this.secretKey);
      return payload as unknown as JWTPayload;
    } catch (error) {
      console.error('JWT verification failed:', error);
      return null;
    }
  }

  /**
   * Verify refresh token
   */
  public async verifyRefreshToken(token: string): Promise<{ userId: string } | null> {
    try {
      const { payload } = await jwtVerify(token, this.refreshSecretKey);
      return payload as { userId: string };
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
  public async createAuthContext(token: string): Promise<AuthContext | null> {
    const payload = await this.verifyAccessToken(token);
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