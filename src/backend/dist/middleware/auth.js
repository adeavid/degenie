"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
// Singleton pattern to prevent multiple DB connections during hot-reload
const globalForPrisma = globalThis;
const prisma = globalForPrisma.prisma ?? new client_1.PrismaClient();
if (!process.env['JWT_SECRET']) {
    throw new Error('JWT_SECRET env var must be set');
}
if (process.env['NODE_ENV'] !== 'production')
    globalForPrisma.prisma = prisma;
async function authMiddleware(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ error: 'No token provided' });
            return;
        }
        const token = authHeader.substring(7);
        const decoded = jsonwebtoken_1.default.verify(token, process.env['JWT_SECRET']);
        // Verify user exists and get current tier
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                walletAddress: true,
                tier: true,
                subscription: {
                    select: {
                        status: true,
                        tier: true,
                        expiresAt: true,
                    }
                }
            }
        });
        if (!user) {
            res.status(401).json({ error: 'User not found' });
            return;
        }
        // Determine effective tier with timezone-safe comparison
        let effectiveTier = user.tier;
        if (user.subscription &&
            user.subscription.status === 'active' &&
            user.subscription.expiresAt &&
            user.subscription.expiresAt.getTime() > Date.now()) {
            effectiveTier = user.subscription.tier;
        }
        req.user = {
            id: user.id,
            walletAddress: user.walletAddress,
            tier: effectiveTier,
        };
        next();
    }
    catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
}
//# sourceMappingURL=auth.js.map