import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

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

    // Determine effective tier
    let effectiveTier = user.tier;
    if (user.subscription && 
        user.subscription.status === 'active' && 
        user.subscription.expiresAt > new Date()) {
      effectiveTier = user.subscription.tier;
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