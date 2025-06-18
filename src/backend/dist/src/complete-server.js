"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
// import Together from 'together-ai';
const replicate_1 = __importDefault(require("replicate"));
const CreditService_1 = require("../services/CreditService");
const auth_routes_1 = __importDefault(require("../routes/auth.routes"));
const token_routes_1 = __importDefault(require("../routes/token.routes"));
const wallet_routes_1 = __importDefault(require("../routes/wallet.routes"));
const comments_routes_1 = __importDefault(require("../routes/comments.routes"));
// import { MockRedis } from './services/MockRedis';
// 🚀 SOLANA IMPORTS FOR REAL TOKEN DEPLOYMENT
const web3_js_1 = require("@solana/web3.js");
const spl_token_1 = require("@solana/spl-token");
dotenv_1.default.config();
// 🚀 SOLANA CONFIGURATION FOR REAL TOKEN DEPLOYMENT
const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
const connection = new web3_js_1.Connection(SOLANA_RPC_URL, 'confirmed');
// Server wallet for paying transaction fees (KEEP PRIVATE!)
const SERVER_WALLET_PRIVATE_KEY = process.env.SERVER_WALLET_PRIVATE_KEY;
if (!SERVER_WALLET_PRIVATE_KEY) {
    console.warn('⚠️  SERVER_WALLET_PRIVATE_KEY not found. Token deployment will be simulated.');
}
const app = (0, express_1.default)();
app.use((0, cors_1.default)({
    origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3003'],
    credentials: true
}));
app.use(express_1.default.json({ limit: '50mb' })); // Increase JSON payload limit
app.use(express_1.default.urlencoded({ limit: '50mb', extended: true })); // For form data
// Initialize AI clients
const replicate = new replicate_1.default({
    auth: process.env['REPLICATE_API_TOKEN']
});
const creditService = new CreditService_1.CreditService();
// 🚀 REAL TOKEN DEPLOYMENT FUNCTION - Like Pump.fun!
async function deployRealSolanaToken({ name, symbol, description, totalSupply, logoUrl, walletAddress, decimals = 6 }) {
    try {
        console.log(`🔥 [REAL DEPLOY] Starting deployment for ${symbol}...`);
        if (!SERVER_WALLET_PRIVATE_KEY) {
            throw new Error('Server wallet not configured for token deployment');
        }
        // Create server keypair from private key
        const serverWallet = web3_js_1.Keypair.fromSecretKey(new Uint8Array(JSON.parse(SERVER_WALLET_PRIVATE_KEY)));
        console.log(`💰 [REAL DEPLOY] Server wallet: ${serverWallet.publicKey.toBase58()}`);
        // Step 1: Create the SPL Token Mint
        console.log(`🪙 [REAL DEPLOY] Creating SPL token mint...`);
        const mintKeypair = web3_js_1.Keypair.generate();
        const mint = await (0, spl_token_1.createMint)(connection, serverWallet, // Payer (our server pays the fees)
        serverWallet.publicKey, // Mint authority
        null, // Freeze authority (null = no freeze)
        decimals, // Decimals (6 for most meme tokens)
        mintKeypair // Optional: use specific keypair
        );
        console.log(`✅ [REAL DEPLOY] Token mint created: ${mint.toBase58()}`);
        // Step 2: Create token metadata (simplified for compatibility)
        console.log(`📝 [REAL DEPLOY] Creating token metadata...`);
        let metadataUri = '';
        try {
            // For now, skip complex metadata to avoid version conflicts
            // Just create the basic SPL token - metadata can be added later
            console.log(`⚠️ [REAL DEPLOY] Skipping metadata for now (version compatibility)`);
            metadataUri = `https://arweave.net/placeholder-${symbol.toLowerCase()}`;
        }
        catch (metadataError) {
            console.warn(`⚠️ [REAL DEPLOY] Metadata creation failed, continuing without:`, metadataError);
            // Continue without metadata - the token will still work
        }
        // Step 3: Mint initial supply to creator's wallet
        console.log(`🎯 [REAL DEPLOY] Minting tokens to creator...`);
        const creatorPublicKey = new web3_js_1.PublicKey(walletAddress);
        // Get or create associated token account for the creator
        const creatorTokenAccount = await (0, spl_token_1.getOrCreateAssociatedTokenAccount)(connection, serverWallet, // Payer
        mint, // Mint
        creatorPublicKey // Owner
        );
        // Mint the total supply to creator
        const mintAmount = BigInt(parseInt(totalSupply) * Math.pow(10, decimals));
        const mintTx = await (0, spl_token_1.mintTo)(connection, serverWallet, // Payer
        mint, // Mint
        creatorTokenAccount.address, // Destination
        serverWallet, // Authority (mint authority)
        mintAmount // Amount (with decimals)
        );
        console.log(`🚀 [REAL DEPLOY] Tokens minted! Transaction: ${mintTx}`);
        // Step 4: Revoke mint authority (prevent further minting)
        console.log(`🔒 [REAL DEPLOY] Revoking mint authority...`);
        const revokeInstruction = (0, spl_token_1.createSetAuthorityInstruction)(mint, // Mint
        serverWallet.publicKey, // Current authority
        spl_token_1.AuthorityType.MintTokens, // Authority type
        null // New authority (null = revoke)
        );
        const revokeTransaction = new web3_js_1.Transaction().add(revokeInstruction);
        const revokeTx = await (0, web3_js_1.sendAndConfirmTransaction)(connection, revokeTransaction, [serverWallet]);
        console.log(`✅ [REAL DEPLOY] Mint authority revoked! Transaction: ${revokeTx}`);
        // Step 5: Return deployment info
        const deploymentTime = Date.now();
        const tokenAddress = mint.toBase58();
        console.log(`🎉 [REAL DEPLOY] TOKEN SUCCESSFULLY DEPLOYED!`);
        console.log(`📊 [REAL DEPLOY] Summary:`);
        console.log(`   💎 Token: ${symbol} (${name})`);
        console.log(`   🔗 Address: ${tokenAddress}`);
        console.log(`   🌐 Network: Solana ${SOLANA_RPC_URL.includes('devnet') ? 'Devnet' : 'Mainnet'}`);
        console.log(`   📈 Supply: ${totalSupply} tokens`);
        console.log(`   👤 Creator: ${walletAddress}`);
        return {
            success: true,
            tokenAddress,
            mintKey: tokenAddress, // Same as token address for SPL tokens
            transactionHash: mintTx,
            name,
            symbol,
            description,
            totalSupply,
            logoUrl,
            deployedAt: new Date(deploymentTime).toISOString(),
            network: SOLANA_RPC_URL.includes('devnet') ? 'solana-devnet' : 'solana-mainnet',
            explorerUrl: `https://explorer.solana.com/address/${tokenAddress}${SOLANA_RPC_URL.includes('devnet') ? '?cluster=devnet' : ''}`,
            metadataUri,
            decimals,
            deployer: walletAddress,
            revokeTx,
            mintTx,
            creatorTokenAccount: creatorTokenAccount.address.toBase58()
        };
    }
    catch (error) {
        console.error(`❌ [REAL DEPLOY] Deployment failed:`, error);
        throw new Error(`Token deployment failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
// Tier configurations with REAL models and costs
const tierConfigs = {
    free: {
        provider: 'replicate', // Using replicate for all, together.ai doesn't have image gen
        models: {
            logo: 'stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b',
            meme: 'fofr/sdxl-emoji:dee76b5afde21b0f01ed7925f0665b7e879c50ee718c5f78a9d38e04d523cc5e',
            gif: null, // No GIFs in free tier
            video: null // No videos in free tier
        },
        costs: {
            logo: 0.5,
            meme: 0.1,
            gif: null,
            video: null
        },
        limits: {
            dailyGenerations: 10,
            creditsIncluded: 3
        }
    },
    starter: {
        provider: 'replicate',
        models: {
            logo: 'stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b',
            meme: 'fofr/sdxl-emoji:dee76b5afde21b0f01ed7925f0665b7e879c50ee718c5f78a9d38e04d523cc5e',
            gif: 'ali-vilab/i2vgen-xl:5821a338d00033abaaba89080a17eb8783d9a17ed710a6b4246a18e0900ccad4',
            video: 'lightricks/ltx-video:e3b90ca5961a8b8767f18fc1e2c5b7b4aabb7b0e8a5f63d0b3dce9e2b2bb6b7f'
        },
        costs: {
            logo: 1.0,
            meme: 0.2,
            gif: 0.5,
            video: 1.5
        },
        limits: {
            dailyGenerations: 100,
            creditsIncluded: 10
        }
    },
    viral: {
        provider: 'replicate',
        models: {
            logo: 'stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b',
            meme: 'fofr/sdxl-emoji:dee76b5afde21b0f01ed7925f0665b7e879c50ee718c5f78a9d38e04d523cc5e',
            gif: 'ali-vilab/i2vgen-xl:5821a338d00033abaaba89080a17eb8783d9a17ed710a6b4246a18e0900ccad4',
            video: 'minimax/video-01:5c3985b5bfc64c3e9abdfcc5aa4c4fd1b1f53ee9ef9c42e6b64c48a6d8dc2ef7'
        },
        costs: {
            logo: 1.5,
            meme: 0.3,
            gif: 1.0,
            video: 2.5
        },
        limits: {
            dailyGenerations: 1000,
            creditsIncluded: 50
        }
    }
};
// Health check
app.get('/health', (_req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: 'v2-with-deploy-fix', // This confirms new backend is running
        services: {
            replicate: process.env['REPLICATE_API_TOKEN'] ? 'configured' : 'missing',
            creditSystem: 'active'
        }
    });
});
// Auth routes
app.use('/api/auth', auth_routes_1.default);
// Token routes
app.use('/api/tokens', token_routes_1.default);
// Wallet routes
app.use('/api/wallet', wallet_routes_1.default);
// Comment routes
app.use('/api/comments', comments_routes_1.default);
// Unified generation endpoint with credit system
app.post('/api/generate/:type', async (req, res) => {
    try {
        const { type } = req.params;
        const { prompt, tokenSymbol, userId = 'demo-user', tier = 'free' } = req.body;
        console.log(`🎯 [/api/generate/${type}] Request received:`, {
            type,
            prompt: prompt?.substring(0, 100) + '...',
            tokenSymbol,
            userId,
            tier,
            body: req.body
        });
        // Validate inputs
        if (!prompt?.trim()) {
            res.status(400).json({
                error: 'Prompt is required',
                code: 'MISSING_PROMPT'
            });
            return;
        }
        if (!['logo', 'meme', 'gif', 'video'].includes(type)) {
            res.status(400).json({
                error: 'Invalid asset type. Use: logo, meme, gif, or video',
                code: 'INVALID_ASSET_TYPE',
                validTypes: ['logo', 'meme', 'gif', 'video']
            });
            return;
        }
        // Get tier configuration
        const config = tierConfigs[tier];
        if (!config) {
            res.status(400).json({
                error: 'Invalid tier',
                code: 'INVALID_TIER',
                validTiers: Object.keys(tierConfigs)
            });
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
        if (cost === null || cost === undefined) {
            res.status(403).json({
                error: `${type.toUpperCase()} generation not available for ${tier} tier`,
                availableIn: type === 'gif' ? ['starter', 'viral'] : ['free', 'starter', 'viral'],
                upgradeUrl: '/pricing'
            });
            return;
        }
        console.log(`Generating ${type} for ${tier} tier using ${config.provider}...`);
        // Atomic operation: Check and deduct credits BEFORE generation to prevent race conditions
        const deducted = await creditService.checkAndDeductCredits(userId, cost);
        if (!deducted) {
            res.status(402).json({
                error: 'Insufficient credits',
                required: cost,
                balance: await creditService.getBalance(userId),
                tier: tier,
                earnMore: {
                    dailyLogin: 0.1,
                    shareTwitter: 0.5,
                    referFriend: 1.0
                }
            });
            return;
        }
        // Generate asset based on provider and tier
        let result;
        const startTime = Date.now();
        try {
            if (config.provider === 'together') {
                result = await generateFreeTier(type, prompt, tokenSymbol, config);
            }
            else {
                result = await generateWithReplicate(type, prompt, tokenSymbol, config);
            }
        }
        catch (error) {
            // Refund credits if generation fails
            await creditService.refundCredits(userId, cost);
            throw error;
        }
        const newBalance = await creditService.getBalance(userId);
        const endTime = Date.now();
        res.json({
            success: true,
            data: {
                type,
                prompt,
                tokenSymbol,
                tier,
                provider: config.provider,
                model: config.models[type],
                url: result.url,
                cost,
                newBalance,
                processingTime: endTime - startTime,
                timestamp: new Date().toISOString()
            }
        });
    }
    catch (error) {
        console.error(`Generation error:`, error);
        res.status(500).json({
            error: 'Generation failed',
            message: error.message
        });
    }
});
async function generateFreeTier(type, prompt, tokenSymbol, config) {
    // Free tier uses Replicate with reduced quality settings
    // (Originally planned for Together.ai but they don't have image generation)
    return await generateWithReplicate(type, prompt, tokenSymbol, {
        ...config,
        models: {
            logo: 'stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b',
            meme: 'fofr/sdxl-emoji:dee76b5afde21b0f01ed7925f0665b7e879c50ee718c5f78a9d38e04d523cc5e',
            gif: null
        },
        // Reduced quality settings for free tier
        settings: {
            num_inference_steps: 15, // vs 25-30 for paid
            width: 512, // vs 1024 for paid logos
            height: 512
        }
    });
}
async function generateWithReplicate(type, prompt, tokenSymbol, config) {
    const model = config.models[type];
    const optimizedPrompt = optimizePrompt(prompt, type, tokenSymbol, 'replicate');
    console.log(`🎨 [generateWithReplicate] Starting generation:`, {
        type,
        model,
        prompt: optimizedPrompt,
        tokenSymbol
    });
    if (type === 'gif') {
        // First generate a base image, then animate it
        const baseImageOutput = await replicate.run('stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b', {
            input: {
                prompt: optimizedPrompt,
                width: 512,
                height: 512,
                num_inference_steps: 25
            }
        });
        const baseImageUrl = Array.isArray(baseImageOutput) ? baseImageOutput[0] : baseImageOutput;
        // Now animate the base image
        const videoOutput = await replicate.run(model, {
            input: {
                image: baseImageUrl,
                prompt: `animate this ${tokenSymbol || 'crypto'} themed image with smooth movement`,
                num_frames: 16,
                fps: 8
            }
        });
        return {
            url: Array.isArray(videoOutput) ? videoOutput[0] : videoOutput,
            baseImage: baseImageUrl,
            note: "Real animated video/GIF"
        };
    }
    if (type === 'video') {
        // Generate video using text-to-video model
        console.log(`🎬 [generateWithReplicate] Generating video with model: ${model}`);
        const videoOutput = await replicate.run(model, {
            input: {
                prompt: optimizedPrompt,
                // Settings optimized for different models
                ...(model.includes('minimax') && {
                    aspect_ratio: '16:9',
                    duration: 5 // 5 seconds
                }),
                ...(model.includes('ltx-video') && {
                    width: 768,
                    height: 512,
                    num_frames: 121, // ~5 seconds at 24fps
                    fps: 24
                })
            }
        });
        return {
            url: Array.isArray(videoOutput) ? videoOutput[0] : videoOutput,
            note: "AI-generated video"
        };
    }
    // Use provided settings or defaults
    const settings = config.settings || {};
    const defaultWidth = type === 'logo' ? 1024 : 512;
    const defaultHeight = type === 'logo' ? 1024 : 512;
    const defaultSteps = type === 'logo' ? 30 : 20;
    console.log(`🚀 [generateWithReplicate] Calling Replicate API...`);
    const output = await replicate.run(model, {
        input: {
            prompt: optimizedPrompt,
            width: settings.width || defaultWidth,
            height: settings.height || defaultHeight,
            num_inference_steps: settings.num_inference_steps || defaultSteps,
            guidance_scale: 7.5
        }
    });
    console.log(`✅ [generateWithReplicate] Generation completed:`, {
        output: Array.isArray(output) ? `Array[${output.length}]` : typeof output,
        url: Array.isArray(output) ? output[0] : output
    });
    return {
        url: Array.isArray(output) ? output[0] : output
    };
}
function optimizePrompt(prompt, type, tokenSymbol, provider) {
    const cryptoContext = tokenSymbol ? `, ${tokenSymbol} cryptocurrency` : ', crypto';
    const typeOptimizations = {
        logo: {
            together: 'professional logo design, clean minimalist style, brand identity',
            replicate: 'cryptocurrency logo, clean modern design, minimalist, vector style, professional branding, circular badge'
        },
        meme: {
            together: 'internet meme style, funny, viral potential, popular format',
            replicate: 'crypto meme, funny cryptocurrency meme, internet meme style, viral potential, trending format'
        },
        gif: {
            together: 'animated sequence, dynamic movement, smooth transitions',
            replicate: 'animated gif style, dynamic movement, motion graphics, smooth loop'
        },
        video: {
            together: 'professional video content, cinematic style, dynamic scenes',
            replicate: 'cinematic video, professional quality, smooth camera movements, dynamic scenes, cryptocurrency theme'
        }
    };
    const optimization = typeOptimizations[type][provider];
    return `${prompt}${cryptoContext}, ${optimization}`;
}
// Credit management endpoints
app.get('/api/credits/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const balance = await creditService.getBalance(userId);
        const transactions = await creditService.getTransactionHistory(userId, 5);
        res.json({
            success: true,
            data: {
                userId,
                balance,
                recentTransactions: transactions,
                earningOpportunities: {
                    dailyLogin: 0.1,
                    shareTwitter: 0.5,
                    referFriend: 1.0,
                    tokenSuccess: 'up to 20 credits'
                }
            }
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.post('/api/credits/:userId/earn', async (req, res) => {
    try {
        const { userId } = req.params;
        const { action, metadata } = req.body;
        // Validate action before calling earnCredits
        const validActions = Object.keys(creditService.getEarningRules());
        if (!action || !validActions.includes(action)) {
            res.status(400).json({
                error: 'Invalid earning action',
                validActions,
                code: 'INVALID_ACTION'
            });
            return;
        }
        const earned = await creditService.earnCredits(userId, action, metadata);
        const newBalance = await creditService.getBalance(userId);
        res.json({
            success: true,
            data: {
                earned,
                newBalance,
                action
            }
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Demo endpoint to show tier differences
app.get('/api/tiers', (_req, res) => {
    res.json({
        success: true,
        data: {
            free: {
                price: 'Free',
                credits: 3,
                features: ['Logos', 'Memes', 'Basic quality (512px)'],
                provider: 'Replicate (Limited)',
                limitations: 'No GIFs, lower quality, 10/day limit'
            },
            starter: {
                price: '$19/month',
                credits: 10,
                features: ['All assets', 'Pro AI models', 'Higher quality'],
                provider: 'Replicate',
                limitations: '100/day limit'
            },
            viral: {
                price: '$49/month',
                credits: 50,
                features: ['Unlimited', 'Premium models', 'Priority'],
                provider: 'Replicate Premium',
                limitations: 'None'
            }
        }
    });
});
// Token deployment endpoint
app.post('/api/tokens/deploy', async (req, res) => {
    try {
        const { name, symbol, description, totalSupply, logoUrl, walletAddress, selectedAssets } = req.body;
        console.log(`🚀 [Token Deploy] Request received:`, {
            name,
            symbol,
            description,
            totalSupply,
            logoUrl: logoUrl ? 'provided' : 'missing',
            walletAddress: walletAddress ? walletAddress.substring(0, 8) + '...' : 'missing',
            assetsCount: selectedAssets ? Object.keys(selectedAssets).length : 0
        });
        // Validate required fields
        if (!name?.trim()) {
            res.status(400).json({
                error: 'Token name is required',
                code: 'MISSING_NAME'
            });
            return;
        }
        if (!symbol?.trim()) {
            res.status(400).json({
                error: 'Token symbol is required',
                code: 'MISSING_SYMBOL'
            });
            return;
        }
        if (!walletAddress?.trim()) {
            res.status(400).json({
                error: 'Wallet address is required',
                code: 'MISSING_WALLET'
            });
            return;
        }
        // 🚀 REAL TOKEN DEPLOYMENT - Like Pump.fun!
        console.log(`🔥 [REAL DEPLOY] Creating SPL token on Solana devnet...`);
        const deploymentResult = await deployRealSolanaToken({
            name,
            symbol,
            description,
            totalSupply: totalSupply || '1000000000',
            logoUrl,
            walletAddress,
            decimals: 6 // Standard for meme tokens
        });
        console.log(`✅ [Token Deploy] Success:`, {
            tokenAddress: deploymentResult.tokenAddress,
            txHash: deploymentResult.transactionHash,
            name,
            symbol
        });
        console.log(`📤 [Token Deploy] Sending response:`, {
            success: true,
            dataTokenAddress: deploymentResult.tokenAddress,
            fullData: deploymentResult
        });
        res.json({
            success: true,
            data: deploymentResult
        });
    }
    catch (error) {
        console.error('❌ [Token Deploy] Error:', error);
        res.status(500).json({
            error: error.message || 'Token deployment failed',
            code: 'DEPLOYMENT_ERROR'
        });
    }
});
// Get user tokens endpoint
app.get('/api/tokens/user/:walletAddress', async (req, res) => {
    try {
        const { walletAddress } = req.params;
        console.log(`📊 [Get User Tokens] Request for wallet: ${walletAddress}`);
        // For now, return empty array (can be extended to use database)
        const userTokens = JSON.parse(
        // Try to get from localStorage simulation or return empty
        '[]');
        res.json({
            success: true,
            data: userTokens
        });
    }
    catch (error) {
        console.error('❌ [Get User Tokens] Error:', error);
        res.status(500).json({ error: error.message });
    }
});
// Emergency credits endpoint for development 💰
app.post('/api/credits/:userId/emergency', async (req, res) => {
    try {
        const { userId } = req.params;
        const { amount = 50 } = req.body; // Default 50 credits
        console.log(`💰 [Emergency Credits] Adding ${amount} credits to ${userId}`);
        // Add the credits directly
        const earned = await creditService.earnCredits(userId, 'communityEngagement', {
            reason: 'Emergency development credits',
            amount
        });
        const newBalance = await creditService.getBalance(userId);
        console.log(`✅ [Emergency Credits] Success! New balance: ${newBalance}`);
        res.json({
            success: true,
            data: {
                earned,
                newBalance,
                message: `¡Added ${amount} credits! 🎉`
            }
        });
    }
    catch (error) {
        console.error('❌ [Emergency Credits] Error:', error);
        res.status(500).json({ error: error.message });
    }
});
// Use port 4000 as configured
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`🚀 DeGenie Complete AI Server running on port ${PORT} (FORCED)`);
    console.log(`🔑 Replicate: ${process.env['REPLICATE_API_TOKEN'] ? 'Ready ✅' : 'Missing ❌'}`);
    console.log(`💳 Credit System: Active ✅`);
    console.log(`\n📊 Tier System:`);
    console.log(`   🆓 Free: Basic quality (512px), Logos+Memes only`);
    console.log(`   💰 Starter: High quality (1024px), All assets including GIFs`);
    console.log(`   🚀 Viral: Premium models, Unlimited usage`);
    console.log(`\n📝 Usage:`);
    console.log(`   POST /api/generate/logo - {"prompt": "...", "tier": "free|starter|viral"}`);
    console.log(`   GET  /api/credits/demo-user - Check balance`);
    console.log(`   GET  /api/tiers - Compare tiers`);
});
//# sourceMappingURL=complete-server.js.map