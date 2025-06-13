# 🚀 DeGenie Raydium Integration

This module handles the automatic graduation of tokens from DeGenie's bonding curve to Raydium DEX when they reach the $69k market cap threshold.

## Features

- ✅ **Automatic Pool Creation**: Creates liquidity pools on Raydium when tokens graduate
- 🔥 **LP Token Burning**: Burns LP tokens to make liquidity permanent (no rug pulls)
- 💰 **Fair Fee Distribution**: 85% liquidity, 10% platform, 5% creator bonus
- 📊 **Performance Monitoring**: Track pool performance after graduation
- 🔒 **Security First**: Validates all operations and prevents common attacks

## Installation

```bash
cd src/raydium-integration
npm install
```

## Usage

### Basic Graduation

```typescript
import { graduateTokenToRaydium } from '@degenie/raydium-integration';
import { Connection, PublicKey, Keypair } from '@solana/web3.js';
import BN from 'bn.js';

const connection = new Connection('https://api.mainnet-beta.solana.com');

const result = await graduateTokenToRaydium(
  connection,
  tokenMint,
  {
    pda: bondingCurvePda,
    treasuryBalance: new BN(12_000_000_000_000), // 12k SOL
    totalSupply: new BN(800_000_000), // 800M tokens
    authority: authorityKeypair,
  },
  {
    creator: creatorWallet,
    platform: platformWallet,
  },
  'mainnet'
);

console.log(`Pool created: ${result.poolId}`);
console.log(`LP tokens burned: ${result.lpMint}`);
```

### Advanced Usage with Custom Pool Creator

```typescript
import { RaydiumPoolCreator } from '@degenie/raydium-integration';

const poolCreator = new RaydiumPoolCreator(connection, 'mainnet');

const poolResult = await poolCreator.createPool({
  connection,
  wallet: authority,
  tokenMint,
  baseAmount: tokensForLiquidity,
  quoteAmount: solForLiquidity,
  burnLpTokens: true, // Automatic burn
});
```

## Graduation Process

### 1. Validation Phase
- Verify market cap ≥ $69,000
- Check treasury balance ≥ 10 SOL minimum
- Validate token mint and supply

### 2. Fee Distribution
```
Treasury Balance: 12,000 SOL
├── Liquidity (85%): 10,200 SOL → Raydium Pool
├── Platform (10%): 1,200 SOL → Platform Wallet
└── Creator (5%): 600 SOL → Creator Wallet
```

### 3. Pool Creation
- Base tokens: 20% of total supply (160M tokens)
- Quote tokens: 85% of treasury (10,200 SOL)
- Initial price: Calculated from ratio
- LP tokens: Automatically burned

### 4. Post-Graduation
- Bonding curve marked as graduated
- Trading continues on Raydium
- Full AMM functionality enabled
- No more bonding curve restrictions

## Architecture

```
src/
├── config.ts           # Configuration and constants
├── poolCreator.ts      # Raydium pool creation logic
├── graduationHandler.ts # Main graduation orchestration
└── index.ts           # Public API exports
```

## Key Components

### TokenGraduationHandler
Main orchestrator for the graduation process:
- Validates eligibility
- Calculates allocations
- Transfers fees
- Creates pool
- Burns LP tokens

### RaydiumPoolCreator
Handles Raydium-specific operations:
- Market creation (OpenBook)
- Pool initialization
- Liquidity addition
- LP token burning

## Configuration

### Fee Structure
```typescript
const GRADUATION_FEES = {
  LIQUIDITY_PERCENTAGE: 85,      // 85% to pool
  PLATFORM_FEE_PERCENTAGE: 10,   // 10% platform
  CREATOR_BONUS_PERCENTAGE: 5,   // 5% creator
  RAYDIUM_INIT_FEE: 0.4,        // 0.4 SOL Raydium fee
};
```

### Network Support
- **Mainnet**: Production pools on Raydium
- **Devnet**: Testing and development

## Security Considerations

1. **Authority Validation**: Only bonding curve authority can graduate
2. **Minimum Liquidity**: Enforces 10 SOL minimum for viable pools
3. **LP Burn**: Automatic burning prevents rug pulls
4. **Slippage Protection**: Validates price impacts
5. **Reentrancy Guards**: Prevents double-graduation

## Error Handling

```typescript
try {
  const result = await graduateTokenToRaydium(...);
} catch (error) {
  if (error.message.includes('Insufficient liquidity')) {
    // Handle low liquidity
  } else if (error.message.includes('Already graduated')) {
    // Handle double graduation attempt
  }
}
```

## Testing

```bash
# Run unit tests
npm test

# Run integration tests (requires devnet SOL)
npm run test:integration

# Run example graduation
npm run example
```

## Monitoring

After graduation, monitor pool performance:

```typescript
const performance = await graduationHandler.monitorPoolPerformance(poolId);
console.log(`24h Volume: $${performance.volume24h}`);
console.log(`Liquidity: $${performance.liquidity}`);
console.log(`Price Change: ${performance.priceChange24h}%`);
```

## Roadmap

- [ ] Integrate Raydium V5 pools
- [ ] Add concentrated liquidity support
- [ ] Multi-token pool creation
- [ ] Cross-chain liquidity bridges
- [ ] Advanced pool analytics

## Dependencies

- `@raydium-io/raydium-sdk`: Raydium protocol SDK
- `@solana/web3.js`: Solana web3 library
- `@solana/spl-token`: SPL token operations
- `bn.js`: Big number operations
- `decimal.js`: Precise decimal calculations

## License

MIT - See LICENSE file for details