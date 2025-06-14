import { Request, Response, NextFunction } from 'express';
import { MockRedis } from '../src/services/MockRedis';

const redis = new MockRedis();

interface RateLimitConfig {
  windowMs: number;
  max: number;
  keyGenerator?: (req: Request) => string;
  skipSuccessfulRequests?: boolean;
  tierMultipliers?: {
    free: number;
    starter: number;
    viral: number;
  };
}

const defaultConfigs: Record<string, RateLimitConfig> = {
  ai_generation: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // free tier default
    tierMultipliers: {
      free: 1,
      starter: 6,
      viral: 30,
    }
  },
  ai_batch_generation: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 2,
    tierMultipliers: {
      free: 0, // not allowed
      starter: 1,
      viral: 5,
    }
  },
  credit_earning: {
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    max: 20,
    tierMultipliers: {
      free: 1,
      starter: 1.5,
      viral: 2,
    }
  },
  api_general: {
    windowMs: 60 * 1000, // 1 minute
    max: 60,
    tierMultipliers: {
      free: 1,
      starter: 2,
      viral: 5,
    }
  }
};

export function rateLimitMiddleware(configName: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const config = defaultConfigs[configName] || defaultConfigs['api_general'];
      const userTier = req.user?.tier || 'free';
      
      // Calculate rate limit based on tier
      const tierMultiplier = config.tierMultipliers ? config.tierMultipliers[userTier as keyof typeof config.tierMultipliers] || 1 : 1;
      const maxRequests = Math.floor(config.max * tierMultiplier);
      
      if (maxRequests === 0) {
        res.status(403).json({ 
          error: 'This feature is not available for your tier',
          upgradeUrl: '/pricing'
        });
        return;
      }

      // Generate key
      const key = config.keyGenerator 
        ? config.keyGenerator(req)
        : `ratelimit:${configName}:${req.user?.id || req.ip}`;
      
      // Get current window
      const now = Date.now();
      const windowStart = now - config.windowMs;
      
      // Count requests in current window
      const requests = await redis.zcount(key, windowStart, now);
      
      if (requests >= maxRequests) {
        const oldestRequest = await redis.zrange(key, 0, 0, 'WITHSCORES');
        const resetTime = oldestRequest.length >= 2 && !isNaN(Number(oldestRequest[1]))
          ? Number(oldestRequest[1]) + config.windowMs
          : now + config.windowMs;
        
        res.status(429).json({
          error: 'Rate limit exceeded',
          limit: maxRequests,
          remaining: 0,
          reset: new Date(resetTime).toISOString(),
          tier: userTier,
          upgradeUrl: userTier !== 'viral' ? '/pricing' : undefined
        });
        return;
      }

      // Add current request
      await redis.zadd(key, now, `${now}-${Math.random()}`);
      await redis.expire(key, Math.ceil(config.windowMs / 1000));
      
      // Clean old entries
      await redis.zremrangebyscore(key, '-inf', windowStart);
      
      // Add headers
      res.setHeader('X-RateLimit-Limit', maxRequests.toString());
      res.setHeader('X-RateLimit-Remaining', (maxRequests - requests - 1).toString());
      res.setHeader('X-RateLimit-Reset', new Date(now + config.windowMs).toISOString());
      
      next();
    } catch (error) {
      console.error('Rate limit error:', error);
      // Allow request to proceed on error
      next();
    }
  };
}