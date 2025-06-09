/**
 * DeGenie Logo Generation API Client
 * TypeScript client for interacting with the logo generation API
 */
import { LogoRequest, LogoResponse, AIProvider } from '../types';
export interface ApiClientConfig {
    baseUrl?: string;
    timeout?: number;
    apiKey?: string;
    retries?: number;
}
export interface GenerationRequest extends LogoRequest {
    variations?: number;
    provider?: AIProvider;
}
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    code?: string;
}
export interface ThemeSuggestionsResponse {
    tokenName: string;
    suggestions: string[];
    count: number;
}
export interface ServiceInfoResponse {
    service: string;
    version: string;
    providers: AIProvider[];
    styles: string[];
    sizes: string[];
    formats: string[];
    usage: any;
}
export declare class LogoGenerationApiClient {
    private client;
    private retries;
    constructor(config?: ApiClientConfig);
    /**
     * Generate a logo or multiple variations
     */
    generateLogo(request: GenerationRequest): Promise<LogoResponse | {
        variations: LogoResponse[];
        count: number;
        successCount: number;
    }>;
    /**
     * Get theme suggestions for a token name
     */
    suggestThemes(tokenName: string): Promise<ThemeSuggestionsResponse>;
    /**
     * Get service information
     */
    getServiceInfo(): Promise<ServiceInfoResponse>;
    /**
     * Get generation history
     */
    getHistory(limit?: number): Promise<{
        history: LogoResponse[];
        count: number;
        limit: number;
    }>;
    /**
     * Get usage statistics
     */
    getStats(): Promise<any>;
    /**
     * Clear generation history (admin function)
     */
    clearHistory(): Promise<{
        message: string;
        timestamp: string;
    }>;
    /**
     * Health check
     */
    healthCheck(): Promise<{
        status: string;
        timestamp: string;
        service: string;
        version: string;
    }>;
    /**
     * Convenience method: Generate a simple logo
     */
    generateSimpleLogo(tokenName: string, theme?: string, style?: string): Promise<LogoResponse>;
    /**
     * Convenience method: Generate multiple logo variations
     */
    generateVariations(tokenName: string, count?: number, options?: Partial<GenerationRequest>): Promise<LogoResponse[]>;
    /**
     * Convenience method: Get auto-suggested theme and generate logo
     */
    generateWithAutoTheme(tokenName: string, options?: Partial<GenerationRequest>): Promise<LogoResponse>;
    /**
     * Test connection to the API
     */
    testConnection(): Promise<boolean>;
    private makeRequest;
}
export declare function createApiClient(config?: ApiClientConfig): LogoGenerationApiClient;
export default LogoGenerationApiClient;
//# sourceMappingURL=api-client.d.ts.map