/**
 * DeGenie AI Logo Generation Service
 * Main entry point for AI-powered logo generation
 */

export { LogoGenerator } from './services/logo-generator';
export { PromptGenerator } from './services/prompt-generator';
export { OpenAIClient } from './providers/openai-client';
export { StabilityClient } from './providers/stability-client';
export { config, validateConfig } from './config';

export * from './types';

// Re-export for convenience
import { LogoGenerator } from './services/logo-generator';
import { validateConfig } from './config';

/**
 * Create a new logo generator instance with configuration validation
 */
export function createLogoGenerator(): LogoGenerator {
  const validation = validateConfig();
  if (!validation.isValid) {
    throw new Error(`Configuration validation failed: ${validation.errors.join(', ')}`);
  }
  
  return new LogoGenerator();
}

/**
 * Quick logo generation function for simple use cases
 */
export async function generateLogo(tokenName: string, theme?: string) {
  const generator = createLogoGenerator();
  return await generator.generateLogo({
    tokenName,
    theme,
  });
}

// Default export
export default LogoGenerator;