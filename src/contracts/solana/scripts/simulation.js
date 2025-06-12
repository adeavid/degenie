/**
 * Bonding Curve Transaction Simulation Script
 * Simulates buy/sell transactions to validate bonding curve mechanics
 */

const anchor = require('@coral-xyz/anchor');

class BondingCurveSimulator {
    constructor() {
        this.initialPrice = 1000; // 0.001 SOL per token (in lamports)
        this.priceIncrement = 100; // 0.0001 SOL increment per token
        this.maxSupply = 1_000_000; // 1M tokens maximum
        this.currentPrice = this.initialPrice;
        this.totalSupply = 0;
        this.treasury = 0; // SOL collected in treasury
        this.transactions = [];
    }

    // Calculate tokens received for SOL amount
    calculateTokensForSol(solAmount) {
        if (solAmount <= 0) throw new Error('SOL amount must be positive');
        if (this.currentPrice <= 0) throw new Error('Invalid price state');
        
        return Math.floor(solAmount / this.currentPrice);
    }

    // Calculate SOL received for token amount
    calculateSolForTokens(tokenAmount) {
        if (tokenAmount <= 0) throw new Error('Token amount must be positive');
        if (this.currentPrice <= 0) throw new Error('Invalid price state');
        
        return tokenAmount * this.currentPrice;
    }

    // Simulate buying tokens
    buyTokens(solAmount, buyerId = 'anonymous') {
        const tokensToMint = this.calculateTokensForSol(solAmount);
        
        // Check max supply
        if (this.totalSupply + tokensToMint > this.maxSupply) {
            throw new Error(`Purchase would exceed max supply. Requested: ${tokensToMint}, Available: ${this.maxSupply - this.totalSupply}`);
        }

        // Update state
        this.totalSupply += tokensToMint;
        this.treasury += solAmount;
        this.currentPrice += Math.floor(this.priceIncrement * tokensToMint / 1000);

        const transaction = {
            type: 'BUY',
            buyer: buyerId,
            solAmount,
            tokensReceived: tokensToMint,
            priceAfter: this.currentPrice,
            supplyAfter: this.totalSupply,
            timestamp: new Date().toISOString()
        };

        this.transactions.push(transaction);
        console.log(`🟢 BUY: ${buyerId} spent ${solAmount} lamports, received ${tokensToMint} tokens. New price: ${this.currentPrice}`);
        
        return transaction;
    }

    // Simulate selling tokens
    sellTokens(tokenAmount, sellerId = 'anonymous') {
        const solToReturn = this.calculateSolForTokens(tokenAmount);
        
        // Check if treasury has enough SOL
        if (solToReturn > this.treasury) {
            throw new Error(`Insufficient treasury funds. Requested: ${solToReturn}, Available: ${this.treasury}`);
        }

        // Update state
        this.totalSupply -= tokenAmount;
        this.treasury -= solToReturn;
        this.currentPrice = Math.max(
            this.initialPrice,
            this.currentPrice - Math.floor(this.priceIncrement * tokenAmount / 1000)
        );

        const transaction = {
            type: 'SELL',
            seller: sellerId,
            tokenAmount,
            solReceived: solToReturn,
            priceAfter: this.currentPrice,
            supplyAfter: this.totalSupply,
            timestamp: new Date().toISOString()
        };

        this.transactions.push(transaction);
        console.log(`🔴 SELL: ${sellerId} sold ${tokenAmount} tokens, received ${solToReturn} lamports. New price: ${this.currentPrice}`);
        
        return transaction;
    }

    // Get current state
    getState() {
        return {
            currentPrice: this.currentPrice,
            totalSupply: this.totalSupply,
            maxSupply: this.maxSupply,
            treasury: this.treasury,
            marketCap: this.totalSupply * this.currentPrice,
            transactionCount: this.transactions.length
        };
    }

    // Print detailed state
    printState() {
        const state = this.getState();
        console.log('\n📊 BONDING CURVE STATE:');
        console.log(`   Current Price: ${state.currentPrice} lamports per token`);
        console.log(`   Total Supply: ${state.totalSupply.toLocaleString()} tokens`);
        console.log(`   Max Supply: ${state.maxSupply.toLocaleString()} tokens`);
        console.log(`   Treasury: ${state.treasury.toLocaleString()} lamports`);
        console.log(`   Market Cap: ${state.marketCap.toLocaleString()} lamports`);
        console.log(`   Transactions: ${state.transactionCount}`);
        console.log(`   Supply Utilization: ${((state.totalSupply / state.maxSupply) * 100).toFixed(2)}%\n`);
    }

    // Run comprehensive simulation
    runSimulation() {
        console.log('🚀 Starting Bonding Curve Simulation...\n');
        
        try {
            // Initial state
            this.printState();

            // Simulate various trading scenarios
            console.log('📈 Phase 1: Initial buying pressure');
            this.buyTokens(50_000, 'whale_1');     // 0.05 SOL
            this.buyTokens(20_000, 'trader_1');    // 0.02 SOL
            this.buyTokens(10_000, 'trader_2');    // 0.01 SOL
            this.printState();

            console.log('📉 Phase 2: Some profit taking');
            this.sellTokens(25, 'trader_1');       // Sell some tokens
            this.sellTokens(10, 'trader_2');       // Sell some tokens
            this.printState();

            console.log('📈 Phase 3: More buying interest');
            this.buyTokens(100_000, 'whale_2');    // 0.1 SOL
            this.buyTokens(75_000, 'whale_1');     // 0.075 SOL - whale_1 buys more
            this.buyTokens(25_000, 'trader_3');    // 0.025 SOL
            this.printState();

            console.log('📊 Phase 4: Mixed trading activity');
            this.sellTokens(50, 'whale_1');        // Whale takes some profit
            this.buyTokens(30_000, 'trader_4');    // New trader enters
            this.sellTokens(15, 'trader_3');       // Trader takes profit
            this.buyTokens(40_000, 'institution_1'); // Institution enters
            this.printState();

            console.log('🎯 Phase 5: High volume testing');
            for (let i = 0; i < 5; i++) {
                this.buyTokens(20_000, `bot_${i}`);
            }
            this.printState();

            // Test edge cases
            console.log('⚠️  Testing edge cases...');
            
            // Test max supply approach
            const remainingSupply = this.maxSupply - this.totalSupply;
            const affordableTokens = Math.min(remainingSupply, 100);
            const solNeeded = affordableTokens * this.currentPrice;
            
            if (affordableTokens > 0) {
                this.buyTokens(solNeeded, 'final_buyer');
                console.log(`✅ Successfully bought ${affordableTokens} tokens approaching max supply`);
            }

            // Final state
            console.log('🏁 SIMULATION COMPLETE');
            this.printState();
            
            // Summary statistics
            this.printTransactionSummary();
            
        } catch (error) {
            console.error(`❌ Simulation error: ${error.message}`);
        }
    }

    // Print transaction summary
    printTransactionSummary() {
        console.log('📋 TRANSACTION SUMMARY:');
        
        const buys = this.transactions.filter(tx => tx.type === 'BUY');
        const sells = this.transactions.filter(tx => tx.type === 'SELL');
        
        const totalSolSpent = buys.reduce((sum, tx) => sum + tx.solAmount, 0);
        const totalTokensBought = buys.reduce((sum, tx) => sum + tx.tokensReceived, 0);
        const totalSolReceived = sells.reduce((sum, tx) => sum + tx.solReceived, 0);
        const totalTokensSold = sells.reduce((sum, tx) => sum + tx.tokenAmount, 0);
        
        console.log(`   Buy Transactions: ${buys.length}`);
        console.log(`   Sell Transactions: ${sells.length}`);
        console.log(`   Total SOL Spent: ${totalSolSpent.toLocaleString()} lamports`);
        console.log(`   Total Tokens Bought: ${totalTokensBought.toLocaleString()}`);
        console.log(`   Total SOL Received: ${totalSolReceived.toLocaleString()} lamports`);
        console.log(`   Total Tokens Sold: ${totalTokensSold.toLocaleString()}`);
        console.log(`   Net SOL Flow: ${(totalSolSpent - totalSolReceived).toLocaleString()} lamports`);
        console.log(`   Net Token Flow: ${(totalTokensBought - totalTokensSold).toLocaleString()} tokens`);
        
        // Price analysis
        const startPrice = this.initialPrice;
        const endPrice = this.currentPrice;
        const priceChange = ((endPrice - startPrice) / startPrice * 100).toFixed(2);
        
        console.log(`   Price Change: ${startPrice} → ${endPrice} lamports (${priceChange}%)`);
    }
}

// Run simulation if called directly
if (require.main === module) {
    const simulator = new BondingCurveSimulator();
    simulator.runSimulation();
}

module.exports = BondingCurveSimulator;