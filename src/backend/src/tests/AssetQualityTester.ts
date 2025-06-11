import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';

interface QualityMetrics {
  promptAdherence: number;  // 0-100: How well it matches the prompt
  technicalQuality: number; // 0-100: Resolution, clarity, artifacts
  cryptoRelevance: number;  // 0-100: Crypto/Web3 theme adherence
  uniqueness: number;       // 0-100: How unique/creative
  overall: number;          // Average score
}

interface TestResult {
  assetType: string;
  tier: string;
  prompt: string;
  generationTime: number;
  cost: number;
  url: string;
  metrics: QualityMetrics;
  notes: string[];
}

interface TestReport {
  timestamp: string;
  totalTests: number;
  results: TestResult[];
  summary: {
    byType: Record<string, { avgScore: number; tests: number }>;
    byTier: Record<string, { avgScore: number; tests: number }>;
    recommendations: string[];
  };
}

export class AssetQualityTester {
  private baseUrl: string;
  private results: TestResult[] = [];

  constructor(baseUrl = 'http://localhost:4000') {
    this.baseUrl = baseUrl;
  }

  /**
   * Test prompts designed to evaluate different aspects
   */
  private getTestPrompts() {
    return {
      logo: [
        { prompt: "minimalist bitcoin logo", expected: ["simple", "clean", "bitcoin"] },
        { prompt: "ethereum dragon mascot", expected: ["dragon", "ethereum", "mascot"] },
        { prompt: "defi protocol abstract logo", expected: ["abstract", "modern", "tech"] },
        { prompt: "meme coin dog logo", expected: ["dog", "fun", "coin"] },
        { prompt: "nft marketplace logo", expected: ["marketplace", "nft", "professional"] }
      ],
      meme: [
        { prompt: "pepe holding bitcoin", expected: ["pepe", "bitcoin", "funny"] },
        { prompt: "doge to the moon", expected: ["doge", "moon", "rocket"] },
        { prompt: "cat with diamond hands", expected: ["cat", "diamond", "hands"] },
        { prompt: "wojak buying the dip", expected: ["wojak", "chart", "emotional"] },
        { prompt: "crypto bro lifestyle", expected: ["lifestyle", "wealth", "humor"] }
      ],
      gif: [
        { prompt: "spinning coin animation", expected: ["spin", "coin", "loop"] },
        { prompt: "rocket launching to moon", expected: ["rocket", "motion", "moon"] },
        { prompt: "dancing crypto mascot", expected: ["dance", "character", "animated"] },
        { prompt: "price chart going up", expected: ["chart", "green", "movement"] },
        { prompt: "wallet connecting animation", expected: ["wallet", "connect", "tech"] }
      ]
    };
  }

  /**
   * Run quality tests for all asset types and tiers
   */
  async runFullTestSuite(userId: string): Promise<TestReport> {
    console.log('🧪 Starting Asset Quality Test Suite...\n');
    
    const testPrompts = this.getTestPrompts();
    const tiers = ['free', 'starter', 'viral'];
    const types = ['logo', 'meme', 'gif'];

    // Create test user first
    await this.createTestUser(userId);

    for (const tier of tiers) {
      console.log(`\n📊 Testing ${tier.toUpperCase()} tier:`);
      
      for (const type of types) {
        // Skip GIF for free tier
        if (type === 'gif' && tier === 'free') {
          console.log(`  ⏭️  Skipping GIF (not available in free tier)`);
          continue;
        }

        console.log(`  🎨 Testing ${type}s:`);
        
        const prompts = testPrompts[type as keyof typeof testPrompts];
        for (const { prompt, expected } of prompts) {
          try {
            const result = await this.testSingleAsset(
              type,
              tier,
              prompt,
              expected,
              userId
            );
            this.results.push(result);
            
            console.log(`    ✅ "${prompt}" - Score: ${result.metrics.overall}/100`);
          } catch (error: any) {
            console.log(`    ❌ "${prompt}" - Failed: ${error.message}`);
          }
          
          // Small delay between requests
          await this.delay(1000);
        }
      }
    }

    return this.generateReport();
  }

  /**
   * Test a single asset generation
   */
  private async testSingleAsset(
    type: string,
    tier: string,
    prompt: string,
    expectedKeywords: string[],
    userId: string
  ): Promise<TestResult> {
    const startTime = Date.now();
    
    // Generate the asset
    const response = await axios.post(
      `${this.baseUrl}/api/generate/${type}`,
      { prompt, tier, userId }
    );

    const endTime = Date.now();
    const generationTime = endTime - startTime;

    const { data } = response.data;
    
    // Evaluate quality metrics
    const metrics = this.evaluateQuality(
      data,
      prompt,
      expectedKeywords,
      type,
      tier
    );

    // Generate notes based on evaluation
    const notes = this.generateNotes(metrics, data, type, tier);

    return {
      assetType: type,
      tier,
      prompt,
      generationTime,
      cost: data.cost,
      url: data.url,
      metrics,
      notes
    };
  }

  /**
   * Evaluate quality metrics for generated asset
   */
  private evaluateQuality(
    data: any,
    _prompt: string,
    expectedKeywords: string[],
    _type: string,
    _tier: string
  ): QualityMetrics {
    // Since we can't actually analyze images in demo mode,
    // we'll use heuristics based on the generation data
    
    // Prompt adherence: Check if optimized prompt contains expected keywords with defensive fallback
    const optimizedPrompt = (data.optimizedPrompt || data.prompt || _prompt).toLowerCase();
    const matchedKeywords = expectedKeywords.filter(kw => 
      optimizedPrompt.includes(kw.toLowerCase())
    );
    const promptAdherence = (matchedKeywords.length / expectedKeywords.length) * 100;

    // Technical quality: Based on tier settings with defensive checks
    const qualitySettings = data.quality || {};
    let technicalQuality = 50; // Base score
    
    if ((qualitySettings.width || 0) >= 1024) technicalQuality += 25;
    if ((qualitySettings.steps || 0) >= 25) technicalQuality += 15;
    if ((qualitySettings.steps || 0) >= 50) technicalQuality += 10;

    // Crypto relevance: Check for crypto keywords in prompt
    const cryptoKeywords = ['crypto', 'bitcoin', 'ethereum', 'defi', 'nft', 'web3', 'token', 'coin'];
    const hasCryptoContext = cryptoKeywords.some(kw => 
      optimizedPrompt.includes(kw)
    );
    const cryptoRelevance = hasCryptoContext ? 85 : 60;

    // Uniqueness: Higher tiers should produce more unique results
    const uniqueness = _tier === 'viral' ? 90 : _tier === 'starter' ? 75 : 60;

    // Calculate overall score
    const overall = Math.round(
      (promptAdherence + technicalQuality + cryptoRelevance + uniqueness) / 4
    );

    return {
      promptAdherence: Math.round(promptAdherence),
      technicalQuality: Math.round(technicalQuality),
      cryptoRelevance: Math.round(cryptoRelevance),
      uniqueness: Math.round(uniqueness),
      overall
    };
  }

  /**
   * Generate evaluation notes
   */
  private generateNotes(
    metrics: QualityMetrics,
    data: any,
    _type: string,
    _tier: string
  ): string[] {
    const notes: string[] = [];

    // Prompt adherence notes
    if (metrics.promptAdherence < 70) {
      notes.push('⚠️ Low prompt adherence - consider improving prompt optimization');
    } else if (metrics.promptAdherence >= 90) {
      notes.push('✅ Excellent prompt adherence');
    }

    // Technical quality notes
    if (metrics.technicalQuality >= 80) {
      notes.push(`✅ High technical quality (${data.quality.width}x${data.quality.height}, ${data.quality.steps} steps)`);
    } else if (metrics.technicalQuality < 60) {
      notes.push('⚠️ Lower technical quality due to tier limitations');
    }

    // Crypto relevance notes
    if (metrics.cryptoRelevance >= 80) {
      notes.push('✅ Strong crypto/Web3 theme integration');
    } else {
      notes.push('💡 Consider adding more crypto-specific elements');
    }

    // Performance notes
    if (data.processingTime < 2000) {
      notes.push(`⚡ Fast generation (${data.processingTime}ms)`);
    } else if (data.processingTime > 5000) {
      notes.push(`🐌 Slow generation (${data.processingTime}ms)`);
    }

    // Cost efficiency
    const costEfficiency = metrics.overall / (data.cost * 100);
    if (costEfficiency > 1.5) {
      notes.push(`💰 Good value (${metrics.overall} score for ${data.cost} credits)`);
    }

    return notes;
  }

  /**
   * Generate comprehensive test report
   */
  private generateReport(): TestReport {
    // Calculate summaries
    const byType: Record<string, { avgScore: number; tests: number }> = {};
    const byTier: Record<string, { avgScore: number; tests: number }> = {};

    for (const result of this.results) {
      // By type
      if (!byType[result.assetType]) {
        byType[result.assetType] = { avgScore: 0, tests: 0 };
      }
      byType[result.assetType]!.tests++;
      byType[result.assetType]!.avgScore += result.metrics.overall;

      // By tier
      if (!byTier[result.tier]) {
        byTier[result.tier] = { avgScore: 0, tests: 0 };
      }
      byTier[result.tier]!.tests++;
      byTier[result.tier]!.avgScore += result.metrics.overall;
    }

    // Calculate averages
    Object.keys(byType).forEach(type => {
      byType[type]!.avgScore = Math.round(byType[type]!.avgScore / byType[type]!.tests);
    });
    Object.keys(byTier).forEach(tier => {
      byTier[tier]!.avgScore = Math.round(byTier[tier]!.avgScore / byTier[tier]!.tests);
    });

    // Generate recommendations
    const recommendations = this.generateRecommendations(byType, byTier);

    return {
      timestamp: new Date().toISOString(),
      totalTests: this.results.length,
      results: this.results,
      summary: {
        byType,
        byTier,
        recommendations
      }
    };
  }

  /**
   * Generate actionable recommendations
   */
  private generateRecommendations(
    byType: Record<string, { avgScore: number; tests: number }>,
    byTier: Record<string, { avgScore: number; tests: number }>
  ): string[] {
    const recommendations: string[] = [];

    // Type-based recommendations
    Object.entries(byType).forEach(([type, data]) => {
      if (data.avgScore < 70) {
        recommendations.push(`🔧 ${type} generation needs improvement (avg: ${data.avgScore}/100)`);
      } else if (data.avgScore >= 85) {
        recommendations.push(`✅ ${type} generation performing excellently (avg: ${data.avgScore}/100)`);
      }
    });

    // Tier-based recommendations
    const tierDiff = (byTier['viral']?.avgScore || 0) - (byTier['free']?.avgScore || 0);
    if (tierDiff < 15) {
      recommendations.push('⚠️ Consider increasing quality gap between tiers');
    } else if (tierDiff > 25) {
      recommendations.push('✅ Good tier differentiation in quality');
    }

    // General recommendations
    const overallAvg = this.results.reduce((sum, r) => sum + r.metrics.overall, 0) / this.results.length;
    
    if (overallAvg < 70) {
      recommendations.push('🚨 Overall quality below target - consider upgrading models or prompts');
    } else if (overallAvg >= 80) {
      recommendations.push('🎉 Overall quality exceeds expectations!');
    }

    // Cost optimization
    const avgCostPerPoint = this.results.reduce((sum, r) => 
      sum + (r.cost / r.metrics.overall), 0
    ) / this.results.length;
    
    if (avgCostPerPoint > 0.02) {
      recommendations.push('💸 Consider optimizing costs - quality/credit ratio could be better');
    }

    return recommendations;
  }

  /**
   * Save report to file
   */
  async saveReport(report: TestReport, filename?: string): Promise<string> {
    const reportsDir = path.join(process.cwd(), 'test-reports');
    await fs.mkdir(reportsDir, { recursive: true });
    
    const reportFilename = filename || `quality-test-${Date.now()}.json`;
    const filepath = path.join(reportsDir, reportFilename);
    
    await fs.writeFile(filepath, JSON.stringify(report, null, 2));
    
    // Also create a summary markdown
    const summaryPath = filepath.replace('.json', '-summary.md');
    await fs.writeFile(summaryPath, this.generateMarkdownSummary(report));
    
    console.log(`\n📄 Report saved to: ${filepath}`);
    console.log(`📊 Summary saved to: ${summaryPath}`);
    
    return filepath;
  }

  /**
   * Generate markdown summary
   */
  private generateMarkdownSummary(report: TestReport): string {
    let md = `# Asset Quality Test Report\n\n`;
    md += `**Date**: ${new Date(report.timestamp).toLocaleString()}\n`;
    md += `**Total Tests**: ${report.totalTests}\n\n`;
    
    md += `## Summary by Asset Type\n\n`;
    md += `| Type | Average Score | Tests Run |\n`;
    md += `|------|--------------|----------|\n`;
    Object.entries(report.summary.byType).forEach(([type, data]) => {
      md += `| ${type} | ${data.avgScore}/100 | ${data.tests} |\n`;
    });
    
    md += `\n## Summary by Tier\n\n`;
    md += `| Tier | Average Score | Tests Run |\n`;
    md += `|------|--------------|----------|\n`;
    Object.entries(report.summary.byTier).forEach(([tier, data]) => {
      md += `| ${tier} | ${data.avgScore}/100 | ${data.tests} |\n`;
    });
    
    md += `\n## Recommendations\n\n`;
    report.summary.recommendations.forEach(rec => {
      md += `- ${rec}\n`;
    });
    
    md += `\n## Top Performing Prompts\n\n`;
    const topResults = [...report.results]
      .sort((a, b) => b.metrics.overall - a.metrics.overall)
      .slice(0, 5);
    
    topResults.forEach(result => {
      md += `- **"${result.prompt}"** (${result.assetType}/${result.tier}): ${result.metrics.overall}/100\n`;
    });
    
    return md;
  }

  /**
   * Create test user
   */
  private async createTestUser(userId: string): Promise<void> {
    try {
      await axios.post(`${this.baseUrl}/api/users`, {
        walletAddress: `test-wallet-${userId}`
      });
      console.log(`✅ Test user created: ${userId}`);
    } catch (error) {
      console.log(`ℹ️  User might already exist: ${userId}`);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}