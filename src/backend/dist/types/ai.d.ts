export type UserTier = 'free' | 'starter' | 'viral';
export type AssetType = 'logo' | 'meme' | 'gif';
export type GenerationProvider = 'together' | 'replicate';
export interface GenerationRequest {
    userId: string;
    prompt: string;
    assetType: AssetType;
    tokenSymbol?: string;
    tokenName?: string;
    style?: string;
    additionalContext?: string;
}
export interface GenerationResponse {
    id: string;
    url: string;
    ipfsHash?: string;
    creditCost: number;
    processingTime: number;
    metadata: {
        prompt: string;
        model: string;
        provider: string;
        timestamp: number;
    };
}
export interface UserCredits {
    userId: string;
    balance: number;
    tier: UserTier;
    lifetimeEarned: number;
    lifetimeSpent: number;
    lastUpdated: Date;
}
export interface TierBenefits {
    tier: UserTier;
    monthlyCredits: number;
    features: {
        logoVariations: number;
        memeTemplates: number;
        gifLength: number;
        priority: boolean;
        customStyles: boolean;
        batchGeneration: boolean;
        apiAccess: boolean;
    };
    limits: {
        dailyGenerations: number;
        maxResolution: number;
        storageGB: number;
    };
}
export interface AIModelConfig {
    provider: GenerationProvider;
    modelId: string;
    name: string;
    description: string;
    capabilities: AssetType[];
    costPerGeneration: number;
    averageTime: number;
    maxResolution: number;
    supportsBatch: boolean;
}
//# sourceMappingURL=ai.d.ts.map