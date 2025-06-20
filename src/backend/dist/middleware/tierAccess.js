"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tierAccessMiddleware = tierAccessMiddleware;
const tierHierarchy = {
    free: 0,
    starter: 1,
    viral: 2,
};
function tierAccessMiddleware(allowedTiers) {
    const requiredTier = allowedTiers.sort((a, b) => tierHierarchy[a] - tierHierarchy[b])[0];
    return (req, res, next) => {
        const userTier = (req.user?.tier || 'free');
        if (!allowedTiers.includes(userTier)) {
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
function getTierBenefits(tier) {
    const benefits = {
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
//# sourceMappingURL=tierAccess.js.map