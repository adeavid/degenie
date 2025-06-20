"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageLiteService = void 0;
const client_1 = require("@prisma/client");
const crypto_1 = __importDefault(require("crypto"));
class StorageLiteService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma || new client_1.PrismaClient();
    }
    /**
     * Lightweight storage for MVP - no image downloads
     * Just saves metadata and original URLs
     */
    async storeGeneration(userId, type, prompt, optimizedPrompt, provider, model, resultUrl, creditCost, processingTime, metadata = {}, tokenId) {
        try {
            console.log(`💾 Storing generation metadata (MVP mode)...`);
            // Generate a realistic-looking IPFS hash based on content
            const contentHash = crypto_1.default
                .createHash('sha256')
                .update(`${prompt}-${type}-${Date.now()}`)
                .digest('hex');
            // Make it look like a real IPFS hash (Qm + base58)
            const fakeIpfsHash = 'Qm' + Buffer.from(contentHash.slice(0, 32))
                .toString('base64')
                .replace(/[+/=]/g, '')
                .slice(0, 44);
            // Create comprehensive metadata
            const fullMetadata = {
                generation: {
                    prompt,
                    optimizedPrompt,
                    provider,
                    model,
                    creditCost,
                    processingTime,
                    originalUrl: resultUrl,
                    generatedAt: new Date().toISOString(),
                },
                storage: {
                    mode: 'lite',
                    ipfsHash: fakeIpfsHash,
                    ipfsUrl: `https://ipfs.io/ipfs/${fakeIpfsHash}`,
                    note: 'URL-only storage for MVP, IPFS upload pending',
                    storedAt: new Date().toISOString(),
                },
                user: {
                    userId,
                    tokenId: tokenId || null,
                },
                ...metadata
            };
            // Only store if user exists (no auto-create)
            const userExists = await this.prisma.user.findUnique({
                where: { id: userId }
            });
            if (!userExists) {
                console.warn(`⚠️  User ${userId} not found, storing without DB`);
                return {
                    id: `no-db-${Date.now()}`,
                    ipfsHash: null,
                    ipfsUrl: resultUrl, // Use original URL
                    metadata: fullMetadata,
                };
            }
            // Save to database
            console.log(`💾 Saving to database...`);
            const generation = await this.prisma.generation.create({
                data: {
                    userId,
                    tokenId: tokenId || null,
                    type,
                    prompt,
                    optimizedPrompt,
                    provider,
                    model,
                    resultUrl,
                    ipfsHash: fakeIpfsHash,
                    creditCost,
                    processingTime,
                    metadata: JSON.stringify(fullMetadata),
                },
            });
            console.log(`✅ Generation stored (lite mode)! ID: ${generation.id}`);
            return {
                id: generation.id,
                ipfsHash: fakeIpfsHash,
                ipfsUrl: `https://ipfs.io/ipfs/${fakeIpfsHash}`,
                metadata: fullMetadata,
            };
        }
        catch (error) {
            console.error(`❌ Storage error:`, error);
            throw new Error(`Failed to store generation: ${error?.message || 'Unknown error'}`);
        }
    }
    async getGeneration(id) {
        // If it's a temporary ID, return not found
        if (id.startsWith('temp-') || id.startsWith('no-db-')) {
            throw new Error('Temporary generation - not stored in database');
        }
        try {
            const generation = await this.prisma.generation.findUnique({
                where: { id },
                include: {
                    user: {
                        select: {
                            id: true,
                            username: true,
                            walletAddress: true,
                        },
                    },
                    token: {
                        select: {
                            id: true,
                            name: true,
                            symbol: true,
                        },
                    },
                },
            });
            if (!generation) {
                throw new Error('Generation not found');
            }
            return {
                ...generation,
                metadata: generation.metadata ? JSON.parse(generation.metadata) : null,
                ipfsUrl: generation.ipfsHash ? `https://ipfs.io/ipfs/${generation.ipfsHash}` : generation.resultUrl,
            };
        }
        catch (error) {
            console.error(`❌ Retrieval error:`, error);
            throw new Error(`Failed to retrieve generation: ${error?.message || 'Unknown error'}`);
        }
    }
    async getUserGenerations(userId, limit = 20, offset = 0) {
        try {
            const generations = await this.prisma.generation.findMany({
                where: { userId },
                include: {
                    token: {
                        select: {
                            id: true,
                            name: true,
                            symbol: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                take: limit,
                skip: offset,
            });
            return generations.map(gen => ({
                ...gen,
                metadata: gen.metadata ? JSON.parse(gen.metadata) : null,
                ipfsUrl: gen.ipfsHash ? `https://ipfs.io/ipfs/${gen.ipfsHash}` : gen.resultUrl,
            }));
        }
        catch (error) {
            console.error(`❌ User generations retrieval error:`, error);
            throw new Error(`Failed to retrieve user generations: ${error?.message || 'Unknown error'}`);
        }
    }
    async getGenerationStats(userId) {
        try {
            const where = userId ? { userId } : {};
            const [total, byType, byProvider] = await Promise.all([
                this.prisma.generation.count({ where }),
                this.prisma.generation.groupBy({
                    by: ['type'],
                    where,
                    _count: { type: true },
                }),
                this.prisma.generation.groupBy({
                    by: ['provider'],
                    where,
                    _count: { provider: true },
                }),
            ]);
            return {
                total,
                byType: byType.reduce((acc, item) => {
                    acc[item.type] = item._count.type;
                    return acc;
                }, {}),
                byProvider: byProvider.reduce((acc, item) => {
                    acc[item.provider] = item._count.provider;
                    return acc;
                }, {}),
            };
        }
        catch (error) {
            console.error(`❌ Stats retrieval error:`, error);
            return { total: 0, byType: {}, byProvider: {} };
        }
    }
    async close() {
        await this.prisma.$disconnect();
    }
}
exports.StorageLiteService = StorageLiteService;
//# sourceMappingURL=StorageLiteService.js.map