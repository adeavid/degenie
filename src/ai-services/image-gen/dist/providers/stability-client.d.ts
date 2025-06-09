/**
 * Stability AI Client for Logo Generation
 */
import { LogoRequest, LogoResponse, AIProvider } from '../types';
export declare class StabilityClient {
    private client;
    private requestCount;
    private lastRequestTime;
    constructor();
    generateLogo(prompt: string, request: LogoRequest): Promise<LogoResponse>;
    private checkRateLimit;
    private convertSizeForStability;
    private handleError;
    getUsageStats(): {
        provider: AIProvider;
        requestCount: number;
        lastRequestTime: number;
        rateLimitInfo: string;
    };
}
//# sourceMappingURL=stability-client.d.ts.map