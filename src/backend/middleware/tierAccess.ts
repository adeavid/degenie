import { Request, Response, NextFunction } from 'express';
import { UserTier } from '../types/ai';

const tierHierarchy: Record<UserTier, number> = {
  free: 0,
  starter: 1,
  viral: 2,
};

export function tierAccessMiddleware(allowedTiers: UserTier[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const userTier = (req.user?.tier || 'free') as UserTier;
    
    if (!allowedTiers.includes(userTier)) {
      const requiredTier = allowedTiers.sort(
        (a, b) => tierHierarchy[a] - tierHierarchy[b]
      )[0];
      
      res.status(403).json({
        error: 'Feature not available for your tier',
        currentTier: userTier,
        requiredTier,
        upgradeUrl: '/pricing',
        benefits: getTierBenefits(requiredTier),
      });
      return;
    }
    
    next();
  };
}

function getTierBenefits(tier: UserTier): string[] {
  const benefits: Record<UserTier, string[]> = {
    free: [
      '3 free tokens per month',
      'Basic AI generation',
      'Solana chain only',
    ],
    starter: [
      '10 tokens per month',
      'Pro AI models',
      'Multi-chain support',
      'Batch generation',
      'Analytics dashboard',
    ],
    viral: [
      'Unlimited tokens',
      'Premium AI models',
      'All chains supported',
      'Priority processing',
      'Advanced analytics',
      'API access',
      'Custom branding',
    ],
  };
  
  return benefits[tier] || [];
}