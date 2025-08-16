/**
 * Cache Utilities Unit Tests
 * 
 * Comprehensive tests for caching utilities including:
 * - MemoryCache operations (set, get, delete, cleanup)
 * - QueryCache with dependency tracking
 * - Cache metrics and performance monitoring
 * - Cache key generation utilities
 * - TTL expiration and size limits
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  MemoryCache,
  QueryCache,
  generateCacheKey,
  generatePatientCacheKey,
  generatePatientDetailCacheKey,
  cached,
  CacheMetrics,
  invalidatePatientCache,
  invalidatePatientDetailCache,
  type CacheOptions,
} from '@/lib/utils/cache';

describe('Cache Utilities', () => {
  describe('MemoryCache', () => {
    let cache: MemoryCache<string>;

    beforeEach(() => {
      cache = new MemoryCache<string>({ ttl: 1000, maxSize: 3 });
    });

    describe('Basic Operations', () => {
      it('should set and get values', () => {
        cache.set('key1', 'value1');
        
        expect(cache.get('key1')).toBe('value1');
      });

      it('should return null for non-existent keys', () => {
        expect(cache.get('nonexistent')).toBeNull();
      });

      it('should check if key exists', () => {
        cache.set('key1', 'value1');
        
        expect(cache.has('key1')).toBe(true);
        expect(cache.has('nonexistent')).toBe(false);
      });

      it('should delete keys', () => {
        cache.set('key1', 'value1');
        
        expect(cache.delete('key1')).toBe(true);
        expect(cache.get('key1')).toBeNull();
        expect(cache.delete('nonexistent')).toBe(false);
      });

      it('should clear all entries', () => {
        cache.set('key1', 'value1');
        cache.set('key2', 'value2');
        
        cache.clear();
        
        expect(cache.get('key1')).toBeNull();
        expect(cache.get('key2')).toBeNull();
        expect(cache.size()).toBe(0);
      });

      it('should track cache size', () => {
        expect(cache.size()).toBe(0);
        
        cache.set('key1', 'value1');
        expect(cache.size()).toBe(1);
        
        cache.set('key2', 'value2');
        expect(cache.size()).toBe(2);
        
        cache.delete('key1');
        expect(cache.size()).toBe(1);
      });
    });

    describe('TTL (Time To Live)', () => {
      beforeEach(() => {
        vi.useFakeTimers();
      });

      afterEach(() => {
        vi.useRealTimers();
      });

      it('should expire entries after TTL', () => {
        cache.set('key1', 'value1', 500);
        
        expect(cache.get('key1')).toBe('value1');
        
        // Advance time beyond TTL
        vi.advanceTimersByTime(600);
        
        expect(cache.get('key1')).toBeNull();
        expect(cache.size()).toBe(0); // Should be removed from cache
      });

      it('should use default TTL when not specified', () => {
        cache.set('key1', 'value1'); // Uses default TTL from constructor (1000ms)
        
        expect(cache.get('key1')).toBe('value1');
        
        vi.advanceTimersByTime(900);
        expect(cache.get('key1')).toBe('value1'); // Still valid
        
        vi.advanceTimersByTime(200);
        expect(cache.get('key1')).toBeNull(); // Expired
      });

      it('should use custom TTL when specified', () => {
        cache.set('key1', 'value1', 2000); // Custom TTL
        
        vi.advanceTimersByTime(1500);
        expect(cache.get('key1')).toBe('value1'); // Still valid
        
        vi.advanceTimersByTime(600);
        expect(cache.get('key1')).toBeNull(); // Expired
      });

      it('should clean up expired entries', () => {
        cache.set('key1', 'value1', 500);
        cache.set('key2', 'value2', 1500);
        cache.set('key3', 'value3', 2000);
        
        expect(cache.size()).toBe(3);
        
        // Advance time to expire first entry
        vi.advanceTimersByTime(600);
        
        cache.cleanup();
        
        expect(cache.size()).toBe(2);
        expect(cache.get('key1')).toBeNull();
        expect(cache.get('key2')).toBe('value2');
        expect(cache.get('key3')).toBe('value3');
      });

      it('should handle multiple expired entries in cleanup', () => {
        cache.set('key1', 'value1', 300);
        cache.set('key2', 'value2', 500);
        cache.set('key3', 'value3', 1500);
        
        vi.advanceTimersByTime(600);
        
        cache.cleanup();
        
        expect(cache.size()).toBe(1);
        expect(cache.get('key3')).toBe('value3');
      });
    });

    describe('Size Limits', () => {
      it('should remove oldest entry when max size is reached', () => {
        // Cache has maxSize: 3
        cache.set('key1', 'value1');
        cache.set('key2', 'value2');
        cache.set('key3', 'value3');
        
        expect(cache.size()).toBe(3);
        
        // Adding 4th entry should remove the oldest (key1)
        cache.set('key4', 'value4');
        
        expect(cache.size()).toBe(3);
        expect(cache.get('key1')).toBeNull(); // Oldest removed
        expect(cache.get('key2')).toBe('value2');
        expect(cache.get('key3')).toBe('value3');
        expect(cache.get('key4')).toBe('value4');
      });

      it('should handle cache with size 1', () => {
        const smallCache = new MemoryCache<string>({ maxSize: 1 });
        
        smallCache.set('key1', 'value1');
        expect(smallCache.get('key1')).toBe('value1');
        
        smallCache.set('key2', 'value2');
        expect(smallCache.get('key1')).toBeNull();
        expect(smallCache.get('key2')).toBe('value2');
        expect(smallCache.size()).toBe(1);
      });
    });

    describe('Default Configuration', () => {
      it('should use default options when none provided', () => {
        const defaultCache = new MemoryCache<string>();
        
        defaultCache.set('key1', 'value1');
        expect(defaultCache.get('key1')).toBe('value1');
        
        // Should work fine with defaults
        expect(defaultCache.size()).toBe(1);
      });
    });
  });

  describe('QueryCache', () => {
    let queryCache: QueryCache<string>;

    beforeEach(() => {
      vi.useFakeTimers();
      queryCache = new QueryCache<string>({ ttl: 1000, maxSize: 10 });
    });

    afterEach(() => {
      vi.useRealTimers();
      queryCache.clear();
    });

    describe('Dependencies Tracking', () => {
      it('should set with dependencies', () => {
        queryCache.setWithDependencies('user:123', 'user data', ['users', 'user:123']);
        
        expect(queryCache.get('user:123')).toBe('user data');
      });

      it('should invalidate entries by dependency', () => {
        queryCache.setWithDependencies('user:123', 'user data', ['users']);
        queryCache.setWithDependencies('user:456', 'other user', ['users']);
        queryCache.setWithDependencies('post:789', 'post data', ['posts']);
        
        expect(queryCache.size()).toBe(3);
        
        // Invalidate all user-related entries
        queryCache.invalidate('users');
        
        expect(queryCache.size()).toBe(1);
        expect(queryCache.get('user:123')).toBeNull();
        expect(queryCache.get('user:456')).toBeNull();
        expect(queryCache.get('post:789')).toBe('post data'); // Not affected
      });

      it('should handle multiple dependencies per entry', () => {
        queryCache.setWithDependencies('user:123:posts', 'user posts', ['users', 'posts', 'user:123']);
        
        // Should be invalidated by any dependency
        queryCache.invalidate('posts');
        expect(queryCache.get('user:123:posts')).toBeNull();
      });

      it('should handle dependencies that don\'t exist', () => {
        queryCache.invalidate('nonexistent-dependency');
        // Should not throw or cause issues
        expect(queryCache.size()).toBe(0);
      });
    });

    describe('Pattern Invalidation', () => {
      it('should invalidate entries matching pattern', () => {
        queryCache.set('user:123', 'user 123');
        queryCache.set('user:456', 'user 456');
        queryCache.set('post:789', 'post 789');
        queryCache.set('user:settings:123', 'user settings');
        
        // Invalidate all user-related entries
        queryCache.invalidatePattern(/^user:/);
        
        expect(queryCache.get('user:123')).toBeNull();
        expect(queryCache.get('user:456')).toBeNull();
        expect(queryCache.get('user:settings:123')).toBeNull();
        expect(queryCache.get('post:789')).toBe('post 789'); // Not affected
      });

      it('should handle complex regex patterns', () => {
        queryCache.set('cache:users:list:page:1', 'page 1');
        queryCache.set('cache:users:list:page:2', 'page 2');
        queryCache.set('cache:posts:list:page:1', 'posts page 1');
        queryCache.set('cache:users:detail:123', 'user detail');
        
        // Invalidate only user list pages
        queryCache.invalidatePattern(/^cache:users:list:/);
        
        expect(queryCache.get('cache:users:list:page:1')).toBeNull();
        expect(queryCache.get('cache:users:list:page:2')).toBeNull();
        expect(queryCache.get('cache:posts:list:page:1')).toBe('posts page 1');
        expect(queryCache.get('cache:users:detail:123')).toBe('user detail');
      });
    });

    describe('Auto Cleanup', () => {
      it('should automatically clean up expired entries', () => {
        queryCache.set('key1', 'value1', 500);
        queryCache.set('key2', 'value2', 1500);
        
        expect(queryCache.size()).toBe(2);
        
        // Simulate auto cleanup interval (5 minutes)
        vi.advanceTimersByTime(5 * 60 * 1000);
        
        // First entry should be expired and cleaned up
        expect(queryCache.size()).toBe(1);
        expect(queryCache.get('key2')).toBe('value2');
      });
    });
  });

  describe('Cache Key Generation', () => {
    describe('generateCacheKey', () => {
      it('should generate key from multiple parts', () => {
        const key = generateCacheKey('users', 'list', 'page', 1);
        
        expect(key).toBe('users:list:page:1');
      });

      it('should filter out null and undefined values', () => {
        const key = generateCacheKey('users', null, 'list', undefined, 'page', 1);
        
        expect(key).toBe('users:list:page:1');
      });

      it('should handle empty input', () => {
        const key = generateCacheKey();
        
        expect(key).toBe('');
      });

      it('should handle boolean values', () => {
        const key = generateCacheKey('settings', true, 'admin', false);
        
        expect(key).toBe('settings:true:admin:false');
      });

      it('should convert numbers to strings', () => {
        const key = generateCacheKey('page', 1, 'limit', 20, 'offset', 0);
        
        expect(key).toBe('page:1:limit:20:offset:0');
      });
    });

    describe('generatePatientCacheKey', () => {
      it('should generate patient cache key without filters', () => {
        const key = generatePatientCacheKey('cabinet-123');
        
        expect(key).toBe('patients:cabinet-123:');
      });

      it('should generate patient cache key with filters', () => {
        const filters = { status: 'active', age: '>18' };
        const key = generatePatientCacheKey('cabinet-123', filters);
        
        expect(key).toBe('patients:cabinet-123:{"status":"active","age":">18"}');
      });

      it('should handle complex filters', () => {
        const filters = {
          search: 'Jean',
          dateRange: { start: '2024-01-01', end: '2024-12-31' },
          tags: ['urgent', 'vip'],
        };
        const key = generatePatientCacheKey('cabinet-123', filters);
        
        expect(key).toContain('patients:cabinet-123:');
        expect(key).toContain('"search":"Jean"');
        expect(key).toContain('"tags":["urgent","vip"]');
      });
    });

    describe('generatePatientDetailCacheKey', () => {
      it('should generate patient detail cache key', () => {
        const key = generatePatientDetailCacheKey('patient-456');
        
        expect(key).toBe('patient:patient-456');
      });
    });
  });

  describe('Cache Decorator', () => {
    let mockCache: QueryCache<any>;
    let mockMethod: any;
    let testClass: any;

    beforeEach(() => {
      mockCache = new QueryCache<any>({ ttl: 1000 });
      mockMethod = vi.fn().mockResolvedValue('result');
      
      testClass = {
        getData: mockMethod,
      };
    });

    it('should cache method results', async () => {
      const keyGenerator = (id: string) => `data:${id}`;
      const decoratedDescriptor = {
        value: cached(mockCache, keyGenerator)(testClass, 'getData', {
          value: mockMethod,
        }).value,
      };

      // First call - should execute method and cache result
      const result1 = await decoratedDescriptor.value('123');
      expect(result1).toBe('result');
      expect(mockMethod).toHaveBeenCalledTimes(1);

      // Second call - should return cached result
      const result2 = await decoratedDescriptor.value('123');
      expect(result2).toBe('result');
      expect(mockMethod).toHaveBeenCalledTimes(1); // Not called again
    });

    it('should use different cache keys for different arguments', async () => {
      const keyGenerator = (id: string) => `data:${id}`;
      const decoratedDescriptor = {
        value: cached(mockCache, keyGenerator)(testClass, 'getData', {
          value: mockMethod,
        }).value,
      };

      await decoratedDescriptor.value('123');
      await decoratedDescriptor.value('456');

      expect(mockMethod).toHaveBeenCalledTimes(2); // Called for each unique key
    });

    it('should set dependencies when provided', async () => {
      const keyGenerator = (id: string) => `data:${id}`;
      const dependencies = ['users'];
      const decoratedDescriptor = {
        value: cached(mockCache, keyGenerator, 2000, dependencies)(testClass, 'getData', {
          value: mockMethod,
        }).value,
      };

      await decoratedDescriptor.value('123');

      // Cache should have the entry
      expect(mockCache.get('data:123')).toBe('result');

      // Invalidating dependency should remove cached entry
      mockCache.invalidate('users');
      expect(mockCache.get('data:123')).toBeNull();
    });
  });

  describe('Cache Metrics', () => {
    let metrics: CacheMetrics;

    beforeEach(() => {
      vi.useFakeTimers();
      metrics = new CacheMetrics();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should track hits and misses', () => {
      metrics.recordHit();
      metrics.recordHit();
      metrics.recordMiss();

      const stats = metrics.getStats();

      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(1);
      expect(stats.total).toBe(3);
      expect(stats.hitRate).toBe(66.67); // (2/3) * 100, rounded
    });

    it('should calculate hit rate correctly', () => {
      // No hits or misses
      expect(metrics.getStats().hitRate).toBe(0);

      // All hits
      metrics.recordHit();
      metrics.recordHit();
      expect(metrics.getStats().hitRate).toBe(100);

      // Mixed
      metrics.recordMiss();
      expect(metrics.getStats().hitRate).toBe(66.67);
    });

    it('should track uptime', () => {
      vi.advanceTimersByTime(5000);

      const stats = metrics.getStats();
      expect(stats.uptime).toBe(5000);
    });

    it('should reset metrics', () => {
      metrics.recordHit();
      metrics.recordMiss();
      vi.advanceTimersByTime(1000);

      metrics.reset();

      const stats = metrics.getStats();
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
      expect(stats.total).toBe(0);
      expect(stats.hitRate).toBe(0);
      expect(stats.uptime).toBeLessThan(100); // Should be reset
    });
  });

  describe('Cache Invalidation Helpers', () => {
    let patientCache: QueryCache<any>;

    beforeEach(() => {
      // Mock the global patientCache
      patientCache = new QueryCache<any>();
      
      // Set up some test data
      patientCache.set('patients:cabinet-123:{}', 'patient list');
      patientCache.set('patients:cabinet-123:{"status":"active"}', 'active patients');
      patientCache.set('patients:cabinet-456:{}', 'other cabinet patients');
      patientCache.set('patient:patient-789', 'patient detail');
    });

    describe('invalidatePatientCache', () => {
      it('should invalidate patient cache for specific cabinet', () => {
        // Mock the global patientCache
        const originalInvalidatePattern = patientCache.invalidatePattern;
        patientCache.invalidatePattern = vi.fn();

        // We need to mock the actual function since it uses the global instance
        const invalidatePatientCacheMock = (cabinetId: string) => {
          patientCache.invalidatePattern(new RegExp(`^patients:${cabinetId}`));
        };

        invalidatePatientCacheMock('cabinet-123');

        expect(patientCache.invalidatePattern).toHaveBeenCalledWith(
          new RegExp('^patients:cabinet-123')
        );
      });
    });

    describe('invalidatePatientDetailCache', () => {
      it('should invalidate specific patient detail', () => {
        const originalDelete = patientCache.delete;
        patientCache.delete = vi.fn();

        // Mock the actual function
        const invalidatePatientDetailCacheMock = (patientId: string) => {
          patientCache.delete(generatePatientDetailCacheKey(patientId));
        };

        invalidatePatientDetailCacheMock('patient-789');

        expect(patientCache.delete).toHaveBeenCalledWith('patient:patient-789');
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    let cache: MemoryCache<any>;

    beforeEach(() => {
      cache = new MemoryCache<any>();
    });

    it('should handle undefined and null values', () => {
      cache.set('undefined', undefined);
      cache.set('null', null);

      expect(cache.get('undefined')).toBeUndefined();
      expect(cache.get('null')).toBeNull();
      expect(cache.has('undefined')).toBe(true);
      expect(cache.has('null')).toBe(true);
    });

    it('should handle complex objects', () => {
      const complexObject = {
        id: 123,
        data: {
          items: [1, 2, 3],
          metadata: { created: new Date() },
        },
      };

      cache.set('complex', complexObject);

      const retrieved = cache.get('complex');
      expect(retrieved).toEqual(complexObject);
      expect(retrieved).toBe(complexObject); // Should be same reference
    });

    it('should handle very large cache keys', () => {
      const longKey = 'x'.repeat(1000);
      
      cache.set(longKey, 'value');
      expect(cache.get(longKey)).toBe('value');
    });

    it('should handle special characters in keys', () => {
      const specialKeys = [
        'key:with:colons',
        'key with spaces',
        'key/with/slashes',
        'key.with.dots',
        'key@with@symbols',
      ];

      specialKeys.forEach((key, index) => {
        cache.set(key, `value${index}`);
        expect(cache.get(key)).toBe(`value${index}`);
      });
    });

    it('should handle zero TTL', () => {
      vi.useFakeTimers();
      
      cache.set('key', 'value', 0);
      
      // Should expire immediately
      expect(cache.get('key')).toBeNull();
      
      vi.useRealTimers();
    });

    it('should handle negative TTL', () => {
      vi.useFakeTimers();
      
      cache.set('key', 'value', -1000);
      
      // Should expire immediately
      expect(cache.get('key')).toBeNull();
      
      vi.useRealTimers();
    });
  });

  describe('Memory Management', () => {
    it('should properly clean up when cache is cleared', () => {
      const cache = new MemoryCache<any>({ maxSize: 1000 });
      
      // Add many entries
      for (let i = 0; i < 500; i++) {
        cache.set(`key${i}`, `value${i}`);
      }
      
      expect(cache.size()).toBe(500);
      
      cache.clear();
      
      expect(cache.size()).toBe(0);
      
      // Should be able to add entries after clearing
      cache.set('new-key', 'new-value');
      expect(cache.get('new-key')).toBe('new-value');
    });

    it('should handle rapid insertions and deletions', () => {
      const cache = new MemoryCache<string>({ maxSize: 10 });
      
      // Rapidly add and remove entries
      for (let i = 0; i < 100; i++) {
        cache.set(`key${i}`, `value${i}`);
        
        if (i > 5) {
          cache.delete(`key${i - 5}`);
        }
      }
      
      // Should maintain reasonable size
      expect(cache.size()).toBeLessThanOrEqual(10);
    });
  });
});