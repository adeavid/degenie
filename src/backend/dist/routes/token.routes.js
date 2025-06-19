"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
// In-memory token storage (shared with complete-server.ts)
const deployedTokens = new Map();
// URL validation patterns
const websiteUrlPattern = /^https?:\/\/.+/;
const twitterUrlPattern = /^https?:\/\/(www\.)?(twitter\.com|x\.com)\/[A-Za-z0-9_]{1,15}$/;
const telegramUrlPattern = /^https?:\/\/(www\.)?(t\.me|telegram\.me)\/[A-Za-z0-9_]{5,32}$/;
// Validation schema for token deployment
const deployTokenSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(50),
    symbol: zod_1.z.string().min(1).max(10),
    description: zod_1.z.string().min(1).max(500),
    totalSupply: zod_1.z.string().regex(/^\d+$/),
    logoUrl: zod_1.z.string().optional(),
    walletAddress: zod_1.z.string().min(32),
    network: zod_1.z.string().default('solana'),
    // Social media URLs - optional but validated when provided
    website: zod_1.z.string().regex(websiteUrlPattern, 'Invalid website URL format').optional().or(zod_1.z.literal('')),
    twitter: zod_1.z.string().regex(twitterUrlPattern, 'Invalid Twitter URL format - use https://twitter.com/username').optional().or(zod_1.z.literal('')),
    telegram: zod_1.z.string().regex(telegramUrlPattern, 'Invalid Telegram URL format - use https://t.me/username').optional().or(zod_1.z.literal('')),
});
// Mock token deployment (DISABLED - using real deployment from complete-server.ts)
/* router.post('/deploy', async (req: Request, res: Response) => {
  try {
    const validatedData = deployTokenSchema.parse(req.body);
    const userId = validatedData.walletAddress; // Use wallet address as user ID for now

    // Mock deployment process
    const deploymentResult = {
      tokenAddress: `token_${uuidv4().replace(/-/g, '')}`,
      mintKey: `mint_${uuidv4().replace(/-/g, '')}`,
      signature: `sig_${uuidv4().replace(/-/g, '')}`,
      network: validatedData.network,
      name: validatedData.name,
      symbol: validatedData.symbol,
      totalSupply: validatedData.totalSupply,
      logoUrl: validatedData.logoUrl,
      website: validatedData.website,
      twitter: validatedData.twitter,
      telegram: validatedData.telegram,
      createdAt: new Date().toISOString(),
      creator: userId,
    };

    // In a real implementation, you would:
    // 1. Create the token on the blockchain
    // 2. Store the token data in the database
    // 3. Set up the bonding curve
    // 4. Initialize liquidity pool

    console.log('Token deployment simulated:', deploymentResult);

    res.status(200).json({
      success: true,
      data: deploymentResult,
    });
  } catch (error) {
    console.error('Token deployment error:', error);
    
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Invalid token data',
        details: error.errors
      });
      return;
    }

    res.status(500).json({
      error: 'Token deployment failed',
      message: process.env['NODE_ENV'] === 'development' ? error instanceof Error ? error.message : 'Unknown error' : undefined
    });
  }
}); */
// Get user's tokens
router.get('/user/:walletAddress', async (req, res) => {
    try {
        const { walletAddress } = req.params;
        // Mock user tokens (in real app, query from database)
        const mockTokens = [
            {
                id: 'token_1',
                name: 'DemoToken',
                symbol: 'DEMO',
                tokenAddress: 'demo_token_address_123',
                createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
                price: 0.000234,
                marketCap: 234000,
                change24h: 156.5,
                volume24h: 45600,
                holders: 1250,
            }
        ];
        res.status(200).json({
            success: true,
            data: mockTokens,
        });
    }
    catch (error) {
        console.error('Error fetching user tokens:', error);
        res.status(500).json({ error: 'Failed to fetch tokens' });
    }
});
// Get token info with REAL pump.fun data
router.get('/:tokenAddress', async (req, res) => {
    try {
        const { tokenAddress } = req.params;
        // Import services
        const { PumpFunBondingCurve } = await Promise.resolve().then(() => __importStar(require('../services/blockchain/PumpFunBondingCurve')));
        const { tradeStorage } = await Promise.resolve().then(() => __importStar(require('../services/shared')));
        // Get real data from trade storage
        const currentSolRaised = tradeStorage.getSolRaised(tokenAddress) || 0;
        const currentPrice = PumpFunBondingCurve.getCurrentPrice(currentSolRaised);
        const marketCap = PumpFunBondingCurve.getMarketCap(currentSolRaised);
        const graduationProgress = PumpFunBondingCurve.getGraduationProgress(currentSolRaised);
        const volume24h = tradeStorage.get24hVolume(tokenAddress);
        const priceChange = tradeStorage.get24hPriceChange(tokenAddress);
        const holdersCount = tradeStorage.getHolderCount(tokenAddress);
        // Get metadata from deployed tokens or generate default
        const deployedToken = deployedTokens.get(tokenAddress);
        const metadata = deployedToken ? {
            name: deployedToken.name || 'DeGenie Token',
            symbol: deployedToken.symbol || tokenAddress.slice(0, 4).toUpperCase(),
            description: deployedToken.description || `Token deployed on Solana using DeGenie`,
            creator: deployedToken.creator || deployedToken.deployer || '7xKXtg2CW3H6cGh5rJ8qHjYo5mW9L2Nk3QpR6FsX4uP8',
            createdAt: deployedToken.createdAt || Date.now()
        } : {
            name: 'DeGenie Token',
            symbol: tokenAddress.slice(0, 4).toUpperCase(),
            description: `Token deployed on Solana using DeGenie`,
            creator: '7xKXtg2CW3H6cGh5rJ8qHjYo5mW9L2Nk3QpR6FsX4uP8',
            createdAt: Date.now()
        };
        const tokenInfo = {
            address: tokenAddress,
            name: metadata.name,
            symbol: metadata.symbol,
            description: metadata.description,
            logoUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiByeD0iMzIiIGZpbGw9IiM4YjVjZjYiLz4KPHR4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0id2hpdGUiIGZvbnQtc2l6ZT0iMjAiIGZvbnQtZmFtaWx5PSJBcmlhbCI+REc8L3R4dD4KPC9zdmc+',
            website: '',
            twitter: '',
            telegram: '',
            creator: metadata.creator,
            createdAt: metadata.createdAt,
            totalSupply: PumpFunBondingCurve.TOTAL_SUPPLY,
            currentPrice,
            marketCap,
            volume24h,
            priceChange24h: priceChange?.percentage || 0,
            holdersCount: holdersCount || 0,
            bondingCurveProgress: graduationProgress,
            graduationThreshold: PumpFunBondingCurve.GRADUATION_THRESHOLD * 180, // In USD
            liquidityCollected: currentSolRaised,
            isGraduated: graduationProgress >= 100,
            isWatchlisted: false
        };
        console.log(`📊 [Token Info] Requested: ${tokenAddress}`);
        console.log(`📊 [Token Info] Returning:`, { name: tokenInfo.name, symbol: tokenInfo.symbol });
        res.status(200).json({
            success: true,
            data: tokenInfo,
        });
    }
    catch (error) {
        console.error('Error fetching token info:', error);
        res.status(500).json({ error: 'Failed to fetch token info' });
    }
});
// Get token trades
router.get('/:tokenAddress/trades', async (req, res) => {
    try {
        const { tokenAddress } = req.params;
        // Mock trades data
        const mockTrades = [
            {
                id: 'trade_1',
                type: 'buy',
                account: '7xKXtg2CW3H6cGh5rJ8qHjYo5mW9L2Nk3QpR6FsX4uP8',
                solAmount: 2.5,
                tokenAmount: 10638297,
                price: 0.000235,
                timestamp: Date.now() - (5 * 60 * 1000), // 5 minutes ago
                signature: 'sig_' + Math.random().toString(36).substring(7),
                priceChange: 2.1
            },
            {
                id: 'trade_2',
                type: 'sell',
                account: 'AnotherWalletAddress1234567890ABCDEF',
                solAmount: 1.8,
                tokenAmount: 7692308,
                price: 0.000234,
                timestamp: Date.now() - (12 * 60 * 1000), // 12 minutes ago
                signature: 'sig_' + Math.random().toString(36).substring(7),
                priceChange: -0.4
            },
            {
                id: 'trade_3',
                type: 'buy',
                account: 'ThirdWalletAddress9876543210FEDCBA',
                solAmount: 5.0,
                tokenAmount: 21505376,
                price: 0.000232,
                timestamp: Date.now() - (25 * 60 * 1000), // 25 minutes ago
                signature: 'sig_' + Math.random().toString(36).substring(7),
                priceChange: 1.7
            }
        ];
        res.status(200).json({
            success: true,
            data: mockTrades,
        });
    }
    catch (error) {
        console.error('Error fetching token trades:', error);
        res.status(500).json({ error: 'Failed to fetch trades' });
    }
});
// Get token holders
router.get('/:tokenAddress/holders', async (req, res) => {
    try {
        const { tokenAddress } = req.params;
        // Mock holders data
        const mockHolders = [
            {
                address: '7xKXtg2CW3H6cGh5rJ8qHjYo5mW9L2Nk3QpR6FsX4uP8',
                balance: 150000000,
                percentage: 15.0,
                firstBuy: Date.now() - (24 * 60 * 60 * 1000), // 24 hours ago
                isCreator: true,
                rank: 1
            },
            {
                address: 'AnotherWalletAddress1234567890ABCDEF',
                balance: 85000000,
                percentage: 8.5,
                firstBuy: Date.now() - (18 * 60 * 60 * 1000), // 18 hours ago
                rank: 2
            },
            {
                address: 'ThirdWalletAddress9876543210FEDCBA',
                balance: 62000000,
                percentage: 6.2,
                firstBuy: Date.now() - (15 * 60 * 60 * 1000), // 15 hours ago
                rank: 3
            },
            {
                address: 'FourthWallet12345ABCDEF67890GHIJK',
                balance: 45000000,
                percentage: 4.5,
                firstBuy: Date.now() - (12 * 60 * 60 * 1000), // 12 hours ago
                rank: 4
            },
            {
                address: 'FifthWalletXYZ789DEF456ABC123GHI',
                balance: 38000000,
                percentage: 3.8,
                firstBuy: Date.now() - (8 * 60 * 60 * 1000), // 8 hours ago
                rank: 5
            }
        ];
        res.status(200).json({
            success: true,
            data: mockHolders,
        });
    }
    catch (error) {
        console.error('Error fetching token holders:', error);
        res.status(500).json({ error: 'Failed to fetch holders' });
    }
});
// Get token comments
router.get('/:tokenAddress/comments', async (req, res) => {
    try {
        const { tokenAddress } = req.params;
        // Mock comments data
        const mockComments = [
            {
                id: 'comment_1',
                author: '7xKXtg2CW3H6cGh5rJ8qHjYo5mW9L2Nk3QpR6FsX4uP8',
                content: 'Great project! The AI-generated assets are incredible. This token has real utility and strong community backing. 🚀',
                timestamp: Date.now() - (30 * 60 * 1000), // 30 minutes ago
                likes: 12,
                isLiked: false,
                replies: [
                    {
                        id: 'reply_1_1',
                        author: 'AnotherWalletAddress1234567890ABCDEF',
                        content: 'Totally agree! The bonding curve mechanism is brilliant.',
                        timestamp: Date.now() - (25 * 60 * 1000),
                        likes: 5,
                        isLiked: false
                    }
                ]
            },
            {
                id: 'comment_2',
                author: 'ThirdWalletAddress9876543210FEDCBA',
                content: 'Just bought more! The price action looks very promising. DeGenie platform is revolutionary for meme coins.',
                timestamp: Date.now() - (45 * 60 * 1000), // 45 minutes ago
                likes: 8,
                isLiked: true,
                replies: []
            },
            {
                id: 'comment_3',
                author: 'FourthWallet12345ABCDEF67890GHIJK',
                content: 'When moon? 🌙 But seriously, the fundamentals are solid here.',
                timestamp: Date.now() - (60 * 60 * 1000), // 1 hour ago
                likes: 3,
                isLiked: false,
                replies: [
                    {
                        id: 'reply_3_1',
                        author: '7xKXtg2CW3H6cGh5rJ8qHjYo5mW9L2Nk3QpR6FsX4uP8',
                        content: 'Soon! We are approaching graduation threshold.',
                        timestamp: Date.now() - (55 * 60 * 1000),
                        likes: 2,
                        isLiked: false
                    }
                ]
            }
        ];
        res.status(200).json({
            success: true,
            data: mockComments,
        });
    }
    catch (error) {
        console.error('Error fetching token comments:', error);
        res.status(500).json({ error: 'Failed to fetch comments' });
    }
});
// Get token chart data - DISABLED: Using real chart endpoint in complete-server.ts
// This mock endpoint was causing issues by intercepting real chart requests
/*
router.get('/:tokenAddress/chart', async (req: Request, res: Response) => {
  try {
    const { tokenAddress } = req.params;
    const { timeframe } = req.query;
    
    // Generate mock chart data based on timeframe
    const generateChartData = (timeframe: string) => {
      const now = Date.now();
      let points = 50;
      let interval = 60 * 1000; // 1 minute
      
      switch (timeframe) {
        case '1h':
          points = 60;
          interval = 60 * 1000; // 1 minute
          break;
        case '4h':
          points = 48;
          interval = 5 * 60 * 1000; // 5 minutes
          break;
        case '1d':
          points = 144;
          interval = 10 * 60 * 1000; // 10 minutes
          break;
        case '3d':
          points = 72;
          interval = 60 * 60 * 1000; // 1 hour
          break;
        case '1w':
          points = 168;
          interval = 60 * 60 * 1000; // 1 hour
          break;
        case 'all':
          points = 100;
          interval = 6 * 60 * 60 * 1000; // 6 hours
          break;
      }
      
      const data = [];
      let currentPrice = 0.000234;
      
      for (let i = 0; i < points; i++) {
        const timestamp = now - ((points - i) * interval);
        
        // Simulate price movement with some trend
        const change = (Math.random() - 0.45) * 0.05; // Slight upward bias
        currentPrice = Math.max(0.0000001, currentPrice * (1 + change));
        
        const volume = Math.random() * 30 + 5; // Random volume 5-35 SOL
        const marketCap = currentPrice * 1000000000; // Assuming 1B supply
        
        data.push({
          time: Math.floor(timestamp / 1000), // Convert to seconds for TradingView
          open: currentPrice * (1 - Math.random() * 0.01),
          high: currentPrice * (1 + Math.random() * 0.02),
          low: currentPrice * (1 - Math.random() * 0.02),
          close: currentPrice,
          value: currentPrice,
          volume,
          marketCap
        });
      }
      
      return data;
    };

    const chartData = generateChartData(timeframe as string || '1d');

    res.status(200).json({
      success: true,
      data: chartData,
    });
  } catch (error) {
    console.error('Error fetching chart data:', error);
    res.status(500).json({ error: 'Failed to fetch chart data' });
  }
});
*/
// Trading endpoints
// Calculate trade preview
router.post('/:tokenAddress/calculate-trade', async (req, res) => {
    try {
        const { tokenAddress } = req.params;
        const { amount, type, inputType, slippage } = req.body;
        const currentPrice = 0.000234; // Mock current price
        const platformFee = 0.01; // 1% platform fee
        let calculation;
        if (type === 'buy' && inputType === 'sol') {
            const grossTokens = amount / currentPrice;
            const fees = amount * platformFee;
            const netAmount = amount - fees;
            const expectedTokens = netAmount / currentPrice;
            const minReceived = expectedTokens * (1 - slippage / 100);
            calculation = {
                expectedTokens,
                priceImpact: Math.min(amount / 1000 * 2, 10), // Simple price impact calculation
                minReceived,
                fees
            };
        }
        else if (type === 'sell' && inputType === 'token') {
            const grossSol = amount * currentPrice;
            const fees = grossSol * platformFee;
            const expectedSol = grossSol - fees;
            const minReceived = expectedSol * (1 - slippage / 100);
            calculation = {
                expectedSol,
                priceImpact: Math.min(amount / 100000000 * 2, 10), // Simple price impact calculation
                minReceived,
                fees
            };
        }
        res.status(200).json({
            success: true,
            data: calculation,
        });
    }
    catch (error) {
        console.error('Error calculating trade:', error);
        res.status(500).json({ error: 'Failed to calculate trade' });
    }
});
// Execute trade
router.post('/:tokenAddress/trade', async (req, res) => {
    try {
        const { tokenAddress } = req.params;
        const { type, solAmount, tokenAmount, slippage, walletAddress } = req.body;
        // Mock trade execution
        const signature = 'sig_' + Math.random().toString(36).substring(7) + Math.random().toString(36).substring(7);
        // In real implementation:
        // 1. Validate wallet signature
        // 2. Execute bonding curve trade
        // 3. Update token balances
        // 4. Record transaction
        res.status(200).json({
            success: true,
            data: {
                signature,
                success: true,
                type,
                amount: solAmount || tokenAmount,
                timestamp: Date.now()
            },
        });
    }
    catch (error) {
        console.error('Error executing trade:', error);
        res.status(500).json({ error: 'Failed to execute trade' });
    }
});
// Wallet endpoints moved to separate wallet.routes.ts
// Watchlist endpoints
// Toggle watchlist
router.post('/:tokenAddress/watchlist', async (req, res) => {
    try {
        const { tokenAddress } = req.params;
        // Mock watchlist toggle
        res.status(200).json({
            success: true,
            data: { success: true, added: true },
        });
    }
    catch (error) {
        console.error('Error toggling watchlist:', error);
        res.status(500).json({ error: 'Failed to update watchlist' });
    }
});
router.delete('/:tokenAddress/watchlist', async (req, res) => {
    try {
        const { tokenAddress } = req.params;
        // Mock watchlist toggle
        res.status(200).json({
            success: true,
            data: { success: true, added: false },
        });
    }
    catch (error) {
        console.error('Error toggling watchlist:', error);
        res.status(500).json({ error: 'Failed to update watchlist' });
    }
});
// Comments endpoints
// Post comment
router.post('/:tokenAddress/comments', async (req, res) => {
    try {
        const { tokenAddress } = req.params;
        const { content, author, parentId } = req.body;
        // Mock comment creation
        const newComment = {
            id: 'comment_' + Date.now(),
            author,
            content,
            timestamp: Date.now(),
            likes: 0,
            isLiked: false,
            replies: []
        };
        res.status(200).json({
            success: true,
            data: newComment,
        });
    }
    catch (error) {
        console.error('Error posting comment:', error);
        res.status(500).json({ error: 'Failed to post comment' });
    }
});
// Like/Delete comment endpoints moved to separate comments.routes.ts
exports.default = router;
//# sourceMappingURL=token.routes.js.map