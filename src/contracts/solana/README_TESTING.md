# 🧪 Testing the Bonding Curve Implementation

## Quick Start Testing Options

### 1. 🎮 Interactive Terminal Demo (Recommended)
```bash
cd src/contracts/solana
node scripts/interactive-demo.js
```

This provides an interactive experience where you can:
- Buy and sell tokens manually
- See real-time price changes
- Watch automated trading simulations
- View transaction history
- See visual price charts in the terminal

### 2. 🌐 Visual Web Dashboard
```bash
cd src/contracts/solana/scripts
# Open in your browser:
open visual-dashboard.html
# Or on Linux:
xdg-open visual-dashboard.html
```

Features:
- Real-time price charts using Chart.js
- Interactive buy/sell interface
- Live market metrics
- Transaction history
- Automated simulation mode

### 3. 🔧 Command Line Simulation
```bash
cd src/contracts/solana
node scripts/simulation.js
```

This runs a pre-programmed simulation showing:
- 18 different transactions
- Price progression from 1000 → 1035 lamports
- Various trader behaviors
- Treasury accumulation

### 4. 🧬 Run Unit Tests
```bash
cd src/contracts/solana/token-creator
cargo test
```

This runs Rust unit tests for:
- Bonding curve mathematical functions
- Buy/sell operations
- Price calculations
- Anti-dump protections

## Understanding the Bonding Curve

### Key Concepts:
- **Initial Price**: 0.001 SOL per token (1000 lamports)
- **Price Increment**: 0.0001 SOL per token bought/sold
- **Max Supply**: 1,000,000 tokens
- **Price Formula**: Linear curve - price increases with supply

### Example Scenarios:

1. **Buying Tokens**:
   - Spend 0.1 SOL → Get ~100 tokens
   - Price increases after purchase
   - Tokens are minted from bonding curve

2. **Selling Tokens**:
   - Sell 50 tokens → Receive ~0.05 SOL
   - Price decreases after sale
   - Tokens are burned

3. **Market Dynamics**:
   - More buyers = Higher price
   - More sellers = Lower price
   - Treasury accumulates SOL from purchases

## Visual Feedback

The interactive demo shows:
```
📊 Current Market State:
┌─────────────────────────────────────────────────────────┐
│ 💰 Token Price:     0.001050 SOL per token              │
│ 📈 Total Supply:    500 tokens                          │
│ 🏦 Treasury:        0.525000 SOL                        │
│ 💎 Market Cap:      0.525000 SOL                        │
│ 📊 Price Change:    +5.00% from start                   │
└─────────────────────────────────────────────────────────┘

📈 Price Visualization:
[████████████▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄]
 0.800 SOL                           1.200 SOL
```

## What to Test

1. **Price Movement**: Buy tokens and watch price increase
2. **Sell Functionality**: Sell tokens back and see price decrease
3. **Max Supply**: Try to buy more than 1M tokens total
4. **Treasury Management**: Watch SOL accumulate/decrease
5. **Edge Cases**: Test with very small/large amounts

## Troubleshooting

If you get module errors:
```bash
npm install readline
```

If the web dashboard doesn't load:
- Make sure to open the HTML file in a modern browser
- Allow JavaScript execution if prompted

## Next Steps

After testing, the bonding curve is ready for:
1. Integration with frontend UI
2. Connection to real Solana network
3. Addition of more complex curve types
4. Integration with liquidity pools