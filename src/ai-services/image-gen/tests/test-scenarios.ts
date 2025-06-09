/**
 * DeGenie Logo Generation Test Scenarios
 * Comprehensive testing with various input scenarios
 */

import { LogoGenerationApiClient, createApiClient } from '../src/client/api-client';
import { LogoStyle, ImageSize, ImageFormat } from '../src/types';

<<<<<<< HEAD
interface LogoGenerationInput {
  tokenName: string;
  theme?: string;
  style?: LogoStyle;
  colors?: string[];
  size?: ImageSize;
  format?: ImageFormat;
  variations?: number;
}

export interface TestScenario {
  name: string;
  description: string;
  input: Partial<LogoGenerationInput>;
=======
export interface TestScenario {
  name: string;
  description: string;
  input: any;
>>>>>>> origin/main
  expectedBehavior: 'success' | 'error' | 'partial';
  category: 'basic' | 'edge-case' | 'stress' | 'validation';
}

export const testScenarios: TestScenario[] = [
  // Basic functionality tests
  {
    name: 'Simple crypto token',
    description: 'Generate logo for a basic crypto token',
    input: {
      tokenName: 'CryptoCoin',
      theme: 'crypto',
      style: LogoStyle.MODERN,
    },
    expectedBehavior: 'success',
    category: 'basic',
  },
  {
    name: 'Gaming token with colors',
    description: 'Generate gaming-themed logo with specific colors',
    input: {
      tokenName: 'GameToken',
      theme: 'gaming',
      style: LogoStyle.FUTURISTIC,
      colors: ['#FF6B35', '#F7931E', '#FFD23F'],
      size: ImageSize.LARGE,
    },
    expectedBehavior: 'success',
    category: 'basic',
  },
  {
    name: 'DeFi professional logo',
    description: 'Generate professional DeFi logo',
    input: {
      tokenName: 'DeFiMaster',
      theme: 'defi',
      style: LogoStyle.PROFESSIONAL,
      size: ImageSize.XLARGE,
      format: ImageFormat.PNG,
    },
    expectedBehavior: 'success',
    category: 'basic',
  },
  {
    name: 'NFT artistic logo',
    description: 'Generate artistic NFT-themed logo',
    input: {
      tokenName: 'ArtNFT',
      theme: 'nft',
      style: LogoStyle.GRADIENT,
      colors: ['#667eea', '#764ba2', '#f093fb'],
    },
    expectedBehavior: 'success',
    category: 'basic',
  },
  {
    name: 'Meme token playful',
    description: 'Generate playful meme token logo',
    input: {
      tokenName: 'MemeGenie',
      theme: 'meme',
      style: LogoStyle.PLAYFUL,
      size: ImageSize.MEDIUM,
    },
    expectedBehavior: 'success',
    category: 'basic',
  },

  // Edge cases
  {
    name: 'Very long token name',
    description: 'Test with extremely long token name',
    input: {
<<<<<<< HEAD
      tokenName: 'SuperDuperMegaAwesomeUltraSpecialCryptoTokenOfTheDecentralizedFuture', // 68 chars > 50
      theme: 'crypto',
      style: LogoStyle.MINIMALIST,
    },
    expectedBehavior: 'error', // validation should reject names >50 chars
=======
      tokenName: 'SuperDuperMegaAwesomeUltraSpecialCryptoTokenOfTheDecentralizedFuture',
      theme: 'crypto',
      style: LogoStyle.MINIMALIST,
    },
    expectedBehavior: 'success',
>>>>>>> origin/main
    category: 'edge-case',
  },
  {
    name: 'Single character name',
    description: 'Test with single character token name',
    input: {
      tokenName: 'X',
      theme: 'tech',
      style: LogoStyle.MODERN,
    },
    expectedBehavior: 'success',
    category: 'edge-case',
  },
  {
    name: 'Special characters',
    description: 'Test with special characters in name',
    input: {
      tokenName: 'Token-2024!',
      theme: 'innovation',
      style: LogoStyle.FUTURISTIC,
    },
    expectedBehavior: 'success',
    category: 'edge-case',
  },
  {
    name: 'Numbers only',
    description: 'Test with numeric token name',
    input: {
      tokenName: '2024',
      theme: 'tech',
      style: LogoStyle.MODERN,
    },
    expectedBehavior: 'success',
    category: 'edge-case',
  },
  {
    name: 'Unicode characters',
    description: 'Test with unicode/emoji characters',
    input: {
      tokenName: 'Token🚀',
      theme: 'innovation',
      style: LogoStyle.PLAYFUL,
    },
    expectedBehavior: 'success',
    category: 'edge-case',
  },

  // Auto-theme detection tests
  {
    name: 'Auto-detect gaming theme',
    description: 'Test auto-theme detection for gaming terms',
    input: {
      tokenName: 'GameFi',
      // No explicit theme - should auto-detect
      style: LogoStyle.FUTURISTIC,
    },
    expectedBehavior: 'success',
    category: 'basic',
  },
  {
    name: 'Auto-detect DeFi theme',
    description: 'Test auto-theme detection for DeFi terms',
    input: {
      tokenName: 'SwapToken',
      // No explicit theme - should auto-detect
      style: LogoStyle.PROFESSIONAL,
    },
    expectedBehavior: 'success',
    category: 'basic',
  },
  {
    name: 'Auto-detect meme theme',
    description: 'Test auto-theme detection for meme terms',
    input: {
      tokenName: 'DogeKing',
      // No explicit theme - should auto-detect
      style: LogoStyle.PLAYFUL,
    },
    expectedBehavior: 'success',
    category: 'basic',
  },

  // Multiple variations tests
  {
    name: 'Multiple variations',
    description: 'Generate multiple logo variations',
    input: {
      tokenName: 'VariationToken',
      theme: 'crypto',
      style: LogoStyle.GRADIENT,
      variations: 3,
    },
    expectedBehavior: 'success',
    category: 'basic',
  },

  // Validation error tests
  {
    name: 'Empty token name',
    description: 'Test validation with empty token name',
    input: {
      tokenName: '',
      theme: 'crypto',
      style: LogoStyle.MODERN,
    },
    expectedBehavior: 'error',
    category: 'validation',
  },
  {
    name: 'Missing token name',
    description: 'Test validation without token name',
    input: {
      theme: 'crypto',
      style: LogoStyle.MODERN,
    },
    expectedBehavior: 'error',
    category: 'validation',
  },
  {
    name: 'Invalid style',
    description: 'Test with invalid style value',
    input: {
      tokenName: 'TestToken',
      theme: 'crypto',
      style: 'invalid-style',
    },
    expectedBehavior: 'error',
    category: 'validation',
  },
  {
    name: 'Invalid size',
    description: 'Test with invalid size value',
    input: {
      tokenName: 'TestToken',
      theme: 'crypto',
      style: LogoStyle.MODERN,
      size: '999x999',
    },
    expectedBehavior: 'error',
    category: 'validation',
  },

  // Stress tests
  {
    name: 'Large color array',
    description: 'Test with many color values',
    input: {
      tokenName: 'ColorfulToken',
      theme: 'art',
      style: LogoStyle.GRADIENT,
      colors: ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080'],
    },
    expectedBehavior: 'success',
    category: 'stress',
  },
  {
    name: 'Maximum variations',
    description: 'Test with maximum number of variations',
    input: {
      tokenName: 'MaxVariations',
      theme: 'crypto',
      style: LogoStyle.MODERN,
      variations: 5,
    },
    expectedBehavior: 'success',
    category: 'stress',
  },

  // Real-world scenarios
  {
    name: 'Solana ecosystem token',
    description: 'Generate logo for Solana-based token',
    input: {
      tokenName: 'SolGenie',
      theme: 'crypto',
      style: LogoStyle.GRADIENT,
      colors: ['#9945FF', '#14F195'],
      size: ImageSize.LARGE,
    },
    expectedBehavior: 'success',
    category: 'basic',
  },
  {
    name: 'Community token',
    description: 'Generate logo for community-focused token',
    input: {
      tokenName: 'CommunityDAO',
      theme: 'community',
      style: LogoStyle.MODERN,
      colors: ['#4CAF50', '#2196F3'],
    },
    expectedBehavior: 'success',
    category: 'basic',
  },
  {
    name: 'Utility token',
    description: 'Generate logo for utility token',
    input: {
      tokenName: 'UtilityPay',
      theme: 'utility',
      style: LogoStyle.PROFESSIONAL,
      size: ImageSize.MEDIUM,
    },
    expectedBehavior: 'success',
    category: 'basic',
  },
];

export class TestRunner {
  private client: LogoGenerationApiClient;
  private results: Array<{
    scenario: TestScenario;
    result: any;
    success: boolean;
    duration: number;
    error?: string;
  }> = [];

  constructor(baseUrl?: string) {
    this.client = createApiClient({
      baseUrl: baseUrl || 'http://localhost:3001',
      timeout: 180000, // 3 minutes for testing
    });
  }

<<<<<<< HEAD
  // Public wrapper methods for accessing private functionality
  public async testConnection(): Promise<boolean> {
    return this.client.testConnection();
  }

  public async runScenario(scenario: TestScenario): Promise<void> {
    return this.runSingleTest(scenario);
  }

=======
>>>>>>> origin/main
  async runAllTests(): Promise<void> {
    console.log('🧪 Starting comprehensive logo generation tests...\n');

    // First check if server is available
    const isConnected = await this.client.testConnection();
    if (!isConnected) {
      console.error('❌ Cannot connect to API server. Make sure it\'s running on port 3001');
      return;
    }

    console.log('✅ Connected to API server\n');

    // Run tests by category
    const categories = ['validation', 'basic', 'edge-case', 'stress'];
    
    for (const category of categories) {
      await this.runCategoryTests(category);
    }

    // Generate summary report
    this.generateReport();
  }

  private async runCategoryTests(category: string): Promise<void> {
    const categoryScenarios = testScenarios.filter(s => s.category === category);
    console.log(`📋 Running ${category.toUpperCase()} tests (${categoryScenarios.length} scenarios):\n`);

    for (const scenario of categoryScenarios) {
      await this.runSingleTest(scenario);
    }

    console.log('\n');
  }

  private async runSingleTest(scenario: TestScenario): Promise<void> {
    const startTime = Date.now();
    
    try {
      console.log(`   Testing: ${scenario.name}...`);
      
      let result;
      if (scenario.input.variations && scenario.input.variations > 1) {
<<<<<<< HEAD
        if (!scenario.input.tokenName) {
          throw new Error('Token name is required for variations');
        }
=======
>>>>>>> origin/main
        result = await this.client.generateVariations(
          scenario.input.tokenName,
          scenario.input.variations,
          scenario.input
        );
      } else {
<<<<<<< HEAD
        if (!scenario.input.tokenName) {
          throw new Error('Token name is required');
        }
=======
>>>>>>> origin/main
        result = await this.client.generateSimpleLogo(
          scenario.input.tokenName,
          scenario.input.theme,
          scenario.input.style
        );
      }

      const duration = Date.now() - startTime;
      const success = this.evaluateResult(result, scenario.expectedBehavior);

      this.results.push({
        scenario,
        result,
        success,
        duration,
      });

      const status = success ? '✅' : '⚠️';
      console.log(`   ${status} ${scenario.name} (${duration}ms)`);

      if (!success) {
        console.log(`      Expected: ${scenario.expectedBehavior}, Got: ${this.getResultType(result)}`);
      }

    } catch (error) {
      const duration = Date.now() - startTime;
      const success = scenario.expectedBehavior === 'error';

      this.results.push({
        scenario,
        result: null,
        success,
        duration,
        error: error.message,
      });

      const status = success ? '✅' : '❌';
      console.log(`   ${status} ${scenario.name} (${duration}ms)`);
      
      if (!success) {
        console.log(`      Error: ${error.message}`);
      }
    }
  }

  private evaluateResult(result: any, expected: 'success' | 'error' | 'partial'): boolean {
    const resultType = this.getResultType(result);
    
    switch (expected) {
      case 'success':
        return resultType === 'success';
      case 'error':
        return resultType === 'error';
      case 'partial':
        return resultType === 'partial' || resultType === 'success';
      default:
        return false;
    }
  }

  private getResultType(result: any): 'success' | 'error' | 'partial' {
    if (!result) return 'error';
    
    if (Array.isArray(result)) {
      // Multiple variations
      const successCount = result.filter(r => r.success).length;
      if (successCount === result.length) return 'success';
      if (successCount > 0) return 'partial';
      return 'error';
    } else {
      // Single result
      return result.success ? 'success' : 'error';
    }
  }

  private generateReport(): void {
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('='.repeat(60));

    const total = this.results.length;
    const passed = this.results.filter(r => r.success).length;
    const failed = total - passed;

    console.log(`\nOverall Results:`);
    console.log(`   Total tests: ${total}`);
    console.log(`   Passed: ${passed} (${Math.round(passed/total*100)}%)`);
    console.log(`   Failed: ${failed} (${Math.round(failed/total*100)}%)`);

    // Results by category
    console.log(`\nResults by Category:`);
    const categories = ['validation', 'basic', 'edge-case', 'stress'];
    
    for (const category of categories) {
      const categoryResults = this.results.filter(r => r.scenario.category === category);
      const categoryPassed = categoryResults.filter(r => r.success).length;
      const categoryTotal = categoryResults.length;
      
      console.log(`   ${category.padEnd(12)}: ${categoryPassed}/${categoryTotal} passed`);
    }

    // Performance stats
    const durations = this.results.map(r => r.duration);
    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
    const maxDuration = Math.max(...durations);
    const minDuration = Math.min(...durations);

    console.log(`\nPerformance:`);
    console.log(`   Average duration: ${Math.round(avgDuration)}ms`);
    console.log(`   Fastest test: ${minDuration}ms`);
    console.log(`   Slowest test: ${maxDuration}ms`);

    // Failed tests details
    const failedTests = this.results.filter(r => !r.success);
    if (failedTests.length > 0) {
      console.log(`\nFailed Tests:`);
      failedTests.forEach(test => {
        console.log(`   ❌ ${test.scenario.name}: ${test.error || 'Unexpected result'}`);
      });
    }

    console.log('\n' + '='.repeat(60));
    
    // Overall assessment
    const successRate = passed / total;
    if (successRate >= 0.9) {
      console.log('🎉 EXCELLENT: All core functionality working correctly!');
    } else if (successRate >= 0.8) {
      console.log('✅ GOOD: Most functionality working, minor issues to address');
    } else if (successRate >= 0.6) {
      console.log('⚠️ FAIR: Basic functionality working, several issues need attention');
    } else {
      console.log('❌ POOR: Significant issues detected, requires immediate attention');
    }
  }

  getResults() {
    return this.results;
  }
}

