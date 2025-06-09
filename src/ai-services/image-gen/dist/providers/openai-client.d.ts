/**
 * OpenAI DALL-E Client for Logo Generation
 */
import { LogoRequest, LogoResponse, AIProvider } from '../types';
export declare class OpenAIClient {
    private client;
    private requestCount;
    private lastRequestTime;
    constructor();
    generateLogo(prompt: string, request: LogoRequest): Promise<LogoResponse>;
    private checkRateLimit;
    private convertSizeForOpenAI;
    private handleError;
    getUsageStats(): {
        provider: AIProvider;
        requestCount: number;
        lastRequestTime: number;
        rateLimitInfo: string;
    };
}
//# sourceMappingURL=openai-client.d.ts.map