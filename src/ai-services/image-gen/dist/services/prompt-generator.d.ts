/**
 * DeGenie Logo Prompt Generation Service
 * Generates optimized prompts for AI logo generation
 */
import { LogoStyle } from '../types';
export declare class PromptGenerator {
    private template;
    generatePrompt(tokenName: string, theme?: string, style?: LogoStyle, colors?: string[]): string;
    generateEnhancedPrompt(tokenName: string, theme?: string, style?: LogoStyle, colors?: string[]): string;
    validateTokenName(tokenName: string): {
        isValid: boolean;
        suggestion?: string;
    };
    suggestTheme(tokenName: string): string[];
    private getRandomEnhancers;
}
//# sourceMappingURL=prompt-generator.d.ts.map