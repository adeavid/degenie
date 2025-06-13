#!/usr/bin/env node

/**
 * Slippage Protection Demo - Shows how DeGenie protects users from price manipulation
 */

const BN = require('bn.js');

class SlippageProtectionDemo {
  constructor() {
    this.LAMPORTS_PER_SOL = 1_000_000_000;
    
    // Bonding curve parameters
    this.initialPrice = 1000; // 0.001 SOL
    this.currentPrice = 1000;
    this.totalSupply = 0;
    this.growthRate = 100; // 1%
    
    // Slippage protection settings
    this.MAX_PRICE_IMPACT_BPS = 500; // 5% max price impact
    
    // Different impact limits for different trade sizes
    this.PROGRESSIVE_LIMITS = {
      small: { threshold: 0.1 * this.LAMPORTS_PER_SOL, maxImpact: 100 },  // 1% for <0.1 SOL
      medium: { threshold: 1 * this.LAMPORTS_PER_SOL, maxImpact: 300 },   // 3% for <1 SOL  
      large: { threshold: 10 * this.LAMPORTS_PER_SOL, maxImpact: 500 },   // 5% for <10 SOL
      whale: { threshold: Infinity, maxImpact: 800 }                      // 8% for >10 SOL
    };
    
    this.trades = [];
  }

  // Calculate exponential price after trade
  calculateNewPrice(solAmount) {
    const tokensToMint = Math.floor(solAmount / this.currentPrice);
    const newSupply = this.totalSupply + tokensToMint;
    
    const scaleFactor = 1000;
    const supplyScaled = Math.floor(newSupply / scaleFactor);
    const growthMultiplier = 1 + (this.growthRate / 10000);
    
    return Math.floor(this.initialPrice * Math.pow(growthMultiplier, supplyScaled));
  }

  // Calculate price impact in basis points
  calculatePriceImpact(solAmount) {
    const newPrice = this.calculateNewPrice(solAmount);
    
    if (newPrice <= this.currentPrice) return 0;
    
    const priceIncrease = newPrice - this.currentPrice;
    const impactBps = Math.floor((priceIncrease * 10000) / this.currentPrice);
    
    return Math.min(impactBps, 65535);
  }

  // Get progressive limit based on trade size
  getProgressiveLimit(solAmount) {
    if (solAmount <= this.PROGRESSIVE_LIMITS.small.threshold) {
      return this.PROGRESSIVE_LIMITS.small.maxImpact;
    } else if (solAmount <= this.PROGRESSIVE_LIMITS.medium.threshold) {
      return this.PROGRESSIVE_LIMITS.medium.maxImpact;
    } else if (solAmount <= this.PROGRESSIVE_LIMITS.large.threshold) {
      return this.PROGRESSIVE_LIMITS.large.maxImpact;
    } else {
      return this.PROGRESSIVE_LIMITS.whale.maxImpact;
    }
  }

  // Attempt trade with slippage protection
  attemptTrade(trader, solAmount, description) {
    console.log(`\n💰 ${description}`);
    console.log(`Trader: ${trader}`);
    console.log(`Amount: ${(solAmount / this.LAMPORTS_PER_SOL).toFixed(3)} SOL`);
    console.log(`Current Price: ${(this.currentPrice / this.LAMPORTS_PER_SOL).toFixed(6)} SOL`);
    
    const priceImpact = this.calculatePriceImpact(solAmount);
    const progressiveLimit = this.getProgressiveLimit(solAmount);
    const newPrice = this.calculateNewPrice(solAmount);
    
    console.log(`Expected Price Impact: ${(priceImpact / 100).toFixed(2)}%`);
    console.log(`Progressive Limit: ${(progressiveLimit / 100).toFixed(2)}%`);
    console.log(`New Price: ${(newPrice / this.LAMPORTS_PER_SOL).toFixed(6)} SOL`);

    try {
      // Check slippage protection
      if (priceImpact > progressiveLimit) {
        throw new Error(`❌ SLIPPAGE PROTECTION: Impact ${(priceImpact/100).toFixed(2)}% exceeds limit ${(progressiveLimit/100).toFixed(2)}%`);
      }

      // Execute trade
      const tokensReceived = Math.floor(solAmount / this.currentPrice);
      this.totalSupply += tokensReceived;
      this.currentPrice = newPrice;

      const trade = {
        trader,
        solAmount: solAmount / this.LAMPORTS_PER_SOL,
        tokensReceived,
        priceImpact: priceImpact / 100,
        oldPrice: (this.currentPrice - (newPrice - this.currentPrice)) / this.LAMPORTS_PER_SOL,
        newPrice: newPrice / this.LAMPORTS_PER_SOL,
        success: true,
        timestamp: Date.now()
      };

      this.trades.push(trade);

      console.log(`✅ SUCCESS: Received ${tokensReceived.toLocaleString()} tokens`);
      console.log(`   Actual Impact: ${(priceImpact/100).toFixed(2)}%`);
      
      return true;

    } catch (error) {
      console.log(error.message);
      
      this.trades.push({
        trader,
        solAmount: solAmount / this.LAMPORTS_PER_SOL,
        tokensReceived: 0,
        priceImpact: priceImpact / 100,
        success: false,
        error: error.message,
        timestamp: Date.now()
      });
      
      return false;
    }
  }

  // Run comprehensive slippage demo
  async runDemo() {
    console.log('🛡️ DeGenie Slippage Protection Demo');
    console.log('====================================');
    console.log(`Initial Price: ${(this.initialPrice / this.LAMPORTS_PER_SOL).toFixed(6)} SOL`);
    console.log(`Max Price Impact: ${this.MAX_PRICE_IMPACT_BPS / 100}%`);
    console.log('');
    console.log('Progressive Limits:');
    console.log(`- Small trades (<0.1 SOL): ${this.PROGRESSIVE_LIMITS.small.maxImpact / 100}%`);
    console.log(`- Medium trades (<1 SOL): ${this.PROGRESSIVE_LIMITS.medium.maxImpact / 100}%`);
    console.log(`- Large trades (<10 SOL): ${this.PROGRESSIVE_LIMITS.large.maxImpact / 100}%`);
    console.log(`- Whale trades (>10 SOL): ${this.PROGRESSIVE_LIMITS.whale.maxImpact / 100}%`);

    // Phase 1: Small trades (should all pass)
    console.log('\n🔸 PHASE 1: SMALL TRADES (Low Impact)');
    console.log('=====================================');
    
    await this.attemptTrade('Small_Trader_1', 0.05 * this.LAMPORTS_PER_SOL, 'Small buy - 0.05 SOL');
    await this.delay(500);
    
    await this.attemptTrade('Small_Trader_2', 0.08 * this.LAMPORTS_PER_SOL, 'Small buy - 0.08 SOL');
    await this.delay(500);

    // Phase 2: Medium trades
    console.log('\n🔹 PHASE 2: MEDIUM TRADES');
    console.log('=========================');
    
    await this.attemptTrade('Medium_Trader_1', 0.3 * this.LAMPORTS_PER_SOL, 'Medium buy - 0.3 SOL');
    await this.delay(500);
    
    await this.attemptTrade('Medium_Trader_2', 0.7 * this.LAMPORTS_PER_SOL, 'Medium buy - 0.7 SOL');
    await this.delay(500);

    // Phase 3: Large trades (some should fail)
    console.log('\n🔷 PHASE 3: LARGE TRADES (Higher Impact)');
    console.log('========================================');
    
    await this.attemptTrade('Large_Trader_1', 2 * this.LAMPORTS_PER_SOL, 'Large buy - 2 SOL');
    await this.delay(500);
    
    await this.attemptTrade('Large_Trader_2', 5 * this.LAMPORTS_PER_SOL, 'Large buy - 5 SOL');
    await this.delay(500);

    // Phase 4: Whale attempts (most should fail)
    console.log('\n🐋 PHASE 4: WHALE TRADES (Extreme Impact)');
    console.log('=========================================');
    
    await this.attemptTrade('Whale_1', 15 * this.LAMPORTS_PER_SOL, 'Whale attempt - 15 SOL');
    await this.delay(500);
    
    await this.attemptTrade('Whale_2', 25 * this.LAMPORTS_PER_SOL, 'Whale attempt - 25 SOL');
    await this.delay(500);
    
    await this.attemptTrade('Mega_Whale', 100 * this.LAMPORTS_PER_SOL, 'MEGA WHALE - 100 SOL (should fail)');
    await this.delay(500);

    // Phase 5: Show cumulative effects
    console.log('\n📈 PHASE 5: PRICE PROGRESSION');
    console.log('==============================');
    this.showPriceProgression();

    this.printSummary();
  }

  // Show how price would progress without protection
  showPriceProgression() {
    console.log('Simulating price progression without slippage protection:');
    
    let simulatedPrice = this.initialPrice;
    let simulatedSupply = 0;
    const bigTrades = [5, 10, 25, 50, 100]; // SOL amounts
    
    console.log('\nTrade Size | With Protection | Without Protection | Impact Prevented');
    console.log('-----------|-----------------|-------------------|------------------');
    
    bigTrades.forEach(solAmount => {
      const lamports = solAmount * this.LAMPORTS_PER_SOL;
      
      // With protection (current state)
      const currentPrice = this.currentPrice;
      
      // Without protection (simulated)
      const tokensToMint = Math.floor(lamports / simulatedPrice);
      simulatedSupply += tokensToMint;
      
      const scaleFactor = 1000;
      const supplyScaled = Math.floor(simulatedSupply / scaleFactor);
      const growthMultiplier = 1 + (this.growthRate / 10000);
      const newSimulatedPrice = Math.floor(this.initialPrice * Math.pow(growthMultiplier, supplyScaled));
      
      const impact = ((newSimulatedPrice - simulatedPrice) / simulatedPrice * 100).toFixed(1);
      const priceDiff = ((newSimulatedPrice - currentPrice) / currentPrice * 100).toFixed(1);
      
      console.log(`${solAmount.toString().padEnd(10)} | ${(currentPrice/this.LAMPORTS_PER_SOL).toFixed(6).padEnd(15)} | ${(newSimulatedPrice/this.LAMPORTS_PER_SOL).toFixed(6).padEnd(17)} | ${impact}% → ${priceDiff}%`);
      
      simulatedPrice = newSimulatedPrice;
    });
  }

  // Print comprehensive summary
  printSummary() {
    console.log('\n📊 SLIPPAGE PROTECTION RESULTS');
    console.log('==============================\n');
    
    const successful = this.trades.filter(t => t.success);
    const blocked = this.trades.filter(t => !t.success);
    
    console.log('✅ SUCCESSFUL TRADES:');
    successful.forEach((trade, i) => {
      console.log(`${i+1}. ${trade.trader}: ${trade.solAmount.toFixed(3)} SOL → ${trade.tokensReceived.toLocaleString()} tokens`);
      console.log(`   Price: ${trade.oldPrice.toFixed(6)} → ${trade.newPrice.toFixed(6)} SOL (+${trade.priceImpact.toFixed(2)}%)`);
    });
    
    console.log('\n❌ BLOCKED TRADES (Slippage Protection):');
    blocked.forEach((trade, i) => {
      console.log(`${i+1}. ${trade.trader}: ${trade.solAmount.toFixed(3)} SOL`);
      console.log(`   Would cause ${trade.priceImpact.toFixed(2)}% price impact`);
    });
    
    const totalVolumeAttempted = this.trades.reduce((sum, t) => sum + t.solAmount, 0);
    const totalVolumeExecuted = successful.reduce((sum, t) => sum + t.solAmount, 0);
    const protectionRate = ((totalVolumeAttempted - totalVolumeExecuted) / totalVolumeAttempted * 100);
    
    console.log('\n📈 PROTECTION EFFECTIVENESS:');
    console.log(`Total Volume Attempted: ${totalVolumeAttempted.toFixed(2)} SOL`);
    console.log(`Total Volume Executed: ${totalVolumeExecuted.toFixed(2)} SOL`);
    console.log(`Volume Blocked: ${protectionRate.toFixed(1)}%`);
    console.log(`Final Price: ${(this.currentPrice / this.LAMPORTS_PER_SOL).toFixed(6)} SOL`);
    console.log(`Price Increase: ${((this.currentPrice - this.initialPrice) / this.initialPrice * 100).toFixed(1)}%`);

    this.compareWithCompetitors();
  }

  // Show competitor comparison
  compareWithCompetitors() {
    console.log('\n🏆 SLIPPAGE PROTECTION COMPARISON');
    console.log('=================================\n');
    
    const comparison = [
      {
        platform: 'DeGenie',
        protection: 'Progressive limits',
        maxImpact: '1-8% based on size',
        fairness: '⭐⭐⭐⭐⭐',
        manipulation: 'Prevented'
      },
      {
        platform: 'Pump.fun',
        protection: 'None',
        maxImpact: 'Unlimited',
        fairness: '⭐⭐',
        manipulation: 'Common'
      },
      {
        platform: 'Uniswap V2',
        protection: 'User-set slippage',
        maxImpact: 'User choice (often too high)',
        fairness: '⭐⭐⭐',
        manipulation: 'Possible'
      },
      {
        platform: 'Typical DEX',
        protection: 'Basic slippage',
        maxImpact: 'Often 10-20%',
        fairness: '⭐⭐⭐',
        manipulation: 'Frequent'
      }
    ];
    
    console.log('Platform     | Protection        | Max Impact                | Fairness | Manipulation');
    console.log('-------------|-------------------|---------------------------|----------|-------------');
    comparison.forEach(c => {
      console.log(`${c.platform.padEnd(12)} | ${c.protection.padEnd(17)} | ${c.maxImpact.padEnd(25)} | ${c.fairness.padEnd(8)} | ${c.manipulation}`);
    });
    
    console.log('\n💡 ADVANTAGES OF DEGENIE SLIPPAGE PROTECTION:');
    console.log('1. Progressive limits based on trade size (fair for all users)');
    console.log('2. Automatic protection (no user configuration needed)');
    console.log('3. Prevents whale manipulation while allowing growth');
    console.log('4. Maintains healthy price discovery');
    console.log('5. Protects small traders from getting rekt');
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run the demo
async function main() {
  const demo = new SlippageProtectionDemo();
  await demo.runDemo();
  
  console.log('\n🎯 KEY TAKEAWAYS:');
  console.log('1. Progressive limits ensure fairness for all trade sizes');
  console.log('2. Large trades are limited to prevent manipulation'); 
  console.log('3. Small traders are protected from whale dumps');
  console.log('4. Healthy price discovery is maintained');
  console.log('5. No user configuration needed - automatic protection');
  console.log('\n🛡️ DeGenie: Advanced slippage protection for everyone!');
}

main().catch(console.error);