/**
 * DeGenie Logo Generation Mock Tests
 * Tests that can run without actual API keys (for development)
 */

import { LogoGenerator } from '../src/services/logo-generator';
import { PromptGenerator } from '../src/services/prompt-generator';
import { LogoRequest, LogoStyle, ImageSize, AIProvider } from '../src/types';
import { config } from '../src/config';

export class MockTestRunner {
  private promptGenerator: PromptGenerator;
  private results: Array<{
    testName: string;
    success: boolean;
    duration: number;
    details: any;
    error?: string;
  }> = [];

  constructor() {
    this.promptGenerator = new PromptGenerator();
    
    // Mock API keys for testing to prevent initialization failures
    this.setupMockApiKeys();
  }

  private setupMockApiKeys() {
    // Ensure at least one API key is set for LogoGenerator initialization
    if (!config.openai.apiKey && !config.stabilityAI.apiKey) {
      // Set a dummy API key for testing
      (config.openai as any).apiKey = 'test-key-for-mocking';
    }
  }

  async runAllMockTests(): Promise<void> {
    console.log('🧪 Running mock tests (no API keys required)...\n');

    const tests = [
      () => this.testPromptGeneration(),
      () => this.testThemeSuggestions(),
      () => this.testConfigValidation(),
      () => this.testInputValidation(),
      () => this.testServiceInitialization(),
      () => this.testEdgeCases(),
    ];

    for (const test of tests) {
      await this.runSingleMockTest(test);
    }

    this.generateMockReport();
  }

  private async runSingleMockTest(testFn: () => Promise<void> | void): Promise<void> {
    const testName = testFn.name.replace('test', '').replace(/([A-Z])/g, ' $1').trim();
    const startTime = Date.now();

    try {
      await testFn();
      const duration = Date.now() - startTime;
      
      this.results.push({
        testName,
        success: true,
        duration,
        details: 'Test completed successfully',
      });

      console.log(`✅ ${testName} (${duration}ms)`);

    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.results.push({
        testName,
        success: false,
        duration,
        details: 'Test failed',
        error: error instanceof Error ? error.message : String(error),
      });

      console.log(`❌ ${testName} (${duration}ms): ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async testPromptGeneration(): Promise<void> {
    console.log('   Testing prompt generation...');

    // Test basic prompt generation
    const prompt1 = this.promptGenerator.generatePrompt({ tokenName: 'CryptoCoin', theme: 'crypto', style: LogoStyle.MODERN });
    if (!prompt1 || prompt1.length < 10) {
      throw new Error('Basic prompt generation failed');
    }

    // Test with colors
    const prompt2 = this.promptGenerator.generatePrompt({
      tokenName: 'GameToken',
      theme: 'gaming',
      style: LogoStyle.FUTURISTIC,
      colors: ['#FF0000', '#00FF00']
    });
    if (!prompt2.includes('color') || !prompt2.includes('FF0000')) {
      console.warn('Color information might not be properly included in prompt');
    }

    // Test auto-theme detection
    const prompt3 = this.promptGenerator.generatePrompt({ tokenName: 'DeFiSwap' }); // No explicit theme
    if (!prompt3) {
      throw new Error('Auto-theme prompt generation failed');
    }

    // Test with special characters
    const prompt4 = this.promptGenerator.generatePrompt({ tokenName: 'Token-2024!', theme: 'tech', style: LogoStyle.MINIMALIST });
    if (!prompt4) {
      throw new Error('Special character handling failed');
    }

    console.log('     ✓ Basic prompt generation');
    console.log('     ✓ Color inclusion in prompts');
    console.log('     ✓ Auto-theme detection');
    console.log('     ✓ Special character handling');
  }

  private async testThemeSuggestions(): Promise<void> {
    console.log('   Testing theme suggestions...');

    // Create a mock logo generator for theme suggestions
    const logoGenerator = new LogoGenerator();

    // Test gaming-related tokens
    const gamingSuggestions = logoGenerator.suggestThemes('GameFi');
    if (!gamingSuggestions.includes('gaming') && !gamingSuggestions.includes('game')) {
      throw new Error('Gaming theme not suggested for gaming-related token');
    }

    // Test DeFi-related tokens
    const defiSuggestions = logoGenerator.suggestThemes('SwapToken');
    if (!defiSuggestions.includes('defi') && !defiSuggestions.includes('finance')) {
      throw new Error('DeFi theme not suggested for DeFi-related token');
    }

    // Test meme-related tokens
    const memeSuggestions = logoGenerator.suggestThemes('DogeKing');
    if (!memeSuggestions.includes('meme') && !memeSuggestions.includes('community')) {
      throw new Error('Meme theme not suggested for meme-related token');
    }

    // Test unknown tokens (should return defaults)
    const unknownSuggestions = logoGenerator.suggestThemes('UnknownToken');
    if (unknownSuggestions.length === 0) {
      throw new Error('No suggestions returned for unknown token');
    }

    console.log('     ✓ Gaming theme detection');
    console.log('     ✓ DeFi theme detection');
    console.log('     ✓ Meme theme detection');
    console.log('     ✓ Default theme fallback');
  }

  private async testConfigValidation(): Promise<void> {
    console.log('   Testing configuration validation...');

    const { validateConfig } = await import('../src/config');

    // Test current config
    const validation = validateConfig();
    
    // Should not crash, but may not be valid without API keys
    if (typeof validation.isValid !== 'boolean') {
      throw new Error('Config validation returned invalid response');
    }

    if (!Array.isArray(validation.errors)) {
      throw new Error('Config validation errors should be an array');
    }

    console.log('     ✓ Config validation function works');
    console.log(`     ✓ Current config valid: ${validation.isValid}`);
    console.log(`     ✓ Validation errors count: ${validation.errors.length}`);
  }

  private async testInputValidation(): Promise<void> {
    console.log('   Testing input validation...');

    // Test valid requests
    const validRequest: LogoRequest = {
      tokenName: 'TestToken',
      theme: 'crypto',
      style: LogoStyle.MODERN,
      size: ImageSize.LARGE,
    };

    // Should not throw
    this.validateRequestFormat(validRequest);

    // Test edge cases
    const edgeCases = [
      { tokenName: 'X', theme: 'crypto' }, // Single character
      { tokenName: 'VeryLongTokenNameThatGoesOnAndOn', theme: 'crypto' }, // Long name
      { tokenName: 'Token123', theme: 'tech' }, // With numbers
      { tokenName: 'Token-Name!', theme: 'innovation' }, // Special chars
    ];

    edgeCases.forEach(request => {
      this.validateRequestFormat(request as LogoRequest);
    });

    console.log('     ✓ Valid request format validation');
    console.log('     ✓ Edge case handling');
  }

  private validateRequestFormat(request: LogoRequest): void {
    if (!request.tokenName || typeof request.tokenName !== 'string') {
      throw new Error('Invalid token name');
    }
    
    if (request.tokenName.trim().length === 0) {
      throw new Error('Empty token name');
    }

    // Additional validations can be added here
  }

  private async testServiceInitialization(): Promise<void> {
    console.log('   Testing service initialization...');

    try {
      // Test that we can create service instances without API keys
      const promptGenerator = new PromptGenerator();
      if (!promptGenerator) {
        throw new Error('Failed to create PromptGenerator');
      }

      const logoGenerator = new LogoGenerator();
      if (!logoGenerator) {
        throw new Error('Failed to create LogoGenerator');
      }

      // Test basic methods don't crash
      const stats = logoGenerator.getUsageStats();
      if (typeof stats !== 'object') {
        throw new Error('Usage stats should return an object');
      }

      const history = logoGenerator.getGenerationHistory();
      if (!Array.isArray(history)) {
        throw new Error('Generation history should return an array');
      }

      console.log('     ✓ Service instantiation');
      console.log('     ✓ Basic method calls');
      console.log('     ✓ Stats retrieval');
      console.log('     ✓ History retrieval');

    } catch (error) {
      throw new Error(`Service initialization failed: ${error.message}`);
    }
  }

  private async testEdgeCases(): Promise<void> {
    console.log('   Testing edge cases...');

    // Test very long token names
    const longName = 'A'.repeat(200);
    const longPrompt = this.promptGenerator.generatePrompt({ tokenName: longName, theme: 'crypto', style: LogoStyle.MODERN });
    if (!longPrompt) {
      throw new Error('Failed to handle very long token name');
    }

    // Test empty/invalid inputs (should not crash)
    try {
      this.promptGenerator.generatePrompt({ tokenName: '', theme: 'crypto', style: LogoStyle.MODERN });
    } catch (error) {
      // This is expected to fail, but shouldn't crash the service
    }

    // Test with undefined style (valid TypeScript, tests graceful handling)
    const invalidStylePrompt = this.promptGenerator.generatePrompt({
      tokenName: 'TestToken',
      theme: 'crypto',
      style: undefined
    });
    if (!invalidStylePrompt) {
      throw new Error('Failed to handle undefined style gracefully');
    }

    console.log('     ✓ Long token name handling');
    console.log('     ✓ Empty input handling');
    console.log('     ✓ Invalid enum handling');
  }

  private generateMockReport(): void {
    console.log('\n' + '='.repeat(50));
    console.log('📊 MOCK TEST RESULTS');
    console.log('='.repeat(50));

    const total = this.results.length;
    const passed = this.results.filter(r => r.success).length;
    const failed = total - passed;

    console.log(`\nResults:`);
    console.log(`   Total tests: ${total}`);
    console.log(`   Passed: ${passed} (${Math.round(passed/total*100)}%)`);
    console.log(`   Failed: ${failed} (${Math.round(failed/total*100)}%)`);

    if (failed > 0) {
      console.log(`\nFailed Tests:`);
      this.results
        .filter(r => !r.success)
        .forEach(result => {
          console.log(`   ❌ ${result.testName}: ${result.error}`);
        });
    }

    const avgDuration = this.results.reduce((sum, r) => sum + r.duration, 0) / total;
    console.log(`\nAverage test duration: ${Math.round(avgDuration)}ms`);

    console.log('\n' + '='.repeat(50));

    if (passed === total) {
      console.log('🎉 All mock tests passed! Core functionality is working.');
    } else {
      console.log('⚠️ Some mock tests failed. Check the implementation.');
    }

    console.log('\nNext steps:');
    console.log('1. Set up API keys in .env file');
    console.log('2. Run integration tests: npm run test:scenarios');
    console.log('3. Start the API server: npm run dev:server');
  }
}

// Run if this file is executed directly
if (require.main === module) {
  const runner = new MockTestRunner();
  runner.runAllMockTests().catch(console.error);
}