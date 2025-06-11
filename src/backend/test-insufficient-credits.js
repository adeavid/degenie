#!/usr/bin/env node

const axios = require('axios');

async function testInsufficientCredits() {
  const BASE_URL = 'http://localhost:4000';
  const TEST_USER_ID = 'poor-user-' + Date.now();
  
  console.log('🧪 Testing Insufficient Credits Handling...');
  
  try {
    // Try to generate without having credits (new user starts with 3, logo costs 0.5)
    // We'll try viral tier which costs 1.5, so after 2 generations (3 credits) user should be insufficient
    
    // First generation (3 - 1.5 = 1.5 left)
    await axios.post(`${BASE_URL}/api/generate/logo`, {
      prompt: 'first logo test',
      userId: TEST_USER_ID,
      tier: 'viral'
    });
    
    // Second generation (1.5 - 1.5 = 0 left)
    await axios.post(`${BASE_URL}/api/generate/logo`, {
      prompt: 'second logo test', 
      userId: TEST_USER_ID,
      tier: 'viral'
    });
    
    // Third generation should fail with insufficient credits
    await axios.post(`${BASE_URL}/api/generate/logo`, {
      prompt: 'third logo test - should fail',
      userId: TEST_USER_ID, 
      tier: 'viral'
    });
    
    console.log('❌ Test failed - should have been insufficient credits');
    
  } catch (error) {
    if (error.response?.status === 402 && error.response?.data?.error === 'Insufficient credits') {
      console.log('✅ Atomic credit check working: Insufficient credits correctly detected');
      console.log(`   Required: ${error.response.data.required}`);
      console.log(`   Balance: ${error.response.data.balance}`);
      return true;
    } else {
      console.log(`❌ Unexpected error: ${error.response?.data?.error || error.message}`);
      return false;
    }
  }
}

testInsufficientCredits();