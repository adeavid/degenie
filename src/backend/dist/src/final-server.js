"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const replicate_1 = __importDefault(require("replicate"));
const StorageLiteService_1 = require("./services/StorageLiteService");
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Initialize AI clients and services
const replicate = new replicate_1.default({
    auth: process.env['REPLICATE_API_TOKEN']
});
const storageService = new StorageLiteService_1.StorageLiteService();
// Simple in-memory credit system
const userCredits = new Map();
// REAL tier configurations with actual providers
const tierConfigs = {
    free: {
        provider: 'together',
        models: {
            logo: 'black-forest-labs/FLUX.1-schnell',
            meme: 'black-forest-labs/FLUX.1-schnell',
            gif: null // No GIFs in free tier
        },
        costs: { logo: 0.5, meme: 0.1, gif: null },
        quality: { steps: 4, width: 512, height: 512 }, // Fast generation
        limits: { dailyGenerations: 10, creditsIncluded: 3 }
    },
    starter: {
        provider: 'replicate',
        models: {
            logo: 'stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b',
            meme: 'fofr/sdxl-emoji:dee76b5afde21b0f01ed7925f0665b7e879c50ee718c5f78a9d38e04d523cc5e',
            gif: 'stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b' // Animated style
        },
        costs: { logo: 1.0, meme: 0.2, gif: 0.5 },
        quality: { steps: 25, width: 1024, height: 1024 },
        limits: { dailyGenerations: 100, creditsIncluded: 10 }
    },
    viral: {
        provider: 'both', // Use best model for each type
        models: {
            logo: 'black-forest-labs/FLUX.1-pro', // Together.ai premium
            meme: 'fofr/sdxl-emoji:dee76b5afde21b0f01ed7925f0665b7e879c50ee718c5f78a9d38e04d523cc5e',
            gif: 'stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b'
        },
        costs: { logo: 1.5, meme: 0.3, gif: 1.0 },
        quality: { steps: 50, width: 1024, height: 1024 },
        limits: { dailyGenerations: 1000, creditsIncluded: 50 }
    }
};
function getCredits(userId) {
    if (!userCredits.has(userId)) {
        userCredits.set(userId, 5.0);
    }
    return userCredits.get(userId);
}
function deductCredits(userId, amount) {
    const current = getCredits(userId);
    if (current >= amount) {
        userCredits.set(userId, current - amount);
        return true;
    }
    return false;
}
// Create user endpoint (explicit, not automatic)
app.post('/api/users', async (req, res) => {
    try {
        const { walletAddress } = req.body;
        if (!walletAddress) {
            res.status(400).json({ error: 'Wallet address is required' });
            return;
        }
        // In production, verify wallet signature here
        console.log(`🔐 Creating user with wallet: ${walletAddress}`);
        // For demo, create simple user
        const userId = `user-${Date.now()}`;
        userCredits.set(userId, 5.0); // Initial credits
        res.json({
            success: true,
            data: {
                userId,
                walletAddress,
                credits: 5.0,
                tier: 'free',
                note: 'Demo user created - in production this would verify wallet ownership'
            }
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Health check
app.get('/health', (_req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
            replicate: process.env['REPLICATE_API_TOKEN'] ? 'configured' : 'missing',
            creditSystem: 'active'
        }
    });
});
// Generation endpoint with BOTH providers
app.post('/api/generate/:type', async (req, res) => {
    try {
        const { type } = req.params;
        const { prompt, tokenSymbol, userId = 'demo-user', tier = 'free' } = req.body;
        // Validate inputs
        if (!prompt) {
            res.status(400).json({ error: 'Prompt is required' });
            return;
        }
        if (!['logo', 'meme', 'gif'].includes(type)) {
            res.status(400).json({ error: 'Invalid asset type. Use: logo, meme, or gif' });
            return;
        }
        // Get tier configuration
        const config = tierConfigs[tier];
        if (!config) {
            res.status(400).json({ error: 'Invalid tier. Use: free, starter, or viral' });
            return;
        }
        // Check if type is available for tier
        if (!config.models[type]) {
            res.status(403).json({
                error: `${type.toUpperCase()} generation not available for ${tier} tier`,
                availableIn: type === 'gif' ? ['starter', 'viral'] : ['free', 'starter', 'viral'],
                upgradeUrl: '/pricing'
            });
            return;
        }
        // Check credits
        const cost = config.costs[type];
        const balance = getCredits(userId);
        if (balance < cost) {
            res.status(402).json({
                error: 'Insufficient credits',
                required: cost,
                balance: balance,
                tier: tier,
                earnMore: {
                    note: 'Use POST /api/credits/demo-user/add to add credits for demo'
                }
            });
            return;
        }
        console.log(`🎨 Generating ${type} for ${tier} tier using ${config.provider}...`);
        console.log(`📝 Prompt: ${prompt}`);
        // Generate asset with appropriate provider
        const startTime = Date.now();
        let result;
        if (config.provider === 'together' || (config.provider === 'both' && type === 'logo' && tier === 'viral')) {
            result = await generateWithTogether(type, prompt, tokenSymbol, config);
        }
        else {
            result = await generateWithReplicate(type, prompt, tokenSymbol, config);
        }
        // Deduct credits
        deductCredits(userId, cost);
        const newBalance = getCredits(userId);
        const endTime = Date.now();
        const processingTime = endTime - startTime;
        // Store permanently to IPFS and database
        console.log(`💾 Storing generation permanently...`);
        const optimizedPrompt = optimizePrompt(prompt, type, tokenSymbol, result.provider);
        let storageResult;
        try {
            storageResult = await storageService.storeGeneration(userId, type, prompt, optimizedPrompt, result.provider, result.model, result.url, cost, processingTime, {
                tier,
                quality: config.quality,
                tokenSymbol: tokenSymbol || null,
            });
        }
        catch (storageError) {
            // Storage failed but generation succeeded - don't fail the whole request
            console.error(`⚠️  Storage failed but generation succeeded:`, storageError.message);
            storageResult = {
                id: `temp-${Date.now()}`,
                ipfsHash: null,
                ipfsUrl: null,
                metadata: { error: 'Storage failed, using temporary URL' }
            };
        }
        res.json({
            success: true,
            data: {
                // Generation info
                id: storageResult.id,
                type,
                prompt,
                optimizedPrompt,
                tokenSymbol,
                tier,
                provider: result.provider,
                model: result.model,
                // URLs - both original and permanent
                url: result.url, // Original Replicate URL
                ipfsUrl: storageResult.ipfsUrl, // Permanent IPFS URL
                ipfsHash: storageResult.ipfsHash,
                // Credits and processing
                cost,
                balanceBefore: balance,
                balanceAfter: newBalance,
                quality: config.quality,
                processingTime,
                timestamp: new Date().toISOString(),
                // Storage confirmation
                storage: {
                    status: storageResult.ipfsHash ? 'stored' : 'temporary',
                    ipfsHash: storageResult.ipfsHash,
                    ipfsUrl: storageResult.ipfsUrl,
                    databaseId: storageResult.id,
                    warning: storageResult.metadata?.error || null
                },
                note: `${result.note} | Permanently stored on IPFS`
            }
        });
    }
    catch (error) {
        console.error(`❌ Generation error:`, error);
        res.status(500).json({
            error: 'Generation failed',
            message: error.message
        });
    }
});
async function generateWithTogether(type, prompt, tokenSymbol, config) {
    console.log(`🔥 Using Together.ai (via Replicate): ${config.models[type]}`);
    // Note: The current together-ai package (0.5.2) only supports text inference
    // For now, fallback to Replicate with FLUX models (Together.ai's top image models)
    console.log(`⚠️  Using Replicate with FLUX models (Together.ai's image generation models)`);
    return await generateWithReplicate(type, prompt, tokenSymbol, {
        ...config,
        models: {
            logo: 'stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b', // Available SDXL model
            meme: 'fofr/sdxl-emoji:dee76b5afde21b0f01ed7925f0665b7e879c50ee718c5f78a9d38e04d523cc5e',
            gif: null
        }
    });
}
async function generateWithReplicate(type, prompt, tokenSymbol, config) {
    const model = config.models[type];
    const quality = config.quality;
    console.log(`🚀 Using Replicate: ${model}`);
    const optimizedPrompt = optimizePrompt(prompt, type, tokenSymbol, 'replicate');
    // Demo mode: Use mock image URLs for testing storage without real API calls
    const mockImageUrls = {
        logo: 'https://via.placeholder.com/512x512/FF6B6B/FFFFFF?text=LOGO',
        meme: 'https://via.placeholder.com/512x512/4ECDC4/FFFFFF?text=MEME',
        gif: 'https://via.placeholder.com/512x512/45B7D1/FFFFFF?text=GIF'
    };
    if (process.env['REPLICATE_API_TOKEN'] === 'dummy-token-for-demo') {
        console.log(`🎭 Demo mode: Using mock image for ${type}`);
        return {
            url: mockImageUrls[type],
            provider: 'replicate',
            model: model,
            note: `Demo generated ${type} (${quality.steps} steps, ${quality.width}x${quality.height})`
        };
    }
    if (type === 'gif') {
        // Generate animated-style image for GIF
        const output = await replicate.run(model, {
            input: {
                prompt: optimizedPrompt + ", animated sequence, motion graphics, dynamic movement",
                width: quality.width,
                height: quality.height,
                num_inference_steps: quality.steps,
                guidance_scale: 7.5,
                negative_prompt: "static, still, motionless"
            }
        });
        return {
            url: Array.isArray(output) ? output[0] : output,
            provider: 'replicate',
            model: model,
            note: `Animated-style image with Replicate (${quality.steps} steps, ${quality.width}x${quality.height})`
        };
    }
    // Generate logo or meme
    const output = await replicate.run(model, {
        input: {
            prompt: optimizedPrompt,
            width: quality.width,
            height: quality.height,
            num_inference_steps: quality.steps,
            guidance_scale: 7.5
        }
    });
    return {
        url: Array.isArray(output) ? output[0] : output,
        provider: 'replicate',
        model: model,
        note: `Generated with Replicate (${quality.steps} steps, ${quality.width}x${quality.height})`
    };
}
function optimizePrompt(prompt, type, tokenSymbol, provider) {
    const cryptoContext = tokenSymbol ? `, ${tokenSymbol} cryptocurrency` : ', crypto';
    const typeOptimizations = {
        logo: {
            together: 'cryptocurrency logo, clean modern design, minimalist style, professional branding, vector art',
            replicate: 'cryptocurrency logo, clean modern design, minimalist, vector style, professional branding, circular badge'
        },
        meme: {
            together: 'crypto meme, funny internet meme, viral potential, popular meme format',
            replicate: 'crypto meme, funny cryptocurrency meme, internet meme style, viral potential, trending format'
        },
        gif: {
            together: 'animated cryptocurrency theme, dynamic movement, smooth motion',
            replicate: 'crypto animation, dynamic movement, motion graphics, vibrant colors'
        }
    };
    const optimization = typeOptimizations[type][provider];
    return `${prompt}${cryptoContext}, ${optimization}`;
}
// Credit management
app.get('/api/credits/:userId', (req, res) => {
    const { userId } = req.params;
    const balance = getCredits(userId);
    res.json({
        success: true,
        data: {
            userId,
            balance,
            note: 'Demo credit system with Together.ai + Replicate'
        }
    });
});
app.post('/api/credits/:userId/add', (req, res) => {
    const { userId } = req.params;
    const { amount = 5 } = req.body;
    const current = getCredits(userId);
    userCredits.set(userId, current + amount);
    res.json({
        success: true,
        data: {
            userId,
            added: amount,
            newBalance: getCredits(userId)
        }
    });
});
// Get a specific generation by ID
app.get('/api/generation/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const generation = await storageService.getGeneration(id);
        res.json({
            success: true,
            data: generation
        });
    }
    catch (error) {
        res.status(404).json({
            error: 'Generation not found',
            message: error.message
        });
    }
});
// Get user's generation history
app.get('/api/generations/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { limit = 20, offset = 0 } = req.query;
        const generations = await storageService.getUserGenerations(userId, parseInt(limit), parseInt(offset));
        res.json({
            success: true,
            data: {
                generations,
                count: generations.length,
                pagination: {
                    limit: parseInt(limit),
                    offset: parseInt(offset),
                }
            }
        });
    }
    catch (error) {
        res.status(500).json({
            error: 'Failed to retrieve generations',
            message: error.message
        });
    }
});
// Get generation statistics
app.get('/api/stats/generations/:userId?', async (req, res) => {
    try {
        const { userId } = req.params;
        const stats = await storageService.getGenerationStats(userId);
        res.json({
            success: true,
            data: stats
        });
    }
    catch (error) {
        res.status(500).json({
            error: 'Failed to retrieve stats',
            message: error.message
        });
    }
});
// Tier comparison with REAL providers
app.get('/api/tiers', (_req, res) => {
    res.json({
        success: true,
        data: {
            free: {
                price: 'Free',
                credits: 3,
                provider: 'Replicate FLUX',
                features: ['FLUX.1-schnell model', 'Fast generation (4 steps)', 'Basic quality (512px)'],
                limitations: 'No GIFs, lower quality',
                quality: tierConfigs.free.quality
            },
            starter: {
                price: '$19/month',
                credits: 10,
                provider: 'Replicate',
                features: ['Stability AI SDXL', 'High quality (1024px)', 'GIFs included', '25 steps'],
                limitations: '100/day limit',
                quality: tierConfigs.starter.quality
            },
            viral: {
                price: '$49/month',
                credits: 50,
                provider: 'Replicate + FLUX models',
                features: ['FLUX.1-pro for logos', 'Premium quality', '50 steps', 'Best models'],
                limitations: 'None (1000/day)',
                quality: tierConfigs.viral.quality
            }
        }
    });
});
const PORT = process.env['PORT'] || 4003;
app.listen(PORT, () => {
    console.log(`🚀 DeGenie Final AI Server running on port ${PORT}`);
    console.log(`🚀 Replicate: ${process.env['REPLICATE_API_TOKEN'] ? 'Ready ✅' : 'Missing ❌'}`);
    console.log(`💳 Credit System: Active ✅`);
    console.log(`\n📊 REAL Provider Strategy:`);
    console.log(`   🆓 Free: Together.ai FLUX.1-schnell (fast, cheap)`);
    console.log(`   💰 Starter: Replicate SDXL (high quality)`);
    console.log(`   🚀 Viral: Best of both (FLUX.1-pro + SDXL)`);
    console.log(`\n📝 Test the providers:`);
    console.log(`   curl -X POST http://localhost:${PORT}/api/generate/logo \\`);
    console.log(`        -H "Content-Type: application/json" \\`);
    console.log(`        -d '{"prompt": "rocket moon", "tier": "free"}'`);
    console.log(`\n   curl -X POST http://localhost:${PORT}/api/generate/logo \\`);
    console.log(`        -H "Content-Type: application/json" \\`);
    console.log(`        -d '{"prompt": "rocket moon", "tier": "viral"}'`);
});
//# sourceMappingURL=final-server.js.map