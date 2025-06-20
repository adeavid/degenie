"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const zod_1 = require("zod");
const prisma_1 = require("../lib/prisma");
const router = (0, express_1.Router)();
// Validation schemas
const walletLoginSchema = zod_1.z.object({
    walletAddress: zod_1.z.string().min(32), // Accept both Ethereum (42 chars) and Solana (32-44 chars)
    signature: zod_1.z.string().optional(), // For future signature verification
    referralCode: zod_1.z.string().optional(),
});
const emailLoginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8),
});
const registerSchema = zod_1.z.object({
    walletAddress: zod_1.z.string().min(32), // Accept both Ethereum and Solana addresses
    email: zod_1.z.string().email().optional(),
    username: zod_1.z.string().min(3).max(30).optional(),
    referralCode: zod_1.z.string().optional(),
});
// Generate JWT token
function generateToken(userId) {
    return jsonwebtoken_1.default.sign({ userId }, process.env['JWT_SECRET'], { expiresIn: '30d' });
}
// Wallet-based login/register (most common for Web3)
router.post('/wallet', async (req, res) => {
    try {
        const { walletAddress, referralCode } = walletLoginSchema.parse(req.body);
        // Find or create user
        let user = await prisma_1.prisma.user.findUnique({
            where: { walletAddress },
        });
        if (!user) {
            // Create new user
            const userData = {
                walletAddress,
                tier: 'free',
                credits: 3.0, // Starting credits
            };
            // Handle referral
            if (referralCode) {
                const referrer = await prisma_1.prisma.user.findUnique({
                    where: { referralCode },
                });
                if (referrer) {
                    userData.referredBy = referrer.id;
                    // Award referral credits atomically
                    await prisma_1.prisma.$transaction([
                        prisma_1.prisma.creditTransaction.create({
                            data: {
                                userId: referrer.id,
                                amount: 1.0,
                                type: 'earn',
                                reason: 'referral_signup',
                                balanceBefore: referrer.credits,
                                balanceAfter: referrer.credits + 1.0,
                            },
                        }),
                        prisma_1.prisma.user.update({
                            where: { id: referrer.id },
                            data: { credits: { increment: 1.0 } },
                        }),
                    ]);
                }
            }
            user = await prisma_1.prisma.user.create({
                data: userData,
            });
            // Award welcome bonus
            await prisma_1.prisma.creditTransaction.create({
                data: {
                    userId: user.id,
                    amount: 3.0,
                    type: 'earn',
                    reason: 'welcome_bonus',
                    balanceBefore: 0,
                    balanceAfter: 3.0,
                },
            });
        }
        // Update last login
        await prisma_1.prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
        });
        const token = generateToken(user.id);
        res.json({
            token,
            user: {
                id: user.id,
                walletAddress: user.walletAddress,
                email: user.email,
                username: user.username,
                credits: user.credits,
                tier: user.tier,
                referralCode: user.referralCode,
            },
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({ error: 'Invalid input', details: error.errors });
            return;
        }
        console.error('Wallet auth error:', error);
        res.status(500).json({ error: 'Authentication failed' });
    }
});
// Register with additional details
router.post('/register', async (req, res) => {
    try {
        const { walletAddress, email, username, referralCode } = registerSchema.parse(req.body);
        // Check if wallet already exists
        const existingUser = await prisma_1.prisma.user.findUnique({
            where: { walletAddress },
        });
        if (existingUser) {
            res.status(400).json({ error: 'Wallet already registered' });
            return;
        }
        // Check unique constraints
        if (email) {
            const emailExists = await prisma_1.prisma.user.findUnique({
                where: { email },
            });
            if (emailExists) {
                res.status(400).json({ error: 'Email already in use' });
                return;
            }
        }
        if (username) {
            const usernameExists = await prisma_1.prisma.user.findUnique({
                where: { username },
            });
            if (usernameExists) {
                res.status(400).json({ error: 'Username already taken' });
                return;
            }
        }
        const userData = {
            walletAddress,
            email,
            username,
            tier: 'free',
            credits: 3.0,
        };
        // Handle referral
        if (referralCode) {
            const referrer = await prisma_1.prisma.user.findUnique({
                where: { referralCode },
            });
            if (referrer) {
                userData.referredBy = referrer.id;
                // Award referral credits atomically
                await prisma_1.prisma.$transaction([
                    prisma_1.prisma.creditTransaction.create({
                        data: {
                            userId: referrer.id,
                            amount: 1.0,
                            type: 'earn',
                            reason: 'referral_signup',
                            balanceBefore: referrer.credits,
                            balanceAfter: referrer.credits + 1.0,
                        },
                    }),
                    prisma_1.prisma.user.update({
                        where: { id: referrer.id },
                        data: { credits: { increment: 1.0 } },
                    }),
                ]);
            }
        }
        const user = await prisma_1.prisma.user.create({
            data: userData,
        });
        // Award welcome bonus
        await prisma_1.prisma.creditTransaction.create({
            data: {
                userId: user.id,
                amount: 3.0,
                type: 'earn',
                reason: 'welcome_bonus',
                balanceBefore: 0,
                balanceAfter: 3.0,
            },
        });
        const token = generateToken(user.id);
        res.status(201).json({
            token,
            user: {
                id: user.id,
                walletAddress: user.walletAddress,
                email: user.email,
                username: user.username,
                credits: user.credits,
                tier: user.tier,
                referralCode: user.referralCode,
            },
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({ error: 'Invalid input', details: error.errors });
            return;
        }
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});
// Get current user info (requires auth)
router.get('/me', async (req, res) => {
    // This would be used with authMiddleware
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'No token provided' });
        return;
    }
    try {
        const token = authHeader.substring(7);
        const decoded = jsonwebtoken_1.default.verify(token, process.env['JWT_SECRET']);
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                walletAddress: true,
                email: true,
                username: true,
                credits: true,
                tier: true,
                referralCode: true,
                createdAt: true,
                subscription: {
                    select: {
                        tier: true,
                        status: true,
                        expiresAt: true,
                    },
                },
                _count: {
                    select: {
                        tokens: true,
                        generations: true,
                        referrals: true,
                    },
                },
            },
        });
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        res.json({
            user: {
                ...user,
                stats: {
                    tokensCreated: user._count.tokens,
                    generationsCount: user._count.generations,
                    referralsCount: user._count.referrals,
                },
            },
        });
    }
    catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
});
// Refresh token endpoint
router.post('/refresh', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'No token provided' });
        return;
    }
    try {
        const oldToken = authHeader.substring(7);
        const decoded = jsonwebtoken_1.default.verify(oldToken, process.env['JWT_SECRET'], {
            ignoreExpiration: true,
        });
        // Check if token is not too old (within 7 days of expiry)
        if (decoded.exp && decoded.exp * 1000 < Date.now() - 7 * 24 * 60 * 60 * 1000) {
            res.status(401).json({ error: 'Token too old for refresh' });
            return;
        }
        // Verify user still exists
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: decoded.userId },
        });
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        const newToken = generateToken(user.id);
        res.json({ token: newToken });
    }
    catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
});
exports.default = router;
//# sourceMappingURL=auth.routes.js.map