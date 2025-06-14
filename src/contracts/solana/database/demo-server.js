/**
 * DeGenie Database Demo Server
 * Demonstrates the graduation service functionality with sample API endpoints
 */

require('dotenv').config();
const express = require('express');
const { graduationService } = require('./graduation-service');
const { db } = require('./config');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS for development
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

// Health check endpoint
app.get('/health', async (req, res) => {
    try {
        const health = await graduationService.getHealthStatus();
        res.json(health);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Demo endpoints
app.get('/', (req, res) => {
    res.json({
        message: '🧞‍♂️ DeGenie Database Demo Server',
        version: '1.0.0',
        endpoints: {
            '/health': 'Database health check',
            '/demo/create-token': 'POST - Create a demo token',
            '/demo/buy-tokens': 'POST - Simulate token purchase',
            '/demo/graduate-token': 'POST - Graduate token to DEX',
            '/analytics/token/:mintAddress': 'GET - Token analytics',
            '/analytics/platform': 'GET - Platform analytics',
            '/analytics/top-tokens': 'GET - Top performing tokens',
            '/analytics/graduations': 'GET - Graduation history',
            '/bot-check/:walletAddress': 'GET - Check bot status'
        }
    });
});

// Create demo token
app.post('/demo/create-token', async (req, res) => {
    try {
        const tokenData = {
            mintAddress: req.body.mintAddress || `DEMO${Date.now()}${Math.random().toString(36).substring(7)}`,
            name: req.body.name || 'Demo Token',
            symbol: req.body.symbol || 'DEMO',
            metadataUri: req.body.metadataUri || 'https://degenie.ai/metadata/demo.json',
            creatorAddress: req.body.creatorAddress || 'CREATOR' + Math.random().toString(36).substring(7),
            initialPrice: req.body.initialPrice || 1000,
            maxSupply: req.body.maxSupply || 1000000000,
            curveType: req.body.curveType || 'Exponential',
            growthRate: req.body.growthRate || 100,
            graduationThreshold: req.body.graduationThreshold || 69000000000000
        };

        const result = await graduationService.createToken(tokenData);
        
        res.json({
            success: true,
            message: 'Demo token created successfully',
            token: tokenData,
            result
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Simulate token purchase
app.post('/demo/buy-tokens', async (req, res) => {
    try {
        const {
            mintAddress,
            walletAddress = 'BUYER' + Math.random().toString(36).substring(7),
            solAmount = 100000000, // 0.1 SOL
            tokenAmount = 100000,
            pricePerToken = 1000,
            transactionFee = 1000000, // 0.001 SOL
            priceImpactBps = 50 // 0.5%
        } = req.body;

        if (!mintAddress) {
            return res.status(400).json({ error: 'mintAddress is required' });
        }

        // Record transaction
        const transaction = await graduationService.recordTransaction({
            mintAddress,
            walletAddress,
            transactionType: 'buy',
            solAmount,
            tokenAmount,
            pricePerToken,
            transactionFee,
            priceImpactBps,
            signature: 'DEMO' + Math.random().toString(36).substring(7),
            slotNumber: Math.floor(Math.random() * 1000000),
            blockTime: new Date()
        });

        // Update bonding curve state
        await graduationService.updateBondingCurveState(mintAddress, {
            currentPrice: pricePerToken,
            totalSupply: tokenAmount,
            treasuryBalance: solAmount,
            totalVolume: solAmount
        });

        res.json({
            success: true,
            message: 'Token purchase recorded',
            transaction
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Graduate token
app.post('/demo/graduate-token', async (req, res) => {
    try {
        const {
            mintAddress,
            finalMarketCap = 69000000000000,
            finalPrice = 69000,
            finalSupply = 1000000,
            liquidityMigrated = 58650000000000 // 85% of market cap
        } = req.body;

        if (!mintAddress) {
            return res.status(400).json({ error: 'mintAddress is required' });
        }

        const graduation = await graduationService.recordGraduation({
            mintAddress,
            finalMarketCap,
            finalPrice,
            finalSupply,
            liquidityMigrated,
            dexPlatform: 'Raydium',
            poolAddress: 'POOL' + Math.random().toString(36).substring(7),
            lpTokensBurned: liquidityMigrated,
            graduationSignature: 'GRAD' + Math.random().toString(36).substring(7)
        });

        res.json({
            success: true,
            message: 'Token graduated successfully',
            graduation
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Token analytics
app.get('/analytics/token/:mintAddress', async (req, res) => {
    try {
        const analytics = await graduationService.getTokenAnalytics(req.params.mintAddress);
        
        if (!analytics) {
            return res.status(404).json({ error: 'Token not found' });
        }

        res.json(analytics);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Platform analytics
app.get('/analytics/platform', async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 30;
        const analytics = await graduationService.getPlatformAnalytics(days);
        res.json(analytics);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Top tokens
app.get('/analytics/top-tokens', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const sortBy = req.query.sortBy || 'market_cap';
        const tokens = await graduationService.getTopTokens(limit, sortBy);
        res.json(tokens);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Graduation history
app.get('/analytics/graduations', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const graduations = await graduationService.getGraduationHistory(limit);
        res.json(graduations);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Bot check
app.get('/bot-check/:walletAddress', async (req, res) => {
    try {
        const botStatus = await graduationService.checkBotStatus(req.params.walletAddress);
        res.json(botStatus);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Demo data generator
app.post('/demo/generate-data', async (req, res) => {
    try {
        console.log('🎲 Generating demo data...');
        
        // Create 5 demo tokens
        const tokens = [];
        for (let i = 0; i < 5; i++) {
            const tokenData = {
                mintAddress: `DEMO${Date.now()}${i}${Math.random().toString(36).substring(7)}`,
                name: `Demo Token ${i + 1}`,
                symbol: `DM${i + 1}`,
                metadataUri: `https://degenie.ai/metadata/demo${i + 1}.json`,
                creatorAddress: `CREATOR${i}${Math.random().toString(36).substring(7)}`,
                initialPrice: 1000 + (i * 100),
                maxSupply: 1000000000,
                curveType: 'Exponential',
                growthRate: 100,
                graduationThreshold: 69000000000000
            };

            await graduationService.createToken(tokenData);
            tokens.push(tokenData);

            // Add some transactions for each token
            for (let j = 0; j < 10; j++) {
                await graduationService.recordTransaction({
                    mintAddress: tokenData.mintAddress,
                    walletAddress: `USER${j}${Math.random().toString(36).substring(7)}`,
                    transactionType: Math.random() > 0.8 ? 'sell' : 'buy',
                    solAmount: Math.floor(Math.random() * 1000000000), // Random amount up to 1 SOL
                    tokenAmount: Math.floor(Math.random() * 1000000),
                    pricePerToken: tokenData.initialPrice + (j * 10),
                    transactionFee: Math.floor(Math.random() * 10000000), // Random fee
                    priceImpactBps: Math.floor(Math.random() * 500), // Random impact up to 5%
                    signature: `TX${j}${Math.random().toString(36).substring(7)}`,
                    slotNumber: Math.floor(Math.random() * 1000000),
                    blockTime: new Date(Date.now() - Math.random() * 86400000) // Random time in last 24h
                });
            }

            // Graduate some tokens
            if (i < 2) {
                await graduationService.recordGraduation({
                    mintAddress: tokenData.mintAddress,
                    finalMarketCap: 69000000000000 + (i * 10000000000000),
                    finalPrice: 69000 + (i * 1000),
                    finalSupply: 1000000,
                    liquidityMigrated: 58650000000000,
                    dexPlatform: 'Raydium',
                    poolAddress: `POOL${i}${Math.random().toString(36).substring(7)}`,
                    lpTokensBurned: 58650000000000,
                    graduationSignature: `GRAD${i}${Math.random().toString(36).substring(7)}`
                });
            }
        }

        res.json({
            success: true,
            message: `Generated ${tokens.length} demo tokens with transactions`,
            tokens: tokens.map(t => ({ name: t.name, symbol: t.symbol, mintAddress: t.mintAddress }))
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Error handling
app.use((error, req, res, next) => {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
async function startServer() {
    try {
        // Test database connection
        console.log('🔌 Testing database connection...');
        const connectionSuccess = await db.testConnection();
        
        if (!connectionSuccess) {
            console.error('❌ Database connection failed. Please check your configuration.');
            process.exit(1);
        }

        app.listen(PORT, () => {
            console.log(`🚀 DeGenie Database Demo Server running on port ${PORT}`);
            console.log(`📊 Health check: http://localhost:${PORT}/health`);
            console.log(`🧞‍♂️ Demo API: http://localhost:${PORT}/`);
            console.log('');
            console.log('📋 Try these demo commands:');
            console.log(`curl -X POST http://localhost:${PORT}/demo/create-token -H "Content-Type: application/json" -d '{"name":"My Token","symbol":"MTK"}'`);
            console.log(`curl -X POST http://localhost:${PORT}/demo/generate-data`);
            console.log(`curl http://localhost:${PORT}/analytics/platform`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error.message);
        process.exit(1);
    }
}

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down gracefully...');
    await db.close();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n🛑 Shutting down gracefully...');
    await db.close();
    process.exit(0);
});

startServer();