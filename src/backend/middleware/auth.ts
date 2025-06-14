import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

// Type for JWT payload
interface JWTPayload {
  userId: string;
  iat?: number;
  exp?: number;
}

// Valid tier types
type UserTier = 'free' | 'starter' | 'viral';

// Singleton pattern to prevent multiple DB connections during hot-reload
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env['NODE_ENV'] !== 'production') globalForPrisma.prisma = prisma;

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        walletAddress: string;
        tier: string;
      };
    }
  }
}

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env['JWT_SECRET']!) as JWTPayload;

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
    let effectiveTier: UserTier = user.tier as UserTier;
    if (user.subscription && 
        user.subscription.status === 'active' && 
        user.subscription.expiresAt && 
        user.subscription.expiresAt.getTime() > Date.now()) {
      effectiveTier = user.subscription.tier as UserTier;
    }

    req.user = {
      id: user.id,
      walletAddress: user.walletAddress,
      tier: effectiveTier,
    };

    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
}