import { EventEmitter } from 'events';
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
    holdDeGenieToken: number;
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
export declare class CreditService extends EventEmitter {
    private readonly earningRules;
    private readonly creditCosts;
    constructor();
    getBalance(userId: string): Promise<number>;
    checkAndDeductCredits(userId: string, amount: number): Promise<boolean>;
    earnCredits(userId: string, reason: keyof CreditEarningRules, metadata?: Record<string, any>): Promise<number>;
    refundCredits(userId: string, amount: number): Promise<void>;
    private checkEarningLimit;
    private updateDatabaseBalance;
    private recordTransaction;
    private checkAchievements;
    getTransactionHistory(userId: string, limit?: number): Promise<CreditTransaction[]>;
    initializeNewUser(userId: string): Promise<void>;
    processHoldingRewards(): Promise<void>;
    private getDeGenieTokenHolders;
    getCreditCosts(): CreditCosts;
    getEarningRules(): CreditEarningRules;
}
export {};
//# sourceMappingURL=CreditService.d.ts.map