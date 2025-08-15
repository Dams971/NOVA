import { Redis } from 'ioredis';
import { env } from '@/config/env';

/**
 * Token Bucket Rate Limiter for NOVA Platform
 * Implements multi-level rate limiting: IP, User, Tenant, Route
 */

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  burstSize?: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: Date;
  totalHits: number;
}

class RateLimiter {
  private redis: Redis;
  private defaultConfig: RateLimitConfig;

  constructor() {
    this.redis = new Redis(env.REDIS_URL, {
      retryDelayOnFailover: 100,
      enableReadyCheck: false,
      maxRetriesPerRequest: null,
    });

    this.defaultConfig = {
      maxRequests: env.RATE_LIMIT_REQUESTS_PER_MINUTE,
      windowMs: 60 * 1000, // 1 minute
      burstSize: env.RATE_LIMIT_BURST_SIZE,
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
    };
  }

  /**
   * Check if request should be rate limited
   */
  async consume(
    key: string,
    tokens: number = 1,
    config: Partial<RateLimitConfig> = {}
  ): Promise<RateLimitResult> {
    const finalConfig = { ...this.defaultConfig, ...config };
    const now = Date.now();
    const window = Math.floor(now / finalConfig.windowMs);
    const redisKey = `rl:${key}:${window}`;

    try {
      // Use Redis pipeline for atomic operations
      const pipeline = this.redis.pipeline();
      pipeline.get(redisKey);
      pipeline.ttl(redisKey);
      
      const results = await pipeline.exec();
      const current = parseInt(results?.[0]?.[1] as string) || 0;
      const ttl = results?.[1]?.[1] as number;

      const remaining = Math.max(0, finalConfig.maxRequests - current - tokens);
      const resetTime = new Date(now + (ttl > 0 ? ttl * 1000 : finalConfig.windowMs));

      if (current + tokens > finalConfig.maxRequests) {
        return {
          allowed: false,
          remaining: 0,
          resetTime,
          totalHits: current,
        };
      }

      // Increment counter
      const incrPipeline = this.redis.pipeline();
      incrPipeline.incrby(redisKey, tokens);
      
      if (ttl === -1) {
        incrPipeline.expire(redisKey, Math.ceil(finalConfig.windowMs / 1000));
      }
      
      await incrPipeline.exec();

      return {
        allowed: true,
        remaining,
        resetTime,
        totalHits: current + tokens,
      };
    } catch (error) {
      console.error('Rate limiter error:', error);
      // Fail open for Redis errors
      return {
        allowed: true,
        remaining: finalConfig.maxRequests,
        resetTime: new Date(now + finalConfig.windowMs),
        totalHits: 0,
      };
    }
  }

  /**
   * IP-based rate limiting
   */
  async checkIPLimit(ip: string, config?: Partial<RateLimitConfig>): Promise<RateLimitResult> {
    return this.consume(`ip:${ip}`, 1, {
      maxRequests: 60, // 60 requests per minute per IP
      windowMs: 60 * 1000,
      ...config,
    });
  }

  /**
   * User-based rate limiting
   */
  async checkUserLimit(userId: string, config?: Partial<RateLimitConfig>): Promise<RateLimitResult> {
    return this.consume(`user:${userId}`, 1, {
      maxRequests: 200, // 200 requests per minute per user
      windowMs: 60 * 1000,
      ...config,
    });
  }

  /**
   * Tenant-based rate limiting
   */
  async checkTenantLimit(tenantId: string, config?: Partial<RateLimitConfig>): Promise<RateLimitResult> {
    return this.consume(`tenant:${tenantId}`, 1, {
      maxRequests: 1000, // 1000 requests per minute per tenant
      windowMs: 60 * 1000,
      ...config,
    });
  }

  /**
   * Route-specific rate limiting
   */
  async checkRouteLimit(
    route: string, 
    identifier: string, 
    config?: Partial<RateLimitConfig>
  ): Promise<RateLimitResult> {
    const routeConfig = this.getRouteConfig(route);
    return this.consume(`route:${route}:${identifier}`, 1, {
      ...routeConfig,
      ...config,
    });
  }

  /**
   * Authentication-specific rate limiting (prevent brute force)
   */
  async checkAuthLimit(identifier: string, config?: Partial<RateLimitConfig>): Promise<RateLimitResult> {
    return this.consume(`auth:${identifier}`, 1, {
      maxRequests: 5, // 5 auth attempts per 15 minutes
      windowMs: 15 * 60 * 1000,
      ...config,
    });
  }

  /**
   * MFA verification rate limiting
   */
  async checkMFALimit(userId: string, config?: Partial<RateLimitConfig>): Promise<RateLimitResult> {
    return this.consume(`mfa:${userId}`, 1, {
      maxRequests: 3, // 3 MFA attempts per 5 minutes
      windowMs: 5 * 60 * 1000,
      ...config,
    });
  }

  /**
   * API key rate limiting
   */
  async checkAPIKeyLimit(apiKey: string, config?: Partial<RateLimitConfig>): Promise<RateLimitResult> {
    return this.consume(`apikey:${apiKey}`, 1, {
      maxRequests: 1000, // 1000 requests per hour for API keys
      windowMs: 60 * 60 * 1000,
      ...config,
    });
  }

  /**
   * Get route-specific configuration
   */
  private getRouteConfig(route: string): Partial<RateLimitConfig> {
    const routeConfigs: Record<string, Partial<RateLimitConfig>> = {
      '/api/auth/login': {
        maxRequests: 10,
        windowMs: 15 * 60 * 1000, // 15 minutes
      },
      '/api/auth/register': {
        maxRequests: 3,
        windowMs: 60 * 60 * 1000, // 1 hour
      },
      '/api/auth/mfa/verify': {
        maxRequests: 5,
        windowMs: 10 * 60 * 1000, // 10 minutes
      },
      '/api/appointments/book': {
        maxRequests: 20,
        windowMs: 60 * 1000, // 1 minute
      },
      '/api/chat': {
        maxRequests: 50,
        windowMs: 60 * 1000, // 1 minute
      },
      '/api/patients': {
        maxRequests: 100,
        windowMs: 60 * 1000, // 1 minute
      },
    };

    return routeConfigs[route] || {};
  }

  /**
   * Reset rate limit for a specific key
   */
  async reset(key: string): Promise<void> {
    try {
      const keys = await this.redis.keys(`rl:${key}:*`);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      console.error('Rate limiter reset error:', error);
    }
  }

  /**
   * Get current usage for a key
   */
  async getUsage(key: string): Promise<{ current: number; resetTime: Date }> {
    try {
      const now = Date.now();
      const window = Math.floor(now / this.defaultConfig.windowMs);
      const redisKey = `rl:${key}:${window}`;
      
      const pipeline = this.redis.pipeline();
      pipeline.get(redisKey);
      pipeline.ttl(redisKey);
      
      const results = await pipeline.exec();
      const current = parseInt(results?.[0]?.[1] as string) || 0;
      const ttl = results?.[1]?.[1] as number;
      
      const resetTime = new Date(now + (ttl > 0 ? ttl * 1000 : this.defaultConfig.windowMs));
      
      return { current, resetTime };
    } catch (error) {
      console.error('Rate limiter usage check error:', error);
      return { current: 0, resetTime: new Date() };
    }
  }

  /**
   * Health check for rate limiter
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.redis.ping();
      return true;
    } catch (error) {
      console.error('Rate limiter health check failed:', error);
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

// Export singleton instance
export const ratelimit = new RateLimiter();

// Export types
export type { RateLimitConfig, RateLimitResult };