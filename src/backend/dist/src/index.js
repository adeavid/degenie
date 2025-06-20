"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
const client_1 = require("@prisma/client");
const MockRedis_1 = require("./services/MockRedis");
// Load environment variables
dotenv_1.default.config();
// Import routes
const ai_routes_1 = __importDefault(require("../routes/ai.routes"));
const auth_routes_1 = __importDefault(require("../routes/auth.routes"));
const token_routes_1 = __importDefault(require("../routes/token.routes"));
// Import services for initialization
const CreditService_1 = require("../services/CreditService");
const app = (0, express_1.default)();
const prisma = new client_1.PrismaClient();
const redis = new MockRedis_1.MockRedis();
// Middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: (process.env['CORS_ORIGINS'] || process.env['FRONTEND_URL'] || 'http://localhost:3000').split(','),
    credentials: true,
}));
app.use((0, morgan_1.default)('combined'));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
// Health check
app.get('/health', async (req, res) => {
    const isBasicCheck = req.query['basic'] === 'true';
    if (isBasicCheck) {
        res.json({ status: 'healthy', timestamp: new Date().toISOString() });
        return;
    }
    try {
        await prisma.$queryRaw `SELECT 1`;
        await redis.ping();
        res.json({
            status: 'healthy',
            services: {
                database: 'connected',
                redis: 'connected',
                timestamp: new Date().toISOString(),
            }
        });
    }
    catch (error) {
        res.status(503).json({
            status: 'unhealthy',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
// API Routes
app.use('/api/ai', ai_routes_1.default);
app.use('/api/auth', auth_routes_1.default);
app.use('/api/tokens', token_routes_1.default);
// Error handling middleware
app.use((err, _req, res, _next) => {
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
    const creditService = new CreditService_1.CreditService();
    creditService.on('creditsEarned', ({ userId, amount, reason, newBalance }) => {
        console.log(`Credits earned: User ${userId} earned ${amount} credits for ${reason}. New balance: ${newBalance}`);
    });
    creditService.on('creditsSpent', ({ userId, amount, newBalance }) => {
        console.log(`Credits spent: User ${userId} spent ${amount} credits. New balance: ${newBalance}`);
    });
    creditService.on('achievementUnlocked', ({ userId, achievement }) => {
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
    }
    catch (error) {
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
//# sourceMappingURL=index.js.map