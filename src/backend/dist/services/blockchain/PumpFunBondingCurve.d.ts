/**
 * Pump.fun Bonding Curve Implementation
 * Based on the exact formula: y = 1073000191 - 32190005730/(30+x)
 * where x is SOL in, y is tokens out
 */
export declare class PumpFunBondingCurve {
    static readonly TOTAL_SUPPLY = 1000000000;
    static readonly INITIAL_SUPPLY = 800000000;
    static readonly GRADUATION_THRESHOLD = 85;
    static readonly INITIAL_MARKET_CAP = 4000;
    static readonly LAMPORTS_PER_SOL = 1000000000;
    static readonly TOKEN_DECIMALS = 6;
    static readonly TOKENS_PER_UNIT = 1000000;
    static readonly A = 1073000191;
    static readonly B = 32190005730;
    static readonly C = 30;
    /**
     * Calculate tokens received for SOL amount using pump.fun formula
     * y = 1073000191 - 32190005730/(30+x)
     */
    static calculateTokensOut(solIn: number, currentSolRaised: number): number;
    /**
     * Calculate SOL required to buy specific amount of tokens
     */
    static calculateSolIn(tokensOut: number, currentSolRaised: number): number;
    /**
     * Calculate current token price based on SOL raised
     */
    static getCurrentPrice(currentSolRaised: number): number;
    /**
     * Calculate market cap based on SOL raised
     */
    static getMarketCap(currentSolRaised: number, solPrice?: number): number;
    /**
     * Calculate graduation progress (0-100%)
     */
    static getGraduationProgress(currentSolRaised: number): number;
    /**
     * Calculate price impact of a trade
     */
    static calculatePriceImpact(solIn: number, currentSolRaised: number): number;
    /**
     * Get initial token price (at 0 SOL raised)
     */
    static getInitialPrice(): number;
    /**
     * Calculate SOL amount received for selling tokens
     * This is the inverse of the buy function
     */
    static calculateSolOut(tokensIn: number, currentSolRaised: number): number;
    /**
     * Validate if trade is within acceptable bounds
     */
    static validateTrade(amount: number, type: 'buy' | 'sell', currentSolRaised: number): {
        valid: boolean;
        reason?: string;
    };
}
//# sourceMappingURL=PumpFunBondingCurve.d.ts.map