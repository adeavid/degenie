/**
 * AMM Price Calculator for DeGenie
 * Implements Uniswap V2 style AMM with custom bonding curve integration
 * 
 * This service handles:
 * - Price calculations for buy/sell trades
 * - Slippage and price impact calculations
 * - Fee distribution (0.5% creator, 0.5% platform)
 * - Integration with existing bonding curve logic
 */

import { UniswapV2AMM, AMMPool, TradeResult } from '../amm/UniswapV2AMM';

export interface TokenMetrics {
  tokenAddress: string;
  currentPrice: number;
  marketCap: number;
  liquidity: number;
  volume24h: number;
  priceChange24h: number;
  holders: number;
  totalSupply: number;
  circulatingSupply: number;
  bondingCurveProgress: number;
  isGraduated: boolean;
}

export interface DetailedTradePreview {
  // Input/Output
  inputAmount: number;
  outputAmount: number;
  outputAmountAfterFees: number;
  
  // Pricing
  currentPrice: number;
  executionPrice: number;
  pricePerTokenAfterTrade: number;
  
  // Impact & Slippage
  priceImpact: number;
  estimatedSlippage: number;
  minimumReceived: number;
  maximumSold?: number;
  
  // Fees breakdown
  fees: {
    total: number;
    totalPercentage: number;
    creator: number;
    creatorPercentage: number;
    platform: number;
    platformPercentage: number;
  };
  
  // Pool state after trade
  poolAfterTrade: {
    tokenReserve: number;
    solReserve: number;
    k: number;
    price: number;
  };
  
  // Additional info
  route: string; // e.g., "SOL → TOKEN" or "TOKEN → SOL"
  warnings: string[];
}

export class AMMPriceCalculator {
  // Fee configuration
  private static readonly TOTAL_FEE_BPS = 100;     // 100 basis points = 1%
  private static readonly CREATOR_FEE_BPS = 50;    // 50 basis points = 0.5%
  private static readonly PLATFORM_FEE_BPS = 50;   // 50 basis points = 0.5%
  
  // Slippage configuration
  private static readonly DEFAULT_SLIPPAGE_BPS = 100;  // 1% default slippage
  private static readonly MAX_SLIPPAGE_BPS = 500;      // 5% max slippage
  
  // Price impact thresholds
  private static readonly LOW_IMPACT_THRESHOLD = 1;    // 1%
  private static readonly MEDIUM_IMPACT_THRESHOLD = 3; // 3%
  private static readonly HIGH_IMPACT_THRESHOLD = 5;   // 5%

  /**
   * Convert basis points to decimal
   */
  private static bpsToDecimal(bps: number): number {
    return bps / 10000;
  }

  /**
   * Get current pool state from token metrics
   */
  static getPoolState(metrics: TokenMetrics): AMMPool {
    // Calculate reserves based on current state
    // For bonding curve tokens, liquidity = SOL raised
    const solReserve = metrics.liquidity;
    const tokenReserve = metrics.circulatingSupply;
    
    return {
      tokenReserve,
      solReserve,
      k: tokenReserve * solReserve,
      totalSupply: metrics.totalSupply,
      creatorAddress: '' // Would be fetched from token data
    };
  }

  /**
   * Calculate detailed buy preview (SOL → Token)
   */
  static calculateBuyPreview(
    metrics: TokenMetrics,
    solAmount: number,
    slippageBps: number = this.DEFAULT_SLIPPAGE_BPS
  ): DetailedTradePreview {
    const pool = this.getPoolState(metrics);
    const slippagePercent = this.bpsToDecimal(slippageBps);
    
    try {
      // Execute simulated trade
      const tradeResult = UniswapV2AMM.executeBuyTrade(pool, solAmount, slippagePercent);
      
      // Calculate minimum tokens based on slippage
      const minimumReceived = tradeResult.amountOut * (1 - slippagePercent);
      
      // Prepare warnings
      const warnings: string[] = [];
      
      if (tradeResult.priceImpact > this.HIGH_IMPACT_THRESHOLD) {
        warnings.push(`High price impact: ${tradeResult.priceImpact.toFixed(2)}%`);
      } else if (tradeResult.priceImpact > this.MEDIUM_IMPACT_THRESHOLD) {
        warnings.push(`Medium price impact: ${tradeResult.priceImpact.toFixed(2)}%`);
      }
      
      if (tradeResult.slippage > slippagePercent * 0.8) {
        warnings.push('Slippage approaching maximum tolerance');
      }
      
      // Check if trade would move price significantly
      const priceIncreasePercent = ((tradeResult.pricePerToken - metrics.currentPrice) / metrics.currentPrice) * 100;
      if (priceIncreasePercent > 10) {
        warnings.push(`Price will increase by ${priceIncreasePercent.toFixed(1)}%`);
      }
      
      return {
        // Input/Output
        inputAmount: solAmount,
        outputAmount: tradeResult.amountOut,
        outputAmountAfterFees: tradeResult.amountOutAfterFees,
        
        // Pricing
        currentPrice: metrics.currentPrice,
        executionPrice: solAmount / tradeResult.amountOut,
        pricePerTokenAfterTrade: tradeResult.pricePerToken,
        
        // Impact & Slippage
        priceImpact: tradeResult.priceImpact,
        estimatedSlippage: tradeResult.slippage,
        minimumReceived,
        
        // Fees breakdown
        fees: {
          total: tradeResult.fees.total,
          totalPercentage: this.TOTAL_FEE_BPS / 100,
          creator: tradeResult.fees.creator,
          creatorPercentage: this.CREATOR_FEE_BPS / 100,
          platform: tradeResult.fees.platform,
          platformPercentage: this.PLATFORM_FEE_BPS / 100
        },
        
        // Pool state after trade
        poolAfterTrade: {
          tokenReserve: tradeResult.newReserves.tokenReserve,
          solReserve: tradeResult.newReserves.solReserve,
          k: tradeResult.newReserves.tokenReserve * tradeResult.newReserves.solReserve,
          price: tradeResult.pricePerToken
        },
        
        // Additional info
        route: 'SOL → ' + metrics.tokenAddress.slice(0, 4) + '...',
        warnings
      };
    } catch (error: any) {
      throw new Error(`Trade preview failed: ${error.message}`);
    }
  }

  /**
   * Calculate detailed sell preview (Token → SOL)
   */
  static calculateSellPreview(
    metrics: TokenMetrics,
    tokenAmount: number,
    slippageBps: number = this.DEFAULT_SLIPPAGE_BPS
  ): DetailedTradePreview {
    const pool = this.getPoolState(metrics);
    const slippagePercent = this.bpsToDecimal(slippageBps);
    
    try {
      // Execute simulated trade
      const tradeResult = UniswapV2AMM.executeSellTrade(pool, tokenAmount, slippagePercent);
      
      // Calculate minimum SOL based on slippage
      const minimumReceived = tradeResult.amountOutAfterFees * (1 - slippagePercent);
      
      // Prepare warnings
      const warnings: string[] = [];
      
      if (tradeResult.priceImpact > this.HIGH_IMPACT_THRESHOLD) {
        warnings.push(`High price impact: ${tradeResult.priceImpact.toFixed(2)}%`);
      } else if (tradeResult.priceImpact > this.MEDIUM_IMPACT_THRESHOLD) {
        warnings.push(`Medium price impact: ${tradeResult.priceImpact.toFixed(2)}%`);
      }
      
      if (tradeResult.slippage > slippagePercent * 0.8) {
        warnings.push('Slippage approaching maximum tolerance');
      }
      
      // Check if trade would crash price
      const priceDecreasePercent = ((metrics.currentPrice - tradeResult.pricePerToken) / metrics.currentPrice) * 100;
      if (priceDecreasePercent > 10) {
        warnings.push(`Price will decrease by ${priceDecreasePercent.toFixed(1)}%`);
      }
      
      // Check if selling large portion of supply
      const supplyPercentage = (tokenAmount / metrics.circulatingSupply) * 100;
      if (supplyPercentage > 1) {
        warnings.push(`Selling ${supplyPercentage.toFixed(1)}% of circulating supply`);
      }
      
      return {
        // Input/Output
        inputAmount: tokenAmount,
        outputAmount: tradeResult.amountOut,
        outputAmountAfterFees: tradeResult.amountOutAfterFees,
        
        // Pricing
        currentPrice: metrics.currentPrice,
        executionPrice: tradeResult.amountOut / tokenAmount,
        pricePerTokenAfterTrade: tradeResult.pricePerToken,
        
        // Impact & Slippage
        priceImpact: tradeResult.priceImpact,
        estimatedSlippage: tradeResult.slippage,
        minimumReceived,
        
        // Fees breakdown
        fees: {
          total: tradeResult.fees.total,
          totalPercentage: this.TOTAL_FEE_BPS / 100,
          creator: tradeResult.fees.creator,
          creatorPercentage: this.CREATOR_FEE_BPS / 100,
          platform: tradeResult.fees.platform,
          platformPercentage: this.PLATFORM_FEE_BPS / 100
        },
        
        // Pool state after trade
        poolAfterTrade: {
          tokenReserve: tradeResult.newReserves.tokenReserve,
          solReserve: tradeResult.newReserves.solReserve,
          k: tradeResult.newReserves.tokenReserve * tradeResult.newReserves.solReserve,
          price: tradeResult.pricePerToken
        },
        
        // Additional info
        route: metrics.tokenAddress.slice(0, 4) + '... → SOL',
        warnings
      };
    } catch (error: any) {
      throw new Error(`Trade preview failed: ${error.message}`);
    }
  }

  /**
   * Calculate how much SOL needed to buy specific token amount
   */
  static calculateBuyCost(
    metrics: TokenMetrics,
    desiredTokenAmount: number,
    slippageBps: number = this.DEFAULT_SLIPPAGE_BPS
  ): { 
    requiredSol: number; 
    requiredSolWithSlippage: number;
    priceImpact: number;
    warnings: string[];
  } {
    const pool = this.getPoolState(metrics);
    const slippageMultiplier = 1 + this.bpsToDecimal(slippageBps);
    
    try {
      const requiredSol = UniswapV2AMM.calculateBuyCost(pool, desiredTokenAmount);
      const requiredSolWithSlippage = requiredSol * slippageMultiplier;
      
      // Calculate price impact
      const priceImpact = ((requiredSol / desiredTokenAmount - metrics.currentPrice) / metrics.currentPrice) * 100;
      
      const warnings: string[] = [];
      if (priceImpact > this.HIGH_IMPACT_THRESHOLD) {
        warnings.push(`High price impact: ${priceImpact.toFixed(2)}%`);
      }
      
      return {
        requiredSol,
        requiredSolWithSlippage,
        priceImpact,
        warnings
      };
    } catch (error: any) {
      throw new Error(`Cost calculation failed: ${error.message}`);
    }
  }

  /**
   * Calculate optimal trade size for minimal slippage
   */
  static calculateOptimalTradeSize(
    metrics: TokenMetrics,
    targetSlippagePercent: number = 0.5
  ): {
    buy: { maxSolAmount: number; expectedTokens: number };
    sell: { maxTokenAmount: number; expectedSol: number };
  } {
    const pool = this.getPoolState(metrics);
    
    // For buys: find SOL amount that results in target slippage
    // Approximation: slippage ≈ tradeSize / (2 * poolSize)
    const maxSolForTargetSlippage = pool.solReserve * targetSlippagePercent * 0.02;
    const expectedTokensFromBuy = UniswapV2AMM.executeBuyTrade(
      pool, 
      maxSolForTargetSlippage, 
      targetSlippagePercent
    ).amountOut;
    
    // For sells: find token amount that results in target slippage
    const maxTokensForTargetSlippage = pool.tokenReserve * targetSlippagePercent * 0.02;
    const expectedSolFromSell = UniswapV2AMM.executeSellTrade(
      pool,
      maxTokensForTargetSlippage,
      targetSlippagePercent
    ).amountOutAfterFees;
    
    return {
      buy: {
        maxSolAmount: maxSolForTargetSlippage,
        expectedTokens: expectedTokensFromBuy
      },
      sell: {
        maxTokenAmount: maxTokensForTargetSlippage,
        expectedSol: expectedSolFromSell
      }
    };
  }

  /**
   * Simulate price impact for various trade sizes
   */
  static generatePriceImpactCurve(
    metrics: TokenMetrics,
    maxTradePercent: number = 10
  ): {
    buy: Array<{ solAmount: number; priceImpact: number; newPrice: number }>;
    sell: Array<{ tokenAmount: number; priceImpact: number; newPrice: number }>;
  } {
    const pool = this.getPoolState(metrics);
    
    // Generate trade amounts (0.1%, 0.5%, 1%, 2%, 5%, 10% of pool)
    const percentages = [0.1, 0.5, 1, 2, 5, Math.min(maxTradePercent, 10)];
    
    // Buy curve
    const buyAmounts = percentages.map(p => pool.solReserve * p / 100);
    const buyCurve = UniswapV2AMM.simulatePriceImpactCurve(pool, buyAmounts, true);
    
    // Sell curve
    const sellAmounts = percentages.map(p => pool.tokenReserve * p / 100);
    const sellCurve = UniswapV2AMM.simulatePriceImpactCurve(pool, sellAmounts, false);
    
    return {
      buy: buyCurve.map((point, i) => ({
        solAmount: buyAmounts[i],
        priceImpact: point.priceImpact,
        newPrice: point.newPrice
      })),
      sell: sellCurve.map((point, i) => ({
        tokenAmount: sellAmounts[i],
        priceImpact: point.priceImpact,
        newPrice: point.newPrice
      }))
    };
  }
}

// Export for easy access
export { UniswapV2AMM, AMMPool, TradeResult as AMMTradeResult } from '../amm/UniswapV2AMM';