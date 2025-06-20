import { PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
export interface BondingCurveState {
    mint: PublicKey;
    currentPrice: BN;
    totalSupply: BN;
    maxSupply: BN;
    treasuryBalance: BN;
    totalVolume: BN;
    isGraduated: boolean;
    creatorFeePercentage: number;
    platformFeePercentage: number;
    transactionFeePercentage: number;
    bondingCurveProgress: number;
}
export interface TradePreview {
    inputAmount: number;
    outputAmount: number;
    pricePerToken: number;
    priceImpact: number;
    platformFee: number;
    creatorFee: number;
    totalFee: number;
    minimumReceived: number;
    maximumCost?: number;
}
export interface TradeResult {
    signature: string;
    inputAmount: number;
    outputAmount: number;
    pricePerToken: number;
    fees: {
        platform: number;
        creator: number;
        total: number;
    };
    newPrice: number;
    newSupply: number;
    graduationProgress: number;
}
export declare class BondingCurveService {
    private connection;
    private program;
    private serverWallet;
    constructor();
    /**
     * Get the bonding curve PDA for a token
     */
    private getBondingCurvePDA;
    /**
     * Get the treasury PDA for a token
     */
    private getTreasuryPDA;
    private bondingCurveStates;
    /**
     * Initialize bonding curve state for a new token
     */
    initializeBondingCurve(tokenAddress: string): BondingCurveState;
    /**
     * Fetch bonding curve state from blockchain
     */
    getBondingCurveState(tokenAddress: string): Promise<BondingCurveState | null>;
    /**
     * Calculate tokens received for SOL amount (buy)
     * Uses exponential bonding curve: price = initialPrice * (1 + k)^supply
     */
    calculateBuyAmount(solAmount: number, currentPrice: number, priceIncrement: number, currentSupply: number): TradePreview;
    /**
     * Calculate SOL received for token amount (sell)
     * Uses exponential bonding curve for accurate pricing
     */
    calculateSellAmount(tokenAmount: number, currentPrice: number, priceIncrement: number, currentSupply: number): TradePreview;
    /**
     * Execute buy transaction
     */
    executeBuy(tokenAddress: string, buyerWallet: string, solAmount: number, minTokensOut: number): Promise<TradeResult>;
    /**
     * Execute sell transaction
     */
    executeSell(tokenAddress: string, sellerWallet: string, tokenAmount: number, minSolOut: number): Promise<TradeResult>;
    /**
     * Get real-time token metrics
     */
    getTokenMetrics(tokenAddress: string): Promise<{
        currentPrice: number;
        marketCap: number;
        totalSupply: number;
        maxSupply: number;
        volume24h: number;
        liquiditySOL: number;
        bondingCurveProgress: number;
        isGraduated: boolean;
        priceChange24h: number;
        holders: number;
    } | null>;
}
export declare const bondingCurveService: BondingCurveService;
//# sourceMappingURL=BondingCurveService.d.ts.map