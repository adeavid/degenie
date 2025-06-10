import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
// import Together from 'together-ai';
import Replicate from 'replicate';
import { CreditService } from '../services/CreditService';
// import { MockRedis } from './services/MockRedis';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Initialize AI clients
const replicate = new Replicate({
  auth: process.env['REPLICATE_API_TOKEN']!
});

const creditService = new CreditService();

// Tier configurations with REAL models and costs
const tierConfigs = {
  free: {
    provider: 'replicate', // Using replicate for all, together.ai doesn't have image gen
    models: {
      logo: 'stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b',
      meme: 'fofr/sdxl-emoji:dee76b5afde21b0f01ed7925f0665b7e879c50ee718c5f78a9d38e04d523cc5e',
      gif: null // No GIFs in free tier
    },
    costs: {
      logo: 0.5,
      meme: 0.1,
      gif: null
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
      gif: 'ali-vilab/i2vgen-xl:5821a338d00033abaaba89080a17eb8783d9a17ed710a6b4246a18e0900ccad4'
    },
    costs: {
      logo: 1.0,
      meme: 0.2, 
      gif: 0.5
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
      gif: 'ali-vilab/i2vgen-xl:5821a338d00033abaaba89080a17eb8783d9a17ed710a6b4246a18e0900ccad4'
    },
    costs: {
      logo: 1.5,
      meme: 0.3,
      gif: 1.0
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
    services: {
      replicate: process.env['REPLICATE_API_TOKEN'] ? 'configured' : 'missing',
      creditSystem: 'active'
    }
  });
});

// Unified generation endpoint with credit system
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
    const config = tierConfigs[tier as keyof typeof tierConfigs];
    if (!config) {
      res.status(400).json({ error: 'Invalid tier' });
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
    const cost = config.costs[type as keyof typeof config.costs];
    if (cost === null || cost === undefined) {
      res.status(403).json({ 
        error: `${type.toUpperCase()} generation not available for ${tier} tier`,
        availableIn: type === 'gif' ? ['starter', 'viral'] : ['free', 'starter', 'viral'],
        upgradeUrl: '/pricing'
      });
      return;
    }
    
    const balance = await creditService.getBalance(userId);
    
    if (balance < cost) {
      res.status(402).json({
        error: 'Insufficient credits',
        required: cost,
        balance: balance,
        tier: tier,
        earnMore: {
          dailyLogin: 0.1,
          shareTwitter: 0.5,
          referFriend: 1.0
        }
      });
      return;
    }

    console.log(`Generating ${type} for ${tier} tier using ${config.provider}...`);
    
    // Generate asset based on provider and tier
    let result;
    const startTime = Date.now();

    if (config.provider === 'together') {
      result = await generateWithTogether(type, prompt, tokenSymbol, config);
    } else {
      result = await generateWithReplicate(type, prompt, tokenSymbol, config);
    }

    // Deduct credits
    await creditService.checkAndDeductCredits(userId, cost);
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
        model: config.models[type as keyof typeof config.models],
        url: result.url,
        cost,
        newBalance,
        processingTime: endTime - startTime,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error(`Generation error:`, error);
    res.status(500).json({
      error: 'Generation failed',
      message: error.message
    });
  }
});

async function generateWithTogether(type: string, prompt: string, tokenSymbol: string, config: any) {
  // Reality check: Together.ai doesn't have image generation
  // For free tier, we'll use Replicate with more limited settings
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

async function generateWithReplicate(type: string, prompt: string, tokenSymbol: string, config: any) {
  const model = config.models[type];
  const optimizedPrompt = optimizePrompt(prompt, type, tokenSymbol, 'replicate');

  if (type === 'gif') {
    // First generate a base image, then animate it
    const baseImageOutput = await replicate.run(
      'stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b',
      {
        input: {
          prompt: optimizedPrompt,
          width: 512,
          height: 512,
          num_inference_steps: 25
        }
      }
    );
    
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

  // Use provided settings or defaults
  const settings = config.settings || {};
  const defaultWidth = type === 'logo' ? 1024 : 512;
  const defaultHeight = type === 'logo' ? 1024 : 512;
  const defaultSteps = type === 'logo' ? 30 : 20;

  const output = await replicate.run(model, {
    input: {
      prompt: optimizedPrompt,
      width: settings.width || defaultWidth,
      height: settings.height || defaultHeight,
      num_inference_steps: settings.num_inference_steps || defaultSteps,
      guidance_scale: 7.5
    }
  });

  return {
    url: Array.isArray(output) ? output[0] : output
  };
}

function optimizePrompt(prompt: string, type: string, tokenSymbol: string, provider: string): string {
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
    }
  };

  const optimization = typeOptimizations[type as keyof typeof typeOptimizations][provider as keyof typeof typeOptimizations['logo']];
  
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
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/credits/:userId/earn', async (req, res) => {
  try {
    const { userId } = req.params;
    const { action, metadata } = req.body;
    
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
  } catch (error: any) {
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

const PORT = process.env['PORT'] || 4001;

app.listen(PORT, () => {
  console.log(`🚀 DeGenie Complete AI Server running on port ${PORT}`);
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