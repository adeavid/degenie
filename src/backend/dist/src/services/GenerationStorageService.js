"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GenerationStorageService = void 0;
const client_1 = require("@prisma/client");
const MockIPFS_1 = require("./MockIPFS");
class GenerationStorageService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma || new client_1.PrismaClient();
    }
    async storeGeneration(userId, type, prompt, optimizedPrompt, provider, model, resultUrl, creditCost, processingTime, metadata = {}, tokenId) {
        try {
            console.log(`📦 Starting permanent storage for ${type} generation...`);
            // 1. Download the image from Replicate/Together.ai
            const imageBuffer = await (0, MockIPFS_1.downloadImage)(resultUrl);
            // 2. Upload image to IPFS (mock for development)
            console.log(`🌐 Uploading image to IPFS...`);
            const ipfsHash = await (0, MockIPFS_1.uploadToIPFS)(imageBuffer);
            const ipfsUrl = (0, MockIPFS_1.getIPFSUrl)(ipfsHash);
            // 3. Create comprehensive metadata
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
                    ipfsHash,
                    ipfsUrl,
                    storedAt: new Date().toISOString(),
                },
                user: {
                    userId,
                    tokenId: tokenId || null,
                },
                ...metadata
            };
            // 4. Create user if doesn't exist (for demo purposes)
            console.log(`👤 Ensuring user exists for demo...`);
            await this.prisma.user.upsert({
                where: { id: userId },
                update: {},
                create: {
                    id: userId,
                    walletAddress: `demo-wallet-${userId}`,
                    credits: 10.0,
                },
            });
            // 5. Save to database
            console.log(`💾 Saving generation metadata to database...`);
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
                    ipfsHash,
                    creditCost,
                    processingTime,
                    metadata: JSON.stringify(fullMetadata),
                },
            });
            console.log(`✅ Generation stored successfully! ID: ${generation.id}, IPFS: ${ipfsHash}`);
            return {
                id: generation.id,
                ipfsHash,
                ipfsUrl,
                metadata: fullMetadata,
            };
        }
        catch (error) {
            console.error(`❌ Storage error:`, error);
            throw new Error(`Failed to store generation: ${error?.message || 'Unknown error'}`);
        }
    }
    async getGeneration(id) {
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
                ipfsUrl: generation.ipfsHash ? (0, MockIPFS_1.getIPFSUrl)(generation.ipfsHash) : null,
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
                ipfsUrl: gen.ipfsHash ? (0, MockIPFS_1.getIPFSUrl)(gen.ipfsHash) : null,
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
            throw new Error(`Failed to retrieve generation stats: ${error?.message || 'Unknown error'}`);
        }
    }
    async close() {
        await this.prisma.$disconnect();
    }
}
exports.GenerationStorageService = GenerationStorageService;
//# sourceMappingURL=GenerationStorageService.js.map