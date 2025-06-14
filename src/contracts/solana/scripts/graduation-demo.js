#!/usr/bin/env node

/**
 * Graduation Demo - Shows automatic graduation to Raydium
 * Demonstrates the complete lifecycle from bonding curve to DEX
 */

const LAMPORTS_PER_SOL = 1_000_000_000;

class GraduationDemo {
    constructor() {
        // Bonding curve parameters
        this.initialPrice = 1000; // 0.001 SOL
        this.growthRate = 100; // 1%
        this.maxSupply = 1_000_000_000; // 1B tokens
        this.graduationThreshold = 69_000 * LAMPORTS_PER_SOL; // $69k market cap
        
        // State
        this.currentPrice = this.initialPrice;
        this.totalSupply = 0;
        this.treasuryBalance = 0;
        this.isGraduated = false;
        
        // Fees
        this.transactionFeeBps = 100; // 1%
        this.creatorFeeBps = 50; // 0.5%
        
        // Tracking
        this.transactions = [];
        this.milestones = [];
    }

    calculatePrice(supply) {
        const scaleFactor = 1000;
        const supplyScaled = Math.floor(supply / scaleFactor);
        const growthMultiplier = 1 + (this.growthRate / 10000);
        return Math.floor(this.initialPrice * Math.pow(growthMultiplier, supplyScaled));
    }

    buyTokens(solAmount, buyer = 'Buyer') {
        if (this.isGraduated) {
            console.log('❌ Token has graduated! Trade on Raydium instead.');
            return;
        }

        // Calculate fees
        const fee = Math.floor(solAmount * this.transactionFeeBps / 10000);
        const netSol = solAmount - fee;
        
        // Calculate tokens
        const avgPrice = this.currentPrice;
        const tokens = Math.floor(netSol / avgPrice);
        
        // Update state
        this.totalSupply += tokens;
        this.treasuryBalance += netSol;
        this.currentPrice = this.calculatePrice(this.totalSupply);
        
        // Record transaction
        const tx = {
            type: 'BUY',
            buyer,
            solAmount: solAmount / LAMPORTS_PER_SOL,
            tokens,
            price: avgPrice / LAMPORTS_PER_SOL,
            newPrice: this.currentPrice / LAMPORTS_PER_SOL,
            marketCap: (this.totalSupply * this.currentPrice) / LAMPORTS_PER_SOL
        };
        this.transactions.push(tx);
        
        console.log(`✅ ${buyer} bought ${tokens.toLocaleString()} tokens for ${(solAmount/LAMPORTS_PER_SOL).toFixed(2)} SOL`);
        console.log(`   Price: ${(avgPrice/LAMPORTS_PER_SOL).toFixed(6)} → ${(this.currentPrice/LAMPORTS_PER_SOL).toFixed(6)} SOL`);
        
        // Check graduation
        this.checkGraduation();
        
        return tx;
    }

    checkGraduation() {
        const marketCap = this.totalSupply * this.currentPrice;
        
        if (marketCap >= this.graduationThreshold && !this.isGraduated) {
            this.isGraduated = true;
            this.milestones.push({
                event: 'GRADUATION',
                marketCap: marketCap / LAMPORTS_PER_SOL,
                supply: this.totalSupply,
                price: this.currentPrice / LAMPORTS_PER_SOL,
                treasury: this.treasuryBalance / LAMPORTS_PER_SOL
            });
            
            console.log('\n🎓🎓🎓 TOKEN GRADUATED! 🎓🎓🎓');
            console.log(`Market cap: $${(marketCap / LAMPORTS_PER_SOL).toFixed(0)}`);
            console.log(`Treasury: ${(this.treasuryBalance / LAMPORTS_PER_SOL).toFixed(2)} SOL`);
            
            this.initiateRaydiumMigration();
        }
    }

    initiateRaydiumMigration() {
        console.log('\n🚀 INITIATING RAYDIUM MIGRATION...\n');
        
        // Calculate liquidity allocation
        const liquidityAmount = Math.floor(this.treasuryBalance * 0.85); // 85% for liquidity
        const platformFee = Math.floor(this.treasuryBalance * 0.10); // 10% platform
        const creatorBonus = Math.floor(this.treasuryBalance * 0.05); // 5% creator bonus
        
        console.log('💰 TREASURY ALLOCATION:');
        console.log(`   Total: ${(this.treasuryBalance / LAMPORTS_PER_SOL).toFixed(2)} SOL`);
        console.log(`   → Liquidity (85%): ${(liquidityAmount / LAMPORTS_PER_SOL).toFixed(2)} SOL`);
        console.log(`   → Platform (10%): ${(platformFee / LAMPORTS_PER_SOL).toFixed(2)} SOL`);
        console.log(`   → Creator Bonus (5%): ${(creatorBonus / LAMPORTS_PER_SOL).toFixed(2)} SOL\n`);
        
        // Calculate tokens for liquidity
        const tokensForLiquidity = Math.floor(this.totalSupply * 0.2); // 20% of supply
        
        console.log('🪙 TOKEN ALLOCATION:');
        console.log(`   Total Supply: ${this.totalSupply.toLocaleString()}`);
        console.log(`   → Liquidity (20%): ${tokensForLiquidity.toLocaleString()}`);
        console.log(`   → Circulating (80%): ${(this.totalSupply - tokensForLiquidity).toLocaleString()}\n`);
        
        // Create pool parameters
        const poolParams = {
            baseAmount: tokensForLiquidity,
            quoteAmount: liquidityAmount,
            initialPrice: liquidityAmount / tokensForLiquidity,
            lpTokens: Math.sqrt(tokensForLiquidity * liquidityAmount)
        };
        
        console.log('🏊 RAYDIUM POOL PARAMETERS:');
        console.log(`   Token Amount: ${poolParams.baseAmount.toLocaleString()}`);
        console.log(`   SOL Amount: ${(poolParams.quoteAmount / LAMPORTS_PER_SOL).toFixed(2)}`);
        console.log(`   Initial Price: ${(poolParams.initialPrice / LAMPORTS_PER_SOL).toFixed(6)} SOL`);
        console.log(`   LP Tokens: ${Math.floor(poolParams.lpTokens).toLocaleString()}\n`);
        
        console.log('🔥 LP TOKEN BURN:');
        console.log('   100% of LP tokens will be burned');
        console.log('   This makes the liquidity PERMANENT');
        console.log('   No rug pulls possible!\n');
        
        console.log('✅ MIGRATION COMPLETE!');
        console.log('   Token is now trading on Raydium');
        console.log('   Bonding curve is closed');
        console.log('   Full AMM functionality enabled\n');
        
        return poolParams;
    }

    runDemo() {
        console.log('🎯 DEGENIE GRADUATION DEMO\n');
        console.log('Starting bonding curve with:');
        console.log(`- Initial Price: ${(this.initialPrice / LAMPORTS_PER_SOL).toFixed(6)} SOL`);
        console.log(`- Growth Rate: ${this.growthRate / 100}%`);
        console.log(`- Graduation: $69,000 market cap\n`);
        
        console.log('📈 PHASE 1: EARLY BUYERS');
        this.buyTokens(0.1 * LAMPORTS_PER_SOL, 'Early_Bird_1');
        this.buyTokens(0.05 * LAMPORTS_PER_SOL, 'Early_Bird_2');
        this.buyTokens(0.02 * LAMPORTS_PER_SOL, 'Small_Buyer');
        this.printProgress();
        
        console.log('\n📈 PHASE 2: MOMENTUM BUILDING');
        for (let i = 0; i < 5; i++) {
            this.buyTokens(0.1 * LAMPORTS_PER_SOL, `FOMO_Buyer_${i+1}`);
        }
        this.printProgress();
        
        console.log('\n📈 PHASE 3: WHALE INTEREST');
        this.buyTokens(1 * LAMPORTS_PER_SOL, 'Whale_1');
        this.buyTokens(0.5 * LAMPORTS_PER_SOL, 'Medium_Whale');
        this.printProgress();
        
        console.log('\n📈 PHASE 4: PUSH TO GRADUATION');
        let buyCount = 0;
        while (!this.isGraduated && buyCount < 50) {
            this.buyTokens(0.3 * LAMPORTS_PER_SOL, `Grad_Push_${buyCount+1}`);
            buyCount++;
        }
        
        if (!this.isGraduated) {
            // Force graduation with big buy
            this.buyTokens(10 * LAMPORTS_PER_SOL, 'Graduation_Whale');
        }
        
        this.printFinalStats();
    }

    printProgress() {
        const marketCap = this.totalSupply * this.currentPrice;
        const progress = Math.min(100, (marketCap / this.graduationThreshold) * 100);
        
        console.log(`\n📊 Progress: ${progress.toFixed(1)}% to graduation`);
        console.log(`   Market Cap: $${(marketCap / LAMPORTS_PER_SOL).toFixed(0)}`);
        console.log(`   Price: ${(this.currentPrice / LAMPORTS_PER_SOL).toFixed(6)} SOL`);
        console.log(`   Supply: ${this.totalSupply.toLocaleString()} tokens`);
    }

    printFinalStats() {
        console.log('\n' + '='.repeat(60));
        console.log('📊 FINAL STATISTICS');
        console.log('='.repeat(60));
        
        console.log('\nTRANSACTION SUMMARY:');
        console.log(`- Total Buys: ${this.transactions.length}`);
        console.log(`- Total Volume: ${this.transactions.reduce((sum, tx) => sum + tx.solAmount, 0).toFixed(2)} SOL`);
        console.log(`- Final Price: ${(this.currentPrice / LAMPORTS_PER_SOL).toFixed(6)} SOL`);
        console.log(`- Price Increase: ${((this.currentPrice - this.initialPrice) / this.initialPrice * 100).toFixed(0)}%`);
        
        console.log('\nEARLY BUYER RETURNS:');
        const earlyBuyers = this.transactions.slice(0, 5);
        earlyBuyers.forEach(tx => {
            const currentValue = tx.tokens * this.currentPrice / LAMPORTS_PER_SOL;
            const roi = ((currentValue - tx.solAmount) / tx.solAmount * 100).toFixed(0);
            console.log(`- ${tx.buyer}: ${tx.solAmount} SOL → ${currentValue.toFixed(2)} SOL (+${roi}%)`);
        });
        
        console.log('\nGRADUATION BENEFITS:');
        console.log('✅ Permanent liquidity (LP burned)');
        console.log('✅ No more bonding curve restrictions');
        console.log('✅ Full AMM trading on Raydium');
        console.log('✅ Eligible for farm rewards');
        console.log('✅ Can be listed on CEXs');
        console.log('✅ Price discovery through market');
    }
}

// Run the demo
if (require.main === module) {
    const demo = new GraduationDemo();
    demo.runDemo();
    
    console.log('\n\n💡 KEY TAKEAWAYS:');
    console.log('1. Graduation happens automatically at $69k market cap');
    console.log('2. 85% of treasury goes to Raydium liquidity');
    console.log('3. LP tokens are burned for permanent liquidity');
    console.log('4. Early buyers see significant returns');
    console.log('5. Creator gets 0.5% of all trading fees');
    console.log('6. No rug pull possible after graduation');
}

module.exports = GraduationDemo;