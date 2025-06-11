import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Replicate from 'replicate';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Replicate client with validation
const replicateToken = process.env['REPLICATE_API_TOKEN'];
if (!replicateToken) {
  throw new Error('REPLICATE_API_TOKEN environment variable is required');
}

const replicate = new Replicate({
  auth: replicateToken
});

// Simple in-memory credit system for demo
const userCredits = new Map<string, number>();

// Tier configurations with REAL models and costs
const tierConfigs = {
  free: {
    models: {
      logo: 'stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b',
      meme: 'fofr/sdxl-emoji:dee76b5afde21b0f01ed7925f0665b7e879c50ee718c5f78a9d38e04d523cc5e',
      gif: null // No GIFs in free tier
    },
    costs: { logo: 0.5, meme: 0.1, gif: null },
    quality: { steps: 15, width: 512, height: 512 }, // Lower quality
    limits: { dailyGenerations: 10, creditsIncluded: 3 }
  },
  starter: {
    models: {
      logo: 'stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b',
      meme: 'fofr/sdxl-emoji:dee76b5afde21b0f01ed7925f0665b7e879c50ee718c5f78a9d38e04d523cc5e',
      gif: 'stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b' // GIF-style for now
    },
    costs: { logo: 1.0, meme: 0.2, gif: 0.5 },
    quality: { steps: 25, width: 1024, height: 1024 }, // Higher quality
    limits: { dailyGenerations: 100, creditsIncluded: 10 }
  },
  viral: {
    models: {
      logo: 'stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b',
      meme: 'fofr/sdxl-emoji:dee76b5afde21b0f01ed7925f0665b7e879c50ee718c5f78a9d38e04d523cc5e',
      gif: 'stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b' // GIF-style for now
    },
    costs: { logo: 1.5, meme: 0.3, gif: 1.0 },
    quality: { steps: 50, width: 1024, height: 1024 }, // Premium quality
    limits: { dailyGenerations: 1000, creditsIncluded: 50 }
  }
};

// Initialize demo user with credits
function getCredits(userId: string): number {
  if (!userCredits.has(userId)) {
    userCredits.set(userId, 5.0); // Start with 5 credits
  }
  return userCredits.get(userId)!;
}

function deductCredits(userId: string, amount: number): boolean {
  const current = getCredits(userId);
  if (current >= amount) {
    userCredits.set(userId, current - amount);
    return true;
  }
  return false;
}

function addCredits(userId: string, amount: number): void {
  const current = getCredits(userId);
  userCredits.set(userId, current + amount);
}

// Health check
app.get('/health', (_req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      replicate: process.env['REPLICATE_API_TOKEN'] ? 'configured' : 'missing',
      creditSystem: 'simple-demo-active'
    }
  });
});

// Generation endpoint with REAL tier differences
app.post('/api/generate/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const { prompt, tokenSymbol, userId = 'demo-user', tier = 'free' } = req.body;

    // Validate inputs
    if (!prompt?.trim()) {
      res.status(400).json({ 
        error: 'Prompt is required', 
        code: 'MISSING_PROMPT' 
      });
      return;
    }

    if (!['logo', 'meme', 'gif'].includes(type)) {
      res.status(400).json({ 
        error: 'Invalid asset type. Use: logo, meme, or gif',
        code: 'INVALID_ASSET_TYPE',
        validTypes: ['logo', 'meme', 'gif']
      });
      return;
    }

    // Get tier configuration
    const config = tierConfigs[tier as keyof typeof tierConfigs];
    if (!config) {
      res.status(400).json({ 
        error: 'Invalid tier. Use: free, starter, or viral',
        code: 'INVALID_TIER',
        validTiers: Object.keys(tierConfigs)
      });
      return;
    }

    // Check if type is available for tier
    if (!config.models[type as keyof typeof config.models]) {
      res.status(403).json({ 
        error: `${type.toUpperCase()} generation not available for ${tier} tier`,
        availableIn: type === 'gif' ? ['starter', 'viral'] : ['free', 'starter', 'viral'],
        upgradeUrl: '/pricing'
      });
      return;
    }

    // Check credits
    const cost = config.costs[type as keyof typeof config.costs]!;
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

    console.log(`🎨 Generating ${type} for ${tier} tier (${cost} credits)...`);
    console.log(`📝 Prompt: ${prompt}`);
    
    // Deduct credits BEFORE generation for atomic operation
    deductCredits(userId, cost);
    let newBalance = getCredits(userId);
    
    let result;
    const startTime = Date.now();
    try {
      // Generate asset
      result = await generateAsset(type, prompt, tokenSymbol, config);
    } catch (error) {
      // Refund credits if generation fails
      console.log(`❌ Generation failed, refunding ${cost} credits`);
      addCredits(userId, cost);
      newBalance = getCredits(userId);
      throw error; // Re-throw to handle in outer catch
    }

    const endTime = Date.now();

    res.json({
      success: true,
      data: {
        type,
        prompt,
        tokenSymbol,
        tier,
        model: config.models[type as keyof typeof config.models],
        url: result.url,
        cost,
        balanceBefore: balance,
        balanceAfter: newBalance,
        quality: config.quality,
        processingTime: endTime - startTime,
        timestamp: new Date().toISOString(),
        note: result.note
      }
    });

  } catch (error: any) {
    console.error(`❌ Generation error:`, error);
    res.status(500).json({
      error: 'Generation failed',
      message: error.message
    });
  }
});

async function generateAsset(type: string, prompt: string, tokenSymbol: string, config: any) {
  const model = config.models[type];
  const quality = config.quality;
  
  // Optimize prompt based on type
  const optimizedPrompt = optimizePrompt(prompt, type, tokenSymbol, config);

  if (type === 'gif') {
    // For GIF, generate animated-style image
    console.log(`🎬 Generating GIF-style animation...`);
    
    const output = await replicate.run(model, {
      input: {
        prompt: optimizedPrompt + ", animated sequence, motion graphics, dynamic movement, storyboard frames",
        width: quality.width,
        height: quality.height,
        num_inference_steps: quality.steps,
        guidance_scale: 7.5,
        negative_prompt: "static, still, motionless, single frame"
      }
    });

    return {
      url: Array.isArray(output) ? output[0] : output,
      note: `Animated-style image (${quality.width}x${quality.height}, ${quality.steps} steps). Real video generation coming soon!`
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
    note: `Generated with ${quality.steps} steps at ${quality.width}x${quality.height}`
  };
}

function optimizePrompt(prompt: string, type: string, tokenSymbol: string, config: any): string {
  const cryptoContext = tokenSymbol ? `, ${tokenSymbol} cryptocurrency` : ', crypto';
  
  const typeOptimizations = {
    logo: `cryptocurrency logo, clean modern design, minimalist, vector style, professional branding, circular badge`,
    meme: `crypto meme, funny cryptocurrency meme, internet meme style, viral potential, trending format`,
    gif: `crypto animation, dynamic cryptocurrency theme, smooth motion, vibrant colors`
  };

  const qualityBoost = config.quality.steps > 20 ? ', trending on Dribbble, award winning design' : '';
  
  return `${prompt}${cryptoContext}, ${typeOptimizations[type as keyof typeof typeOptimizations]}${qualityBoost}`;
}

// Credit management for demo
app.get('/api/credits/:userId', (req, res) => {
  const { userId } = req.params;
  const balance = getCredits(userId);
  
  res.json({
    success: true,
    data: {
      userId,
      balance,
      demoNote: 'This is a simple demo credit system'
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

// Tier comparison
app.get('/api/tiers', (_req, res) => {
  res.json({
    success: true,
    data: {
      free: {
        price: 'Free',
        credits: 3,
        features: ['Logos (512px)', 'Memes (512px)', '15 inference steps'],
        limitations: 'No GIFs, lower quality, 10/day limit',
        quality: tierConfigs.free.quality
      },
      starter: {
        price: '$19/month',
        credits: 10,
        features: ['All assets (1024px)', 'GIFs included', '25 inference steps'],
        limitations: '100/day limit',
        quality: tierConfigs.starter.quality
      },
      viral: {
        price: '$49/month', 
        credits: 50,
        features: ['Premium quality (1024px)', '50 inference steps', 'Priority processing'],
        limitations: 'None (1000/day)',
        quality: tierConfigs.viral.quality
      }
    }
  });
});

const PORT = process.env['PORT'] || 4002;

app.listen(PORT, () => {
  console.log(`🚀 DeGenie Working AI Server running on port ${PORT}`);
  console.log(`🔑 Replicate: ${process.env['REPLICATE_API_TOKEN'] ? 'Ready ✅' : 'Missing ❌'}`);
  console.log(`💳 Credit System: Simple Demo Active ✅`);
  console.log(`\n📊 REAL Tier Differences:`);
  console.log(`   🆓 Free: 512px, 15 steps, no GIFs`);
  console.log(`   💰 Starter: 1024px, 25 steps, GIFs included`);
  console.log(`   🚀 Viral: 1024px, 50 steps, premium quality`);
  console.log(`\n📝 Test the differences:`);
  console.log(`   curl -X POST http://localhost:${PORT}/api/generate/logo \\`);
  console.log(`        -H "Content-Type: application/json" \\`);
  console.log(`        -d '{"prompt": "dragon fire", "tier": "free", "userId": "demo"}'`);
  console.log(`\n   curl -X POST http://localhost:${PORT}/api/generate/logo \\`);
  console.log(`        -H "Content-Type: application/json" \\`);
  console.log(`        -d '{"prompt": "dragon fire", "tier": "viral", "userId": "demo"}'`);
  console.log(`\n💰 Add credits: POST /api/credits/demo/add`);
  console.log(`💰 Check balance: GET /api/credits/demo`);
});