"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssetGenerationService = void 0;
const together_ai_1 = __importDefault(require("together-ai"));
const replicate_1 = __importDefault(require("replicate"));
const uuid_1 = require("uuid");
const ipfs_1 = require("../../utils/ipfs");
const CreditService_1 = require("../CreditService");
const MockRedis_1 = require("../../src/services/MockRedis");
class AssetGenerationService {
    togetherClient;
    replicateClient;
    redis;
    creditService;
    providers = {
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
        this.togetherClient = new together_ai_1.default({
            auth: process.env['TOGETHER_API_KEY']
        });
        this.replicateClient = new replicate_1.default({
            auth: process.env['REPLICATE_API_TOKEN']
        });
        this.redis = new MockRedis_1.MockRedis();
        this.creditService = new CreditService_1.CreditService();
    }
    async generateAsset(userId, prompt, assetType, userTier, tokenSymbol) {
        // Check rate limits
        await this.checkRateLimit(userId, userTier);
        // Get generation config
        const config = this.providers[userTier][assetType];
        // Check and deduct credits
        const hasCredits = await this.creditService.checkAndDeductCredits(userId, config.creditCost);
        if (!hasCredits) {
            throw new Error('Insufficient credits');
        }
        try {
            // Optimize prompt based on asset type and tier
            const optimizedPrompt = this.optimizePrompt(prompt, assetType, userTier, tokenSymbol);
            // Generate asset based on provider
            let result;
            if (config.provider === 'together') {
                result = await this.generateWithTogether(optimizedPrompt, config);
            }
            else {
                result = await this.generateWithReplicate(optimizedPrompt, config);
            }
            // Upload to IPFS
            const ipfsHash = await (0, ipfs_1.uploadToIPFS)(result.data || result.output);
            // Save generation metadata
            const generationId = (0, uuid_1.v4)();
            const metadata = {
                id: generationId,
                url: result.url || result.output?.[0],
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
            await this.redis.setex(`generation:${userId}:${generationId}`, 86400, // 24 hours
            JSON.stringify(metadata));
            // Track usage analytics
            await this.trackUsage(userId, assetType, userTier, config.creditCost);
            return metadata;
        }
        catch (error) {
            // Refund credits on failure
            await this.creditService.refundCredits(userId, config.creditCost);
            throw error;
        }
    }
    async generateWithTogether(prompt, config) {
        // Together AI uses inference endpoint for image generation
        const response = await this.togetherClient.inference(config.model, {
            prompt,
            ...config.settings,
            n: 1,
        });
        return {
            data: response.output?.data?.[0]?.b64_json || null,
            url: response.output?.data?.[0]?.url || response.output?.[0] || null,
        };
    }
    async generateWithReplicate(prompt, config) {
        const output = await this.replicateClient.run(config.model, {
            input: {
                prompt,
                ...config.settings,
            }
        });
        return { output };
    }
    optimizePrompt(basePrompt, assetType, tier, tokenSymbol) {
        const styleGuides = {
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
    async checkRateLimit(userId, tier) {
        const limits = {
            free: 10, // 10 per hour
            starter: 60, // 60 per hour
            viral: 300, // 300 per hour
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
    async trackUsage(userId, assetType, tier, creditCost) {
        await this.redis.hincrby(`usage:${userId}`, assetType, 1);
        await this.redis.hincrby(`usage:${userId}`, 'totalCreditsSpent', creditCost * 100);
        await this.redis.hincrby(`usage:global:${tier}`, assetType, 1);
    }
    async getGenerationHistory(userId, limit = 10) {
        // Implementation for retrieving user's generation history
        const keys = await this.redis.keys(`generation:${userId}:*`);
        const results = [];
        for (const key of keys.slice(0, limit)) {
            const data = await this.redis.get(key);
            if (data) {
                results.push(JSON.parse(data));
            }
        }
        return results;
    }
}
exports.AssetGenerationService = AssetGenerationService;
//# sourceMappingURL=AssetGenerationService.js.map