// Simple in-memory cache for Zellij data

interface CacheEntry<T> {
  value: T;
  expiry: number;
}

export class Cache {
  private static instance: Cache;
  private cache = new Map<string, CacheEntry<any>>();
  private defaultTTL = 5000; // 5 seconds default

  static getInstance(): Cache {
    if (!Cache.instance) {
      Cache.instance = new Cache();
    }
    return Cache.instance;
  }

  set<T>(key: string, value: T, ttlMs?: number): void {
    const expiry = Date.now() + (ttlMs || this.defaultTTL);
    this.cache.set(key, { value, expiry });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return false;
    }

    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Clear expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiry) {
        this.cache.delete(key);
      }
    }
  }

  // Get cache statistics
  getStats(): { size: number; keys: string[] } {
    this.cleanup(); // Clean up first
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Singleton instance
export const cache = Cache.getInstance();

// Auto-cleanup every minute
setInterval(() => {
  cache.cleanup();
}, 60000);