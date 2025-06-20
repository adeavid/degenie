import { Request, Response } from 'express';
import { AssetGenerationService } from '../services/ai/AssetGenerationService';
import { CreditService } from '../services/CreditService';
import { validateGenerationRequest } from '../validators/aiValidators';
import { getUserTier } from '../utils/userUtils';
import { AssetType, GenerationRequest } from '../types/ai';

export class AIGenerationController {
  private assetService: AssetGenerationService;
  private creditService: CreditService;

  constructor() {
    this.assetService = new AssetGenerationService();
    this.creditService = new CreditService();
  }

  async generateAsset(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      // Validate request
      const validation = validateGenerationRequest(req.body);
      if (!validation.valid) {
        res.status(400).json({ error: validation.error });
        return;
      }

      const { prompt, assetType, tokenSymbol } = req.body as GenerationRequest;

      // Get user tier
      const userTier = await getUserTier(userId);

      // Check credits before generation
      const creditBalance = await this.creditService.getBalance(userId);
      const requiredCredits = this.getRequiredCredits(assetType, userTier);

      if (creditBalance < requiredCredits) {
        res.status(402).json({ 
          error: 'Insufficient credits',
          required: requiredCredits,
          balance: creditBalance,
          purchaseUrl: process.env['CREDITS_PURCHASE_URL'] || '/credits/purchase'
        });
        return;
      }

      // Generate asset
      const startTime = Date.now();
      const result = await this.assetService.generateAsset(
        userId,
        prompt,
        assetType as AssetType,
        userTier,
        tokenSymbol
      );

      const processingTime = Date.now() - startTime;

      res.status(200).json({
        success: true,
        data: {
          id: result.id,
          url: result.url,
          ipfsHash: result.ipfsHash,
          metadata: result.metadata,
          processingTime,
          creditsRemaining: creditBalance - requiredCredits,
        }
      });
    } catch (error: any) {
      console.error('Asset generation error:', error);
      
      if (error.message === 'Rate limit exceeded') {
        res.status(429).json({ error: error.message });
      } else {
        res.status(500).json({ 
          error: 'Failed to generate asset',
          message: process.env['NODE_ENV'] === 'development' ? error.message : undefined
        });
      }
    }
  }

  async batchGenerate(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const userTier = await getUserTier(userId);
      
      // Only starter and viral tiers can batch generate
      if (userTier === 'free') {
        res.status(403).json({ 
          error: 'Batch generation is not available for free tier',
          upgradeUrl: '/pricing'
        });
        return;
      }

      const { requests } = req.body;
      if (!Array.isArray(requests) || requests.length === 0) {
        res.status(400).json({ error: 'Invalid batch request' });
        return;
      }

      const maxBatch = userTier === 'viral' ? 10 : 5;
      if (requests.length > maxBatch) {
        res.status(400).json({ 
          error: `Maximum batch size is ${maxBatch} for ${userTier} tier` 
        });
        return;
      }

      // Calculate total credits needed
      let totalCredits = 0;
      for (const request of requests) {
        totalCredits += this.getRequiredCredits(request.assetType, userTier);
      }

      const creditBalance = await this.creditService.getBalance(userId);
      if (creditBalance < totalCredits) {
        res.status(402).json({ 
          error: 'Insufficient credits for batch',
          required: totalCredits,
          balance: creditBalance
        });
        return;
      }

      // Process batch
      const results = [];
      for (const request of requests) {
        try {
          const result = await this.assetService.generateAsset(
            userId,
            request.prompt,
            request.assetType,
            userTier,
            request.tokenSymbol
          );
          results.push({ success: true, data: result });
        } catch (error: any) {
          results.push({ success: false, error: error.message });
        }
      }

      res.status(200).json({
        success: true,
        batchId: `batch_${Date.now()}`,
        results,
        creditsUsed: totalCredits,
        creditsRemaining: await this.creditService.getBalance(userId),
      });
    } catch (error: any) {
      console.error('Batch generation error:', error);
      res.status(500).json({ error: 'Batch generation failed' });
    }
  }

  async getGenerationHistory(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const limit = Math.min(parseInt(req.query['limit'] as string) || 10, 50);
      const history = await this.assetService.getGenerationHistory(userId, limit);

      res.status(200).json({
        success: true,
        data: history,
        count: history.length,
      });
    } catch (error) {
      console.error('History fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch history' });
    }
  }

  async getCreditBalance(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const balance = await this.creditService.getBalance(userId);
      const transactions = await this.creditService.getTransactionHistory(userId, 10);
      const costs = this.creditService.getCreditCosts();
      const earningRules = this.creditService.getEarningRules();

      res.status(200).json({
        success: true,
        data: {
          balance,
          recentTransactions: transactions,
          costs,
          earningOpportunities: earningRules,
        }
      });
    } catch (error) {
      console.error('Credit balance error:', error);
      res.status(500).json({ error: 'Failed to fetch credit balance' });
    }
  }

  async earnCredits(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { action, metadata } = req.body;
      const validActions = [
        'dailyLogin',
        'shareOnTwitter',
        'referralSignup',
        'communityEngagement'
      ];

      if (!validActions.includes(action)) {
        res.status(400).json({ error: 'Invalid earning action' });
        return;
      }

      const earned = await this.creditService.earnCredits(userId, action, metadata);
      
      if (earned === 0) {
        const ONE_DAY_MS = 24 * 60 * 60 * 1000;
        res.status(429).json({ 
          error: 'Daily limit reached for this action',
          nextAvailable: new Date(Date.now() + ONE_DAY_MS).toISOString()
        });
        return;
      }

      const newBalance = await this.creditService.getBalance(userId);

      res.status(200).json({
        success: true,
        data: {
          earned,
          newBalance,
          action,
        }
      });
    } catch (error) {
      console.error('Earn credits error:', error);
      res.status(500).json({ error: 'Failed to process earning' });
    }
  }

  private getRequiredCredits(assetType: string, tier: string): number {
    const costs = this.creditService.getCreditCosts();
    const costMap: Record<string, number> = {
      'logo:free': costs.basicLogo,
      'logo:starter': costs.proLogo,
      'logo:viral': costs.premiumLogo,
      'meme:free': costs.memeGeneration,
      'meme:starter': costs.memeGeneration,
      'meme:viral': costs.memeGeneration,
      'gif:free': costs.gifCreation,
      'gif:starter': costs.gifCreation,
      'gif:viral': costs.gifCreation,
    };

    return costMap[`${assetType}:${tier}`] || 1;
  }
}