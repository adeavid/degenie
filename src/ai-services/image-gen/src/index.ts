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
 * Creates a new {@link LogoGenerator} instance after validating the configuration.
 *
 * @returns A configured {@link LogoGenerator} instance.
 *
 * @throws {Error} If configuration validation fails, listing the validation errors.
 */
export function createLogoGenerator(): LogoGenerator {
  const validation = validateConfig();
  if (!validation.isValid) {
    throw new Error(`Configuration validation failed: ${validation.errors.join(', ')}`);
  }
  
  return new LogoGenerator();
}

/**
 * Generates an AI-powered logo for the specified token name and optional theme.
 *
 * @param tokenName - The name of the token for which to generate a logo. Must be a non-empty string.
 * @param theme - An optional theme to influence the logo's style.
 * @returns A promise that resolves to the generated logo result.
 *
 * @throws {Error} If {@link tokenName} is missing, not a string, or an empty string.
 * @throws {Error} If {@link theme} is provided but is not a string.
 */
export async function generateLogo(tokenName: string, theme?: string) {
  if (!tokenName || typeof tokenName !== 'string' || tokenName.trim().length === 0) {
    throw new Error('Token name is required and must be a non-empty string');
  }

  if (theme && typeof theme !== 'string') {
    throw new Error('Theme must be a string if provided');
  }

  const generator = createLogoGenerator();
  return await generator.generateLogo({
    tokenName: tokenName.trim(),
    theme,
  });
}

// Default export
export default LogoGenerator;