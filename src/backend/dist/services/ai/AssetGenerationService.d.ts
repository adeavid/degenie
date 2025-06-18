import { UserTier, AssetType } from '../../types/ai';
interface GenerationResult {
    id: string;
    url: string;
    ipfsHash?: string;
    metadata: {
        prompt: string;
        model: string;
        provider: string;
        timestamp: number;
        creditCost: number;
    };
}
export declare class AssetGenerationService {
    private togetherClient;
    private replicateClient;
    private redis;
    private creditService;
    private readonly providers;
    constructor();
    generateAsset(userId: string, prompt: string, assetType: AssetType, userTier: UserTier, tokenSymbol?: string): Promise<GenerationResult>;
    private generateWithTogether;
    private generateWithReplicate;
    private optimizePrompt;
    private checkRateLimit;
    private trackUsage;
    getGenerationHistory(userId: string, limit?: number): Promise<GenerationResult[]>;
}
export {};
//# sourceMappingURL=AssetGenerationService.d.ts.map