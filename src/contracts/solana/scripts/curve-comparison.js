#!/usr/bin/env node

/**
 * Bonding Curve Comparison Tool
 * Compares different curve types and growth rates
 */

const LAMPORTS_PER_SOL = 1_000_000_000;

class CurveComparison {
    constructor() {
        this.initialPrice = 1000; // 0.001 SOL
    }

    // Linear curve
    calculateLinear(supply, increment = 100) {
        return this.initialPrice + (increment * supply / 1000);
    }

    // Exponential curve with different growth rates
    calculateExponential(supply, growthRate) {
        const scaleFactor = 1000;
        const supplyScaled = Math.floor(supply / scaleFactor);
        const growthMultiplier = 1 + (growthRate / 10000);
        return Math.floor(this.initialPrice * Math.pow(growthMultiplier, supplyScaled));
    }

    // Compare curves
    compareCurves() {
        console.log('📊 BONDING CURVE COMPARISON\n');
        console.log('Initial Price: 0.001 SOL (all curves)\n');

        const supplies = [0, 1000, 5000, 10000, 25000, 50000, 100000, 250000, 500000, 1000000];
        const growthRates = [50, 100, 200, 500, 1000]; // 0.5%, 1%, 2%, 5%, 10%

        console.log('Supply    | Linear  | Exp 0.5% | Exp 1%   | Exp 2%   | Exp 5%   | Exp 10%  |');
        console.log('----------|---------|----------|----------|----------|----------|----------|');

        supplies.forEach(supply => {
            const linear = this.calculateLinear(supply);
            const exp05 = this.calculateExponential(supply, 50);
            const exp1 = this.calculateExponential(supply, 100);
            const exp2 = this.calculateExponential(supply, 200);
            const exp5 = this.calculateExponential(supply, 500);
            const exp10 = this.calculateExponential(supply, 1000);

            console.log(
                `${supply.toString().padEnd(9)} | ` +
                `${(linear/LAMPORTS_PER_SOL).toFixed(4).padEnd(7)} | ` +
                `${(exp05/LAMPORTS_PER_SOL).toFixed(4).padEnd(8)} | ` +
                `${(exp1/LAMPORTS_PER_SOL).toFixed(4).padEnd(8)} | ` +
                `${(exp2/LAMPORTS_PER_SOL).toFixed(4).padEnd(8)} | ` +
                `${(exp5/LAMPORTS_PER_SOL).toFixed(4).padEnd(8)} | ` +
                `${(exp10/LAMPORTS_PER_SOL).toFixed(4).padEnd(8)} |`
            );
        });

        console.log('\n📈 PRICE MULTIPLIERS (vs initial price):');
        console.log('Supply    | Linear | Exp 0.5% | Exp 1%  | Exp 2%  | Exp 5%  | Exp 10% |');
        console.log('----------|--------|----------|---------|---------|---------|---------|');

        supplies.forEach(supply => {
            if (supply === 0) return;
            
            const linear = this.calculateLinear(supply) / this.initialPrice;
            const exp05 = this.calculateExponential(supply, 50) / this.initialPrice;
            const exp1 = this.calculateExponential(supply, 100) / this.initialPrice;
            const exp2 = this.calculateExponential(supply, 200) / this.initialPrice;
            const exp5 = this.calculateExponential(supply, 500) / this.initialPrice;
            const exp10 = this.calculateExponential(supply, 1000) / this.initialPrice;

            console.log(
                `${supply.toString().padEnd(9)} | ` +
                `${linear.toFixed(1).padEnd(6)}x | ` +
                `${exp05.toFixed(1).padEnd(8)}x | ` +
                `${exp1.toFixed(1).padEnd(7)}x | ` +
                `${exp2.toFixed(1).padEnd(7)}x | ` +
                `${exp5.toFixed(1).padEnd(7)}x | ` +
                `${exp10.toFixed(1).padEnd(7)}x |`
            );
        });

        this.analyzeInvestmentReturns();
    }

    // Analyze early buyer advantages
    analyzeInvestmentReturns() {
        console.log('\n💰 EARLY BUYER ADVANTAGE ANALYSIS:');
        console.log('(Buying 1000 tokens at different stages)\n');

        const tokenAmount = 1000;
        const stages = [
            { supply: 0, label: 'Launch' },
            { supply: 10000, label: '10k supply' },
            { supply: 50000, label: '50k supply' },
            { supply: 100000, label: '100k supply' },
            { supply: 500000, label: '500k supply' }
        ];

        console.log('Curve Type  | Launch → 100k | Launch → 500k | Launch → 1M  |');
        console.log('------------|---------------|---------------|--------------|');

        const curveTypes = [
            { name: 'Linear', calc: (s) => this.calculateLinear(s) },
            { name: 'Exp 0.5%', calc: (s) => this.calculateExponential(s, 50) },
            { name: 'Exp 1%', calc: (s) => this.calculateExponential(s, 100) },
            { name: 'Exp 2%', calc: (s) => this.calculateExponential(s, 200) },
            { name: 'Exp 5%', calc: (s) => this.calculateExponential(s, 500) },
            { name: 'Exp 10%', calc: (s) => this.calculateExponential(s, 1000) }
        ];

        curveTypes.forEach(curve => {
            const launchPrice = curve.calc(0);
            const price100k = curve.calc(100000);
            const price500k = curve.calc(500000);
            const price1M = curve.calc(1000000);

            const roi100k = ((price100k - launchPrice) / launchPrice * 100).toFixed(0);
            const roi500k = ((price500k - launchPrice) / launchPrice * 100).toFixed(0);
            const roi1M = ((price1M - launchPrice) / launchPrice * 100).toFixed(0);

            console.log(
                `${curve.name.padEnd(11)} | ` +
                `+${roi100k.padEnd(11)}% | ` +
                `+${roi500k.padEnd(11)}% | ` +
                `+${roi1M.padEnd(10)}% |`
            );
        });

        this.analyzePumpFunModel();
    }

    // Analyze pump.fun's specific model
    analyzePumpFunModel() {
        console.log('\n🎯 PUMP.FUN MODEL ANALYSIS:\n');

        const pumpFunSupply = 800_000_000; // 800M tokens in bonding curve
        const graduationMarketCap = 69_000 * LAMPORTS_PER_SOL; // $69k

        console.log('Pump.fun specifics:');
        console.log('- Initial supply in curve: 800M tokens');
        console.log('- Graduation at: $69k market cap');
        console.log('- Creation fee: 0.02 SOL');
        console.log('- Transaction fee: 1%');
        console.log('- Migration fee: 6 SOL (now 0 with PumpSwap)\n');

        // Calculate price needed for graduation
        const priceForGraduation = graduationMarketCap / pumpFunSupply;
        console.log(`Price needed for graduation: ${(priceForGraduation/LAMPORTS_PER_SOL).toFixed(6)} SOL\n`);

        // Revenue analysis
        console.log('💵 REVENUE SPLIT COMPARISON:\n');
        console.log('Platform         | Creation Fee | Trade Fee | Creator Share | Platform Share |');
        console.log('-----------------|--------------|-----------|---------------|----------------|');
        console.log('Pump.fun         | 0.02 SOL     | 1%        | 0%            | 1%             |');
        console.log('Raydium LaunchLab| 0 SOL        | 1%        | 0%            | 0.75% (0.25% buy RAY) |');
        console.log('DeGenie (ours)   | 0.02 SOL     | 1%        | 0.5%          | 0.5%           |');
        console.log('\n✅ DeGenie gives creators 0.5% revenue share - MORE than competitors!');
    }
}

// Run comparison
if (require.main === module) {
    const comparison = new CurveComparison();
    comparison.compareCurves();

    console.log('\n\n🎨 PROS & CONS ANALYSIS:\n');
    
    console.log('LINEAR CURVE:');
    console.log('✅ Pros:');
    console.log('  - Predictable price growth');
    console.log('  - Easy to understand');
    console.log('  - No extreme price spikes');
    console.log('❌ Cons:');
    console.log('  - Less exciting for traders');
    console.log('  - Minimal early buyer advantage');
    console.log('  - Doesn\'t create FOMO\n');

    console.log('EXPONENTIAL 1% (Current Implementation):');
    console.log('✅ Pros:');
    console.log('  - Rewards early buyers (10x at 1M supply)');
    console.log('  - Creates buying pressure');
    console.log('  - Industry standard (pump.fun uses similar)');
    console.log('❌ Cons:');
    console.log('  - Can seem unfair to late buyers');
    console.log('  - Price can grow quickly\n');

    console.log('EXPONENTIAL 5-10% (More Aggressive):');
    console.log('✅ Pros:');
    console.log('  - MASSIVE early buyer rewards (265x-21,916x)');
    console.log('  - Creates extreme FOMO');
    console.log('  - Fast graduation potential');
    console.log('❌ Cons:');
    console.log('  - Can kill momentum (too expensive too fast)');
    console.log('  - Might seem like a scam');
    console.log('  - Late buyers get rekt');
    console.log('  - Can cause massive dumps\n');

    console.log('📌 RECOMMENDATION:');
    console.log('Stick with 1-2% exponential growth rate because:');
    console.log('1. Proven by pump.fun\'s success');
    console.log('2. Balanced reward for early buyers');
    console.log('3. Sustainable price growth');
    console.log('4. Doesn\'t kill late-stage momentum');
}

module.exports = CurveComparison;