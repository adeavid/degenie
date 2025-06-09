/**
 * Tests for PromptGenerator
 */

import { PromptGenerator } from '../src/services/prompt-generator';
import { LogoStyle } from '../src/types';

describe('PromptGenerator', () => {
  let generator: PromptGenerator;

  beforeEach(() => {
    generator = new PromptGenerator();
  });

  describe('generatePrompt', () => {
    test('should generate basic prompt for token name only', () => {
      const prompt = generator.generatePrompt({ tokenName: 'TestToken' });
      
      expect(prompt).toContain('TestToken');
      expect(prompt).toContain('professional logo');
      expect(prompt).toContain('cryptocurrency token');
      expect(prompt.length).toBeGreaterThan(50);
    });

    test('should include style modifier when provided', () => {
      const prompt = generator.generatePrompt({ tokenName: 'TestToken', style: LogoStyle.MODERN });
      
      expect(prompt).toContain('modern design');
      expect(prompt).toContain('contemporary');
    });

    test('should include theme modifier when provided', () => {
      const prompt = generator.generatePrompt({ tokenName: 'TestToken', theme: 'gaming' });
      
      expect(prompt).toContain('gaming');
    });

    test('should include colors when provided', () => {
      const prompt = generator.generatePrompt({ tokenName: 'TestToken', colors: ['#FF0000', '#00FF00'] });
      
      expect(prompt).toContain('#FF0000');
      expect(prompt).toContain('#00FF00');
    });
  });

  describe('generateEnhancedPrompt', () => {
    test('should generate longer prompt than basic version', () => {
      const basicPrompt = generator.generatePrompt({ tokenName: 'TestToken' });
      const enhancedPrompt = generator.generateEnhancedPrompt({ tokenName: 'TestToken' });
      
      expect(enhancedPrompt.length).toBeGreaterThan(basicPrompt.length);
      expect(enhancedPrompt).toContain('Additional requirements');
    });
  });

  describe('validateTokenName', () => {
    test('should validate correct token names', () => {
      const result = generator.validateTokenName('ValidToken');
      expect(result.isValid).toBe(true);
      expect(result.suggestion).toBeUndefined();
    });

    test('should reject empty token names', () => {
      const result = generator.validateTokenName('');
      expect(result.isValid).toBe(false);
      expect(result.suggestion).toContain('cannot be empty');
    });

    test('should reject very long token names', () => {
      const longName = 'A'.repeat(60);
      const result = generator.validateTokenName(longName);
      expect(result.isValid).toBe(false);
      expect(result.suggestion).toContain('shorter than 50');
    });

    test('should reject token names with special characters', () => {
      const result = generator.validateTokenName('Token@#$');
      expect(result.isValid).toBe(false);
      expect(result.suggestion).toContain('invalid characters');
    });
  });

  describe('suggestTheme', () => {
    test('should suggest gaming theme for game-related tokens', () => {
      const suggestions = generator.suggestTheme('GameToken');
      expect(suggestions).toContain('gaming');
    });

    test('should suggest defi theme for finance-related tokens', () => {
      const suggestions = generator.suggestTheme('YieldFarm');
      expect(suggestions).toContain('defi');
    });

    test('should suggest nft theme for art-related tokens', () => {
      const suggestions = generator.suggestTheme('ArtCollect');
      expect(suggestions).toContain('nft');
    });

    test('should return default suggestions for generic tokens', () => {
      const suggestions = generator.suggestTheme('RandomToken');
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions).toContain('crypto');
    });

    test('should return maximum 3 suggestions', () => {
      const suggestions = generator.suggestTheme('GameArtToken');
      expect(suggestions.length).toBeLessThanOrEqual(3);
    });
  });
});