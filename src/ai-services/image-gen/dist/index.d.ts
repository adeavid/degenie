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
/**
 * Create a new logo generator instance with configuration validation
 */
export declare function createLogoGenerator(): LogoGenerator;
/**
 * Quick logo generation function for simple use cases
 */
export declare function generateLogo(tokenName: string, theme?: string): Promise<import("./types").LogoResponse>;
export default LogoGenerator;
//# sourceMappingURL=index.d.ts.map