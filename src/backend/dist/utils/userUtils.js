"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserTier = getUserTier;
exports.updateUserTier = updateUserTier;
exports.checkUserLimits = checkUserLimits;
exports.incrementUserUsage = incrementUserUsage;
const prisma_1 = require("../lib/prisma");
const redis_1 = require("../lib/redis");
async function getUserTier(userId) {
    if (!userId?.trim()) {
        return 'free';
    }
    try {
        const user = await prisma_1.prisma.user.findUnique({
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
            return user.subscription.tier;
        }
        // Default tier from user profile
        return user.tier || 'free';
    }
    catch (error) {
        console.error('Error fetching user tier:', error);
        return 'free';
    }
}
async function updateUserTier(userId, tier) {
    if (!userId?.trim()) {
        throw new Error('Valid userId is required');
    }
    const validTiers = ['free', 'starter', 'viral'];
    if (!validTiers.includes(tier)) {
        throw new Error(`Invalid tier: ${tier}. Valid tiers: ${validTiers.join(', ')}`);
    }
    try {
        await prisma_1.prisma.user.update({
            where: { id: userId },
            data: { tier }
        });
    }
    catch (error) {
        if (error.code === 'P2025') {
            throw new Error(`User not found: ${userId}`);
        }
        throw new Error(`Failed to update user tier: ${error?.message || 'Unknown error'}`);
    }
}
// Tier limits configuration - extracted for reusability
const TIER_LIMITS = {
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
async function checkUserLimits(userId, action) {
    if (!userId?.trim() || !action?.trim()) {
        return false;
    }
    const tier = await getUserTier(userId);
    const userLimits = TIER_LIMITS[tier];
    const limit = userLimits?.[action];
    // If action is not defined for this tier, deny access
    if (limit === undefined) {
        return false;
    }
    if (limit === -1)
        return true; // Unlimited
    // Check usage for the action
    const usage = await getUserUsage(userId, action);
    return usage < limit;
}
async function getUserUsage(userId, action) {
    try {
        // Use shared Redis instance to ensure data persists
        const redis = (0, redis_1.getRedisInstance)();
        // Use daily usage key
        const today = new Date().toISOString().split('T')[0];
        const usageKey = `usage:${userId}:${action}:${today}`;
        const usage = await redis.get(usageKey);
        return parseInt(usage || '0', 10);
    }
    catch (error) {
        console.error('Error getting user usage:', error);
        // Return high number to be safe if Redis fails
        return 999999;
    }
}
async function incrementUserUsage(userId, action) {
    try {
        // Use shared Redis instance to ensure data persists
        const redis = (0, redis_1.getRedisInstance)();
        const today = new Date().toISOString().split('T')[0];
        const usageKey = `usage:${userId}:${action}:${today}`;
        // Increment and set expiry for 25 hours (to handle timezone differences)
        await redis.incr(usageKey);
        await redis.expire(usageKey, 25 * 60 * 60);
    }
    catch (error) {
        console.error('Error incrementing user usage:', error);
    }
}
//# sourceMappingURL=userUtils.js.map