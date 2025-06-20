/**
 * AMM (Automated Market Maker) Price Calculation Service
 * Implements Uniswap V2 style constant product formula (x * y = k)
 * with custom fee structure for DeGenie platform
 */

export interface AMMPool {
  tokenReserve: number;  // Amount of tokens in the pool
  solReserve: number;    // Amount of SOL in the pool
  k: number;             // Constant product (tokenReserve * solReserve)
  totalSupply: number;   // Total token supply
  creatorAddress: string;
}

export interface TradeResult {
  amountOut: number;           // Amount of tokens/SOL received
  amountOutAfterFees: number;  // Amount after fees
  pricePerToken: number;       // New price per token after trade
  priceImpact: number;         // Price impact percentage
  slippage: number;            // Actual slippage percentage
  fees: {
    total: number;             // Total fees
    creator: number;           // Creator fee (0.5%)
    platform: number;          // Platform fee (0.5%)
  };
  newReserves: {
    tokenReserve: number;
    solReserve: number;
  };
}

export class UniswapV2AMM {
  // Fee structure: 1% total (0.5% creator, 0.5% platform)
  private static readonly TOTAL_FEE_PERCENT = 0.01;     // 1%
  private static readonly CREATOR_FEE_PERCENT = 0.005;  // 0.5%
  private static readonly PLATFORM_FEE_PERCENT = 0.005; // 0.5%

  /**
   * Calculate output amount using constant product formula
   * Formula: amountOut = (amountIn * reserveOut) / (reserveIn + amountIn)
   * 
   * @param amountIn - Amount of input token
   * @param reserveIn - Reserve of input token
   * @param reserveOut - Reserve of output token
   * @returns Amount of output token
   */
  private static getAmountOut(
    amountIn: number,
    reserveIn: number,
    reserveOut: number
  ): number {
    if (amountIn <= 0) {
      throw new Error('Insufficient input amount');
    }
    if (reserveIn <= 0 || reserveOut <= 0) {
      throw new Error('Insufficient liquidity');
    }

    // Apply fee to input amount (1% fee)
    const amountInWithFee = amountIn * (1 - this.TOTAL_FEE_PERCENT);
    
    // Calculate output using constant product formula
    const numerator = amountInWithFee * reserveOut;
    const denominator = reserveIn + amountInWithFee;
    const amountOut = numerator / denominator;

    return amountOut;
  }

  /**
   * Calculate input amount required to get specific output
   * Inverse of getAmountOut formula
   * 
   * @param amountOut - Desired output amount
   * @param reserveIn - Reserve of input token
   * @param reserveOut - Reserve of output token
   * @returns Required input amount
   */
  private static getAmountIn(
    amountOut: number,
    reserveIn: number,
    reserveOut: number
  ): number {
    if (amountOut <= 0) {
      throw new Error('Insufficient output amount');
    }
    if (reserveIn <= 0 || reserveOut <= 0) {
      throw new Error('Insufficient liquidity');
    }
    if (amountOut >= reserveOut) {
      throw new Error('Insufficient liquidity for desired output');
    }

    const numerator = reserveIn * amountOut;
    const denominator = (reserveOut - amountOut) * (1 - this.TOTAL_FEE_PERCENT);
    const amountIn = numerator / denominator;

    return amountIn;
  }

  /**
   * Calculate price impact of a trade
   * Price impact = ((newPrice - oldPrice) / oldPrice) * 100
   * 
   * @param amountIn - Amount being traded
   * @param reserveIn - Reserve of input token
   * @param reserveOut - Reserve of output token
   * @returns Price impact percentage
   */
  private static calculatePriceImpact(
    amountIn: number,
    reserveIn: number,
    reserveOut: number
  ): number {
    // Current price (before trade)
    const currentPrice = reserveOut / reserveIn;
    
    // New reserves after trade
    const amountOut = this.getAmountOut(amountIn, reserveIn, reserveOut);
    const newReserveIn = reserveIn + amountIn;
    const newReserveOut = reserveOut - amountOut;
    
    // New price (after trade)
    const newPrice = newReserveOut / newReserveIn;
    
    // Price impact percentage
    const priceImpact = ((currentPrice - newPrice) / currentPrice) * 100;
    
    return Math.abs(priceImpact);
  }

  /**
   * Execute a buy trade (SOL -> Tokens)
   * 
   * @param pool - Current pool state
   * @param solAmount - Amount of SOL to spend
   * @param maxSlippage - Maximum acceptable slippage (default 1%)
   * @returns Trade result with all details
   */
  static executeBuyTrade(
    pool: AMMPool,
    solAmount: number,
    maxSlippage: number = 1
  ): TradeResult {
    // Calculate tokens out
    const tokensOut = this.getAmountOut(
      solAmount,
      pool.solReserve,
      pool.tokenReserve
    );

    // Calculate fees
    const totalFee = solAmount * this.TOTAL_FEE_PERCENT;
    const creatorFee = solAmount * this.CREATOR_FEE_PERCENT;
    const platformFee = solAmount * this.PLATFORM_FEE_PERCENT;

    // Calculate new reserves
    const newSolReserve = pool.solReserve + solAmount;
    const newTokenReserve = pool.tokenReserve - tokensOut;

    // Calculate new price
    const newPricePerToken = newSolReserve / newTokenReserve;
    const oldPricePerToken = pool.solReserve / pool.tokenReserve;

    // Calculate price impact
    const priceImpact = this.calculatePriceImpact(
      solAmount,
      pool.solReserve,
      pool.tokenReserve
    );

    // Calculate actual slippage
    const expectedTokensOut = solAmount / oldPricePerToken;
    const actualSlippage = ((expectedTokensOut - tokensOut) / expectedTokensOut) * 100;

    // Check if slippage exceeds maximum
    if (actualSlippage > maxSlippage) {
      throw new Error(`Slippage too high: ${actualSlippage.toFixed(2)}% > ${maxSlippage}%`);
    }

    return {
      amountOut: tokensOut,
      amountOutAfterFees: tokensOut, // Fees taken from input, not output
      pricePerToken: newPricePerToken,
      priceImpact,
      slippage: actualSlippage,
      fees: {
        total: totalFee,
        creator: creatorFee,
        platform: platformFee
      },
      newReserves: {
        tokenReserve: newTokenReserve,
        solReserve: newSolReserve
      }
    };
  }

  /**
   * Execute a sell trade (Tokens -> SOL)
   * 
   * @param pool - Current pool state
   * @param tokenAmount - Amount of tokens to sell
   * @param maxSlippage - Maximum acceptable slippage (default 1%)
   * @returns Trade result with all details
   */
  static executeSellTrade(
    pool: AMMPool,
    tokenAmount: number,
    maxSlippage: number = 1
  ): TradeResult {
    // Calculate SOL out
    const solOut = this.getAmountOut(
      tokenAmount,
      pool.tokenReserve,
      pool.solReserve
    );

    // Calculate fees (taken from output)
    const totalFee = solOut * this.TOTAL_FEE_PERCENT;
    const creatorFee = solOut * this.CREATOR_FEE_PERCENT;
    const platformFee = solOut * this.PLATFORM_FEE_PERCENT;
    const solOutAfterFees = solOut - totalFee;

    // Calculate new reserves
    const newTokenReserve = pool.tokenReserve + tokenAmount;
    const newSolReserve = pool.solReserve - solOut;

    // Calculate new price
    const newPricePerToken = newSolReserve / newTokenReserve;
    const oldPricePerToken = pool.solReserve / pool.tokenReserve;

    // Calculate price impact
    const priceImpact = this.calculatePriceImpact(
      tokenAmount,
      pool.tokenReserve,
      pool.solReserve
    );

    // Calculate actual slippage
    const expectedSolOut = tokenAmount * oldPricePerToken;
    const actualSlippage = ((expectedSolOut - solOut) / expectedSolOut) * 100;

    // Check if slippage exceeds maximum
    if (actualSlippage > maxSlippage) {
      throw new Error(`Slippage too high: ${actualSlippage.toFixed(2)}% > ${maxSlippage}%`);
    }

    return {
      amountOut: solOut,
      amountOutAfterFees: solOutAfterFees,
      pricePerToken: newPricePerToken,
      priceImpact,
      slippage: actualSlippage,
      fees: {
        total: totalFee,
        creator: creatorFee,
        platform: platformFee
      },
      newReserves: {
        tokenReserve: newTokenReserve,
        solReserve: newSolReserve
      }
    };
  }

  /**
   * Calculate how much SOL is needed to buy specific amount of tokens
   * 
   * @param pool - Current pool state
   * @param tokenAmount - Desired token amount
   * @returns Required SOL amount (including fees)
   */
  static calculateBuyCost(
    pool: AMMPool,
    tokenAmount: number
  ): number {
    const solRequired = this.getAmountIn(
      tokenAmount,
      pool.solReserve,
      pool.tokenReserve
    );

    return solRequired;
  }

  /**
   * Calculate how many tokens needed to get specific SOL amount
   * 
   * @param pool - Current pool state
   * @param solAmount - Desired SOL amount (after fees)
   * @returns Required token amount
   */
  static calculateSellAmount(
    pool: AMMPool,
    solAmount: number
  ): number {
    // Account for fees in the calculation
    const solAmountBeforeFees = solAmount / (1 - this.TOTAL_FEE_PERCENT);
    
    const tokensRequired = this.getAmountIn(
      solAmountBeforeFees,
      pool.tokenReserve,
      pool.solReserve
    );

    return tokensRequired;
  }

  /**
   * Get current token price in SOL
   * 
   * @param pool - Current pool state
   * @returns Price per token in SOL
   */
  static getCurrentPrice(pool: AMMPool): number {
    return pool.solReserve / pool.tokenReserve;
  }

  /**
   * Simulate multiple trades to show price impact curve
   * 
   * @param pool - Current pool state
   * @param tradeAmounts - Array of trade amounts to simulate
   * @param isBuy - Whether simulating buy or sell trades
   * @returns Array of price impacts for each trade amount
   */
  static simulatePriceImpactCurve(
    pool: AMMPool,
    tradeAmounts: number[],
    isBuy: boolean = true
  ): Array<{ amount: number; priceImpact: number; newPrice: number }> {
    return tradeAmounts.map(amount => {
      const priceImpact = this.calculatePriceImpact(
        amount,
        isBuy ? pool.solReserve : pool.tokenReserve,
        isBuy ? pool.tokenReserve : pool.solReserve
      );

      let newPrice: number;
      if (isBuy) {
        const result = this.executeBuyTrade(pool, amount, 100); // High slippage for simulation
        newPrice = result.pricePerToken;
      } else {
        const result = this.executeSellTrade(pool, amount, 100); // High slippage for simulation
        newPrice = result.pricePerToken;
      }

      return { amount, priceImpact, newPrice };
    });
  }
}

// Example usage and documentation
export const AMMExamples = {
  /**
   * Example 1: Simple buy trade
   * Pool: 1,000,000 tokens, 100 SOL
   * Buy with: 10 SOL
   */
  buyExample: () => {
    const pool: AMMPool = {
      tokenReserve: 1_000_000,
      solReserve: 100,
      k: 1_000_000 * 100,
      totalSupply: 1_000_000,
      creatorAddress: 'creator123'
    };

    console.log('Initial price:', UniswapV2AMM.getCurrentPrice(pool), 'SOL per token');
    
    const result = UniswapV2AMM.executeBuyTrade(pool, 10, 1);
    
    console.log('Buy 10 SOL worth of tokens:');
    console.log('- Tokens received:', result.amountOut);
    console.log('- New price:', result.pricePerToken, 'SOL per token');
    console.log('- Price impact:', result.priceImpact.toFixed(2), '%');
    console.log('- Fees paid:', result.fees.total, 'SOL');
    console.log('  - Creator:', result.fees.creator, 'SOL');
    console.log('  - Platform:', result.fees.platform, 'SOL');
  },

  /**
   * Example 2: Calculate required SOL for specific token amount
   */
  calculateCostExample: () => {
    const pool: AMMPool = {
      tokenReserve: 1_000_000,
      solReserve: 100,
      k: 1_000_000 * 100,
      totalSupply: 1_000_000,
      creatorAddress: 'creator123'
    };

    const desiredTokens = 10_000;
    const requiredSol = UniswapV2AMM.calculateBuyCost(pool, desiredTokens);
    
    console.log(`To buy ${desiredTokens} tokens, you need ${requiredSol} SOL`);
  },

  /**
   * Example 3: Price impact simulation
   */
  priceImpactExample: () => {
    const pool: AMMPool = {
      tokenReserve: 1_000_000,
      solReserve: 100,
      k: 1_000_000 * 100,
      totalSupply: 1_000_000,
      creatorAddress: 'creator123'
    };

    const tradeAmounts = [1, 5, 10, 25, 50, 100];
    const impacts = UniswapV2AMM.simulatePriceImpactCurve(pool, tradeAmounts, true);
    
    console.log('Price impact for different buy amounts:');
    impacts.forEach(({ amount, priceImpact, newPrice }) => {
      console.log(`- ${amount} SOL: ${priceImpact.toFixed(2)}% impact, new price: ${newPrice.toFixed(8)} SOL`);
    });
  }
};