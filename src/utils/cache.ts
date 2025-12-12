/**
 * Simple in-memory cache utility
 * For caching frequently accessed data like machine info
 */

interface CacheEntry<T> {
    data: T;
    expiry: number;
}

class SimpleCache {
    private cache: Map<string, CacheEntry<any>> = new Map();
    
    /**
     * Get value from cache
     * @param key Cache key
     * @returns Cached value or null if expired/not found
     */
    get<T>(key: string): T | null {
        const entry = this.cache.get(key);
        
        if (!entry) {
            return null;
        }
        
        // Check if expired
        if (Date.now() > entry.expiry) {
            this.cache.delete(key);
            return null;
        }
        
        return entry.data as T;
    }
    
    /**
     * Set value in cache
     * @param key Cache key
     * @param value Value to cache
     * @param ttlSeconds Time to live in seconds (default: 300 = 5 minutes)
     */
    set<T>(key: string, value: T, ttlSeconds: number = 300): void {
        this.cache.set(key, {
            data: value,
            expiry: Date.now() + (ttlSeconds * 1000)
        });
    }
    
    /**
     * Delete value from cache
     * @param key Cache key
     */
    delete(key: string): void {
        this.cache.delete(key);
    }
    
    /**
     * Clear all cache
     */
    clear(): void {
        this.cache.clear();
    }
    
    /**
     * Get cache size
     */
    size(): number {
        return this.cache.size;
    }
}

// Export singleton instance
export const cache = new SimpleCache();
