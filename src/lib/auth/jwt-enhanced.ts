import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { Redis } from 'ioredis';
import { env } from '@/config/env';

export interface JWTPayload {
  userId: string;
  email: string;
  role: 'super_admin' | 'admin' | 'manager' | 'staff';
  assignedCabinets: string[];
  jti: string; // JWT ID for revocation
  iat?: number;
  exp?: number;
}

export interface RefreshTokenPayload {
  userId: string;
  jti: string; // Unique identifier for this refresh token
  tokenFamily: string; // Family ID for rotation detection
  iat?: number;
  exp?: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  refreshExpiresAt: Date;
}

export interface TokenRevocationEntry {
  jti: string;
  userId: string;
  revokedAt: Date;
  reason: string;
}

/**
 * Enhanced JWT Manager with refresh token rotation and revocation
 * Implements security best practices for healthcare applications
 */
class EnhancedJWTManager {
  private static instance: EnhancedJWTManager;
  private readonly accessTokenSecret: string;
  private readonly refreshTokenSecret: string;
  private readonly accessTokenExpiry: string;
  private readonly refreshTokenExpiry: string;
  private redis: Redis;

  private constructor() {
    this.accessTokenSecret = env.JWT_ACCESS_SECRET;
    this.refreshTokenSecret = env.JWT_REFRESH_SECRET;
    this.accessTokenExpiry = env.JWT_EXPIRES_IN;
    this.refreshTokenExpiry = env.REFRESH_EXPIRES_IN;
    
    this.redis = new Redis(env.REDIS_URL, {
      retryDelayOnFailover: 100,
      enableReadyCheck: false,
      maxRetriesPerRequest: null,
    });
  }

  public static getInstance(): EnhancedJWTManager {
    if (!EnhancedJWTManager.instance) {
      EnhancedJWTManager.instance = new EnhancedJWTManager();
    }
    return EnhancedJWTManager.instance;
  }

  /**
   * Generate a new token pair with refresh token rotation
   */
  async generateTokenPair(payload: Omit<JWTPayload, 'jti'>): Promise<TokenPair> {
    const accessJti = uuidv4();
    const refreshJti = uuidv4();
    const tokenFamily = uuidv4(); // Family ID for tracking token generations

    // Create access token
    const accessTokenPayload: JWTPayload = {
      ...payload,
      jti: accessJti,
    };

    const accessToken = jwt.sign(accessTokenPayload, this.accessTokenSecret, {
      expiresIn: this.accessTokenExpiry,
      issuer: 'nova-platform',
      audience: 'nova-users',
    });

    // Create refresh token
    const refreshTokenPayload: RefreshTokenPayload = {
      userId: payload.userId,
      jti: refreshJti,
      tokenFamily,
    };

    const refreshToken = jwt.sign(refreshTokenPayload, this.refreshTokenSecret, {
      expiresIn: this.refreshTokenExpiry,
      issuer: 'nova-platform',
      audience: 'nova-refresh',
    });

    // Store refresh token metadata in Redis
    const refreshTokenKey = `refresh:${refreshJti}`;
    const refreshExpiresAt = new Date(Date.now() + this.parseExpiry(this.refreshTokenExpiry));
    const expiresAt = new Date(Date.now() + this.parseExpiry(this.accessTokenExpiry));

    await this.redis.setex(
      refreshTokenKey,
      Math.floor(this.parseExpiry(this.refreshTokenExpiry) / 1000),
      JSON.stringify({
        userId: payload.userId,
        tokenFamily,
        issuedAt: new Date().toISOString(),
        expiresAt: refreshExpiresAt.toISOString(),
        isActive: true,
      })
    );

    // Store token family for rotation detection
    const familyKey = `family:${payload.userId}:${tokenFamily}`;
    await this.redis.setex(
      familyKey,
      Math.floor(this.parseExpiry(this.refreshTokenExpiry) / 1000),
      JSON.stringify({
        currentRefreshToken: refreshJti,
        generations: 1,
        lastUsed: new Date().toISOString(),
      })
    );

    return {
      accessToken,
      refreshToken,
      expiresAt,
      refreshExpiresAt,
    };
  }

  /**
   * Refresh access token with automatic rotation
   */
  async refreshAccessToken(refreshToken: string): Promise<TokenPair | null> {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, this.refreshTokenSecret) as RefreshTokenPayload;
      
      // Check if refresh token exists and is active
      const refreshTokenKey = `refresh:${decoded.jti}`;
      const tokenData = await this.redis.get(refreshTokenKey);
      
      if (!tokenData) {
        // Token not found or expired - possible token reuse
        await this.revokeTokenFamily(decoded.tokenFamily, 'Refresh token reuse detected');
        return null;
      }

      const parsedTokenData = JSON.parse(tokenData);
      if (!parsedTokenData.isActive) {
        return null;
      }

      // Check token family integrity
      const familyKey = `family:${decoded.userId}:${decoded.tokenFamily}`;
      const familyData = await this.redis.get(familyKey);
      
      if (!familyData) {
        // Token family not found - revoke and return null
        await this.revokeRefreshToken(decoded.jti, 'Token family compromised');
        return null;
      }

      const parsedFamilyData = JSON.parse(familyData);
      if (parsedFamilyData.currentRefreshToken !== decoded.jti) {
        // Token reuse detected - revoke entire family
        await this.revokeTokenFamily(decoded.tokenFamily, 'Token reuse detected');
        return null;
      }

      // Get user data for new token
      const userData = await this.getUserDataForToken(decoded.userId);
      if (!userData) {
        return null;
      }

      // Revoke current refresh token (one-time use)
      await this.revokeRefreshToken(decoded.jti, 'Token rotated');

      // Generate new token pair
      const newTokenPair = await this.generateTokenPair(userData);

      return newTokenPair;

    } catch (error) {
      console.error('Token refresh error:', error);
      
      if (error instanceof jwt.JsonWebTokenError) {
        // Invalid token - check if it's a revoked token being reused
        try {
          const decoded = jwt.decode(refreshToken) as RefreshTokenPayload;
          if (decoded?.tokenFamily) {
            await this.revokeTokenFamily(decoded.tokenFamily, 'Invalid token reuse attempt');
          }
        } catch {
          // Ignore decode errors
        }
      }
      
      return null;
    }
  }

  /**
   * Verify access token
   */
  async verifyAccessToken(token: string): Promise<JWTPayload | null> {
    try {
      const decoded = jwt.verify(token, this.accessTokenSecret) as JWTPayload;
      
      // Check if token is revoked
      const isRevoked = await this.isTokenRevoked(decoded.jti);
      if (isRevoked) {
        return null;
      }

      return decoded;
    } catch (error) {
      console.error('Access token verification error:', error);
      return null;
    }
  }

  /**
   * Revoke a specific refresh token
   */
  async revokeRefreshToken(jti: string, reason: string): Promise<void> {
    const refreshTokenKey = `refresh:${jti}`;
    const tokenData = await this.redis.get(refreshTokenKey);
    
    if (tokenData) {
      const parsedData = JSON.parse(tokenData);
      parsedData.isActive = false;
      parsedData.revokedAt = new Date().toISOString();
      parsedData.revokedReason = reason;
      
      // Update with original TTL
      const ttl = await this.redis.ttl(refreshTokenKey);
      if (ttl > 0) {
        await this.redis.setex(refreshTokenKey, ttl, JSON.stringify(parsedData));
      }
    }

    // Add to revocation list
    const revocationKey = `revoked:${jti}`;
    await this.redis.setex(
      revocationKey,
      86400 * 7, // Keep for 7 days
      JSON.stringify({
        jti,
        revokedAt: new Date().toISOString(),
        reason,
      })
    );
  }

  /**
   * Revoke entire token family (all refresh tokens for a user session)
   */
  async revokeTokenFamily(tokenFamily: string, reason: string): Promise<void> {
    try {
      // Find all refresh tokens in this family
      const pattern = `refresh:*`;
      const keys = await this.redis.keys(pattern);
      
      for (const key of keys) {
        const tokenData = await this.redis.get(key);
        if (tokenData) {
          const parsedData = JSON.parse(tokenData);
          if (parsedData.tokenFamily === tokenFamily) {
            const jti = key.replace('refresh:', '');
            await this.revokeRefreshToken(jti, reason);
          }
        }
      }

      // Remove family tracking
      const familyPattern = `family:*:${tokenFamily}`;
      const familyKeys = await this.redis.keys(familyPattern);
      if (familyKeys.length > 0) {
        await this.redis.del(...familyKeys);
      }
    } catch (error) {
      console.error('Error revoking token family:', error);
    }
  }

  /**
   * Revoke all tokens for a user (logout from all devices)
   */
  async revokeAllUserTokens(userId: string, reason: string): Promise<void> {
    try {
      // Revoke all refresh tokens for this user
      const pattern = `refresh:*`;
      const keys = await this.redis.keys(pattern);
      
      for (const key of keys) {
        const tokenData = await this.redis.get(key);
        if (tokenData) {
          const parsedData = JSON.parse(tokenData);
          if (parsedData.userId === userId) {
            const jti = key.replace('refresh:', '');
            await this.revokeRefreshToken(jti, reason);
          }
        }
      }

      // Revoke all token families for this user
      const familyPattern = `family:${userId}:*`;
      const familyKeys = await this.redis.keys(familyPattern);
      if (familyKeys.length > 0) {
        await this.redis.del(...familyKeys);
      }
    } catch (error) {
      console.error('Error revoking all user tokens:', error);
    }
  }

  /**
   * Check if a token is revoked
   */
  async isTokenRevoked(jti: string): Promise<boolean> {
    const revocationKey = `revoked:${jti}`;
    const exists = await this.redis.exists(revocationKey);
    return exists === 1;
  }

  /**
   * Get active sessions for a user
   */
  async getUserActiveSessions(userId: string): Promise<Array<{
    jti: string;
    issuedAt: Date;
    expiresAt: Date;
    lastUsed: Date;
  }>> {
    try {
      const pattern = `refresh:*`;
      const keys = await this.redis.keys(pattern);
      const sessions = [];
      
      for (const key of keys) {
        const tokenData = await this.redis.get(key);
        if (tokenData) {
          const parsedData = JSON.parse(tokenData);
          if (parsedData.userId === userId && parsedData.isActive) {
            sessions.push({
              jti: key.replace('refresh:', ''),
              issuedAt: new Date(parsedData.issuedAt),
              expiresAt: new Date(parsedData.expiresAt),
              lastUsed: new Date(parsedData.lastUsed || parsedData.issuedAt),
            });
          }
        }
      }
      
      return sessions;
    } catch (error) {
      console.error('Error getting user sessions:', error);
      return [];
    }
  }

  /**
   * Clean up expired tokens (maintenance task)
   */
  async cleanupExpiredTokens(): Promise<number> {
    try {
      let cleaned = 0;
      const patterns = ['refresh:*', 'family:*', 'revoked:*'];
      
      for (const pattern of patterns) {
        const keys = await this.redis.keys(pattern);
        for (const key of keys) {
          const ttl = await this.redis.ttl(key);
          if (ttl === -1) { // No expiry set
            await this.redis.del(key);
            cleaned++;
          }
        }
      }
      
      return cleaned;
    } catch (error) {
      console.error('Error cleaning up tokens:', error);
      return 0;
    }
  }

  /**
   * Helper methods
   */
  private parseExpiry(expiry: string): number {
    const unit = expiry.slice(-1);
    const value = parseInt(expiry.slice(0, -1));
    
    switch (unit) {
      case 's': return value * 1000;
      case 'm': return value * 60 * 1000;
      case 'h': return value * 60 * 60 * 1000;
      case 'd': return value * 24 * 60 * 60 * 1000;
      default: return 15 * 60 * 1000; // Default 15 minutes
    }
  }

  private async getUserDataForToken(userId: string): Promise<Omit<JWTPayload, 'jti'> | null> {
    // This should query your user database to get current user data
    // Implementation depends on your user service
    // For now, return null to indicate user not found
    return null;
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.redis.ping();
      return true;
    } catch (error) {
      console.error('JWT manager health check failed:', error);
      return false;
    }
  }

  /**
   * Close Redis connection
   */
  async close(): Promise<void> {
    await this.redis.quit();
  }
}

export default EnhancedJWTManager;