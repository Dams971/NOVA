// Caching utilities for performance optimization

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum number of entries
}

// In-memory cache implementation
export class MemoryCache<T> {
  protected cache = new Map<string, CacheEntry<T>>();
  private defaultTTL: number;
  private maxSize: number;

  constructor(options: CacheOptions = {}) {
    this.defaultTTL = options.ttl || 5 * 60 * 1000; // 5 minutes default
    this.maxSize = options.maxSize || 1000;
  }

  set(key: string, data: T, ttl?: number): void {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
      }
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    };

    this.cache.set(key, entry);
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  // Clean expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

// Query cache with automatic invalidation
export class QueryCache<T> extends MemoryCache<T> {
  private dependencies = new Map<string, Set<string>>();

  constructor(options: CacheOptions = {}) {
    super(options);
    
    // Auto cleanup every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  setWithDependencies(key: string, data: T, dependencies: string[] = [], ttl?: number): void {
    this.set(key, data, ttl);
    
    // Track dependencies
    for (const dep of dependencies) {
      if (!this.dependencies.has(dep)) {
        this.dependencies.set(dep, new Set());
      }
      this.dependencies.get(dep)!.add(key);
    }
  }

  invalidate(dependency: string): void {
    const dependentKeys = this.dependencies.get(dependency);
    if (dependentKeys) {
      for (const key of dependentKeys) {
        this.delete(key);
      }
      this.dependencies.delete(dependency);
    }
  }

  invalidatePattern(pattern: RegExp): void {
    const keysToDelete: string[] = [];
    
    for (const [key] of this.cache.entries()) {
      if (pattern.test(key)) {
        keysToDelete.push(key);
      }
    }
    
    for (const key of keysToDelete) {
      this.delete(key);
    }
  }
}

// Cache key generators
export const generateCacheKey = (...parts: (string | number | boolean | undefined | null)[]): string => {
  return parts
    .filter(part => part !== undefined && part !== null)
    .map(part => String(part))
    .join(':');
};

export const generatePatientCacheKey = (cabinetId: string, filters?: any): string => {
  const filterString = filters ? JSON.stringify(filters) : '';
  return generateCacheKey('patients', cabinetId, filterString);
};

export const generatePatientDetailCacheKey = (patientId: string): string => {
  return generateCacheKey('patient', patientId);
};

// Global cache instances
export const queryCache = new QueryCache<any>({ ttl: 5 * 60 * 1000, maxSize: 500 });
export const patientCache = new QueryCache<any>({ ttl: 10 * 60 * 1000, maxSize: 200 });

// Cache decorators for service methods
export function cached<T>(
  cache: QueryCache<T>,
  keyGenerator: (...args: any[]) => string,
  ttl?: number,
  dependencies?: string[]
) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const cacheKey = keyGenerator(...args);
      
      // Try to get from cache first
      const cached = cache.get(cacheKey);
      if (cached !== null) {
        return cached;
      }

      // Execute original method
      const result = await method.apply(this, args);
      
      // Cache the result
      cache.setWithDependencies(cacheKey, result, dependencies, ttl);
      
      return result;
    };
  };
}

// React hook for cached data would go here
// Removed for now to avoid React import issues on server side

// Cache invalidation helpers
export const invalidatePatientCache = (cabinetId: string) => {
  patientCache.invalidatePattern(new RegExp(`^patients:${cabinetId}`));
};

export const invalidatePatientDetailCache = (patientId: string) => {
  patientCache.delete(generatePatientDetailCacheKey(patientId));
};

// Performance monitoring
export class CacheMetrics {
  private hits = 0;
  private misses = 0;
  private startTime = Date.now();

  recordHit(): void {
    this.hits++;
  }

  recordMiss(): void {
    this.misses++;
  }

  getStats() {
    const total = this.hits + this.misses;
    const hitRate = total > 0 ? (this.hits / total) * 100 : 0;
    const uptime = Date.now() - this.startTime;

    return {
      hits: this.hits,
      misses: this.misses,
      total,
      hitRate: Math.round(hitRate * 100) / 100,
      uptime
    };
  }

  reset(): void {
    this.hits = 0;
    this.misses = 0;
    this.startTime = Date.now();
  }
}

export const cacheMetrics = new CacheMetrics();
