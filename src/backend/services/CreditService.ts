import { PrismaClient } from '@prisma/client';
import { EventEmitter } from 'events';
import { MockRedis } from './MockRedis';

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
  private redis: MockRedis;
  private prisma: PrismaClient;
  
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
    this.redis = new MockRedis();
    this.prisma = new PrismaClient();
  }

  async getBalance(userId: string): Promise<number> {
    const cacheKey = `credits:${userId}`;
    const balance = await this.redis.get(cacheKey);
    
    if (balance === null) {
      // Fetch from database if not in cache
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { credits: true }
      });
      
      balance = user?.credits?.toString() || '0';
      await this.redis.setex(cacheKey, 300, balance); // Cache for 5 minutes
    }
    
    return parseFloat(balance);
  }

  async checkAndDeductCredits(userId: string, amount: number): Promise<boolean> {
    const balance = await this.getBalance(userId);
    
    if (balance < amount) {
      return false;
    }

    // Atomic deduction using Redis
    const newBalance = await this.redis.incrbyfloat(`credits:${userId}`, -amount);
    
    // Update database asynchronously
    this.updateDatabaseBalance(userId, newBalance);
    
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
  }

  async earnCredits(userId: string, reason: keyof CreditEarningRules, metadata?: Record<string, any>): Promise<number> {
    const amount = this.earningRules[reason];
    
    // Check for daily limits on certain earnings
    if (await this.checkEarningLimit(userId, reason)) {
      return 0;
    }

    const newBalance = await this.redis.incrbyfloat(`credits:${userId}`, amount);
    
    // Update database
    this.updateDatabaseBalance(userId, newBalance);
    
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
  }

  async refundCredits(userId: string, amount: number): Promise<void> {
    const newBalance = await this.redis.incrbyfloat(`credits:${userId}`, amount);
    
    this.updateDatabaseBalance(userId, newBalance);
    
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
    
    const count = await this.redis.incr(key);
    if (count === 1) {
      await this.redis.expire(key, 86400); // 24 hours
    }

    return count > limit;
  }

  private async updateDatabaseBalance(userId: string, balance: number): void {
    // Batch database updates for performance
    setTimeout(async () => {
      try {
        await this.prisma.user.update({
          where: { id: userId },
          data: { credits: balance }
        });
      } catch (error) {
        console.error('Failed to update database balance:', error);
      }
    }, 100);
  }

  private async recordTransaction(transaction: CreditTransaction): Promise<void> {
    await this.prisma.creditTransaction.create({
      data: transaction
    });

    // Keep recent transactions in Redis for quick access
    const key = `transactions:${transaction.userId}`;
    await this.redis.lpush(key, JSON.stringify(transaction));
    await this.redis.ltrim(key, 0, 99); // Keep last 100 transactions
    await this.redis.expire(key, 2592000); // 30 days
  }

  private async checkAchievements(userId: string, balance: number): Promise<void> {
    const achievements = [
      { threshold: 10, name: 'credit_novice', reward: 1 },
      { threshold: 50, name: 'credit_enthusiast', reward: 5 },
      { threshold: 100, name: 'credit_master', reward: 10 },
      { threshold: 500, name: 'credit_whale', reward: 50 },
    ];

    for (const achievement of achievements) {
      if (balance >= achievement.threshold) {
        const achieved = await this.redis.sismember(`achievements:${userId}`, achievement.name);
        
        if (!achieved) {
          await this.redis.sadd(`achievements:${userId}`, achievement.name);
          await this.earnCredits(userId, 'communityEngagement', { 
            achievement: achievement.name,
            reward: achievement.reward 
          });
          
          this.emit('achievementUnlocked', { userId, achievement: achievement.name });
        }
      }
    }
  }

  async getTransactionHistory(userId: string, limit = 20): Promise<CreditTransaction[]> {
    const cached = await this.redis.lrange(`transactions:${userId}`, 0, limit - 1);
    
    if (cached.length > 0) {
      return cached.map(t => JSON.parse(t));
    }

    // Fallback to database
    const transactions = await this.prisma.creditTransaction.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });

    return transactions;
  }

  async initializeNewUser(userId: string): Promise<void> {
    // Give 3 free credits to new users
    await this.redis.set(`credits:${userId}`, '3');
    
    await this.prisma.user.update({
      where: { id: userId },
      data: { credits: 3 }
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