/**
 * DeGenie Logo Generation Service Configuration
 */
import { AIProvider, ImageSize, ImageFormat, LogoStyle } from '../types';
export interface Config {
    openai: {
        apiKey: string;
        model: string;
        maxRetries: number;
        timeout: number;
    };
    stabilityAI: {
        apiKey: string;
        model: string;
        maxRetries: number;
        timeout: number;
    };
    general: {
        defaultProvider: AIProvider;
        fallbackProvider: AIProvider;
        outputPath: string;
        enableLocalStorage: boolean;
        enablePromptEnhancement: boolean;
    };
    image: {
        defaultSize: ImageSize;
        defaultFormat: ImageFormat;
        defaultStyle: LogoStyle;
        quality: string;
    };
    rateLimiting: {
        maxRequestsPerMinute: number;
        maxRequestsPerHour: number;
    };
    logging: {
        level: string;
        enableMetrics: boolean;
    };
}
export declare const config: Config;
export declare function validateConfig(): {
    isValid: boolean;
    errors: string[];
};
//# sourceMappingURL=index.d.ts.map