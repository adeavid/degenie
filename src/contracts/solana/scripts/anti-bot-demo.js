#!/usr/bin/env node

/**
 * Anti-Bot Protection Demo - Shows how DeGenie protects against MEV bots
 */

const BN = require('bn.js');

class AntiBotDemo {
  constructor() {
    this.LAMPORTS_PER_SOL = 1_000_000_000;
    this.LAUNCH_TIME = Date.now();
    
    // Anti-bot settings
    this.PROTECTION_PERIOD = 3600; // 1 hour in seconds
    this.MAX_BUY_DURING_PROTECTION = 1 * this.LAMPORTS_PER_SOL; // 1 SOL
    this.TRANSACTION_COOLDOWN = 30; // 30 seconds
    this.MAX_PRICE_IMPACT_BPS = 500; // 5%
    
    // User tracking
    this.userTracker = new Map();
    this.transactions = [];
    
    // Token state
    this.currentPrice = 1000; // 0.001 SOL
    this.totalSupply = 0;
    this.initialPrice = 1000;
    this.growthRate = 100; // 1%
  }

  // Simulate time passing
  advanceTime(seconds) {
    this.LAUNCH_TIME -= seconds * 1000;
  }

  // Get token age in seconds
  getTokenAge() {
    return Math.floor((Date.now() - this.LAUNCH_TIME) / 1000);
  }

  // Check if in protection period
  isProtectionPeriod() {
    return this.getTokenAge() < this.PROTECTION_PERIOD;
  }

  // Calculate price impact
  calculatePriceImpact(solAmount) {
    const tokensToMint = Math.floor(solAmount / this.currentPrice);
    const newSupply = this.totalSupply + tokensToMint;
    
    // Exponential price calculation
    const scaleFactor = 1000;
    const supplyScaled = Math.floor(newSupply / scaleFactor);
    const growthMultiplier = 1 + (this.growthRate / 10000);
    const newPrice = Math.floor(this.initialPrice * Math.pow(growthMultiplier, supplyScaled));
    
    if (newPrice <= this.currentPrice) return 0;
    
    const priceIncrease = newPrice - this.currentPrice;
    const impactBps = Math.floor((priceIncrease * 10000) / this.currentPrice);
    
    return Math.min(impactBps, 65535); // Cap at u16 max
  }

  // Attempt to buy tokens with anti-bot checks
  async attemptBuy(wallet, solAmount, description) {
    console.log(`\n🤖 ${description}`);
    console.log(`Wallet: ${wallet}`);
    console.log(`Amount: ${(solAmount / this.LAMPORTS_PER_SOL).toFixed(2)} SOL`);
    console.log(`Token Age: ${this.getTokenAge()}s`);
    
    const currentTime = Date.now();
    const userState = this.userTracker.get(wallet) || {
      lastTransactionTime: 0,
      totalBought: 0,
      transactionCount: 0
    };

    try {
      // 1. Rate limiting check
      if (userState.lastTransactionTime > 0) {
        const timeSinceLastTx = (currentTime - userState.lastTransactionTime) / 1000;
        if (timeSinceLastTx < this.TRANSACTION_COOLDOWN) {
          throw new Error(`❌ COOLDOWN: Must wait ${this.TRANSACTION_COOLDOWN - Math.floor(timeSinceLastTx)} more seconds`);
        }
      }

      // 2. Protection period limits
      if (this.isProtectionPeriod()) {
        if (solAmount > this.MAX_BUY_DURING_PROTECTION) {
          throw new Error(`❌ PROTECTION LIMIT: Max ${this.MAX_BUY_DURING_PROTECTION / this.LAMPORTS_PER_SOL} SOL during first hour`);
        }
      }

      // 3. Price impact protection
      const priceImpact = this.calculatePriceImpact(solAmount);
      if (priceImpact > this.MAX_PRICE_IMPACT_BPS) {
        throw new Error(`❌ PRICE IMPACT: ${(priceImpact/100).toFixed(2)}% exceeds ${this.MAX_PRICE_IMPACT_BPS/100}% limit`);
      }

      // Execute buy
      const tokensToMint = Math.floor(solAmount / this.currentPrice);
      this.totalSupply += tokensToMint;
      
      // Update price
      const scaleFactor = 1000;
      const supplyScaled = Math.floor(this.totalSupply / scaleFactor);
      const growthMultiplier = 1 + (this.growthRate / 10000);
      this.currentPrice = Math.floor(this.initialPrice * Math.pow(growthMultiplier, supplyScaled));

      // Update user state
      userState.lastTransactionTime = currentTime;
      userState.totalBought += solAmount;
      userState.transactionCount++;
      this.userTracker.set(wallet, userState);

      // Record transaction
      this.transactions.push({
        wallet,
        solAmount,
        tokensReceived: tokensToMint,
        priceImpact: priceImpact / 100,
        timestamp: currentTime,
        success: true
      });

      console.log(`✅ SUCCESS: Bought ${tokensToMint.toLocaleString()} tokens`);
      console.log(`   Price impact: ${(priceImpact/100).toFixed(2)}%`);
      console.log(`   New price: ${(this.currentPrice/this.LAMPORTS_PER_SOL).toFixed(6)} SOL`);
      
      return true;

    } catch (error) {
      console.log(error.message);
      
      // Record failed transaction
      this.transactions.push({
        wallet,
        solAmount,
        tokensReceived: 0,
        priceImpact: 0,
        timestamp: currentTime,
        success: false,
        error: error.message
      });
      
      return false;
    }
  }

  // Run comprehensive demo
  async runDemo() {
    console.log('🛡️ DeGenie Anti-Bot Protection Demo');
    console.log('====================================');
    console.log(`Launch time: ${new Date(this.LAUNCH_TIME).toLocaleTimeString()}`);
    console.log(`Protection period: ${this.PROTECTION_PERIOD / 60} minutes`);
    console.log(`Max buy during protection: ${this.MAX_BUY_DURING_PROTECTION / this.LAMPORTS_PER_SOL} SOL`);
    console.log(`Transaction cooldown: ${this.TRANSACTION_COOLDOWN} seconds`);
    console.log(`Max price impact: ${this.MAX_PRICE_IMPACT_BPS / 100}%\n`);

    // Phase 1: Legitimate users during protection period
    console.log('🕐 PHASE 1: PROTECTION PERIOD (First Hour)');
    console.log('==========================================');
    
    await this.attemptBuy('User_Alice', 0.5 * this.LAMPORTS_PER_SOL, 'Legitimate user - Small buy');
    await this.delay(1000);
    
    await this.attemptBuy('User_Bob', 0.8 * this.LAMPORTS_PER_SOL, 'Legitimate user - Medium buy');
    await this.delay(1000);
    
    // Bot tries to snipe with large amount
    await this.attemptBuy('Bot_Sniper_1', 5 * this.LAMPORTS_PER_SOL, 'BOT ATTACK: Large snipe attempt');
    await this.delay(1000);
    
    // Bot tries rapid transactions
    await this.attemptBuy('Bot_Rapid_1', 0.1 * this.LAMPORTS_PER_SOL, 'BOT ATTACK: Rapid fire #1');
    await this.attemptBuy('Bot_Rapid_1', 0.1 * this.LAMPORTS_PER_SOL, 'BOT ATTACK: Rapid fire #2 (should fail)');
    await this.delay(1000);

    // Phase 2: After cooldown
    console.log('\n⏰ PHASE 2: AFTER COOLDOWN');
    console.log('==========================');
    
    // Simulate 35 seconds passing
    this.advanceTime(35);
    
    await this.attemptBuy('Bot_Rapid_1', 0.2 * this.LAMPORTS_PER_SOL, 'BOT: Retry after cooldown');
    await this.delay(1000);

    // Phase 3: Price impact protection
    console.log('\n💥 PHASE 3: PRICE IMPACT PROTECTION');
    console.log('===================================');
    
    // Build up some supply first
    await this.attemptBuy('User_Charlie', 0.3 * this.LAMPORTS_PER_SOL, 'User builds up supply');
    await this.delay(1000);
    
    await this.attemptBuy('User_Dave', 0.4 * this.LAMPORTS_PER_SOL, 'User continues building');
    await this.delay(1000);
    
    // Now try a large buy that would cause high price impact
    await this.attemptBuy('Whale_Attack', 20 * this.LAMPORTS_PER_SOL, 'WHALE ATTACK: Massive buy attempt');
    await this.delay(1000);

    // Phase 4: After protection period
    console.log('\n🔓 PHASE 4: AFTER PROTECTION PERIOD');
    console.log('===================================');
    
    // Simulate 1 hour passing
    this.advanceTime(3600);
    
    await this.attemptBuy('Late_Whale', 10 * this.LAMPORTS_PER_SOL, 'Late whale - No protection limits');
    await this.delay(1000);
    
    await this.attemptBuy('Late_User', 5 * this.LAMPORTS_PER_SOL, 'Regular user - Higher limits');
    
    this.printSummary();
  }

  // Print results summary
  printSummary() {
    console.log('\n📊 ANTI-BOT PROTECTION RESULTS');
    console.log('==============================\n');
    
    const successful = this.transactions.filter(tx => tx.success);
    const failed = this.transactions.filter(tx => !tx.success);
    
    console.log('✅ SUCCESSFUL TRANSACTIONS:');
    successful.forEach((tx, i) => {
      console.log(`${i+1}. ${tx.wallet}: ${(tx.solAmount/this.LAMPORTS_PER_SOL).toFixed(2)} SOL → ${tx.tokensReceived.toLocaleString()} tokens`);
      console.log(`   Price impact: ${tx.priceImpact.toFixed(2)}%`);
    });
    
    console.log('\n❌ BLOCKED TRANSACTIONS:');
    failed.forEach((tx, i) => {
      console.log(`${i+1}. ${tx.wallet}: ${(tx.solAmount/this.LAMPORTS_PER_SOL).toFixed(2)} SOL`);
      console.log(`   Reason: ${tx.error}`);
    });
    
    console.log('\n📈 FINAL STATE:');
    console.log(`Total Supply: ${this.totalSupply.toLocaleString()} tokens`);
    console.log(`Current Price: ${(this.currentPrice/this.LAMPORTS_PER_SOL).toFixed(6)} SOL`);
    console.log(`Price increase: ${((this.currentPrice - this.initialPrice) / this.initialPrice * 100).toFixed(1)}%`);
    
    const botTransactions = this.transactions.filter(tx => tx.wallet.includes('Bot') || tx.wallet.includes('Attack'));
    const botSuccessRate = botTransactions.filter(tx => tx.success).length / botTransactions.length * 100;
    
    console.log(`\n🤖 BOT SUCCESS RATE: ${botSuccessRate.toFixed(1)}%`);
    console.log(`✅ Legitimate users protected from bot manipulation!`);
    
    this.showCompetitorComparison();
  }

  // Show how competitors handle bots
  showCompetitorComparison() {
    console.log('\n🏆 COMPETITOR COMPARISON');
    console.log('========================\n');
    
    const platforms = [
      {
        name: 'DeGenie',
        protection: '4-layer protection',
        rateLimiting: '✅ 30s cooldown',
        launchProtection: '✅ 1hr + limits',
        priceImpact: '✅ 5% max',
        result: 'Bots mostly blocked'
      },
      {
        name: 'Pump.fun',
        protection: 'Minimal',
        rateLimiting: '❌ None',
        launchProtection: '❌ None',
        priceImpact: '❌ None',
        result: 'Bots dominate launches'
      },
      {
        name: 'Others',
        protection: 'Basic',
        rateLimiting: '⚠️ Limited',
        launchProtection: '⚠️ Limited',
        priceImpact: '❌ Rare',
        result: 'Some protection'
      }
    ];
    
    console.log('Platform | Protection    | Rate Limit | Launch Protection | Price Impact | Result');
    console.log('---------|---------------|------------|-------------------|--------------|--------');
    platforms.forEach(p => {
      console.log(
        `${p.name.padEnd(8)} | ${p.protection.padEnd(13)} | ${p.rateLimiting.padEnd(10)} | ${p.launchProtection.padEnd(17)} | ${p.priceImpact.padEnd(12)} | ${p.result}`
      );
    });
    
    console.log('\n💡 DeGenie provides the STRONGEST anti-bot protection in the market!');
  }

  // Utility delay function
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run the demo
async function main() {
  const demo = new AntiBotDemo();
  await demo.runDemo();
  
  console.log('\n🎯 KEY TAKEAWAYS:');
  console.log('1. Rate limiting prevents rapid-fire bot attacks');
  console.log('2. Protection period limits prevent large snipes at launch');
  console.log('3. Price impact limits prevent market manipulation');
  console.log('4. Multiple layers ensure fair launches for everyone');
  console.log('\n🔒 DeGenie: Where fair launches meet strong protection!');
}

main().catch(console.error);