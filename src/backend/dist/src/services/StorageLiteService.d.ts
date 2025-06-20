import { PrismaClient } from '@prisma/client';
interface LiteStorageResult {
    id: string;
    ipfsHash: string | null;
    ipfsUrl: string | null;
    metadata: any;
}
export declare class StorageLiteService {
    private prisma;
    constructor(prisma?: PrismaClient);
    /**
     * Lightweight storage for MVP - no image downloads
     * Just saves metadata and original URLs
     */
    storeGeneration(userId: string, type: string, prompt: string, optimizedPrompt: string, provider: string, model: string, resultUrl: string, creditCost: number, processingTime: number, metadata?: any, tokenId?: string): Promise<LiteStorageResult>;
    getGeneration(id: string): Promise<any>;
    getUserGenerations(userId: string, limit?: number, offset?: number): Promise<any[]>;
    getGenerationStats(userId?: string): Promise<any>;
    close(): Promise<void>;
}
export {};
//# sourceMappingURL=StorageLiteService.d.ts.map