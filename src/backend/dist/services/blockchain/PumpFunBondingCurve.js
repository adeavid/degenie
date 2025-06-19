"use strict";
/**
 * Pump.fun Bonding Curve Implementation
 * Based on the exact formula: y = 1073000191 - 32190005730/(30+x)
 * where x is SOL in, y is tokens out
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PumpFunBondingCurve = void 0;
class PumpFunBondingCurve {
    // Constants from pump.fun
    static TOTAL_SUPPLY = 1_000_000_000; // 1 billion tokens
    static INITIAL_SUPPLY = 800_000_000; // 800M tokens in bonding curve
    static GRADUATION_THRESHOLD = 85; // 85 SOL to graduate
    static INITIAL_MARKET_CAP = 4000; // $4000 initial market cap
    static LAMPORTS_PER_SOL = 1_000_000_000;
    static TOKEN_DECIMALS = 6;
    static TOKENS_PER_UNIT = 1_000_000; // 10^6 for 6 decimals
    // Bonding curve constants
    static A = 1073000191;
    static B = 32190005730;
    static C = 30;
    /**
     * Calculate tokens received for SOL amount using pump.fun formula
     * y = 1073000191 - 32190005730/(30+x)
     */
    static calculateTokensOut(solIn, currentSolRaised) {
        // Calculate tokens at current point
        const tokensAtStart = this.A - this.B / (this.C + currentSolRaised);
        // Calculate tokens at new point
        const tokensAtEnd = this.A - this.B / (this.C + currentSolRaised + solIn);
        // Tokens received is the difference
        const tokensOut = tokensAtEnd - tokensAtStart;
        return Math.max(0, tokensOut);
    }
    /**
     * Calculate SOL required to buy specific amount of tokens
     */
    static calculateSolIn(tokensOut, currentSolRaised) {
        // Current tokens sold
        const currentTokensSold = this.A - this.B / (this.C + currentSolRaised);
        // Target tokens sold
        const targetTokensSold = currentTokensSold + tokensOut;
        // Solve for x: targetTokensSold = A - B/(C+currentSolRaised+x)
        // B/(C+currentSolRaised+x) = A - targetTokensSold
        // C+currentSolRaised+x = B/(A - targetTokensSold)
        // x = B/(A - targetTokensSold) - C - currentSolRaised
        const solRequired = this.B / (this.A - targetTokensSold) - this.C - currentSolRaised;
        return Math.max(0, solRequired);
    }
    /**
     * Calculate current token price based on SOL raised
     */
    static getCurrentPrice(currentSolRaised) {
        // Price is the derivative of the bonding curve
        // dy/dx = B/(C+x)^2
        const denominator = Math.pow(this.C + currentSolRaised, 2);
        const priceInTokensPerSol = this.B / denominator;
        // Convert to SOL per token
        return 1 / priceInTokensPerSol;
    }
    /**
     * Calculate market cap based on SOL raised
     */
    static getMarketCap(currentSolRaised, solPrice = 180) {
        const pricePerToken = this.getCurrentPrice(currentSolRaised);
        const marketCapInSol = pricePerToken * this.TOTAL_SUPPLY;
        return marketCapInSol * solPrice;
    }
    /**
     * Calculate graduation progress (0-100%)
     */
    static getGraduationProgress(currentSolRaised) {
        return Math.min(100, (currentSolRaised / this.GRADUATION_THRESHOLD) * 100);
    }
    /**
     * Calculate price impact of a trade
     */
    static calculatePriceImpact(solIn, currentSolRaised) {
        const currentPrice = this.getCurrentPrice(currentSolRaised);
        const newPrice = this.getCurrentPrice(currentSolRaised + solIn);
        const impact = ((newPrice - currentPrice) / currentPrice) * 100;
        return impact;
    }
    /**
     * Get initial token price (at 0 SOL raised)
     */
    static getInitialPrice() {
        return this.getCurrentPrice(0);
    }
    /**
     * Calculate SOL amount received for selling tokens
     * This is the inverse of the buy function
     */
    static calculateSolOut(tokensIn, currentSolRaised) {
        // Current tokens sold
        const currentTokensSold = this.A - this.B / (this.C + currentSolRaised);
        // New tokens sold after selling (less tokens in circulation)
        const newTokensSold = currentTokensSold - tokensIn;
        // Calculate new SOL raised level
        // newTokensSold = A - B/(C + newSolRaised)
        // B/(C + newSolRaised) = A - newTokensSold
        // C + newSolRaised = B/(A - newTokensSold)
        // newSolRaised = B/(A - newTokensSold) - C
        const newSolRaised = this.B / (this.A - newTokensSold) - this.C;
        // SOL to return is the difference
        const solOut = currentSolRaised - newSolRaised;
        return Math.max(0, solOut);
    }
    /**
     * Validate if trade is within acceptable bounds
     */
    static validateTrade(amount, type, currentSolRaised) {
        if (amount <= 0) {
            return { valid: false, reason: 'Amount must be positive' };
        }
        if (type === 'buy') {
            // Check if trade would exceed graduation threshold
            if (currentSolRaised + amount > this.GRADUATION_THRESHOLD) {
                return { valid: false, reason: 'Trade would exceed graduation threshold' };
            }
            // Check price impact
            const impact = this.calculatePriceImpact(amount, currentSolRaised);
            if (impact > 50) {
                return { valid: false, reason: 'Price impact too high (>50%)' };
            }
        }
        else {
            // For sells, ensure we don't go below 0
            const solOut = this.calculateSolOut(amount, currentSolRaised);
            if (solOut > currentSolRaised) {
                return { valid: false, reason: 'Insufficient liquidity' };
            }
        }
        return { valid: true };
    }
}
exports.PumpFunBondingCurve = PumpFunBondingCurve;
//# sourceMappingURL=PumpFunBondingCurve.js.map