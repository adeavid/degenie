import { PrismaClient } from '@prisma/client';
import { UserTier } from '../types/ai';

const prisma = new PrismaClient();

export async function getUserTier(userId: string): Promise<UserTier> {
  if (!userId?.trim()) {
    return 'free';
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        tier: true,
        subscription: {
          select: {
            status: true,
            tier: true,
            expiresAt: true,
          }
        }
      }
    });

    if (!user) {
      return 'free';
    }

    // Check if user has active subscription with timezone-safe comparison
    if (user.subscription && 
        user.subscription.status === 'active' && 
        user.subscription.expiresAt && 
        user.subscription.expiresAt.getTime() > Date.now()) {
      return user.subscription.tier as UserTier;
    }

    // Default tier from user profile
    return (user.tier as UserTier) || 'free';
  } catch (error) {
    console.error('Error fetching user tier:', error);
    return 'free';
  }
}

export async function updateUserTier(userId: string, tier: UserTier): Promise<void> {
  if (!userId?.trim()) {
    throw new Error('Valid userId is required');
  }

  const validTiers: UserTier[] = ['free', 'starter', 'viral'];
  if (!validTiers.includes(tier)) {
    throw new Error(`Invalid tier: ${tier}. Valid tiers: ${validTiers.join(', ')}`);
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { tier }
    });
  } catch (error: any) {
    if (error.code === 'P2025') {
      throw new Error(`User not found: ${userId}`);
    }
    throw new Error(`Failed to update user tier: ${error?.message || 'Unknown error'}`);
  }
}

export async function checkUserLimits(userId: string, action: string): Promise<boolean> {
  if (!userId?.trim() || !action?.trim()) {
    return false;
  }

  const tier = await getUserTier(userId);
  
  const limits: Record<UserTier, Record<string, number>> = {
    free: {
      dailyGenerations: 10,
      tokensPerMonth: 3,
      chainsSupported: 1,
    },
    starter: {
      dailyGenerations: 100,
      tokensPerMonth: 10,
      chainsSupported: 2,
    },
    viral: {
      dailyGenerations: 1000,
      tokensPerMonth: -1, // unlimited
      chainsSupported: -1, // all chains
    }
  };

  const userLimits = limits[tier];
  const limit = userLimits?.[action];
  
  // If action is not defined for this tier, deny access
  if (limit === undefined) {
    return false;
  }
  
  if (limit === -1) return true; // Unlimited
  
  // Check usage for the action
  const usage = await getUserUsage(userId, action);
  return usage < limit;
}

async function getUserUsage(userId: string, action: string): Promise<number> {
  try {
    // Create Redis client if needed
    const { MockRedis } = await import('../src/services/MockRedis');
    const redis = new MockRedis();
    
    // Use daily usage key
    const today = new Date().toISOString().split('T')[0];
    const usageKey = `usage:${userId}:${action}:${today}`;
    
    const usage = await redis.get(usageKey);
    return parseInt(usage || '0', 10);
  } catch (error) {
    console.error('Error getting user usage:', error);
    // Return high number to be safe if Redis fails
    return 999999;
  }
}

export async function incrementUserUsage(userId: string, action: string): Promise<void> {
  try {
    const { MockRedis } = await import('../src/services/MockRedis');
    const redis = new MockRedis();
    
    const today = new Date().toISOString().split('T')[0];
    const usageKey = `usage:${userId}:${action}:${today}`;
    
    // Increment and set expiry for 25 hours (to handle timezone differences)
    await redis.incr(usageKey);
    await redis.expire(usageKey, 25 * 60 * 60);
  } catch (error) {
    console.error('Error incrementing user usage:', error);
  }
}