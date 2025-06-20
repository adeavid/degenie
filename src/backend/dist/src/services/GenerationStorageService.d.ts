import { PrismaClient } from '@prisma/client';
interface StorageResult {
    id: string;
    ipfsHash: string;
    ipfsUrl: string;
    metadata: any;
}
export declare class GenerationStorageService {
    private prisma;
    constructor(prisma?: PrismaClient);
    storeGeneration(userId: string, type: string, prompt: string, optimizedPrompt: string, provider: string, model: string, resultUrl: string, creditCost: number, processingTime: number, metadata?: any, tokenId?: string): Promise<StorageResult>;
    getGeneration(id: string): Promise<any>;
    getUserGenerations(userId: string, limit?: number, offset?: number): Promise<any[]>;
    getGenerationStats(userId?: string): Promise<any>;
    close(): Promise<void>;
}
export {};
//# sourceMappingURL=GenerationStorageService.d.ts.map