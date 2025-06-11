import { PrismaClient } from '@prisma/client';
import { downloadImage, uploadToIPFS, getIPFSUrl } from './MockIPFS';

interface StorageResult {
  id: string;
  ipfsHash: string;
  ipfsUrl: string;
  metadata: any;
}

export class GenerationStorageService {
  private prisma: PrismaClient;

  constructor(prisma?: PrismaClient) {
    this.prisma = prisma || new PrismaClient();
  }

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
  ): Promise<StorageResult> {
    try {
      console.log(`📦 Starting permanent storage for ${type} generation...`);
      
      // 1. Download the image from Replicate/Together.ai
      const imageBuffer = await downloadImage(resultUrl);
      
      // 2. Upload image to IPFS (mock for development)
      console.log(`🌐 Uploading image to IPFS...`);
      const ipfsHash = await uploadToIPFS(imageBuffer);
      const ipfsUrl = getIPFSUrl(ipfsHash);
      
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
    } catch (error: any) {
      console.error(`❌ Storage error:`, error);
      throw new Error(`Failed to store generation: ${error?.message || 'Unknown error'}`);
    }
  }


  async getGeneration(id: string): Promise<any> {
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
        ipfsUrl: generation.ipfsHash ? getIPFSUrl(generation.ipfsHash) : null,
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
        ipfsUrl: gen.ipfsHash ? getIPFSUrl(gen.ipfsHash) : null,
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
      throw new Error(`Failed to retrieve generation stats: ${error?.message || 'Unknown error'}`);
    }
  }

  async close(): Promise<void> {
    await this.prisma.$disconnect();
  }
}