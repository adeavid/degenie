/**
 * DeGenie Logo Generation API Server
 * Express.js server that exposes the logo generation service via REST API
 */

<<<<<<< HEAD
import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import { LogoGenerator } from '../services/logo-generator';
import { LogoRequest, LogoStyle, ImageSize, ImageFormat, AIProvider, GenerationOptions } from '../types';
=======
import express from 'express';
import cors from 'cors';
import path from 'path';
import { LogoGenerator } from '../services/logo-generator';
import { LogoRequest, LogoStyle, ImageSize, ImageFormat, AIProvider } from '../types';
>>>>>>> origin/main
import { validateConfig } from '../config';

const app = express();
const port = process.env.PORT || 3001;

<<<<<<< HEAD
// Add authentication middleware
const requireAuth = (req: express.Request, res: express.Response, next: express.NextFunction): void => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey || apiKey !== process.env.ADMIN_API_KEY) {
    const error = new Error('Unauthorized');
    (error as any).status = 401;
    (error as any).code = 'UNAUTHORIZED';
    next(error);
    return;
  }
  next();
};

// Middleware
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Add rate limiting in production
if (process.env.NODE_ENV === 'production') {
  const rateLimit = require('express-rate-limit');
  app.use('/api/', rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: { error: 'Too many requests', code: 'RATE_LIMITED' }
  }));
}

=======
// Middleware
app.use(cors());
app.use(express.json());
>>>>>>> origin/main
app.use(express.static('public'));

// Initialize logo generator
let logoGenerator: LogoGenerator;

try {
  const configValidation = validateConfig();
  if (!configValidation.isValid) {
    console.error('❌ Configuration validation failed:', configValidation.errors);
    process.exit(1);
  }
  
  logoGenerator = new LogoGenerator();
  console.log('✅ Logo generator initialized');
} catch (error) {
  console.error('❌ Failed to initialize logo generator:', error);
  process.exit(1);
}

// API Routes

/**
 * Health check endpoint
 */
<<<<<<< HEAD
app.get('/health', (req: Request, res: Response): void => {
=======
app.get('/health', (req, res) => {
>>>>>>> origin/main
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'degenie-logo-generator',
    version: '1.0.0',
  });
});

/**
 * Get service information and available options
 */
<<<<<<< HEAD
app.get('/api/info', (req: Request, res: Response): void => {
=======
app.get('/api/info', (req, res) => {
>>>>>>> origin/main
  res.json({
    service: 'DeGenie Logo Generation API',
    version: '1.0.0',
    providers: Object.values(AIProvider),
    styles: Object.values(LogoStyle),
    sizes: Object.values(ImageSize),
    formats: Object.values(ImageFormat),
    usage: logoGenerator.getUsageStats(),
  });
});

/**
 * Generate a single logo
 */
<<<<<<< HEAD
app.post('/api/generate', async (req: Request, res: Response): Promise<void> => {
=======
app.post('/api/generate', async (req, res) => {
>>>>>>> origin/main
  try {
    console.log('📝 Received logo generation request:', req.body);

    const {
      tokenName,
      theme,
      style,
      colors,
      size,
      format,
      provider,
      variations = 1,
    } = req.body;

    // Validate required fields
    if (!tokenName || typeof tokenName !== 'string') {
<<<<<<< HEAD
      res.status(400).json({
        error: 'tokenName is required and must be a string',
        code: 'INVALID_TOKEN_NAME',
      });
      return;
=======
      return res.status(400).json({
        error: 'tokenName is required and must be a string',
        code: 'INVALID_TOKEN_NAME',
      });
>>>>>>> origin/main
    }

    // Build request object
    const logoRequest: LogoRequest = {
      tokenName: tokenName.trim(),
      theme,
<<<<<<< HEAD
      style: Object.values(LogoStyle).includes(style) ? style as LogoStyle : undefined,
      colors: Array.isArray(colors) ? colors : undefined,
      size: Object.values(ImageSize).includes(size) ? size as ImageSize : undefined,
      format: Object.values(ImageFormat).includes(format) ? format as ImageFormat : undefined,
    };

    // Generation options
    const validProvider = provider && Object.values(AIProvider).includes(provider) 
      ? provider as AIProvider 
      : undefined;
    
    const options: GenerationOptions | undefined = validProvider 
      ? { provider: validProvider }
      : undefined;

    // Validate variations parameter
    const validatedVariations = Math.max(1, Math.min(parseInt(variations) || 1, 5));

    let result;

    if (validatedVariations > 1) {
      // Generate multiple variations
      const results = await logoGenerator.generateVariations(logoRequest, validatedVariations);
=======
      style: style as LogoStyle,
      colors: Array.isArray(colors) ? colors : undefined,
      size: size as ImageSize,
      format: format as ImageFormat,
    };

    // Generation options
    const options = {
      provider: provider as AIProvider,
    };

    let result;

    if (variations > 1) {
      // Generate multiple variations
      const results = await logoGenerator.generateVariations(logoRequest, Math.min(variations, 5));
>>>>>>> origin/main
      result = {
        success: results.some(r => r.success),
        variations: results,
        count: results.length,
        successCount: results.filter(r => r.success).length,
      };
    } else {
      // Generate single logo
      result = await logoGenerator.generateLogo(logoRequest, options);
    }

    console.log('✅ Logo generation completed');
    res.json(result);

  } catch (error) {
    console.error('❌ Logo generation failed:', error);
    res.status(500).json({
      error: 'Internal server error during logo generation',
      code: 'GENERATION_ERROR',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Get theme suggestions for a token name
 */
<<<<<<< HEAD
app.post('/api/suggest-themes', (req: Request, res: Response): void => {
=======
app.post('/api/suggest-themes', (req, res) => {
>>>>>>> origin/main
  try {
    const { tokenName } = req.body;

    if (!tokenName || typeof tokenName !== 'string') {
<<<<<<< HEAD
      res.status(400).json({
        error: 'tokenName is required and must be a string',
        code: 'INVALID_TOKEN_NAME',
      });
      return;
=======
      return res.status(400).json({
        error: 'tokenName is required and must be a string',
        code: 'INVALID_TOKEN_NAME',
      });
>>>>>>> origin/main
    }

    const suggestions = logoGenerator.suggestThemes(tokenName.trim());
    
    res.json({
      tokenName: tokenName.trim(),
      suggestions,
      count: suggestions.length,
    });

  } catch (error) {
    console.error('❌ Theme suggestion failed:', error);
    res.status(500).json({
      error: 'Internal server error during theme suggestion',
      code: 'SUGGESTION_ERROR',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Get generation history
 */
<<<<<<< HEAD
app.get('/api/history', (req: Request, res: Response): void => {
  try {
    const history = logoGenerator.getGenerationHistory();
    const rawLimit = parseInt(req.query.limit as string);
    const limit = (!isNaN(rawLimit) && rawLimit > 0) ? Math.min(rawLimit, 100) : 50;
=======
app.get('/api/history', (req, res) => {
  try {
    const history = logoGenerator.getGenerationHistory();
    const limit = parseInt(req.query.limit as string) || 50;
>>>>>>> origin/main
    
    res.json({
      history: history.slice(-limit),
      count: history.length,
      limit,
    });

  } catch (error) {
    console.error('❌ History retrieval failed:', error);
    res.status(500).json({
      error: 'Internal server error during history retrieval',
      code: 'HISTORY_ERROR',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Get usage statistics
 */
<<<<<<< HEAD
app.get('/api/stats', (req: Request, res: Response): void => {
=======
app.get('/api/stats', (req, res) => {
>>>>>>> origin/main
  try {
    const stats = logoGenerator.getUsageStats();
    res.json(stats);

  } catch (error) {
    console.error('❌ Stats retrieval failed:', error);
    res.status(500).json({
      error: 'Internal server error during stats retrieval',
      code: 'STATS_ERROR',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Clear generation history (admin endpoint)
 */
<<<<<<< HEAD
app.delete('/api/history', requireAuth, async (req: Request, res: Response): Promise<void> => {
=======
app.delete('/api/history', async (req, res) => {
>>>>>>> origin/main
  try {
    await logoGenerator.clearHistory();
    res.json({
      message: 'Generation history cleared successfully',
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ History clearing failed:', error);
    res.status(500).json({
      error: 'Internal server error during history clearing',
      code: 'CLEAR_ERROR',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Error handling middleware
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
<<<<<<< HEAD
  // Log detailed error server-side
  console.error('Unhandled error:', error.stack || error);
=======
  console.error('❌ Unhandled error:', error);
>>>>>>> origin/main
  
  res.status(500).json({
    error: 'Internal server error',
    code: 'INTERNAL_ERROR',
<<<<<<< HEAD
    message: 'Something went wrong',
    ...(process.env.NODE_ENV === 'development' && { debug: error.message })
=======
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
>>>>>>> origin/main
  });
});

// 404 handler
<<<<<<< HEAD
app.use((req: Request, res: Response): void => {
=======
app.use((req, res) => {
>>>>>>> origin/main
  res.status(404).json({
    error: 'Endpoint not found',
    code: 'NOT_FOUND',
    path: req.path,
  });
});

// Start server
app.listen(port, () => {
  console.log(`🧞‍♂️ DeGenie Logo Generation API server running on port ${port}`);
  console.log(`📡 API endpoints available at http://localhost:${port}/api/`);
  console.log(`🏥 Health check: http://localhost:${port}/health`);
  console.log(`📊 Service info: http://localhost:${port}/api/info`);
});

export default app;