"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const AIGenerationController_1 = require("../controllers/AIGenerationController");
const auth_1 = require("../middleware/auth");
const rateLimit_1 = require("../middleware/rateLimit");
const tierAccess_1 = require("../middleware/tierAccess");
const router = (0, express_1.Router)();
const aiController = new AIGenerationController_1.AIGenerationController();
// All AI routes require authentication
router.use(auth_1.authMiddleware);
// Generate single asset
router.post('/generate', (0, rateLimit_1.rateLimitMiddleware)('ai_generation'), aiController.generateAsset.bind(aiController));
// Batch generation (starter and viral tiers only)
router.post('/generate/batch', (0, tierAccess_1.tierAccessMiddleware)(['starter', 'viral']), (0, rateLimit_1.rateLimitMiddleware)('ai_batch_generation'), aiController.batchGenerate.bind(aiController));
// Get generation history
router.get('/history', aiController.getGenerationHistory.bind(aiController));
// Credit management
router.get('/credits/balance', aiController.getCreditBalance.bind(aiController));
router.post('/credits/earn', (0, rateLimit_1.rateLimitMiddleware)('credit_earning'), aiController.earnCredits.bind(aiController));
// Webhook endpoints for automated credit earning
router.post('/webhooks/twitter-share/:userId', async (req, res) => {
    // Verify Twitter webhook signature
    // Award credits for sharing
    const { userId } = req.params;
    console.log(`Twitter share webhook for user: ${userId}`);
    res.status(200).json({ received: true });
});
router.post('/webhooks/token-milestone/:tokenAddress', async (req, res) => {
    // Verify blockchain data
    // Award credits to creator for reaching milestones
    const { tokenAddress } = req.params;
    console.log(`Token milestone webhook for token: ${tokenAddress}`);
    res.status(200).json({ received: true });
});
exports.default = router;
//# sourceMappingURL=ai.routes.js.map