import axios from 'axios';

async function quickQualityTest() {
  console.log('🧪 Quick Quality Test - Testing 3 assets\n');
  
  const baseUrl = 'http://localhost:4000';
  const testUserId = `quick-test-${Date.now()}`;
  
  // Create test user
  try {
    await axios.post(`${baseUrl}/api/users`, {
      walletAddress: `test-wallet-${testUserId}`
    });
    console.log(`✅ Test user created\n`);
  } catch (error) {
    console.log(`ℹ️  User creation skipped\n`);
  }
  
  // Test cases
  const tests = [
    { type: 'logo', tier: 'free', prompt: 'bitcoin rocket logo' },
    { type: 'meme', tier: 'starter', prompt: 'doge to the moon' },
    { type: 'logo', tier: 'viral', prompt: 'ethereum dragon' }
  ];
  
  console.log('Running tests...\n');
  
  for (const test of tests) {
    try {
      console.log(`📝 Testing: ${test.type} (${test.tier}) - "${test.prompt}"`);
      
      const startTime = Date.now();
      const response = await axios.post(
        `${baseUrl}/api/generate/${test.type}`,
        { ...test, userId: testUserId }
      );
      const endTime = Date.now();
      
      const { data } = response.data;
      
      // Simple quality evaluation
      const quality = data.quality;
      const score = calculateSimpleScore(quality, test.tier);
      
      console.log(`   ✅ Generated in ${endTime - startTime}ms`);
      console.log(`   📊 Quality: ${quality.width}x${quality.height}, ${quality.steps} steps`);
      console.log(`   💰 Cost: ${data.cost} credits`);
      console.log(`   ⭐ Score: ${score}/100`);
      console.log(`   🔗 URL: ${data.url}`);
      console.log('');
      
    } catch (error: any) {
      console.log(`   ❌ Failed: ${error.message}\n`);
    }
  }
  
  console.log('✅ Quick test complete!');
}

function calculateSimpleScore(quality: any, tier: string): number {
  let score = 50; // Base score
  
  // Resolution scoring
  if (quality.width >= 1024) score += 20;
  else if (quality.width >= 512) score += 10;
  
  // Steps scoring
  if (quality.steps >= 50) score += 20;
  else if (quality.steps >= 25) score += 15;
  else if (quality.steps >= 15) score += 10;
  
  // Tier bonus
  if (tier === 'viral') score += 10;
  else if (tier === 'starter') score += 5;
  
  return Math.min(score, 100);
}

// Run the test
quickQualityTest().catch(console.error);