import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Together from 'together-ai';
import Replicate from 'replicate';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Initialize AI clients
const together = new Together({
  apiKey: process.env['TOGETHER_API_KEY']!
});

const replicate = new Replicate({
  auth: process.env['REPLICATE_API_TOKEN']!
});

// Health check
app.get('/health', (_req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      together: process.env['TOGETHER_API_KEY'] ? 'configured' : 'missing',
      replicate: process.env['REPLICATE_API_TOKEN'] ? 'configured' : 'missing',
    }
  });
});

// Simple AI generation endpoint
app.post('/api/generate', async (req, res) => {
  try {
    const { prompt, type = 'logo', tier = 'free' } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    let result;
    
    if (tier === 'viral') {
      // Use Replicate for premium tier
      console.log('Using Replicate for premium generation...');
      
      result = await replicate.run(
        "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
        {
          input: {
            prompt: `${prompt}, cryptocurrency ${type}, professional design, high quality`,
            width: 1024,
            height: 1024,
            num_inference_steps: 50
          }
        }
      );
    } else {
      // Use Together.ai for free/starter tier
      console.log('Using Together.ai for basic generation...');
      
      // For now, generate a detailed prompt description
      const response = await together.chat.completions.create({
        messages: [
          {
            role: "user",
            content: `Create a detailed description for a ${type} with this concept: ${prompt}. Make it suitable for crypto/DeFi branding.`
          }
        ],
        model: "meta-llama/Llama-Vision-Free"
      });
      
      result = {
        description: response.choices[0].message.content,
        prompt: `${prompt}, cryptocurrency ${type}, clean design`
      };
    }

    res.json({
      success: true,
      data: {
        prompt,
        type,
        tier,
        result: tier === 'viral' ? result : result.data[0],
        timestamp: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('Generation error:', error);
    res.status(500).json({
      error: 'Generation failed',
      message: error.message
    });
  }
});

// Test Together.ai endpoint
app.post('/api/test/together', async (req, res) => {
  try {
    const { prompt = 'A simple logo' } = req.body;
    
    const response = await together.chat.completions.create({
      messages: [
        {
          role: "user",
          content: `Create a detailed visual description for: ${prompt}`
        }
      ],
      model: "meta-llama/Llama-Vision-Free"
    });

    res.json({
      success: true,
      provider: 'together',
      data: response.choices[0].message.content
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Together.ai test failed',
      message: error.message
    });
  }
});

// Test Replicate endpoint
app.post('/api/test/replicate', async (req, res) => {
  try {
    const { prompt = 'A premium logo' } = req.body;
    
    const output = await replicate.run(
      "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
      {
        input: {
          prompt: `${prompt}, premium design, high quality`,
          width: 512,
          height: 512,
          num_inference_steps: 20
        }
      }
    );

    res.json({
      success: true,
      provider: 'replicate',
      data: output
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Replicate test failed',
      message: error.message
    });
  }
});

const PORT = process.env['PORT'] || 4000;

app.listen(PORT, () => {
  console.log(`🚀 DeGenie AI Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env['NODE_ENV'] || 'development'}`);
  console.log(`🔑 Together.ai: ${process.env['TOGETHER_API_KEY'] ? 'Ready' : 'Not configured'}`);
  console.log(`🔑 Replicate: ${process.env['REPLICATE_API_TOKEN'] ? 'Ready' : 'Not configured'}`);
  console.log(`\n📖 Available endpoints:`);
  console.log(`   GET  /health - Health check`);
  console.log(`   POST /api/generate - Generate AI assets`);
  console.log(`   POST /api/test/together - Test Together.ai`);
  console.log(`   POST /api/test/replicate - Test Replicate`);
});