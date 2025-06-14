import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { MockRedis } from './services/MockRedis';

// Load environment variables
dotenv.config();

// Import routes
import aiRoutes from '../routes/ai.routes';
import authRoutes from '../routes/auth.routes';
// import tokenRoutes from './routes/token.routes';

// Import services for initialization
import { CreditService } from '../services/CreditService';

const app = express();
const prisma = new PrismaClient();
const redis = new MockRedis();

// Middleware
app.use(helmet());
app.use(cors({
  origin: (process.env['CORS_ORIGINS'] || process.env['FRONTEND_URL'] || 'http://localhost:3000').split(','),
  credentials: true,
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', async (req, res) => {
  const isBasicCheck = req.query['basic'] === 'true';
  
  if (isBasicCheck) {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
    return;
  }
  
  try {
    await prisma.$queryRaw`SELECT 1`;
    await redis.ping();
    res.json({ 
      status: 'healthy',
      services: {
        database: 'connected',
        redis: 'connected',
        timestamp: new Date().toISOString(),
      }
    });
  } catch (error) {
    res.status(503).json({ 
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// API Routes
app.use('/api/ai', aiRoutes);
app.use('/api/auth', authRoutes);
// app.use('/api/tokens', tokenRoutes);

// Error handling middleware
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error:', err);
  
  if (err.name === 'ValidationError') {
    res.status(400).json({
      error: 'Validation failed',
      details: err.details,
    });
    return;
  }

  if (err.name === 'UnauthorizedError') {
    res.status(401).json({
      error: 'Unauthorized',
    });
    return;
  }

  res.status(500).json({
    error: 'Internal server error',
    message: process.env['NODE_ENV'] === 'development' ? err.message : undefined,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path,
  });
});

// Initialize services
async function initializeServices() {
  console.log('🚀 Initializing services...');
  
  // Initialize credit service event listeners
  const creditService = new CreditService();
  
  creditService.on('creditsEarned', ({ userId, amount, reason, newBalance }: { userId: string; amount: number; reason: string; newBalance: number }) => {
    console.log(`Credits earned: User ${userId} earned ${amount} credits for ${reason}. New balance: ${newBalance}`);
  });
  
  creditService.on('creditsSpent', ({ userId, amount, newBalance }: { userId: string; amount: number; newBalance: number }) => {
    console.log(`Credits spent: User ${userId} spent ${amount} credits. New balance: ${newBalance}`);
  });
  
  creditService.on('achievementUnlocked', ({ userId, achievement }: { userId: string; achievement: string }) => {
    console.log(`Achievement unlocked: User ${userId} unlocked ${achievement}`);
  });
  
  console.log('✅ Services initialized');
}

// Start server
const PORT = process.env['PORT'] || 4000;

async function start() {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connected');
    
    // Test Redis connection
    await redis.ping();
    console.log('✅ Redis connected');
    
    // Initialize services
    await initializeServices();
    
    // Start Express server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📍 Environment: ${process.env['NODE_ENV'] || 'development'}`);
      console.log(`🎨 AI Providers: Together.ai + Replicate`);
      console.log(`💳 Credit System: Active`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  await prisma.$disconnect();
  await redis.quit();
  process.exit(0);
});

start();