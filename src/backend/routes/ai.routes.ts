import { Router } from 'express';
import { AIGenerationController } from '../controllers/AIGenerationController';
import { authMiddleware } from '../middleware/auth';
import { rateLimitMiddleware } from '../middleware/rateLimit';
import { tierAccessMiddleware } from '../middleware/tierAccess';

const router = Router();
const aiController = new AIGenerationController();

// All AI routes require authentication
router.use(authMiddleware);

// Generate single asset
router.post(
  '/generate',
  rateLimitMiddleware('ai_generation'),
  aiController.generateAsset.bind(aiController)
);

// Batch generation (starter and viral tiers only)
router.post(
  '/generate/batch',
  tierAccessMiddleware(['starter', 'viral']),
  rateLimitMiddleware('ai_batch_generation'),
  aiController.batchGenerate.bind(aiController)
);

// Get generation history
router.get(
  '/history',
  aiController.getGenerationHistory.bind(aiController)
);

// Credit management
router.get(
  '/credits/balance',
  aiController.getCreditBalance.bind(aiController)
);

router.post(
  '/credits/earn',
  rateLimitMiddleware('credit_earning'),
  aiController.earnCredits.bind(aiController)
);

// Webhook endpoints for automated credit earning
router.post(
  '/webhooks/twitter-share/:userId',
  async (req, res) => {
    // Verify Twitter webhook signature
    // Award credits for sharing
    const { userId } = req.params;
    console.log(`Twitter share webhook for user: ${userId}`);
    res.status(200).json({ received: true });
  }
);

router.post(
  '/webhooks/token-milestone/:tokenAddress',
  async (req, res) => {
    // Verify blockchain data
    // Award credits to creator for reaching milestones
    const { tokenAddress } = req.params;
    console.log(`Token milestone webhook for token: ${tokenAddress}`);
    res.status(200).json({ received: true });
  }
);

export default router;