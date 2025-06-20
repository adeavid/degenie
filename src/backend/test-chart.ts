import fetch from 'node-fetch';

const API_URL = 'http://localhost:4000';
const FRONTEND_URL = 'http://localhost:3003';

async function createTestToken() {
  try {
    // Deploy a test token
    const deployResponse = await fetch(`${API_URL}/api/tokens/deploy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Chart Test Token',
        symbol: 'CHART',
        description: 'Testing the new PooCoin-style chart',
        totalSupply: '1000000000',
        walletAddress: '7xKXtg2CW3H6cGh5rJ8qHjYo5mW9L2Nk3QpR6FsX4uP8',
        network: 'solana',
        logoUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiByeD0iMzIiIGZpbGw9IiM4YjVjZjYiLz4KPHR4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0id2hpdGUiIGZvbnQtc2l6ZT0iMjAiIGZvbnQtZmFtaWx5PSJBcmlhbCI+Q0hBUlQ8L3R4dD4KPC9zdmc+',
        website: '',
        twitter: '',
        telegram: ''
      }),
    });

    const deployData = await deployResponse.json() as any;
    
    if (deployData.success && deployData.data?.tokenAddress) {
      console.log('✅ Token deployed successfully!');
      console.log(`Token Address: ${deployData.data.tokenAddress}`);
      console.log(`\n🌐 View token at: ${FRONTEND_URL}/token/${deployData.data.tokenAddress}`);
      
      // Make a test buy to generate some chart data
      console.log('\n💰 Making a test buy...');
      const buyResponse = await fetch(`${API_URL}/api/tokens/${deployData.data.tokenAddress}/buy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: '7xKXtg2CW3H6cGh5rJ8qHjYo5mW9L2Nk3QpR6FsX4uP8',
          solAmount: 0.1,
        }),
      });
      
      const buyData = await buyResponse.json() as any;
      if (buyData.success) {
        console.log('✅ Test buy successful!');
        console.log(`Bought ${buyData.data.tokenAmount} tokens for ${buyData.data.solAmount} SOL`);
      }
      
    } else {
      console.error('❌ Failed to deploy token:', deployData);
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the test
createTestToken();