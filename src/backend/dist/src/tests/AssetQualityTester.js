"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssetQualityTester = void 0;
const axios_1 = __importDefault(require("axios"));
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
class AssetQualityTester {
    baseUrl;
    results = [];
    constructor(baseUrl = 'http://localhost:4000') {
        this.baseUrl = baseUrl;
    }
    /**
     * Test prompts designed to evaluate different aspects
     */
    getTestPrompts() {
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
    async runFullTestSuite(userId) {
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
                const prompts = testPrompts[type];
                for (const { prompt, expected } of prompts) {
                    try {
                        const result = await this.testSingleAsset(type, tier, prompt, expected, userId);
                        this.results.push(result);
                        console.log(`    ✅ "${prompt}" - Score: ${result.metrics.overall}/100`);
                    }
                    catch (error) {
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
    async testSingleAsset(type, tier, prompt, expectedKeywords, userId) {
        const startTime = Date.now();
        // Generate the asset
        const response = await axios_1.default.post(`${this.baseUrl}/api/generate/${type}`, { prompt, tier, userId });
        const endTime = Date.now();
        const generationTime = endTime - startTime;
        const { data } = response.data;
        // Evaluate quality metrics
        const metrics = this.evaluateQuality(data, prompt, expectedKeywords, type, tier);
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
    evaluateQuality(data, _prompt, expectedKeywords, _type, _tier) {
        // Since we can't actually analyze images in demo mode,
        // we'll use heuristics based on the generation data
        // Prompt adherence: Check if optimized prompt contains expected keywords with defensive fallback
        const optimizedPrompt = (data.optimizedPrompt || data.prompt || _prompt).toLowerCase();
        const matchedKeywords = expectedKeywords.filter(kw => optimizedPrompt.includes(kw.toLowerCase()));
        const promptAdherence = (matchedKeywords.length / expectedKeywords.length) * 100;
        // Technical quality: Based on tier settings with defensive checks
        const qualitySettings = data.quality || {};
        let technicalQuality = 50; // Base score
        if ((qualitySettings.width || 0) >= 1024)
            technicalQuality += 25;
        if ((qualitySettings.steps || 0) >= 25)
            technicalQuality += 15;
        if ((qualitySettings.steps || 0) >= 50)
            technicalQuality += 10;
        // Crypto relevance: Check for crypto keywords in prompt
        const cryptoKeywords = ['crypto', 'bitcoin', 'ethereum', 'defi', 'nft', 'web3', 'token', 'coin'];
        const hasCryptoContext = cryptoKeywords.some(kw => optimizedPrompt.includes(kw));
        const cryptoRelevance = hasCryptoContext ? 85 : 60;
        // Uniqueness: Higher tiers should produce more unique results
        const uniqueness = _tier === 'viral' ? 90 : _tier === 'starter' ? 75 : 60;
        // Calculate overall score
        const overall = Math.round((promptAdherence + technicalQuality + cryptoRelevance + uniqueness) / 4);
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
    generateNotes(metrics, data, _type, _tier) {
        const notes = [];
        // Prompt adherence notes
        if (metrics.promptAdherence < 70) {
            notes.push('⚠️ Low prompt adherence - consider improving prompt optimization');
        }
        else if (metrics.promptAdherence >= 90) {
            notes.push('✅ Excellent prompt adherence');
        }
        // Technical quality notes
        if (metrics.technicalQuality >= 80) {
            notes.push(`✅ High technical quality (${data.quality.width}x${data.quality.height}, ${data.quality.steps} steps)`);
        }
        else if (metrics.technicalQuality < 60) {
            notes.push('⚠️ Lower technical quality due to tier limitations');
        }
        // Crypto relevance notes
        if (metrics.cryptoRelevance >= 80) {
            notes.push('✅ Strong crypto/Web3 theme integration');
        }
        else {
            notes.push('💡 Consider adding more crypto-specific elements');
        }
        // Performance notes
        if (data.processingTime < 2000) {
            notes.push(`⚡ Fast generation (${data.processingTime}ms)`);
        }
        else if (data.processingTime > 5000) {
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
    generateReport() {
        // Calculate summaries
        const byType = {};
        const byTier = {};
        for (const result of this.results) {
            // By type
            if (!byType[result.assetType]) {
                byType[result.assetType] = { avgScore: 0, tests: 0 };
            }
            byType[result.assetType].tests++;
            byType[result.assetType].avgScore += result.metrics.overall;
            // By tier
            if (!byTier[result.tier]) {
                byTier[result.tier] = { avgScore: 0, tests: 0 };
            }
            byTier[result.tier].tests++;
            byTier[result.tier].avgScore += result.metrics.overall;
        }
        // Calculate averages
        Object.keys(byType).forEach(type => {
            byType[type].avgScore = Math.round(byType[type].avgScore / byType[type].tests);
        });
        Object.keys(byTier).forEach(tier => {
            byTier[tier].avgScore = Math.round(byTier[tier].avgScore / byTier[tier].tests);
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
    generateRecommendations(byType, byTier) {
        const recommendations = [];
        // Type-based recommendations
        Object.entries(byType).forEach(([type, data]) => {
            if (data.avgScore < 70) {
                recommendations.push(`🔧 ${type} generation needs improvement (avg: ${data.avgScore}/100)`);
            }
            else if (data.avgScore >= 85) {
                recommendations.push(`✅ ${type} generation performing excellently (avg: ${data.avgScore}/100)`);
            }
        });
        // Tier-based recommendations
        const tierDiff = (byTier['viral']?.avgScore || 0) - (byTier['free']?.avgScore || 0);
        if (tierDiff < 15) {
            recommendations.push('⚠️ Consider increasing quality gap between tiers');
        }
        else if (tierDiff > 25) {
            recommendations.push('✅ Good tier differentiation in quality');
        }
        // General recommendations
        const overallAvg = this.results.reduce((sum, r) => sum + r.metrics.overall, 0) / this.results.length;
        if (overallAvg < 70) {
            recommendations.push('🚨 Overall quality below target - consider upgrading models or prompts');
        }
        else if (overallAvg >= 80) {
            recommendations.push('🎉 Overall quality exceeds expectations!');
        }
        // Cost optimization
        const avgCostPerPoint = this.results.reduce((sum, r) => sum + (r.cost / r.metrics.overall), 0) / this.results.length;
        if (avgCostPerPoint > 0.02) {
            recommendations.push('💸 Consider optimizing costs - quality/credit ratio could be better');
        }
        return recommendations;
    }
    /**
     * Save report to file
     */
    async saveReport(report, filename) {
        const reportsDir = path_1.default.join(process.cwd(), 'test-reports');
        await promises_1.default.mkdir(reportsDir, { recursive: true });
        const reportFilename = filename || `quality-test-${Date.now()}.json`;
        const filepath = path_1.default.join(reportsDir, reportFilename);
        await promises_1.default.writeFile(filepath, JSON.stringify(report, null, 2));
        // Also create a summary markdown
        const summaryPath = filepath.replace('.json', '-summary.md');
        await promises_1.default.writeFile(summaryPath, this.generateMarkdownSummary(report));
        console.log(`\n📄 Report saved to: ${filepath}`);
        console.log(`📊 Summary saved to: ${summaryPath}`);
        return filepath;
    }
    /**
     * Generate markdown summary
     */
    generateMarkdownSummary(report) {
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
    async createTestUser(userId) {
        try {
            await axios_1.default.post(`${this.baseUrl}/api/users`, {
                walletAddress: `test-wallet-${userId}`
            });
            console.log(`✅ Test user created: ${userId}`);
        }
        catch (error) {
            console.log(`ℹ️  User might already exist: ${userId}`);
        }
    }
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
exports.AssetQualityTester = AssetQualityTester;
//# sourceMappingURL=AssetQualityTester.js.map