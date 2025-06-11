import { EventEmitter } from 'events';
import { prisma } from '../lib/prisma';
import { getRedisInstance } from '../lib/redis';

interface CreditTransaction {
  userId: string;
  amount: number;
  type: 'earn' | 'spend' | 'refund';
  reason: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}

interface CreditEarningRules {
  dailyLogin: number;
  shareOnTwitter: number;
  tokenReaches10kMcap: number;
  tokenReaches100kMcap: number;
  tokenReaches1mMcap: number;
  referralSignup: number;
  holdDeGenieToken: number; // per day per 1000 tokens
  firstTokenCreation: number;
  communityEngagement: number;
}

interface CreditCosts {
  basicLogo: number;
  proLogo: number;
  premiumLogo: number;
  memeGeneration: number;
  gifCreation: number;
  viralityAnalysis: number;
  advancedAnalytics: number;
  multiChainDeploy: number;
}

export class CreditService extends EventEmitter {
  private readonly earningRules: CreditEarningRules = {
    dailyLogin: 0.1,
    shareOnTwitter: 0.5,
    tokenReaches10kMcap: 2,
    tokenReaches100kMcap: 5,
    tokenReaches1mMcap: 20,
    referralSignup: 1,
    holdDeGenieToken: 0.01, // per day per 1000 tokens
    firstTokenCreation: 0.5,
    communityEngagement: 0.2,
  };

  private readonly creditCosts: CreditCosts = {
    basicLogo: 0.5,
    proLogo: 1.0,
    premiumLogo: 1.5,
    memeGeneration: 0.1,
    gifCreation: 0.3,
    viralityAnalysis: 0.2,
    advancedAnalytics: 0.5,
    multiChainDeploy: 2.0,
  };

  constructor() {
    super();
    // Use singleton instances to prevent connection pool exhaustion
  }

  async getBalance(userId: string): Promise<number> {
    if (!userId?.trim()) {
      throw new Error('Valid userId is required');
    }

    try {
      const redis = getRedisInstance();
      const cacheKey = `credits:${userId}`;
      let balance = await redis.get(cacheKey);
      
      if (balance === null) {
        // Fetch from database if not in cache
        let user = await prisma.user.findUnique({
          where: { walletAddress: userId },
          select: { credits: true }
        });
        
        // Create user if doesn't exist
        if (!user) {
          user = await prisma.user.create({
            data: { walletAddress: userId, credits: 3 }, // 3 free credits for new users
            select: { credits: true }
          });
        }
        
        balance = user?.credits?.toString() || '0';
        await redis.setex(cacheKey, 300, balance); // Cache for 5 minutes
      }
      
      const numericBalance = parseFloat(balance);
      return isNaN(numericBalance) ? 0 : Math.max(0, numericBalance); // Ensure non-negative
    } catch (error: any) {
      console.error(`Error getting balance for user ${userId}:`, error);
      return 0; // Safe fallback
    }
  }

  async checkAndDeductCredits(userId: string, amount: number): Promise<boolean> {
    if (!userId?.trim()) {
      throw new Error('Valid userId is required');
    }

    if (amount <= 0) {
      throw new Error('Amount must be positive');
    }

    try {
      // Atomic check and deduct operation using Redis (simulates Lua script)
      const redis = getRedisInstance();
      const cacheKey = `credits:${userId}`;
      
      // Ensure cache is populated with current balance
      const currentBalance = await this.getBalance(userId);
      // key already cached inside getBalance – avoid overwriting to preserve concurrent deductions

      // Atomic check and deduct
      const newBalance = await redis.atomicCheckAndDeduct(cacheKey, amount);
      if (newBalance === -1) {
        return false; // Insufficient funds
      }
      
      // Update database
      await this.updateDatabaseBalance(userId, newBalance);
      
      // Record transaction
      await this.recordTransaction({
        userId,
        amount: -amount,
        type: 'spend',
        reason: 'Asset generation',
        timestamp: new Date(),
      });

      this.emit('creditsSpent', { userId, amount, newBalance });
      
      return true;
    } catch (error: any) {
      console.error(`Error deducting credits for user ${userId}:`, error);
      throw new Error(`Failed to deduct credits: ${error?.message || 'Unknown error'}`);
    }
  }

  async earnCredits(userId: string, reason: keyof CreditEarningRules, metadata?: Record<string, any>): Promise<number> {
    if (!userId?.trim()) {
      throw new Error('Valid userId is required');
    }

    if (!reason) {
      throw new Error('Valid reason is required');
    }

    try {
      const amount = this.earningRules[reason];
      
      if (amount <= 0) {
        throw new Error(`Invalid earning amount for reason: ${reason}`);
      }
      
      // Check for daily limits on certain earnings
      if (await this.checkEarningLimit(userId, reason)) {
        return 0;
      }

      const redis = getRedisInstance();
      const newBalance = await redis.incrbyfloat(`credits:${userId}`, amount);
      
      // Update database
      await this.updateDatabaseBalance(userId, newBalance);
      
      // Record transaction
      await this.recordTransaction({
        userId,
        amount,
        type: 'earn',
        reason,
        metadata,
        timestamp: new Date(),
      });

      // Achievement check
      await this.checkAchievements(userId, newBalance);
      
      this.emit('creditsEarned', { userId, amount, reason, newBalance });
      
      return amount;
    } catch (error: any) {
      console.error(`Error earning credits for user ${userId}:`, error);
      throw new Error(`Failed to earn credits: ${error?.message || 'Unknown error'}`);
    }
  }

  async refundCredits(userId: string, amount: number): Promise<void> {
    const redis = getRedisInstance();
    const newBalance = await redis.incrbyfloat(`credits:${userId}`, amount);
    
    await this.updateDatabaseBalance(userId, newBalance);
    
    await this.recordTransaction({
      userId,
      amount,
      type: 'refund',
      reason: 'Generation failed',
      timestamp: new Date(),
    });

    this.emit('creditsRefunded', { userId, amount, newBalance });
  }

  private async checkEarningLimit(userId: string, reason: string): Promise<boolean> {
    const dailyLimits: Partial<Record<keyof CreditEarningRules, number>> = {
      dailyLogin: 1,
      shareOnTwitter: 5,
      communityEngagement: 10,
    };

    const limit = dailyLimits[reason as keyof CreditEarningRules];
    if (!limit) return false;

    const today = new Date().toISOString().split('T')[0];
    const key = `earning_limit:${userId}:${reason}:${today}`;
    
    const redis = getRedisInstance();
    const count = await redis.incr(key);
    if (count === 1) {
      await redis.expire(key, 86400); // 24 hours
    }

    return count > limit;
  }

  private async updateDatabaseBalance(userId: string, balance: number): Promise<void> {
    if (!userId?.trim()) {
      throw new Error('Valid userId is required');
    }

    if (balance < 0) {
      throw new Error('Balance cannot be negative');
    }

    try {
      // Use immediate update instead of setTimeout for data consistency
      await prisma.user.upsert({
        where: { walletAddress: userId },
        update: { credits: balance },
        create: { walletAddress: userId, credits: balance }
      });
    } catch (error: any) {
      console.error(`Failed to update database balance for user ${userId}:`, error);
      
      // Clear cache on database update failure to prevent inconsistency
      const redis = getRedisInstance();
      await redis.del(`credits:${userId}`).catch(() => {
        console.error('Failed to clear cache after database update failure');
      });
      
      throw new Error(`Database update failed: ${error?.message || 'Unknown error'}`);
    }
  }

  private async recordTransaction(transaction: CreditTransaction): Promise<void> {
    try {
      // Get current balance to calculate balanceBefore and balanceAfter
      const currentBalance = await this.getBalance(transaction.userId);
      const balanceBefore = 
        transaction.type === 'earn'
          ? currentBalance - transaction.amount            // earn: was less before adding
          : transaction.type === 'refund'
              ? currentBalance - transaction.amount        // refund: was less before refunding
              : currentBalance + Math.abs(transaction.amount); // spend: was more before spending
      const balanceAfter = currentBalance;

      // Get the actual user ID from database
      const user = await prisma.user.findUnique({
        where: { walletAddress: transaction.userId },
        select: { id: true }
      });

      if (!user) {
        throw new Error(`User not found: ${transaction.userId}`);
      }

      await prisma.creditTransaction.create({
        data: {
          userId: user.id,
          amount: transaction.amount,
          type: transaction.type,
          reason: transaction.reason,
          metadata: transaction.metadata ? JSON.stringify(transaction.metadata) : null,
          balanceBefore,
          balanceAfter,
          timestamp: transaction.timestamp,
        }
      });

      // Keep recent transactions in Redis for quick access
      const redis = getRedisInstance();
      const key = `transactions:${transaction.userId}`;
      await redis.lpush(key, JSON.stringify(transaction));
      await redis.ltrim(key, 0, 99); // Keep last 100 transactions
      await redis.expire(key, 2592000); // 30 days
    } catch (error: any) {
      console.error(`Failed to record transaction for user ${transaction.userId}:`, error);
      throw new Error(`Transaction recording failed: ${error?.message || 'Unknown error'}`);
    }
  }

  private async checkAchievements(userId: string, balance: number): Promise<void> {
    const achievements = [
      { threshold: 10, name: 'credit_novice', reward: 1 },
      { threshold: 50, name: 'credit_enthusiast', reward: 5 },
      { threshold: 100, name: 'credit_master', reward: 10 },
      { threshold: 500, name: 'credit_whale', reward: 50 },
    ];

    const redis = getRedisInstance();
    const achievementRewards: Array<{ name: string; reward: number }> = [];

    for (const achievement of achievements) {
      if (balance >= achievement.threshold) {
        const achieved = await redis.sismember(`achievements:${userId}`, achievement.name);
        
        if (!achieved) {
          await redis.sadd(`achievements:${userId}`, achievement.name);
          achievementRewards.push({ name: achievement.name, reward: achievement.reward });
          this.emit('achievementUnlocked', { userId, achievement: achievement.name });
        }
      }
    }

    // Award all achievement credits in bulk to prevent recursive calls
    if (achievementRewards.length > 0) {
      const totalReward = achievementRewards.reduce((sum, a) => sum + a.reward, 0);
      const newBalance = await redis.incrbyfloat(`credits:${userId}`, totalReward);
      
      await this.updateDatabaseBalance(userId, newBalance);
      
      // Record single transaction for all achievement rewards
      await this.recordTransaction({
        userId,
        amount: totalReward,
        type: 'earn',
        reason: 'Achievement rewards',
        metadata: { achievements: achievementRewards },
        timestamp: new Date(),
      });

      this.emit('creditsEarned', { userId, amount: totalReward, reason: 'achievements', newBalance });
    }
  }

  async getTransactionHistory(userId: string, limit = 20): Promise<CreditTransaction[]> {
    if (!userId?.trim()) {
      throw new Error('Valid userId is required');
    }

    if (limit <= 0 || limit > 100) {
      throw new Error('Limit must be between 1 and 100');
    }

    try {
      const redis = getRedisInstance();
      const cached = await redis.lrange(`transactions:${userId}`, 0, limit - 1);
      
      if (cached.length > 0) {
        return cached.map((t: string) => JSON.parse(t) as CreditTransaction);
      }

      // Fallback to database - get actual user ID first
      const user = await prisma.user.findUnique({
        where: { walletAddress: userId },
        select: { id: true }
      });

      if (!user) {
        return []; // No user found, return empty array
      }

      const transactions = await prisma.creditTransaction.findMany({
        where: { userId: user.id },
        orderBy: { timestamp: 'desc' },
        take: limit,
      });

      // Transform database records to match CreditTransaction interface
      return transactions.map(t => ({
        userId: t.userId,
        amount: t.amount,
        type: t.type as 'earn' | 'spend' | 'refund',
        reason: t.reason,
        metadata: t.metadata ? JSON.parse(t.metadata) : undefined,
        timestamp: t.timestamp,
      }));
    } catch (error: any) {
      console.error(`Error getting transaction history for user ${userId}:`, error);
      throw new Error(`Failed to retrieve transaction history: ${error?.message || 'Unknown error'}`);
    }
  }

  async initializeNewUser(userId: string): Promise<void> {
    // Give 3 free credits to new users
    const redis = getRedisInstance();
    await redis.set(`credits:${userId}`, '3');
    
    await prisma.user.upsert({
      where: { walletAddress: userId },
      update: { credits: 3 },
      create: { walletAddress: userId, credits: 3 }
    });

    await this.recordTransaction({
      userId,
      amount: 3,
      type: 'earn',
      reason: 'Welcome bonus',
      timestamp: new Date(),
    });

    this.emit('newUserInitialized', { userId, initialCredits: 3 });
  }

  // Scheduled tasks (run via cron)
  async processHoldingRewards(): Promise<void> {
    // This would be called by a cron job daily
    const holders = await this.getDeGenieTokenHolders();
    
    for (const holder of holders) {
      const tokensHeld = holder.balance / 1000; // Per 1000 tokens
      const dailyReward = tokensHeld * this.earningRules.holdDeGenieToken;
      
      if (dailyReward > 0) {
        await this.earnCredits(holder.userId, 'holdDeGenieToken', {
          tokensHeld: holder.balance,
          dailyReward
        });
      }
    }
  }

  private async getDeGenieTokenHolders(): Promise<any[]> {
    // Implementation would query blockchain for token holders
    // This is a placeholder
    return [];
  }

  getCreditCosts(): CreditCosts {
    return { ...this.creditCosts };
  }

  getEarningRules(): CreditEarningRules {
    return { ...this.earningRules };
  }
}