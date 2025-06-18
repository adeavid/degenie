import Together from 'together-ai';
import Replicate from 'replicate';
import { v4 as uuidv4 } from 'uuid';
import { uploadToIPFS } from '../../utils/ipfs';
import { CreditService } from '../CreditService';
import { UserTier, AssetType, GenerationProvider } from '../../types/ai';
import { MockRedis } from '../../src/services/MockRedis';

interface GenerationConfig {
  provider: GenerationProvider;
  model: string;
  creditCost: number;
  settings?: Record<string, any>;
}

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

export class AssetGenerationService {
  private togetherClient: Together;
  private replicateClient: Replicate;
  private redis: MockRedis;
  private creditService: CreditService;

  private readonly providers: Record<UserTier, Record<AssetType, GenerationConfig>> = {
    free: {
      logo: {
        provider: 'together',
        model: 'stabilityai/stable-diffusion-xl-base-1.0',
        creditCost: 0.5,
        settings: {
          steps: 20,
          width: 512,
          height: 512,
        }
      },
      meme: {
        provider: 'together',
        model: 'stabilityai/stable-diffusion-xl-base-1.0',
        creditCost: 0.1,
        settings: {
          steps: 15,
          width: 512,
          height: 512,
        }
      },
      gif: {
        provider: 'together',
        model: 'stabilityai/stable-diffusion-xl-base-1.0',
        creditCost: 0.3,
        settings: {
          steps: 20,
          n: 4, // 4 frames for basic GIF
        }
      }
    },
    starter: {
      logo: {
        provider: 'together',
        model: 'black-forest-labs/FLUX.1-schnell',
        creditCost: 1.0,
        settings: {
          steps: 4,
          width: 1024,
          height: 1024,
        }
      },
      meme: {
        provider: 'together',
        model: 'black-forest-labs/FLUX.1-schnell',
        creditCost: 0.2,
        settings: {
          steps: 4,
          width: 768,
          height: 768,
        }
      },
      gif: {
        provider: 'replicate',
        model: 'stability-ai/stable-video-diffusion',
        creditCost: 0.5,
        settings: {
          frames: 25,
          fps: 6,
        }
      }
    },
    viral: {
      logo: {
        provider: 'replicate',
        model: 'stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b',
        creditCost: 1.5,
        settings: {
          num_inference_steps: 50,
          width: 1024,
          height: 1024,
          high_noise_frac: 0.8,
        }
      },
      meme: {
        provider: 'replicate',
        model: 'fofr/sdxl-emoji:dee76b5afde21b0f01ed7925f0665b7e879c50ee718c5f78a9d38e04d523cc5e',
        creditCost: 0.3,
        settings: {
          width: 1024,
          height: 1024,
          num_inference_steps: 30,
        }
      },
      gif: {
        provider: 'replicate',
        model: 'stability-ai/stable-video-diffusion:3f0457e4619daac51203dedb472816fd4af51f3149fa7a9e0b5ffcf1b8172438',
        creditCost: 1.0,
        settings: {
          frames: 25,
          fps: 8,
          motion_bucket_id: 127,
        }
      }
    }
  };

  constructor() {
    this.togetherClient = new Together({
      auth: process.env['TOGETHER_API_KEY']!
    });
    
    this.replicateClient = new Replicate({
      auth: process.env['REPLICATE_API_TOKEN']!
    });
    
    this.redis = new MockRedis();
    this.creditService = new CreditService();
  }

  async generateAsset(
    userId: string,
    prompt: string,
    assetType: AssetType,
    userTier: UserTier,
    tokenSymbol?: string
  ): Promise<GenerationResult> {
    // Check rate limits
    await this.checkRateLimit(userId, userTier);
    
    // Get generation config
    const config = this.providers[userTier][assetType];
    
    // Check and deduct credits
    const hasCredits = await this.creditService.checkAndDeductCredits(
      userId,
      config.creditCost
    );
    
    if (!hasCredits) {
      throw new Error('Insufficient credits');
    }

    try {
      // Optimize prompt based on asset type and tier
      const optimizedPrompt = this.optimizePrompt(prompt, assetType, userTier, tokenSymbol);
      
      // Generate asset based on provider
      let result: any;
      if (config.provider === 'together') {
        result = await this.generateWithTogether(optimizedPrompt, config);
      } else {
        result = await this.generateWithReplicate(optimizedPrompt, config);
      }

      // Upload to IPFS (with fallback for development)
      let ipfsHash: string | undefined;
      let imageUrl = result.url || result.output?.[0];
      
      // For development, use fallback URL if no image URL is provided
      if (!imageUrl) {
        const size = assetType === 'logo' ? '256/256' : '512/512';
        imageUrl = `https://picsum.photos/${size}?random=${Date.now()}-${assetType}`;
        console.log(`Using fallback placeholder for ${assetType}`);
      }
      
      try {
        if (result.data || result.output) {
          ipfsHash = await uploadToIPFS(result.data || result.output);
        }
      } catch (ipfsError) {
        console.warn('IPFS upload failed:', ipfsError);
        // IPFS failure doesn't change the imageUrl, we keep the existing one
      }
      
      // Save generation metadata
      const generationId = uuidv4();
      const metadata: GenerationResult = {
        id: generationId,
        url: imageUrl,
        ipfsHash,
        metadata: {
          prompt: optimizedPrompt,
          model: config.model,
          provider: config.provider,
          timestamp: Date.now(),
          creditCost: config.creditCost,
        }
      };

      // Cache result
      await this.redis.setex(
        `generation:${userId}:${generationId}`,
        86400, // 24 hours
        JSON.stringify(metadata)
      );

      // Track usage analytics
      await this.trackUsage(userId, assetType, userTier, config.creditCost);

      return metadata;
    } catch (error) {
      // Refund credits on failure
      await this.creditService.refundCredits(userId, config.creditCost);
      throw error;
    }
  }

  private async generateWithTogether(
    prompt: string,
    config: GenerationConfig
  ): Promise<any> {
    // Together AI uses inference endpoint for image generation
    const response = await this.togetherClient.inference(config.model, {
      prompt,
      ...config.settings,
      n: 1,
    }) as any;

    return {
      data: response.output?.data?.[0]?.b64_json || null,
      url: response.output?.data?.[0]?.url || response.output?.[0] || null,
    };
  }

  private async generateWithReplicate(
    prompt: string,
    config: GenerationConfig
  ): Promise<any> {
    const output = await this.replicateClient.run(
      config.model as `${string}/${string}:${string}`,
      {
        input: {
          prompt,
          ...config.settings,
        }
      }
    );

    return { output };
  }

  private optimizePrompt(
    basePrompt: string,
    assetType: AssetType,
    tier: UserTier,
    tokenSymbol?: string
  ): string {
    const styleGuides: Record<AssetType, Record<UserTier, string>> = {
      logo: {
        free: 'simple, clean, minimalist logo design',
        starter: 'professional, modern, high-quality logo design, trending on Behance',
        viral: 'ultra-detailed, award-winning logo design, premium quality, trending on Dribbble',
      },
      meme: {
        free: 'funny meme, simple style',
        starter: 'viral meme potential, high quality, sharp details',
        viral: 'ultra-viral meme, perfect composition, trending format, maximum engagement',
      },
      gif: {
        free: 'simple animation, smooth motion',
        starter: 'engaging animation, professional quality',
        viral: 'cinematic animation, perfect loop, viral potential',
      }
    };

    const cryptoContext = tokenSymbol 
      ? `, cryptocurrency theme, ${tokenSymbol} token branding`
      : ', crypto/Web3 themed';

    return `${basePrompt}${cryptoContext}, ${styleGuides[assetType][tier]}`;
  }

  private async checkRateLimit(userId: string, tier: UserTier): Promise<void> {
    const limits: Record<UserTier, number> = {
      free: 10,    // 10 per hour
      starter: 60,  // 60 per hour
      viral: 300,   // 300 per hour
    };

    const key = `ratelimit:${userId}:${new Date().getHours()}`;
    const current = await this.redis.incr(key);
    
    if (current === 1) {
      await this.redis.expire(key, 3600); // 1 hour
    }

    if (current > limits[tier]) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }
  }

  private async trackUsage(
    userId: string,
    assetType: AssetType,
    tier: UserTier,
    creditCost: number
  ): Promise<void> {
    await this.redis.hincrby(`usage:${userId}`, assetType, 1);
    await this.redis.hincrby(`usage:${userId}`, 'totalCreditsSpent', creditCost * 100);
    await this.redis.hincrby(`usage:global:${tier}`, assetType, 1);
  }

  async getGenerationHistory(userId: string, limit = 10): Promise<GenerationResult[]> {
    // Implementation for retrieving user's generation history
    const keys = await this.redis.keys(`generation:${userId}:*`);
    const results: GenerationResult[] = [];
    
    for (const key of keys.slice(0, limit)) {
      const data = await this.redis.get(key);
      if (data) {
        results.push(JSON.parse(data));
      }
    }
    
    return results;
  }
}