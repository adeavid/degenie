# AMM (Automated Market Maker) Implementation Documentation

## Overview

DeGenie implements a **Uniswap V2 style AMM** with constant product formula (x * y = k) for token trading. This provides:
- Automated price discovery
- Always available liquidity
- Predictable price impact
- Fair fee distribution

## Core Formula

### Constant Product Formula
```
x * y = k
```
Where:
- `x` = Token reserve in the pool
- `y` = SOL reserve in the pool
- `k` = Constant product (remains constant during trades)

### Price Calculation
```
Price = SOL Reserve / Token Reserve
```

### Output Calculation (with fees)
```
amountOut = (amountIn * (1 - fee) * reserveOut) / (reserveIn + amountIn * (1 - fee))
```

## Fee Structure

Total fee: **1%** (100 basis points)
- **Creator fee**: 0.5% (50 bps)
- **Platform fee**: 0.5% (50 bps)

Fees are taken from the input amount, ensuring the pool's `k` value increases with each trade.

## Price Impact & Slippage

### Price Impact
The percentage change in price caused by a trade:
```
Price Impact = |((newPrice - oldPrice) / oldPrice) * 100|
```

### Slippage
The difference between expected and actual output:
```
Slippage = ((expectedOutput - actualOutput) / expectedOutput) * 100
```

## Implementation Examples

### 1. Buy Trade (SOL → Tokens)

```typescript
// Initial pool state
const pool = {
  tokenReserve: 1_000_000,  // 1M tokens
  solReserve: 100,          // 100 SOL
  k: 100_000_000           // constant product
};

// Buy with 10 SOL
const solIn = 10;
const fee = 0.01; // 1%
const solInAfterFee = solIn * (1 - fee) = 9.9;

// Calculate tokens out
const tokensOut = (solInAfterFee * tokenReserve) / (solReserve + solInAfterFee)
                = (9.9 * 1_000_000) / (100 + 9.9)
                = 9_900_000 / 109.9
                = 90,082 tokens

// New pool state
newSolReserve = 100 + 10 = 110 SOL
newTokenReserve = 1_000_000 - 90,082 = 909,918 tokens
newPrice = 110 / 909,918 = 0.0001209 SOL per token

// Price impact
oldPrice = 100 / 1_000_000 = 0.0001 SOL per token
priceImpact = ((0.0001209 - 0.0001) / 0.0001) * 100 = 20.9%
```

### 2. Sell Trade (Tokens → SOL)

```typescript
// Sell 100,000 tokens
const tokensIn = 100_000;
const tokensInAfterFee = tokensIn * (1 - fee) = 99,000;

// Calculate SOL out
const solOut = (tokensInAfterFee * solReserve) / (tokenReserve + tokensInAfterFee)
             = (99,000 * 100) / (1_000_000 + 99,000)
             = 9_900_000 / 1_099_000
             = 9.01 SOL

// Fee breakdown
totalFee = solOut * 0.01 = 0.0901 SOL
creatorFee = 0.0451 SOL
platformFee = 0.0451 SOL
userReceives = 9.01 - 0.0901 = 8.92 SOL
```

### 3. Price Impact Examples

| Trade Size | Direction | Price Impact | Warning Level |
|------------|-----------|--------------|---------------|
| 1% of pool | Buy/Sell  | ~2%          | Low           |
| 5% of pool | Buy/Sell  | ~10%         | Medium        |
| 10% of pool| Buy/Sell  | ~22%         | High          |
| 20% of pool| Buy/Sell  | ~50%         | Very High     |

### 4. Slippage Protection

```typescript
// User wants to buy tokens with 10 SOL
// Sets 1% slippage tolerance

const expectedTokens = calculateExpectedTokens(10); // 90,082
const minAcceptableTokens = expectedTokens * 0.99; // 89,181

// If actual output < minAcceptableTokens, transaction fails
if (actualTokens < minAcceptableTokens) {
  throw new Error('Slippage tolerance exceeded');
}
```

## API Usage

### Calculate Buy Preview
```typescript
const preview = AMMPriceCalculator.calculateBuyPreview(
  tokenMetrics,
  10, // 10 SOL
  100 // 1% slippage
);

console.log({
  tokensToReceive: preview.outputAmount,
  priceImpact: preview.priceImpact + '%',
  fees: preview.fees.total + ' SOL',
  minTokens: preview.minimumReceived
});
```

### Calculate Sell Preview
```typescript
const preview = AMMPriceCalculator.calculateSellPreview(
  tokenMetrics,
  100_000, // 100k tokens
  100 // 1% slippage
);

console.log({
  solToReceive: preview.outputAmountAfterFees,
  priceImpact: preview.priceImpact + '%',
  fees: preview.fees.total + ' SOL',
  minSol: preview.minimumReceived
});
```

### Find Optimal Trade Size
```typescript
const optimal = AMMPriceCalculator.calculateOptimalTradeSize(
  tokenMetrics,
  0.5 // Target 0.5% slippage
);

console.log({
  maxBuyAmount: optimal.buy.maxSolAmount + ' SOL',
  maxSellAmount: optimal.sell.maxTokenAmount + ' tokens'
});
```

## Integration with Bonding Curve

The AMM integrates seamlessly with the existing bonding curve:

1. **Pre-Graduation**: Uses bonding curve formula
2. **Post-Graduation**: Switches to AMM (constant product)
3. **Liquidity Migration**: Automatic when graduating

## Best Practices

1. **Always show price impact** to users before trades
2. **Implement slippage protection** (default 1%, max 5%)
3. **Warn on high impact trades** (>3% impact)
4. **Update UI in real-time** as user types amounts
5. **Show minimum received** accounting for slippage

## Security Considerations

1. **Sandwich Attack Protection**: 
   - Enforce maximum slippage
   - Use commit-reveal for large trades

2. **Price Manipulation**:
   - Monitor for unusual price movements
   - Implement trade size limits

3. **Front-running Protection**:
   - Use private mempools when available
   - Implement MEV protection

## Testing

```typescript
// Run AMM examples
import { AMMExamples } from './services/amm/UniswapV2AMM';

AMMExamples.buyExample();
AMMExamples.calculateCostExample();
AMMExamples.priceImpactExample();
```

## Formulas Reference

### Buy (SOL → Token)
```
tokensOut = (solIn * (1 - fee) * tokenReserve) / (solReserve + solIn * (1 - fee))
newPrice = (solReserve + solIn) / (tokenReserve - tokensOut)
```

### Sell (Token → SOL)
```
solOut = (tokenIn * (1 - fee) * solReserve) / (tokenReserve + tokenIn * (1 - fee))
newPrice = (solReserve - solOut) / (tokenReserve + tokenIn)
```

### Price Impact
```
priceImpact = |((executionPrice - spotPrice) / spotPrice) * 100|
```

### Minimum Output (with slippage)
```
minOutput = expectedOutput * (1 - slippageTolerance)
```