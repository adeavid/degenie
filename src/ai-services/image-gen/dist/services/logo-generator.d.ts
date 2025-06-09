/**
 * DeGenie Logo Generator Service
 * Main service that orchestrates AI logo generation with multiple providers
 */
import { LogoRequest, LogoResponse, GenerationOptions } from '../types';
export declare class LogoGenerator {
    private promptGenerator;
    private openaiClient?;
    private stabilityClient?;
    private generationHistory;
    constructor();
    private initializeClients;
    generateLogo(request: LogoRequest, options?: GenerationOptions): Promise<LogoResponse>;
    private tryProvider;
    private validateRequest;
    private saveLogoLocally;
    suggestThemes(tokenName: string): string[];
    getGenerationHistory(): LogoResponse[];
    getUsageStats(): any;
    clearHistory(): Promise<void>;
    generateVariations(request: LogoRequest, count?: number): Promise<LogoResponse[]>;
}
//# sourceMappingURL=logo-generator.d.ts.map