// Test script to verify trades are being stored and retrieved correctly
const axios = require('axios');

const API_URL = 'http://localhost:4000/api';
const TEST_WALLET = 'TestWallet1234567890ABCDEF1234567890ABCDEF12';

async function testRealTrades() {
  try {
    console.log('🧪 Testing REAL trade storage and retrieval...\n');
    
    // Step 1: Deploy a new token
    console.log('1️⃣ Deploying a new test token...');
    const deployResponse = await axios.post(`${API_URL}/tokens/deploy`, {
      name: 'Test Trade Token',
      symbol: 'TTT',
      description: 'Token for testing trade functionality',
      totalSupply: '1000000000',
      logoUrl: 'https://example.com/logo.png',
      walletAddress: TEST_WALLET
    });
    
    if (!deployResponse.data.success) {
      console.error('❌ Failed to deploy token:', deployResponse.data);
      return;
    }
    
    const tokenAddress = deployResponse.data.data.tokenAddress;
    console.log('✅ Token deployed successfully!');
    console.log(`   - Address: ${tokenAddress}`);
    console.log(`   - Symbol: ${deployResponse.data.data.symbol}`);
    
    // Wait a moment for token to be fully registered
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Step 2: Execute a buy trade
    console.log('\n2️⃣ Executing BUY trade...');
    const buyResponse = await axios.post(`${API_URL}/tokens/${tokenAddress}/buy`, {
      walletAddress: TEST_WALLET,
      solAmount: 2.5,
      slippage: 1
    });
    console.log('✅ Buy trade response:', buyResponse.data.success ? 'SUCCESS' : 'FAILED');
    if (buyResponse.data.success) {
      console.log(`   - Tokens received: ${buyResponse.data.data.outputAmount.toFixed(2)}`);
      console.log(`   - New price: ${buyResponse.data.data.newPrice.toFixed(8)} SOL`);
    }
    
    // Step 3: Execute a sell trade
    console.log('\n3️⃣ Executing SELL trade...');
    const sellResponse = await axios.post(`${API_URL}/tokens/${tokenAddress}/sell`, {
      walletAddress: TEST_WALLET,
      tokenAmount: 5000000,
      slippage: 1
    });
    console.log('✅ Sell trade response:', sellResponse.data.success ? 'SUCCESS' : 'FAILED');
    if (sellResponse.data.success) {
      console.log(`   - SOL received: ${sellResponse.data.data.outputAmount.toFixed(6)}`);
      console.log(`   - New price: ${sellResponse.data.data.newPrice.toFixed(8)} SOL`);
    }
    
    // Step 4: Execute another buy trade
    console.log('\n4️⃣ Executing another BUY trade...');
    const buy2Response = await axios.post(`${API_URL}/tokens/${tokenAddress}/buy`, {
      walletAddress: 'AnotherWallet9876543210FEDCBA9876543210FEDCBA',
      solAmount: 1.0,
      slippage: 1
    });
    console.log('✅ Buy trade response:', buy2Response.data.success ? 'SUCCESS' : 'FAILED');
    
    // Step 5: Get trades for the token
    console.log('\n5️⃣ Fetching trades for token...');
    const tradesResponse = await axios.get(`${API_URL}/tokens/${tokenAddress}/trades`);
    console.log('✅ Trades fetched:', tradesResponse.data.success ? 'SUCCESS' : 'FAILED');
    
    if (tradesResponse.data.success) {
      const trades = tradesResponse.data.data;
      console.log(`\n📊 Total trades found: ${trades.length}`);
      
      // Show each trade
      trades.forEach((trade, index) => {
        console.log(`\n   Trade #${index + 1}:`);
        console.log(`   - Type: ${trade.type.toUpperCase()}`);
        console.log(`   - Account: ${trade.account.slice(0, 8)}...`);
        console.log(`   - SOL Amount: ${trade.solAmount.toFixed(6)}`);
        console.log(`   - Token Amount: ${trade.tokenAmount.toFixed(2)}`);
        console.log(`   - Price: ${trade.price.toFixed(8)} SOL/token`);
        console.log(`   - Timestamp: ${new Date(trade.timestamp).toLocaleString()}`);
      });
      
      // Verify we have both buy and sell trades
      const buyTrades = trades.filter(t => t.type === 'buy');
      const sellTrades = trades.filter(t => t.type === 'sell');
      
      console.log(`\n📈 Summary:`);
      console.log(`   - Buy trades: ${buyTrades.length}`);
      console.log(`   - Sell trades: ${sellTrades.length}`);
      
      if (sellTrades.length > 0) {
        console.log('\n✅ SUCCESS: Sell trades are being properly recorded and displayed!');
        console.log('   The fix is working correctly - trades are now fetched from tradeStorage.');
      } else {
        console.log('\n❌ ISSUE: No sell trades found in the response');
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
console.log('🚀 Starting REAL trade storage test...\n');
console.log('Make sure the backend server is running on port 4000\n');

testRealTrades();