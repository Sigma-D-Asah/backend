/**
 * Rate Limiter Utility
 * For limiting API calls (especially OpenAI) to prevent cost overruns
 */

interface RateLimitConfig {
    maxRequests: number;
    windowMs: number;
}

class RateLimiter {
    private requests: Map<string, number[]> = new Map();
    private config: RateLimitConfig;
    
    constructor(config: RateLimitConfig) {
        this.config = config;
    }
    
    /**
     * Check if request is allowed
     * @param key Identifier (e.g., user ID, IP address)
     * @returns true if allowed, false if rate limit exceeded
     */
    async check(key: string): Promise<boolean> {
        const now = Date.now();
        const windowStart = now - this.config.windowMs;
        
        // Get existing requests for this key
        let requestTimes = this.requests.get(key) || [];
        
        // Filter out old requests outside the window
        requestTimes = requestTimes.filter(time => time > windowStart);
        
        // Check if limit exceeded
        if (requestTimes.length >= this.config.maxRequests) {
            return false;
        }
        
        // Add current request
        requestTimes.push(now);
        this.requests.set(key, requestTimes);
        
        return true;
    }
    
    /**
     * Get remaining requests for a key
     * @param key Identifier
     * @returns Number of remaining requests
     */
    getRemaining(key: string): number {
        const now = Date.now();
        const windowStart = now - this.config.windowMs;
        
        let requestTimes = this.requests.get(key) || [];
        requestTimes = requestTimes.filter(time => time > windowStart);
        
        return Math.max(0, this.config.maxRequests - requestTimes.length);
    }
    
    /**
     * Reset rate limit for a key
     * @param key Identifier
     */
    reset(key: string): void {
        this.requests.delete(key);
    }
    
    /**
     * Clean up old entries (should be called periodically)
     */
    cleanup(): void {
        const now = Date.now();
        const windowStart = now - this.config.windowMs;
        
        for (const [key, times] of this.requests.entries()) {
            const validTimes = times.filter(time => time > windowStart);
            if (validTimes.length === 0) {
                this.requests.delete(key);
            } else {
                this.requests.set(key, validTimes);
            }
        }
    }
}

// Create rate limiters for different purposes

// OpenAI API: 100 requests per hour per user
export const openaiRateLimiter = new RateLimiter({
    maxRequests: 100,
    windowMs: 60 * 60 * 1000, // 1 hour
});

// Chat endpoint: 50 messages per day per user (more reasonable for production)
export const chatRateLimiter = new RateLimiter({
    maxRequests: 50,
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
});

// Chat burst protection: 10 messages per minute
export const chatBurstLimiter = new RateLimiter({
    maxRequests: 10,
    windowMs: 60 * 1000, // 1 minute
});

// ML API: 200 requests per minute (system-wide)
export const mlApiRateLimiter = new RateLimiter({
    maxRequests: 200,
    windowMs: 60 * 1000, // 1 minute
});

// Cleanup every 5 minutes
setInterval(() => {
    openaiRateLimiter.cleanup();
    chatRateLimiter.cleanup();
    chatBurstLimiter.cleanup();
    mlApiRateLimiter.cleanup();
}, 5 * 60 * 1000);

export { RateLimiter };
