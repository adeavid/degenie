#!/usr/bin/env node

/**
 * Enhanced Bonding Curve Simulation with Exponential Curves and Fees
 * Simulates the new implementation with pump.fun-like features
 */

const LAMPORTS_PER_SOL = 1_000_000_000;

class EnhancedBondingCurveSimulator {
    constructor(curveType = 'exponential', growthRate = 100) {
        // Basic parameters
        this.curveType = curveType; // 'linear', 'exponential', 'logarithmic'
        this.initialPrice = 1000; // 0.001 SOL per token (in lamports)
        this.priceIncrement = 100; // For linear curve
        this.growthRate = growthRate; // Basis points (100 = 1%)
        this.maxSupply = 1_000_000; // 1M tokens maximum
        this.graduationThreshold = 69_000 * LAMPORTS_PER_SOL; // $69k market cap
        
        // State
        this.currentPrice = this.initialPrice;
        this.totalSupply = 0;
        this.treasuryBalance = 0;
        this.totalVolume = 0;
        this.isGraduated = false;
        
        // Fees (in basis points)
        this.creationFee = 20_000_000; // 0.02 SOL
        this.transactionFeeBps = 100; // 1%
        this.creatorFeeBps = 50; // 0.5%
        this.platformFeeBps = 50; // 0.5%
        
        // Tracking
        this.transactions = [];
        this.priceHistory = [{x: 0, y: this.currentPrice / LAMPORTS_PER_SOL}];
        this.feesCollected = {
            creation: 0,
            transaction: 0,
            creator: 0,
            platform: 0
        };
    }

    // Calculate price based on curve type
    calculatePrice(supply) {
        switch (this.curveType) {
            case 'linear':
                return this.initialPrice + (this.priceIncrement * supply / 1000);
            
            case 'exponential':
                // Exponential: price = initial * (1 + growthRate/10000) ^ (supply / scale)
                const scaleFactor = 1000;
                const supplyScaled = Math.floor(supply / scaleFactor);
                const growthMultiplier = 1 + (this.growthRate / 10000);
                return Math.floor(this.initialPrice * Math.pow(growthMultiplier, supplyScaled));
            
            case 'logarithmic':
                // Logarithmic: rapid initial growth that tapers off
                if (supply === 0) return this.initialPrice;
                return Math.floor(this.initialPrice * (1 + Math.log(1 + supply / 1000)));
            
            default:
                return this.currentPrice;
        }
    }

    // Calculate tokens for SOL amount (with fees)
    calculateTokensForSol(solAmount) {
        // Calculate transaction fee
        const transactionFee = Math.floor(solAmount * this.transactionFeeBps / 10000);
        const solAfterFee = solAmount - transactionFee;
        
        // For exponential curve, we estimate based on average price
        // In production, this would use integration
        const avgPrice = this.currentPrice;
        const tokens = Math.floor(solAfterFee / avgPrice);
        
        return { tokens, fee: transactionFee, netSol: solAfterFee };
    }

    // Buy tokens
    buyTokens(solAmount, buyerId = 'anonymous') {
        if (this.isGraduated) {
            throw new Error('Token has graduated to DEX - trade there instead');
        }
        
        const { tokens: tokensToMint, fee, netSol } = this.calculateTokensForSol(solAmount);
        
        // Check max supply
        if (this.totalSupply + tokensToMint > this.maxSupply) {
            throw new Error(`Purchase would exceed max supply. Available: ${this.maxSupply - this.totalSupply}`);
        }

        // Update state
        this.totalSupply += tokensToMint;
        this.treasuryBalance += netSol;
        this.totalVolume += solAmount;
        
        // Update fees
        this.feesCollected.transaction += fee;
        const creatorFee = Math.floor(fee * this.creatorFeeBps / this.transactionFeeBps);
        const platformFee = fee - creatorFee;
        this.feesCollected.creator += creatorFee;
        this.feesCollected.platform += platformFee;
        
        // Update price based on new supply
        this.currentPrice = this.calculatePrice(this.totalSupply);
        
        // Check for graduation
        const marketCap = this.totalSupply * this.currentPrice;
        if (marketCap >= this.graduationThreshold) {
            this.isGraduated = true;
            console.log('🎓 TOKEN GRADUATED! Market cap reached $69k equivalent');
            console.log('   Ready for DEX migration with $12k liquidity');
        }

        const transaction = {
            type: 'BUY',
            buyer: buyerId,
            solAmount: solAmount / LAMPORTS_PER_SOL,
            tokensReceived: tokensToMint,
            fee: fee / LAMPORTS_PER_SOL,
            priceAfter: this.currentPrice,
            supplyAfter: this.totalSupply,
            marketCap: marketCap / LAMPORTS_PER_SOL,
            timestamp: new Date().toISOString()
        };

        this.transactions.push(transaction);
        this.priceHistory.push({x: this.priceHistory.length, y: this.currentPrice / LAMPORTS_PER_SOL});
        
        console.log(`🟢 BUY: ${buyerId} spent ${(solAmount/LAMPORTS_PER_SOL).toFixed(4)} SOL (fee: ${(fee/LAMPORTS_PER_SOL).toFixed(4)} SOL)`);
        console.log(`   Received: ${tokensToMint} tokens @ ${(this.currentPrice/LAMPORTS_PER_SOL).toFixed(6)} SOL`);
        
        return transaction;
    }

    // Sell tokens (simplified for simulation)
    sellTokens(tokenAmount, sellerId = 'anonymous') {
        if (this.isGraduated) {
            throw new Error('Token has graduated to DEX - trade there instead');
        }
        
        if (tokenAmount > this.totalSupply) {
            throw new Error('Not enough tokens in circulation');
        }
        
        // Calculate SOL to return (with fees)
        const newSupply = this.totalSupply - tokenAmount;
        const newPrice = this.calculatePrice(newSupply);
        const avgPrice = (this.currentPrice + newPrice) / 2;
        const grossSol = Math.floor(tokenAmount * avgPrice);
        
        const fee = Math.floor(grossSol * this.transactionFeeBps / 10000);
        const netSol = grossSol - fee;
        
        if (netSol > this.treasuryBalance) {
            throw new Error('Insufficient treasury funds');
        }

        // Update state
        this.totalSupply = newSupply;
        this.treasuryBalance -= netSol;
        this.totalVolume += grossSol;
        this.currentPrice = newPrice;
        
        // Update fees
        this.feesCollected.transaction += fee;
        const creatorFee = Math.floor(fee * this.creatorFeeBps / this.transactionFeeBps);
        const platformFee = fee - creatorFee;
        this.feesCollected.creator += creatorFee;
        this.feesCollected.platform += platformFee;

        const transaction = {
            type: 'SELL',
            seller: sellerId,
            tokenAmount,
            solReceived: netSol / LAMPORTS_PER_SOL,
            fee: fee / LAMPORTS_PER_SOL,
            priceAfter: this.currentPrice,
            supplyAfter: this.totalSupply,
            timestamp: new Date().toISOString()
        };

        this.transactions.push(transaction);
        this.priceHistory.push({x: this.priceHistory.length, y: this.currentPrice / LAMPORTS_PER_SOL});
        
        console.log(`🔴 SELL: ${sellerId} sold ${tokenAmount} tokens`);
        console.log(`   Received: ${(netSol/LAMPORTS_PER_SOL).toFixed(4)} SOL (fee: ${(fee/LAMPORTS_PER_SOL).toFixed(4)} SOL)`);
        
        return transaction;
    }

    // Print current state
    printState() {
        const marketCap = this.totalSupply * this.currentPrice;
        const graduationProgress = Math.min(100, (marketCap / this.graduationThreshold) * 100);
        
        console.log('\n📊 ENHANCED BONDING CURVE STATE:');
        console.log(`   Curve Type: ${this.curveType.toUpperCase()} (growth: ${this.growthRate/100}%)`);
        console.log(`   Current Price: ${(this.currentPrice/LAMPORTS_PER_SOL).toFixed(6)} SOL per token`);
        console.log(`   Price Change: ${((this.currentPrice - this.initialPrice) / this.initialPrice * 100).toFixed(2)}%`);
        console.log(`   Total Supply: ${this.totalSupply.toLocaleString()} tokens`);
        console.log(`   Treasury: ${(this.treasuryBalance/LAMPORTS_PER_SOL).toFixed(4)} SOL`);
        console.log(`   Market Cap: ${(marketCap/LAMPORTS_PER_SOL).toFixed(2)} SOL ($${(marketCap/LAMPORTS_PER_SOL * 150).toFixed(0)})`);
        console.log(`   Total Volume: ${(this.totalVolume/LAMPORTS_PER_SOL).toFixed(4)} SOL`);
        console.log(`   Graduation Progress: ${graduationProgress.toFixed(1)}% ${this.isGraduated ? '🎓 GRADUATED!' : ''}`);
        console.log(`   \n💰 FEES COLLECTED:`);
        console.log(`   Creation Fee: ${(this.feesCollected.creation/LAMPORTS_PER_SOL).toFixed(4)} SOL`);
        console.log(`   Transaction Fees: ${(this.feesCollected.transaction/LAMPORTS_PER_SOL).toFixed(4)} SOL`);
        console.log(`   - Creator Share: ${(this.feesCollected.creator/LAMPORTS_PER_SOL).toFixed(4)} SOL`);
        console.log(`   - Platform Share: ${(this.feesCollected.platform/LAMPORTS_PER_SOL).toFixed(4)} SOL\n`);
    }

    // Run comprehensive simulation
    runSimulation() {
        console.log('🚀 Starting Enhanced Bonding Curve Simulation (Pump.fun Style)...\n');
        
        // Pay creation fee
        this.feesCollected.creation = this.creationFee;
        console.log(`💳 Paid creation fee: ${(this.creationFee/LAMPORTS_PER_SOL).toFixed(3)} SOL`);
        
        try {
            this.printState();

            console.log('📈 Phase 1: Early buyers (FOMO generation)');
            this.buyTokens(0.1 * LAMPORTS_PER_SOL, 'Early_Whale');
            this.buyTokens(0.05 * LAMPORTS_PER_SOL, 'Degen_1');
            this.buyTokens(0.02 * LAMPORTS_PER_SOL, 'Ape_1');
            this.printState();

            console.log('📈 Phase 2: Momentum building');
            for (let i = 0; i < 5; i++) {
                this.buyTokens(0.03 * LAMPORTS_PER_SOL, `FOMO_${i}`);
            }
            this.printState();

            console.log('📉 Phase 3: Some profit taking');
            this.sellTokens(50, 'Degen_1');
            this.sellTokens(30, 'Ape_1');
            this.printState();

            console.log('🚀 Phase 4: Major buying pressure');
            this.buyTokens(0.5 * LAMPORTS_PER_SOL, 'Big_Whale');
            this.buyTokens(0.3 * LAMPORTS_PER_SOL, 'Institution_1');
            this.printState();

            console.log('🎯 Phase 5: Push towards graduation');
            while (!this.isGraduated && this.transactions.length < 100) {
                try {
                    this.buyTokens(0.2 * LAMPORTS_PER_SOL, `Grad_Push_${this.transactions.length}`);
                } catch (e) {
                    console.log(`⚠️  ${e.message}`);
                    break;
                }
            }

            console.log('\n🏁 SIMULATION COMPLETE');
            this.printState();
            this.printPriceComparison();
            
        } catch (error) {
            console.error(`❌ Simulation error: ${error.message}`);
        }
    }

    // Compare linear vs exponential growth
    printPriceComparison() {
        console.log('\n📈 PRICE COMPARISON (Linear vs Exponential):');
        console.log('Supply    | Linear Price  | Exponential Price | Difference');
        console.log('----------|---------------|-------------------|------------');
        
        const supplies = [0, 1000, 5000, 10000, 50000, 100000];
        supplies.forEach(supply => {
            const linearPrice = this.initialPrice + (this.priceIncrement * supply / 1000);
            const expPrice = this.calculatePrice(supply);
            const diff = ((expPrice - linearPrice) / linearPrice * 100).toFixed(1);
            
            console.log(`${supply.toString().padEnd(9)} | ${(linearPrice/LAMPORTS_PER_SOL).toFixed(6)} SOL | ${(expPrice/LAMPORTS_PER_SOL).toFixed(6)} SOL | +${diff}%`);
        });
    }
}

// Run different curve types
if (require.main === module) {
    console.log('='.repeat(80));
    console.log('EXPONENTIAL CURVE SIMULATION (1% growth rate - Pump.fun style)');
    console.log('='.repeat(80));
    const expSimulator = new EnhancedBondingCurveSimulator('exponential', 100);
    expSimulator.runSimulation();
    
    console.log('\n\n' + '='.repeat(80));
    console.log('LINEAR CURVE SIMULATION (for comparison)');
    console.log('='.repeat(80));
    const linearSimulator = new EnhancedBondingCurveSimulator('linear', 100);
    linearSimulator.runSimulation();
}

module.exports = EnhancedBondingCurveSimulator;