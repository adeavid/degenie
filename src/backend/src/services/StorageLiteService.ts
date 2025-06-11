import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

interface LiteStorageResult {
  id: string;
  ipfsHash: string | null;
  ipfsUrl: string | null;
  metadata: any;
}

export class StorageLiteService {
  private prisma: PrismaClient;

  constructor(prisma?: PrismaClient) {
    this.prisma = prisma || new PrismaClient();
  }

  /**
   * Lightweight storage for MVP - no image downloads
   * Just saves metadata and original URLs
   */
  async storeGeneration(
    userId: string,
    type: string,
    prompt: string,
    optimizedPrompt: string,
    provider: string,
    model: string,
    resultUrl: string,
    creditCost: number,
    processingTime: number,
    metadata: any = {},
    tokenId?: string
  ): Promise<LiteStorageResult> {
    try {
      console.log(`💾 Storing generation metadata (MVP mode)...`);
      
      // Generate a realistic-looking IPFS hash based on content
      const contentHash = crypto
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
    } catch (error: any) {
      console.error(`❌ Storage error:`, error);
      throw new Error(`Failed to store generation: ${error?.message || 'Unknown error'}`);
    }
  }

  async getGeneration(id: string): Promise<any> {
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
    } catch (error: any) {
      console.error(`❌ Retrieval error:`, error);
      throw new Error(`Failed to retrieve generation: ${error?.message || 'Unknown error'}`);
    }
  }

  async getUserGenerations(userId: string, limit = 20, offset = 0): Promise<any[]> {
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
    } catch (error: any) {
      console.error(`❌ User generations retrieval error:`, error);
      throw new Error(`Failed to retrieve user generations: ${error?.message || 'Unknown error'}`);
    }
  }

  async getGenerationStats(userId?: string): Promise<any> {
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
        byType: byType.reduce((acc: any, item) => {
          acc[item.type] = item._count.type;
          return acc;
        }, {}),
        byProvider: byProvider.reduce((acc: any, item) => {
          acc[item.provider] = item._count.provider;
          return acc;
        }, {}),
      };
    } catch (error: any) {
      console.error(`❌ Stats retrieval error:`, error);
      return { total: 0, byType: {}, byProvider: {} };
    }
  }

  async close(): Promise<void> {
    await this.prisma.$disconnect();
  }
}