import { Server as HTTPServer } from 'http';
export declare class WebSocketService {
    private io;
    private priceUpdateInterval;
    private connectedClients;
    initialize(server: HTTPServer): void;
    /**
     * Broadcast trade event to all subscribers
     */
    broadcastTrade(tokenAddress: string, trade: any): void;
    /**
     * Broadcast price update to all subscribers
     */
    broadcastPriceUpdate(tokenAddress: string, priceData: any): void;
    /**
     * Start periodic price updates for all subscribed tokens
     */
    private startPriceUpdates;
    /**
     * Broadcast graduation event
     */
    broadcastGraduation(tokenAddress: string, graduationData: any): void;
    /**
     * Broadcast new token creation
     */
    broadcastNewToken(tokenData: any): void;
    /**
     * Get connection statistics
     */
    getStats(): {
        totalConnections: number;
        subscribedTokens: number;
        tokenSubscriptions: Record<string, number>;
    };
    /**
     * Cleanup resources
     */
    cleanup(): void;
}
export declare const webSocketService: WebSocketService;
//# sourceMappingURL=WebSocketService.d.ts.map