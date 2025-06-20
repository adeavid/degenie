// Script to create a test token for chart testing
import fetch from 'node-fetch';

const API_URL = 'http://localhost:4000';
const TEST_WALLET = '5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d';

async function createTestToken() {
  console.log('🚀 Creating test token...');
  
  try {
    const response = await fetch(`${API_URL}/api/tokens/deploy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Chart Test Token',
        symbol: 'CHART',
        description: 'Test token for chart functionality',
        totalSupply: '1000000000',
        logoUrl: 'https://via.placeholder.com/150',
        walletAddress: TEST_WALLET,
        selectedAssets: {}
      }),
    });

    const data = await response.json() as any;
    
    if (data.success && data.data?.tokenAddress) {
      console.log(`✅ Token created successfully!`);
      console.log(`📍 Token Address: ${data.data.tokenAddress}`);
      console.log(`🔗 View at: http://localhost:3000/token/${data.data.tokenAddress}`);
      return data.data.tokenAddress;
    } else if (data.tokenAddress) {
      // Handle direct tokenAddress response
      console.log(`✅ Token created successfully!`);
      console.log(`📍 Token Address: ${data.tokenAddress}`);
      console.log(`🔗 View at: http://localhost:3000/token/${data.tokenAddress}`);
      return data.tokenAddress;
    } else {
      console.error('❌ Token creation failed:', data);
      return null;
    }
  } catch (error) {
    console.error('❌ Error:', error);
    return null;
  }
}

// Create the token
createTestToken()
  .then(tokenAddress => {
    if (tokenAddress) {
      console.log('\n📝 Token address saved. You can now run test-trades.ts');
      // Save token address for test-trades script
      console.log(`\nUpdate TEST_TOKEN_ADDRESS in test-trades.ts to: ${tokenAddress}`);
    }
  })
  .catch(console.error);