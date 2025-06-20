// Test script to verify sell trades are working correctly
import fetch from 'node-fetch';

const API_URL = 'http://localhost:4000';
const TEST_TOKEN_ADDRESS = 'E6hf1BzrZG4eq9eLyRmS7de2Y9GNrBozXbK8g6eRNJew';
const TEST_WALLET = '5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d';

async function getMetrics() {
  const response = await fetch(`${API_URL}/api/tokens/${TEST_TOKEN_ADDRESS}/metrics`);
  const data = await response.json() as any;
  return data.data;
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testSellFix() {
  console.log('🧪 Testing Sell Fix for Bonding Curve\n');
  
  // Get initial metrics
  const initialMetrics = await getMetrics();
  console.log('📊 Initial State:');
  console.log(`   Price: ${initialMetrics.currentPrice.toFixed(8)} SOL`);
  console.log(`   SOL Raised: ${initialMetrics.liquiditySOL.toFixed(4)} SOL`);
  console.log(`   Progress: ${initialMetrics.bondingCurveProgress.toFixed(2)}%\n`);
  
  // Buy some tokens first
  console.log('🔵 Buying 2 SOL worth of tokens...');
  const buyResponse = await fetch(`${API_URL}/api/tokens/${TEST_TOKEN_ADDRESS}/buy`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      walletAddress: TEST_WALLET,
      solAmount: '2',
      slippage: 1
    }),
  });
  
  const buyData = await buyResponse.json() as any;
  if (buyData.success) {
    console.log(`✅ Bought ${buyData.data.outputAmount.toFixed(2)} tokens`);
    console.log(`   New Price: ${buyData.data.newPrice.toFixed(8)} SOL`);
    console.log(`   Progress: ${buyData.data.graduationProgress.toFixed(2)}%`);
  }
  
  await sleep(2000);
  
  // Get metrics after buy
  const afterBuyMetrics = await getMetrics();
  console.log('\n📊 After Buy:');
  console.log(`   Price: ${afterBuyMetrics.currentPrice.toFixed(8)} SOL`);
  console.log(`   SOL Raised: ${afterBuyMetrics.liquiditySOL.toFixed(4)} SOL`);
  console.log(`   Progress: ${afterBuyMetrics.bondingCurveProgress.toFixed(2)}%\n`);
  
  // Now sell some tokens
  const tokensToSell = buyData.data.outputAmount * 0.5; // Sell half
  console.log(`🔴 Selling ${tokensToSell.toFixed(2)} tokens...`);
  
  const sellResponse = await fetch(`${API_URL}/api/tokens/${TEST_TOKEN_ADDRESS}/sell`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      walletAddress: TEST_WALLET,
      tokenAmount: tokensToSell.toString(),
      slippage: 1
    }),
  });
  
  const sellData = await sellResponse.json() as any;
  if (sellData.success) {
    console.log(`✅ Sold for ${sellData.data.outputAmount.toFixed(6)} SOL`);
    console.log(`   New Price: ${sellData.data.newPrice.toFixed(8)} SOL`);
    console.log(`   Progress: ${sellData.data.graduationProgress.toFixed(2)}%`);
  }
  
  await sleep(2000);
  
  // Get final metrics
  const finalMetrics = await getMetrics();
  console.log('\n📊 Final State:');
  console.log(`   Price: ${finalMetrics.currentPrice.toFixed(8)} SOL`);
  console.log(`   SOL Raised: ${finalMetrics.liquiditySOL.toFixed(4)} SOL`);
  console.log(`   Progress: ${finalMetrics.bondingCurveProgress.toFixed(2)}%`);
  
  // Verify sell worked correctly
  console.log('\n🔍 Verification:');
  console.log(`   Price decreased: ${afterBuyMetrics.currentPrice > finalMetrics.currentPrice ? '✅ YES' : '❌ NO'}`);
  console.log(`   SOL decreased: ${afterBuyMetrics.liquiditySOL > finalMetrics.liquiditySOL ? '✅ YES' : '❌ NO'}`);
  console.log(`   Progress decreased: ${afterBuyMetrics.bondingCurveProgress > finalMetrics.bondingCurveProgress ? '✅ YES' : '❌ NO'}`);
  
  // Get candles to verify
  console.log('\n📊 Checking candles...');
  const candlesResponse = await fetch(`${API_URL}/api/tokens/${TEST_TOKEN_ADDRESS}/candles?timeframe=1m`);
  const candlesData = await candlesResponse.json() as any;
  
  if (candlesData.success && candlesData.data.length > 0) {
    const lastCandles = candlesData.data.slice(-3);
    console.log('Last 3 candles:');
    lastCandles.forEach((candle: any, i: number) => {
      const isRed = candle.close < candle.open;
      console.log(`   ${i + 1}. O: ${candle.open.toFixed(8)} -> C: ${candle.close.toFixed(8)} [${isRed ? '🔴 RED' : '🟢 GREEN'}]`);
    });
  }
}

testSellFix().catch(console.error);