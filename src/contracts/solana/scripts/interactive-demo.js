#!/usr/bin/env node

/**
 * Interactive Bonding Curve Demo
 * Visual demonstration of how the bonding curve works
 */

const readline = require('readline');
const BondingCurveSimulator = require('./simulation');

// ANSI color codes for better visualization
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
};

class InteractiveBondingCurveDemo {
    constructor() {
        this.simulator = new BondingCurveSimulator();
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }

    printBanner() {
        console.clear();
        console.log(colors.cyan + colors.bright);
        console.log('╔══════════════════════════════════════════════════════════╗');
        console.log('║        🧞‍♂️  DeGenie Bonding Curve Interactive Demo        ║');
        console.log('║                                                          ║');
        console.log('║  Experience how token prices change with supply/demand   ║');
        console.log('╚══════════════════════════════════════════════════════════╝');
        console.log(colors.reset);
    }

    printState() {
        const state = this.simulator.getState();
        const priceInSol = (state.currentPrice / 1_000_000_000).toFixed(6);
        const treasuryInSol = (state.treasury / 1_000_000_000).toFixed(6);
        const marketCapInSol = (state.marketCap / 1_000_000_000).toFixed(6);
        
        console.log('\n' + colors.bright + '📊 Current Market State:' + colors.reset);
        console.log('┌─────────────────────────────────────────────────────────┐');
        console.log(`│ ${colors.green}💰 Token Price:${colors.reset}     ${priceInSol} SOL per token           │`);
        console.log(`│ ${colors.blue}📈 Total Supply:${colors.reset}    ${state.totalSupply.toLocaleString().padEnd(15)} tokens │`);
        console.log(`│ ${colors.yellow}🏦 Treasury:${colors.reset}        ${treasuryInSol.padEnd(15)} SOL    │`);
        console.log(`│ ${colors.magenta}💎 Market Cap:${colors.reset}      ${marketCapInSol.padEnd(15)} SOL    │`);
        console.log(`│ ${colors.cyan}📊 Price Change:${colors.reset}    ${this.calculatePriceChange()}% from start       │`);
        console.log('└─────────────────────────────────────────────────────────┘');
        
        this.printPriceChart();
    }

    calculatePriceChange() {
        const current = this.simulator.currentPrice;
        const initial = this.simulator.initialPrice;
        const change = ((current - initial) / initial * 100).toFixed(2);
        return change >= 0 ? `+${change}` : change;
    }

    printPriceChart() {
        console.log('\n' + colors.bright + '📈 Price Visualization:' + colors.reset);
        const maxPrice = Math.max(this.simulator.currentPrice, this.simulator.initialPrice * 1.5);
        const minPrice = this.simulator.initialPrice * 0.8;
        const range = maxPrice - minPrice;
        const barLength = 40;
        
        // Current price bar
        const currentPos = Math.floor((this.simulator.currentPrice - minPrice) / range * barLength);
        let priceBar = '';
        for (let i = 0; i < barLength; i++) {
            if (i === currentPos) {
                priceBar += colors.green + '█' + colors.reset;
            } else if (i < currentPos) {
                priceBar += colors.dim + '▄' + colors.reset;
            } else {
                priceBar += colors.dim + '·' + colors.reset;
            }
        }
        
        console.log(`[${priceBar}]`);
        console.log(` ${(minPrice/1000).toFixed(3)} SOL                           ${(maxPrice/1000).toFixed(3)} SOL`);
    }

    async showMenu() {
        console.log('\n' + colors.bright + '🎮 Actions:' + colors.reset);
        console.log('┌─────────────────────────────────────────────────────────┐');
        console.log('│ [1] 💰 Buy Tokens  - Spend SOL to buy tokens            │');
        console.log('│ [2] 💸 Sell Tokens - Sell tokens back for SOL          │');
        console.log('│ [3] 🎲 Simulate Activity - Watch automated trading     │');
        console.log('│ [4] 📊 View History - See all transactions             │');
        console.log('│ [5] 🔄 Reset - Start fresh with new curve              │');
        console.log('│ [6] ❌ Exit                                             │');
        console.log('└─────────────────────────────────────────────────────────┘');
        
        return new Promise((resolve) => {
            this.rl.question('\nChoose an action (1-6): ', resolve);
        });
    }

    async buyTokens() {
        console.log('\n' + colors.green + colors.bright + '💰 Buy Tokens' + colors.reset);
        console.log('Current price: ' + (this.simulator.currentPrice / 1_000_000_000).toFixed(6) + ' SOL per token');
        
        const solAmount = await new Promise((resolve) => {
            this.rl.question('How much SOL to spend? (e.g., 0.1): ', (answer) => {
                resolve(parseFloat(answer) * 1_000_000_000);
            });
        });

        try {
            const tokensReceived = this.simulator.calculateTokensForSol(solAmount);
            console.log(`\nYou will receive: ${colors.bright}${tokensReceived} tokens${colors.reset}`);
            
            const confirm = await new Promise((resolve) => {
                this.rl.question('Confirm purchase? (y/n): ', resolve);
            });

            if (confirm.toLowerCase() === 'y') {
                this.simulator.buyTokens(solAmount, 'You');
                console.log(colors.green + '✅ Purchase successful!' + colors.reset);
            } else {
                console.log(colors.yellow + '❌ Purchase cancelled.' + colors.reset);
            }
        } catch (error) {
            console.log(colors.red + `❌ Error: ${error.message}` + colors.reset);
        }
    }

    async sellTokens() {
        console.log('\n' + colors.red + colors.bright + '💸 Sell Tokens' + colors.reset);
        console.log('Current price: ' + (this.simulator.currentPrice / 1_000_000_000).toFixed(6) + ' SOL per token');
        console.log('Your balance: ' + this.simulator.totalSupply + ' tokens');
        
        const tokenAmount = await new Promise((resolve) => {
            this.rl.question('How many tokens to sell?: ', (answer) => {
                resolve(parseInt(answer));
            });
        });

        try {
            const solReceived = this.simulator.calculateSolForTokens(tokenAmount);
            console.log(`\nYou will receive: ${colors.bright}${(solReceived / 1_000_000_000).toFixed(6)} SOL${colors.reset}`);
            
            const confirm = await new Promise((resolve) => {
                this.rl.question('Confirm sale? (y/n): ', resolve);
            });

            if (confirm.toLowerCase() === 'y') {
                this.simulator.sellTokens(tokenAmount, 'You');
                console.log(colors.green + '✅ Sale successful!' + colors.reset);
            } else {
                console.log(colors.yellow + '❌ Sale cancelled.' + colors.reset);
            }
        } catch (error) {
            console.log(colors.red + `❌ Error: ${error.message}` + colors.reset);
        }
    }

    async simulateActivity() {
        console.log('\n' + colors.yellow + colors.bright + '🎲 Simulating Market Activity...' + colors.reset);
        console.log('Watch how the price changes with trading activity!\n');
        
        const activities = [
            { action: 'buy', amount: 0.05, trader: 'Whale_1' },
            { action: 'buy', amount: 0.02, trader: 'Trader_A' },
            { action: 'buy', amount: 0.01, trader: 'Trader_B' },
            { action: 'sell', tokens: 20, trader: 'Trader_A' },
            { action: 'buy', amount: 0.1, trader: 'Whale_2' },
            { action: 'sell', tokens: 30, trader: 'Whale_1' },
        ];

        for (const activity of activities) {
            await new Promise(resolve => setTimeout(resolve, 1500)); // Pause for effect
            
            try {
                if (activity.action === 'buy') {
                    this.simulator.buyTokens(activity.amount * 1_000_000_000, activity.trader);
                } else {
                    this.simulator.sellTokens(activity.tokens, activity.trader);
                }
                this.printState();
            } catch (error) {
                console.log(colors.red + `❌ ${activity.trader} failed: ${error.message}` + colors.reset);
            }
        }
        
        console.log('\n' + colors.green + '✅ Simulation complete!' + colors.reset);
    }

    viewHistory() {
        console.log('\n' + colors.cyan + colors.bright + '📋 Transaction History:' + colors.reset);
        console.log('┌────────────────────────────────────────────────────────────────┐');
        
        this.simulator.transactions.forEach((tx, index) => {
            const icon = tx.type === 'BUY' ? '🟢' : '🔴';
            const amount = tx.type === 'BUY' 
                ? `${(tx.solAmount / 1_000_000_000).toFixed(4)} SOL → ${tx.tokensReceived} tokens`
                : `${tx.tokenAmount} tokens → ${(tx.solReceived / 1_000_000_000).toFixed(4)} SOL`;
            
            console.log(`│ ${icon} ${tx.type.padEnd(4)} | ${tx.buyer || tx.seller} | ${amount.padEnd(30)} │`);
        });
        
        console.log('└────────────────────────────────────────────────────────────────┘');
    }

    async run() {
        this.printBanner();
        
        while (true) {
            this.printState();
            const choice = await this.showMenu();
            
            switch (choice) {
                case '1':
                    await this.buyTokens();
                    break;
                case '2':
                    await this.sellTokens();
                    break;
                case '3':
                    await this.simulateActivity();
                    break;
                case '4':
                    this.viewHistory();
                    await new Promise(resolve => {
                        this.rl.question('\nPress Enter to continue...', resolve);
                    });
                    break;
                case '5':
                    this.simulator = new BondingCurveSimulator();
                    console.log(colors.green + '✅ Bonding curve reset!' + colors.reset);
                    break;
                case '6':
                    console.log(colors.cyan + '\n👋 Thanks for trying the DeGenie Bonding Curve demo!' + colors.reset);
                    this.rl.close();
                    process.exit(0);
                default:
                    console.log(colors.red + '❌ Invalid choice. Please try again.' + colors.reset);
            }
        }
    }
}

// Run the demo
if (require.main === module) {
    const demo = new InteractiveBondingCurveDemo();
    demo.run().catch(console.error);
}

module.exports = InteractiveBondingCurveDemo;