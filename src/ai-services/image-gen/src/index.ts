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
  if (!tokenName || typeof tokenName !== 'string' || tokenName.trim().length === 0) {
    throw new Error('Token name is required and must be a non-empty string');
  }
  
  // Validate token name length and characters
  const trimmedTokenName = tokenName.trim();
  if (trimmedTokenName.length > 100) {
    throw new Error('Token name must be 100 characters or less');
  }
  
  // Basic sanitization - allow alphanumeric, spaces, and common symbols
  if (!/^[a-zA-Z0-9\s\-_\.]+$/.test(trimmedTokenName)) {
    throw new Error('Token name contains invalid characters');
  }

  if (theme !== undefined && (typeof theme !== 'string' || theme.trim().length === 0)) {
    throw new Error('Theme must be a string if provided');
  }
  
  if (theme && theme.length > 50) {
    throw new Error('Theme must be 50 characters or less');
  }

  const generator = createLogoGenerator();
  return await generator.generateLogo({
    tokenName: trimmedTokenName,
    theme: theme?.trim(),
  });
}

// Default export
export default LogoGenerator;