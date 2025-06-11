import axios from 'axios';
import { QualityReportGenerator } from './quality-report-generator';

async function comprehensiveQualityTest() {
  console.log('🧪 Comprehensive Quality Test\n');
  
  const baseUrl = 'http://localhost:4000';
  const testUserId = `comprehensive-test-${Date.now()}`;
  const results: any[] = [];
  
  // Create test user
  try {
    await axios.post(`${baseUrl}/api/users`, {
      walletAddress: `test-wallet-${testUserId}`
    });
    console.log(`✅ Test user created\n`);
  } catch (error) {
    console.log(`ℹ️  User creation skipped\n`);
  }
  
  // Comprehensive test cases
  const testCases = [
    // Free tier tests
    { type: 'logo', tier: 'free', prompt: 'minimalist bitcoin logo', expectedKeywords: ['bitcoin', 'crypto'] },
    { type: 'logo', tier: 'free', prompt: 'ethereum shield emblem', expectedKeywords: ['ethereum', 'shield'] },
    { type: 'meme', tier: 'free', prompt: 'pepe holding bitcoin', expectedKeywords: ['pepe', 'bitcoin'] },
    { type: 'meme', tier: 'free', prompt: 'doge rocket moon', expectedKeywords: ['doge', 'rocket'] },
    
    // Starter tier tests
    { type: 'logo', tier: 'starter', prompt: 'defi protocol futuristic', expectedKeywords: ['defi', 'modern'] },
    { type: 'meme', tier: 'starter', prompt: 'wojak buying the dip', expectedKeywords: ['wojak', 'trading'] },
    { type: 'gif', tier: 'starter', prompt: 'spinning coin animation', expectedKeywords: ['coin', 'spin'] },
    
    // Viral tier tests
    { type: 'logo', tier: 'viral', prompt: 'nft marketplace premium', expectedKeywords: ['nft', 'marketplace'] },
    { type: 'meme', tier: 'viral', prompt: 'diamond hands ape', expectedKeywords: ['diamond', 'hands'] },
    { type: 'gif', tier: 'viral', prompt: 'rocket launching moon', expectedKeywords: ['rocket', 'moon'] }
  ];
  
  console.log(`Running ${testCases.length} test cases...\n`);
  
  for (const test of testCases) {
    try {
      console.log(`📝 Testing: ${test.type} (${test.tier}) - "${test.prompt}"`);
      
      const startTime = Date.now();
      const response = await axios.post(
        `${baseUrl}/api/generate/${test.type}`,
        { 
          prompt: test.prompt,
          tier: test.tier,
          userId: testUserId 
        }
      );
      const endTime = Date.now();
      
      const { data } = response.data;
      const generationTime = endTime - startTime;
      
      // Evaluate quality
      const score = evaluateQuality(data, test);
      
      results.push({
        type: test.type,
        tier: test.tier,
        prompt: test.prompt,
        score,
        metrics: {
          resolution: `${data.quality.width}x${data.quality.height}`,
          steps: data.quality.steps,
          cost: data.cost,
          time: generationTime
        }
      });
      
      console.log(`   ✅ Score: ${score}/100 | Time: ${generationTime}ms | Cost: ${data.cost} credits\n`);
      
    } catch (error: any) {
      console.log(`   ❌ Failed: ${error.response?.data?.error || error.message}\n`);
      
      // Still record failed tests
      results.push({
        type: test.type,
        tier: test.tier,
        prompt: test.prompt,
        score: 0,
        metrics: {
          resolution: 'N/A',
          steps: 0,
          cost: 0,
          time: 0
        }
      });
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Generate summary
  const summary = generateSummary(results);
  
  // Create report data
  const reportData = {
    timestamp: new Date().toISOString(),
    results,
    summary
  };
  
  // Generate and save HTML report
  await QualityReportGenerator.saveHTMLReport(reportData);
  
  // Print summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 QUALITY TEST SUMMARY');
  console.log('='.repeat(50) + '\n');
  
  console.log(`Total Tests: ${summary.totalTests}`);
  console.log(`Average Score: ${summary.avgScore}/100`);
  console.log(`Average Time: ${summary.avgTime}ms`);
  console.log(`Total Credits: ${summary.totalCost}`);
  
  if (summary.recommendations.length > 0) {
    console.log(`\nRecommendations:`);
    summary.recommendations.forEach(rec => {
      console.log(`  • ${rec}`);
    });
  }
  
  console.log('\n✅ Comprehensive quality test complete!');
}

function evaluateQuality(data: any, test: any): number {
  let score = 50; // Base score
  
  // Resolution scoring (0-25 points)
  if (data.quality.width >= 1024) {
    score += 25;
  } else if (data.quality.width >= 768) {
    score += 15;
  } else if (data.quality.width >= 512) {
    score += 10;
  }
  
  // Steps scoring (0-25 points)
  if (data.quality.steps >= 50) {
    score += 25;
  } else if (data.quality.steps >= 25) {
    score += 20;
  } else if (data.quality.steps >= 15) {
    score += 15;
  } else if (data.quality.steps >= 4) {
    score += 10;
  }
  
  // Prompt optimization scoring (0-20 points)
  const optimizedPrompt = data.optimizedPrompt.toLowerCase();
  const keywordMatches = test.expectedKeywords.filter((kw: string) => 
    optimizedPrompt.includes(kw.toLowerCase())
  );
  score += (keywordMatches.length / test.expectedKeywords.length) * 20;
  
  // Speed bonus (0-10 points)
  if (data.processingTime < 100) {
    score += 10;
  } else if (data.processingTime < 500) {
    score += 5;
  }
  
  // Tier consistency (0-10 points)
  if (data.tier === test.tier) {
    score += 10;
  }
  
  // Cost efficiency (0-10 points)
  const costEfficiency = (100 - score) / (data.cost * 100);
  if (costEfficiency < 0.5) {
    score += 10; // Good value
  } else if (costEfficiency < 1) {
    score += 5;
  }
  
  return Math.min(Math.round(score), 100);
}

function generateSummary(results: any[]) {
  const totalTests = results.length;
  const validResults = results.filter(r => r.score > 0);
  
  const avgScore = validResults.length > 0
    ? Math.round(validResults.reduce((sum, r) => sum + r.score, 0) / validResults.length)
    : 0;
    
  const avgTime = validResults.length > 0
    ? Math.round(validResults.reduce((sum, r) => sum + r.metrics.time, 0) / validResults.length)
    : 0;
    
  const totalCost = results.reduce((sum, r) => sum + r.metrics.cost, 0);
  
  const recommendations: string[] = [];
  
  // Analyze tier performance
  const tierScores: Record<string, number[]> = {
    free: [],
    starter: [],
    viral: []
  };
  
  validResults.forEach(r => {
    const tierArray = tierScores[r.tier as keyof typeof tierScores];
    if (tierArray) {
      tierArray.push(r.score);
    }
  });
  
  // Generate recommendations
  Object.entries(tierScores).forEach(([tier, scores]) => {
    if (scores.length > 0) {
      const avgTierScore = scores.reduce((a, b) => a + b, 0) / scores.length;
      if (avgTierScore < 70) {
        recommendations.push(`${tier} tier needs quality improvements (avg: ${Math.round(avgTierScore)}/100)`);
      } else if (avgTierScore > 85) {
        recommendations.push(`${tier} tier performing excellently (avg: ${Math.round(avgTierScore)}/100)`);
      }
    }
  });
  
  // Check tier differentiation
  const freeScores = tierScores['free'] || [];
  const viralScores = tierScores['viral'] || [];
  
  const freeAvg = freeScores.length > 0 
    ? freeScores.reduce((a, b) => a + b, 0) / freeScores.length : 0;
  const viralAvg = viralScores.length > 0
    ? viralScores.reduce((a, b) => a + b, 0) / viralScores.length : 0;
    
  if (viralAvg - freeAvg < 20) {
    recommendations.push('Consider increasing quality gap between free and viral tiers');
  }
  
  // Performance recommendations
  if (avgTime > 500) {
    recommendations.push('Generation times are high - consider optimization');
  } else if (avgTime < 100) {
    recommendations.push('Excellent generation speed!');
  }
  
  // Failed tests
  const failedTests = results.filter(r => r.score === 0).length;
  if (failedTests > 0) {
    recommendations.push(`${failedTests} tests failed - investigate error handling`);
  }
  
  return {
    totalTests,
    avgScore,
    avgTime,
    totalCost,
    recommendations
  };
}

// Run the test
comprehensiveQualityTest().catch(console.error);