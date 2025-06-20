// Test script to simulate buy/sell trades for chart testing
import fetch from 'node-fetch';

const API_URL = 'http://localhost:4000';
const TEST_TOKEN_ADDRESS = 'E6hf1BzrZG4eq9eLyRmS7de2Y9GNrBozXbK8g6eRNJew'; // Chart Test Token
const TEST_WALLET = '5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d';

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function simulateBuy(solAmount: number) {
  console.log(`🔵 Simulating BUY of ${solAmount} SOL...`);
  
  try {
    const response = await fetch(`${API_URL}/api/tokens/${TEST_TOKEN_ADDRESS}/buy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        walletAddress: TEST_WALLET,
        solAmount: solAmount.toString(),
        slippage: 1
      }),
    });

    const data = await response.json() as any;
    
    if (data.success) {
      console.log(`✅ Buy successful: ${data.data.outputAmount.toFixed(2)} tokens @ ${data.data.pricePerToken.toFixed(6)} SOL`);
      console.log(`   Progress: ${data.data.graduationProgress.toFixed(2)}%`);
    } else {
      console.error('❌ Buy failed:', data.error);
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

async function simulateSell(tokenAmount: number) {
  console.log(`🔴 Simulating SELL of ${tokenAmount} tokens...`);
  
  try {
    const response = await fetch(`${API_URL}/api/tokens/${TEST_TOKEN_ADDRESS}/sell`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        walletAddress: TEST_WALLET,
        tokenAmount: tokenAmount.toString(),
        slippage: 1
      }),
    });

    const data = await response.json() as any;
    
    if (data.success) {
      console.log(`✅ Sell successful: ${data.data.outputAmount.toFixed(6)} SOL @ ${data.data.pricePerToken.toFixed(6)} SOL`);
      console.log(`   Progress: ${data.data.graduationProgress.toFixed(2)}%`);
    } else {
      console.error('❌ Sell failed:', data.error);
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

async function runTradeSimulation() {
  console.log('🚀 Starting trade simulation...');
  console.log('📊 Watch the chart at http://localhost:3000/token/' + TEST_TOKEN_ADDRESS);
  console.log('');
  
  // Pattern: Random buys and sells with varying sizes
  const trades = [
    { type: 'buy', amount: 0.1 },
    { type: 'buy', amount: 0.5 },
    { type: 'buy', amount: 1.0 },
    { type: 'sell', amount: 10000 },
    { type: 'buy', amount: 0.3 },
    { type: 'sell', amount: 5000 },
    { type: 'buy', amount: 2.0 },
    { type: 'buy', amount: 0.2 },
    { type: 'sell', amount: 20000 },
    { type: 'buy', amount: 5.0 },
  ];
  
  for (const trade of trades) {
    if (trade.type === 'buy') {
      await simulateBuy(trade.amount);
    } else {
      await simulateSell(trade.amount);
    }
    
    // Wait 3-5 seconds between trades
    const delay = 3000 + Math.random() * 2000;
    console.log(`⏳ Waiting ${(delay / 1000).toFixed(1)}s...\n`);
    await sleep(delay);
  }
  
  console.log('✅ Trade simulation complete!');
}

// Run the simulation
runTradeSimulation().catch(console.error);