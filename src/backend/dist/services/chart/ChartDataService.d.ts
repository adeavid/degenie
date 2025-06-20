export interface Candle {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}
export interface ChartData {
    candles: Candle[];
    lastUpdate: number;
}
export declare class ChartDataService {
    private priceHistory;
    private candleCache;
    /**
     * Add a new price point from a trade
     */
    addPricePoint(tokenAddress: string, price: number, volume: number, tradeType?: 'buy' | 'sell'): void;
    /**
     * Get chart data for a token with specified timeframe
     */
    getChartData(tokenAddress: string, timeframe?: '1m' | '5m' | '15m' | '1h' | '4h' | '1d', limit?: number): Promise<ChartData>;
    /**
     * Generate candles from price history - ONLY REAL TRADES
     */
    private generateCandles;
    /**
     * Convert timeframe to milliseconds
     */
    private getIntervalMs;
    /**
     * Get latest price for a token
     */
    getLatestPrice(tokenAddress: string): Promise<number | null>;
}
export declare const chartDataService: ChartDataService;
//# sourceMappingURL=ChartDataService.d.ts.map