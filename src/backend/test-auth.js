#!/usr/bin/env node

/**
 * Test authentication endpoints
 */

const axios = require('axios');

const API_URL = 'http://localhost:4000/api';

// Test wallet addresses (using valid Solana format)
const testWallet1 = '8B5cqBRPr3u3nFtLKChPH1TUZuc7HDcjJEPVxYBjrJnr';
const testWallet2 = '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU';

async function testAuth() {
  console.log('🔐 Testing Authentication Endpoints\n');

  try {
    // Test 1: Wallet login (new user)
    console.log('1. Testing wallet login (new user)...');
    const loginResponse = await axios.post(`${API_URL}/auth/wallet`, {
      walletAddress: testWallet1,
    });
    
    console.log('✅ Login successful:');
    console.log(`   Token: ${loginResponse.data.token.substring(0, 20)}...`);
    console.log(`   User ID: ${loginResponse.data.user.id}`);
    console.log(`   Credits: ${loginResponse.data.user.credits}`);
    console.log(`   Tier: ${loginResponse.data.user.tier}`);
    console.log(`   Referral Code: ${loginResponse.data.user.referralCode}\n`);

    const token = loginResponse.data.token;

    // Test 2: Get user info
    console.log('2. Testing /me endpoint...');
    const meResponse = await axios.get(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ User info retrieved:');
    console.log(`   Tokens Created: ${meResponse.data.user.stats.tokensCreated}`);
    console.log(`   Generations: ${meResponse.data.user.stats.generationsCount}`);
    console.log(`   Referrals: ${meResponse.data.user.stats.referralsCount}\n`);

    // Test 3: Register with details
    console.log('3. Testing registration with details...');
    const registerResponse = await axios.post(`${API_URL}/auth/register`, {
      walletAddress: testWallet2,
      email: 'test@degenie.com',
      username: 'testuser',
      referralCode: loginResponse.data.user.referralCode,
    });
    
    console.log('✅ Registration successful:');
    console.log(`   New User ID: ${registerResponse.data.user.id}`);
    console.log(`   Username: ${registerResponse.data.user.username}`);
    console.log(`   Email: ${registerResponse.data.user.email}\n`);

    // Test 4: Check referral bonus
    console.log('4. Checking referral bonus...');
    const referrerResponse = await axios.get(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ Referral bonus applied:');
    console.log(`   New Credits: ${referrerResponse.data.user.credits}`);
    console.log(`   Referrals Count: ${referrerResponse.data.user.stats.referralsCount}\n`);

    // Test 5: Test duplicate registration
    console.log('5. Testing duplicate registration (should fail)...');
    try {
      await axios.post(`${API_URL}/auth/register`, {
        walletAddress: testWallet2,
      });
      console.log('❌ Duplicate registration allowed (should have failed)');
    } catch (error) {
      console.log(
        '✅ Duplicate registration blocked:',
        error.response?.data?.error ?? error.message
      );
    }

    // Test 6: Test refresh token
    console.log('\n6. Testing token refresh...');
    const refreshResponse = await axios.post(`${API_URL}/auth/refresh`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ Token refreshed:');
    console.log(`   New Token: ${refreshResponse.data.token.substring(0, 20)}...`);

    console.log('\n🎉 All authentication tests passed!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

// Run tests
testAuth();