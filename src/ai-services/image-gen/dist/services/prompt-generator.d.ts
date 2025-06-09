/**
 * DeGenie Logo Prompt Generation Service
 * Generates optimized prompts for AI logo generation
 */
import { LogoStyle } from '../types';
export interface PromptOptions {
    tokenName: string;
    theme?: string;
    style?: LogoStyle;
    colors?: string[];
}
export declare class PromptGenerator {
    private template;
    generatePrompt(options: PromptOptions): string;
    generateEnhancedPrompt(options: PromptOptions): string;
    validateTokenName(tokenName: string): {
        isValid: boolean;
        suggestion?: string;
    };
    suggestTheme(tokenName: string): string[];
    private getRandomEnhancers;
    private shuffleArray;
}
//# sourceMappingURL=prompt-generator.d.ts.map