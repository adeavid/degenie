import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Replicate from 'replicate';
import path from 'path';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../public')));

// Initialize Replicate client
const replicate = new Replicate({
  auth: process.env['REPLICATE_API_TOKEN']!
});

// Health check
app.get('/health', (_req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      replicate: process.env['REPLICATE_API_TOKEN'] ? 'configured' : 'missing',
    }
  });
});

// Test Replicate endpoint for logo generation
app.post('/api/generate/logo', async (req, res) => {
  try {
    const { prompt, tokenSymbol } = req.body;

    if (!prompt) {
      res.status(400).json({ error: 'Prompt is required' });
      return;
    }

    console.log('Generating logo with Replicate...');
    console.log('Prompt:', prompt);
    console.log('Token Symbol:', tokenSymbol);
    
    const optimizedPrompt = `${prompt}, ${tokenSymbol || 'crypto'} cryptocurrency logo, clean modern design, minimalist, vector style, professional branding, circular logo badge, flat design, trending on Dribble`;
    
    const output = await replicate.run(
      "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
      {
        input: {
          prompt: optimizedPrompt,
          width: 1024,
          height: 1024,
          num_inference_steps: 30,
          guidance_scale: 7.5,
          scheduler: "K_EULER",
          negative_prompt: "blurry, low quality, pixelated, text, watermark, signature"
        }
      }
    );

    console.log('Generation complete!');

    res.json({
      success: true,
      data: {
        prompt: optimizedPrompt,
        originalPrompt: prompt,
        tokenSymbol,
        imageUrl: Array.isArray(output) ? output[0] : output,
        provider: 'replicate',
        model: 'stability-ai/sdxl',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('Replicate generation error:', error);
    res.status(500).json({
      error: 'Logo generation failed',
      message: error.message
    });
  }
});

// Test Replicate endpoint for meme generation
app.post('/api/generate/meme', async (req, res) => {
  try {
    const { prompt, tokenSymbol } = req.body;

    if (!prompt) {
      res.status(400).json({ error: 'Prompt is required' });
      return;
    }

    console.log('Generating meme with Replicate...');
    
    const memePrompt = `${prompt}, ${tokenSymbol || 'crypto'} meme, funny crypto meme, internet meme style, viral meme potential, cryptocurrency humor, trending meme format`;
    
    const output = await replicate.run(
      "fofr/sdxl-emoji:dee76b5afde21b0f01ed7925f0665b7e879c50ee718c5f78a9d38e04d523cc5e",
      {
        input: {
          prompt: memePrompt,
          width: 1024,
          height: 1024,
          num_inference_steps: 20
        }
      }
    );

    res.json({
      success: true,
      data: {
        prompt: memePrompt,
        originalPrompt: prompt,
        tokenSymbol,
        imageUrl: Array.isArray(output) ? output[0] : output,
        provider: 'replicate',
        model: 'fofr/sdxl-emoji',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('Meme generation error:', error);
    res.status(500).json({
      error: 'Meme generation failed',
      message: error.message
    });
  }
});

// Test Replicate endpoint for GIF generation
app.post('/api/generate/gif', async (req, res) => {
  try {
    const { prompt, tokenSymbol } = req.body;

    if (!prompt) {
      res.status(400).json({ error: 'Prompt is required' });
      return;
    }

    console.log('Generating GIF with Replicate...');
    
    const gifPrompt = `${prompt}, ${tokenSymbol || 'crypto'} animated gif, cryptocurrency animation, smooth loop, digital art, vibrant colors, dynamic movement`;
    
    // For now, use SDXL to generate a "gif-like" animated style image
    // We'll upgrade to true video generation in a future iteration
    const output = await replicate.run(
      "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
      {
        input: {
          prompt: gifPrompt + ", animated style, motion lines, dynamic composition, storyboard frames",
          width: 512,
          height: 512,
          num_inference_steps: 25,
          guidance_scale: 7.5,
          negative_prompt: "static, still, motionless"
        }
      }
    );

    res.json({
      success: true,
      data: {
        prompt: gifPrompt,
        originalPrompt: prompt,
        tokenSymbol,
        gifUrl: Array.isArray(output) ? output[0] : output,
        provider: 'replicate',
        model: 'stability-ai/sdxl-gif-style',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('GIF generation error:', error);
    res.status(500).json({
      error: 'GIF generation failed',
      message: error.message
    });
  }
});

// Quick test endpoint
app.get('/api/test', (_req, res) => {
  res.json({
    message: 'DeGenie AI Server is running!',
    endpoints: [
      'POST /api/generate/logo',
      'POST /api/generate/meme',
      'POST /api/generate/gif',
      'GET /health'
    ]
  });
});

const PORT = process.env['PORT'] || 4000;

app.listen(PORT, () => {
  console.log(`🚀 DeGenie AI Test Server running on port ${PORT}`);
  console.log(`🔑 Replicate: ${process.env['REPLICATE_API_TOKEN'] ? 'Ready ✅' : 'Not configured ❌'}`);
  console.log(`\n📖 Available Asset Types:`);
  console.log(`   🎨 Logos  - POST /api/generate/logo`);
  console.log(`   🎭 Memes  - POST /api/generate/meme`);
  console.log(`   🎬 GIFs   - POST /api/generate/gif`);
  console.log(`\n📝 Example usage:`);
  console.log(`   curl -X POST http://localhost:${PORT}/api/generate/gif \\`);
  console.log(`        -H "Content-Type: application/json" \\`);
  console.log(`        -d '{"prompt": "rocket launching to moon", "tokenSymbol": "ROCKET"}'`);
});