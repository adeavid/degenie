// Simple test to check if trades endpoint is now returning real data
const axios = require('axios');

const API_URL = 'http://localhost:4000/api';
// Use a known token address that might have trades
const TEST_TOKEN = 'DXKun7LY4Y8JAdfYbVf9YDAJiBpXKm76z43Z7KeTFTea'; // Example token

async function testTradesEndpoint() {
  try {
    console.log('🧪 Testing trades endpoint...\n');
    
    // Try to get trades
    console.log(`📊 Fetching trades for token: ${TEST_TOKEN}`);
    const tradesResponse = await axios.get(`${API_URL}/tokens/${TEST_TOKEN}/trades`);
    
    console.log('\n📤 Response:', JSON.stringify(tradesResponse.data, null, 2));
    
    if (tradesResponse.data.success && tradesResponse.data.data.length > 0) {
      const firstTrade = tradesResponse.data.data[0];
      
      // Check if this is real data or mock data
      if (firstTrade.hasOwnProperty('priceChange') && !firstTrade.hasOwnProperty('newPrice')) {
        console.log('\n❌ This appears to be MOCK data from token.routes.ts');
        console.log('   The server needs to be restarted for the fix to take effect.');
      } else if (firstTrade.hasOwnProperty('newPrice')) {
        console.log('\n✅ This appears to be REAL data from tradeStorage!');
        console.log('   The fix is working correctly.');
      }
    }
    
  } catch (error) {
    if (error.response?.status === 404) {
      console.log('❌ Token not found - this is expected for a random token address');
      console.log('   The important thing is that the endpoint is reachable.');
    } else {
      console.error('❌ Error:', error.response?.data || error.message);
    }
  }
}

testTradesEndpoint();