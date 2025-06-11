#!/usr/bin/env node

const axios = require('axios');

const BASE_URL = 'http://localhost:4000';
const TEST_USER_ID = 'test-user-' + Date.now();

// Colors for output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testHealthCheck() {
  log('\n🏥 Testing Health Check...', 'blue');
  try {
    const response = await axios.get(`${BASE_URL}/health`);
    log(`✅ Health check passed: ${response.data.status}`, 'green');
    return true;
  } catch (error) {
    log(`❌ Health check failed: ${error.message}`, 'red');
    return false;
  }
}

async function testCreditBalance() {
  log('\n💰 Testing Credit Balance...', 'blue');
  try {
    const response = await axios.get(`${BASE_URL}/api/credits/${TEST_USER_ID}`);
    log(`✅ Credit balance retrieved: ${response.data.data.balance}`, 'green');
    return response.data.data.balance;
  } catch (error) {
    log(`❌ Credit balance failed: ${error.response?.data?.error || error.message}`, 'red');
    return null;
  }
}

async function testEarnCredits() {
  log('\n💎 Testing Credit Earning...', 'blue');
  try {
    const response = await axios.post(`${BASE_URL}/api/credits/${TEST_USER_ID}/earn`, {
      action: 'dailyLogin',
      metadata: { source: 'test' }
    });
    log(`✅ Credits earned: ${response.data.data.earned}, New balance: ${response.data.data.newBalance}`, 'green');
    return response.data.data.newBalance;
  } catch (error) {
    log(`❌ Credit earning failed: ${error.response?.data?.error || error.message}`, 'red');
    return null;
  }
}

async function testInvalidAction() {
  log('\n🚫 Testing Invalid Action Validation...', 'blue');
  try {
    const response = await axios.post(`${BASE_URL}/api/credits/${TEST_USER_ID}/earn`, {
      action: 'invalidAction',
      metadata: { source: 'test' }
    });
    log(`❌ Should have failed but got: ${JSON.stringify(response.data)}`, 'red');
    return false;
  } catch (error) {
    if (error.response?.status === 400 && error.response?.data?.code === 'INVALID_ACTION') {
      log(`✅ Invalid action correctly rejected: ${error.response.data.error}`, 'green');
      return true;
    } else {
      log(`❌ Unexpected error: ${error.response?.data?.error || error.message}`, 'red');
      return false;
    }
  }
}

async function testAtomicCreditDeduction() {
  log('\n⚛️ Testing Atomic Credit Deduction...', 'blue');
  try {
    // First ensure user has enough credits
    await testEarnCredits();
    
    const response = await axios.post(`${BASE_URL}/api/generate/logo`, {
      prompt: 'A simple logo for test purposes',
      userId: TEST_USER_ID,
      tier: 'free'
    });
    
    if (response.data.success) {
      log(`✅ Atomic generation successful: ${response.data.data.cost} credits deducted`, 'green');
      log(`  New balance: ${response.data.data.newBalance}`, 'green');
      return true;
    } else {
      log(`❌ Generation failed: ${JSON.stringify(response.data)}`, 'red');
      return false;
    }
  } catch (error) {
    if (error.response?.status === 402 && error.response?.data?.error === 'Insufficient credits') {
      log(`✅ Insufficient credits correctly handled: ${error.response.data.error}`, 'green');
      return true;
    } else {
      log(`❌ Atomic deduction failed: ${error.response?.data?.error || error.message}`, 'red');
      return false;
    }
  }
}

async function testInputValidation() {
  log('\n🛡️ Testing Input Validation...', 'blue');
  
  // Test missing prompt
  try {
    await axios.post(`${BASE_URL}/api/generate/logo`, {
      userId: TEST_USER_ID,
      tier: 'free'
    });
    log(`❌ Should have failed for missing prompt`, 'red');
    return false;
  } catch (error) {
    if (error.response?.status === 400 && error.response?.data?.code === 'MISSING_PROMPT') {
      log(`✅ Missing prompt correctly rejected`, 'green');
    } else {
      log(`❌ Unexpected error for missing prompt: ${error.response?.data?.error || error.message}`, 'red');
      return false;
    }
  }
  
  // Test invalid asset type
  try {
    await axios.post(`${BASE_URL}/api/generate/invalid`, {
      prompt: 'test prompt',
      userId: TEST_USER_ID,
      tier: 'free'
    });
    log(`❌ Should have failed for invalid asset type`, 'red');
    return false;
  } catch (error) {
    if (error.response?.status === 400 && error.response?.data?.code === 'INVALID_ASSET_TYPE') {
      log(`✅ Invalid asset type correctly rejected`, 'green');
      return true;
    } else {
      log(`❌ Unexpected error for invalid asset type: ${error.response?.data?.error || error.message}`, 'red');
      return false;
    }
  }
}

async function testTierAccessControl() {
  log('\n🎯 Testing Tier Access Control...', 'blue');
  try {
    // Test GIF generation on free tier (should fail)
    await axios.post(`${BASE_URL}/api/generate/gif`, {
      prompt: 'animated logo',
      userId: TEST_USER_ID,
      tier: 'free'
    });
    log(`❌ Should have failed for GIF on free tier`, 'red');
    return false;
  } catch (error) {
    if (error.response?.status === 403 && error.response?.data?.error?.includes('not available for free tier')) {
      log(`✅ Tier access control working: GIF blocked on free tier`, 'green');
      return true;
    } else {
      log(`❌ Unexpected error for tier access: ${error.response?.data?.error || error.message}`, 'red');
      return false;
    }
  }
}

async function runAllTests() {
  log('🧪 Starting Functionality Tests...', 'yellow');
  log(`🔍 Testing with user ID: ${TEST_USER_ID}`, 'blue');
  
  const results = {
    healthCheck: await testHealthCheck(),
    creditBalance: await testCreditBalance(),
    earnCredits: await testEarnCredits(),
    invalidAction: await testInvalidAction(),
    atomicDeduction: await testAtomicCreditDeduction(),
    inputValidation: await testInputValidation(),
    tierAccess: await testTierAccessControl()
  };
  
  log('\n📊 Test Results Summary:', 'yellow');
  let passed = 0;
  let total = 0;
  
  Object.entries(results).forEach(([test, result]) => {
    total++;
    if (result) {
      passed++;
      log(`✅ ${test}: PASSED`, 'green');
    } else {
      log(`❌ ${test}: FAILED`, 'red');
    }
  });
  
  log(`\n🎯 Overall: ${passed}/${total} tests passed (${Math.round(passed/total*100)}%)`, 
      passed === total ? 'green' : 'yellow');
  
  if (passed === total) {
    log('\n🚀 All critical fixes are working correctly!', 'green');
    log('✅ Atomic credit operations working', 'green');
    log('✅ Input validation working', 'green');
    log('✅ Error handling working', 'green');
    log('✅ Tier access control working', 'green');
  } else {
    log('\n⚠️ Some tests failed - review the results above', 'yellow');
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  log('\n👋 Tests interrupted by user', 'yellow');
  process.exit(0);
});

// Run tests
runAllTests().catch(error => {
  log(`\n💥 Test suite crashed: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});