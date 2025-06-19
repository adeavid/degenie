import { EventEmitter } from 'events';
export interface Trade {
    id: string;
    tokenAddress: string;
    type: 'buy' | 'sell';
    wallet: string;
    solAmount: number;
    tokenAmount: number;
    price: number;
    timestamp: number;
    txSignature: string;
    solRaisedAfter: number;
    priceAfter: number;
}
export interface OHLCV {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}
export declare class TradeStorageService extends EventEmitter {
    private trades;
    private latestPrices;
    private solRaised;
    /**
     * Store a new trade and emit events
     */
    addTrade(trade: Trade): void;
    /**
     * Get all trades for a token
     */
    getTrades(tokenAddress: string): Trade[];
    /**
     * Get trades within a time range
     */
    getTradesInRange(tokenAddress: string, startTime: number, endTime: number): Trade[];
    /**
     * Get latest price for a token
     */
    getLatestPrice(tokenAddress: string): number | null;
    /**
     * Get total SOL raised for a token
     */
    getSolRaised(tokenAddress: string): number;
    /**
     * Generate OHLCV candles from trades
     * Only returns candles where actual trades occurred
     */
    generateOHLCV(tokenAddress: string, interval: number, // Interval in seconds (60 = 1m, 300 = 5m, etc)
    limit?: number): OHLCV[];
    /**
     * Get 24h volume for a token
     */
    get24hVolume(tokenAddress: string): number;
    /**
     * Get 24h price change
     */
    get24hPriceChange(tokenAddress: string): {
        change: number;
        percentage: number;
    } | null;
    /**
     * Get holder count (unique wallets that have traded)
     */
    getHolderCount(tokenAddress: string): number;
    /**
     * Clear all data for a token (useful for testing)
     */
    clearToken(tokenAddress: string): void;
}
//# sourceMappingURL=TradeStorageService.d.ts.map