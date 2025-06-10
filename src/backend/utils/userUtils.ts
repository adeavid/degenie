import { PrismaClient } from '@prisma/client';
import { UserTier } from '../types/ai';

const prisma = new PrismaClient();

export async function getUserTier(userId: string): Promise<UserTier> {
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

    // Check if user has active subscription
    if (user.subscription && 
        user.subscription.status === 'active' && 
        user.subscription.expiresAt > new Date()) {
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
  await prisma.user.update({
    where: { id: userId },
    data: { tier }
  });
}

export async function checkUserLimits(userId: string, action: string): Promise<boolean> {
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
  const limit = userLimits[action];
  
  if (limit === -1) return true; // Unlimited
  
  // Check usage for the action
  const usage = await getUserUsage(userId, action);
  return usage < limit;
}

async function getUserUsage(userId: string, action: string): Promise<number> {
  // Implementation would check Redis or database for usage counts
  // This is a placeholder
  return 0;
}