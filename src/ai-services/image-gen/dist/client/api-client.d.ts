/**
 * DeGenie Logo Generation API Client
 * TypeScript client for interacting with the logo generation API
 */
import { LogoRequest, LogoResponse, AIProvider, LogoStyle } from '../types';
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
export interface ThemeSuggestionsResponse {
    tokenName: string;
    suggestions: string[];
    count: number;
}
export interface VariationsResponse {
    variations: LogoResponse[];
    count: number;
    successCount: number;
}
export interface HistoryResponse {
    history: LogoResponse[];
    count: number;
    limit: number;
}
export interface StatsResponse {
    totalGenerations: number;
    successfulGenerations: number;
    failedGenerations: number;
    averageGenerationTime: number;
    providers: Record<string, any>;
}
export interface ClearHistoryResponse {
    message: string;
    timestamp: string;
}
export interface HealthCheckResponse {
    status: string;
    timestamp: string;
    service: string;
    version: string;
}
export interface ServiceInfoResponse {
    service: string;
    version: string;
    providers: AIProvider[];
    styles: string[];
    sizes: string[];
    formats: string[];
    usage: StatsResponse;
}
export declare class LogoGenerationApiClient {
    private client;
    private retries;
    constructor(config?: ApiClientConfig);
    /**
     * Generate a logo or multiple variations
     */
    generateLogo(request: GenerationRequest): Promise<LogoResponse | VariationsResponse>;
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
    getHistory(limit?: number): Promise<HistoryResponse>;
    /**
     * Get usage statistics
     */
    getStats(): Promise<StatsResponse>;
    /**
     * Clear generation history (admin function)
     */
    clearHistory(): Promise<ClearHistoryResponse>;
    /**
     * Health check
     */
    healthCheck(): Promise<HealthCheckResponse>;
    /**
     * Convenience method: Generate a simple logo
     */
    generateSimpleLogo(tokenName: string, theme?: string, style?: LogoStyle): Promise<LogoResponse>;
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