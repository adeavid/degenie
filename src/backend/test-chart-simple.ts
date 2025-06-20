import fetch from 'node-fetch';

const API_URL = 'http://localhost:4000';
const FRONTEND_URL = 'http://localhost:3003';

// Test token address - can be any valid Solana address format
const TEST_TOKEN = '7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr';

async function testChart() {
  try {
    console.log('🧪 Testing chart with token:', TEST_TOKEN);
    console.log(`\n🌐 Open browser at: ${FRONTEND_URL}/token/${TEST_TOKEN}`);
    
    // Make some test trades to generate chart data
    console.log('\n💰 Making test trades...');
    
    // Buy 1
    await fetch(`${API_URL}/api/tokens/${TEST_TOKEN}/buy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        walletAddress: '7xKXtg2CW3H6cGh5rJ8qHjYo5mW9L2Nk3QpR6FsX4uP8',
        solAmount: 0.1,
      }),
    });
    console.log('✅ Buy 1 completed');

    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Buy 2
    await fetch(`${API_URL}/api/tokens/${TEST_TOKEN}/buy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        walletAddress: '8yLXtg2CW3H6cGh5rJ8qHjYo5mW9L2Nk3QpR6FsX4uP9',
        solAmount: 0.2,
      }),
    });
    console.log('✅ Buy 2 completed');

    // Sell 1
    await fetch(`${API_URL}/api/tokens/${TEST_TOKEN}/sell`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        walletAddress: '7xKXtg2CW3H6cGh5rJ8qHjYo5mW9L2Nk3QpR6FsX4uP8',
        tokenAmount: 1000000,
      }),
    });
    console.log('✅ Sell 1 completed');

    console.log('\n📊 Chart should now show trading data!');
    console.log(`🔗 View at: ${FRONTEND_URL}/token/${TEST_TOKEN}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the test
testChart();