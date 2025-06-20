import { Trade } from '@prisma/client';
type Timeframe = '1m' | '5m' | '15m' | '1h' | '4h' | '1d';
export declare class CandleService {
    private prisma;
    private candleBuffers;
    constructor();
    /**
     * Get the start time for a candle period
     */
    private getCandleStartTime;
    /**
     * Update candles from a new trade
     */
    updateCandlesFromTrade(trade: Trade): Promise<void>;
    /**
     * Update a single candle for a specific timeframe
     */
    private updateCandle;
    /**
     * Get candles for a token and timeframe
     */
    getCandles(tokenAddress: string, timeframe: Timeframe, limit?: number): Promise<any>;
    /**
     * Get latest candle for a token
     */
    getLatestCandle(tokenAddress: string, timeframe: Timeframe): Promise<{
        time: number;
        open: any;
        high: any;
        low: any;
        close: any;
        volume: any;
    } | null>;
    /**
     * Process all candles periodically
     */
    processAllCandles(): Promise<void>;
    /**
     * Fill any missing candles for a token
     */
    private fillMissingCandles;
    /**
     * Get TradingView datafeed configuration
     */
    getTradingViewConfig(): {
        supported_resolutions: string[];
        exchanges: {
            value: string;
            name: string;
            desc: string;
        }[];
        symbols_types: {
            name: string;
            value: string;
        }[];
    };
    /**
     * Convert TradingView resolution to timeframe
     */
    private resolutionToTimeframe;
    /**
     * Get candles for TradingView
     */
    getTradingViewBars(symbol: string, resolution: string, from: number, to: number, firstDataRequest: boolean): Promise<{
        s: string;
        t: any;
        o: any;
        h: any;
        l: any;
        c: any;
        v: any;
    }>;
}
export declare const candleService: CandleService;
export {};
//# sourceMappingURL=CandleService.d.ts.map