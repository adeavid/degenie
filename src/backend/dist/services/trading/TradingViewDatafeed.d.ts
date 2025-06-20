import { TradeStorageService } from './TradeStorageService';
/**
 * TradingView UDF (Universal Data Feed) Implementation
 * Provides real-time chart data for TradingView charts
 */
export interface TVSymbolInfo {
    symbol: string;
    name: string;
    description: string;
    type: 'crypto';
    session: '24x7';
    timezone: 'Etc/UTC';
    ticker: string;
    minmov: 1;
    pricescale: 100000000;
    has_intraday: true;
    intraday_multipliers: string[];
    supported_resolutions: string[];
    volume_precision: 8;
    data_status: 'streaming';
}
export interface TVBar {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}
export interface TVSearchResult {
    symbol: string;
    full_name: string;
    description: string;
    type: 'crypto';
    exchange: 'PUMP.FUN';
    ticker: string;
}
export declare class TradingViewDatafeed {
    private tradeStorage;
    private tokenInfo;
    constructor(tradeStorage: TradeStorageService, tokenInfo: Map<string, {
        name: string;
        symbol: string;
    }>);
    /**
     * Get datafeed configuration
     */
    getConfig(): {
        supported_resolutions: string[];
        supports_group_request: boolean;
        supports_marks: boolean;
        supports_search: boolean;
        supports_timescale_marks: boolean;
        supports_time: boolean;
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
     * Search for symbols
     */
    search(query: string, type: string, exchange: string, limit: number): TVSearchResult[];
    /**
     * Get symbol info
     */
    resolveSymbol(symbolName: string): TVSymbolInfo | null;
    /**
     * Get historical bars (OHLCV data)
     */
    getBars(symbolInfo: string, resolution: string, from: number, to: number, firstDataRequest: boolean): {
        bars: TVBar[];
        meta: {
            noData: boolean;
        };
    };
    /**
     * Subscribe to real-time updates
     */
    subscribeBars(symbolInfo: string, resolution: string, onRealtimeCallback: (bar: TVBar) => void, subscriberUID: string, onResetCacheNeededCallback: () => void): void;
    /**
     * Unsubscribe from real-time updates
     */
    unsubscribeBars(subscriberUID: string): void;
    /**
     * Convert resolution string to seconds
     */
    private resolutionToSeconds;
}
//# sourceMappingURL=TradingViewDatafeed.d.ts.map