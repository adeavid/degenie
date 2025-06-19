/**
 * Shared service instances used across the application
 */
import { TradeStorageService } from './trading/TradeStorageService';
import { TradingViewDatafeed } from './trading/TradingViewDatafeed';
export declare const tradeStorage: TradeStorageService;
export declare const tokenMetadata: Map<string, {
    name: string;
    symbol: string;
    description: string;
    creator: string;
    createdAt: number;
}>;
export declare const tradingViewDatafeed: TradingViewDatafeed;
//# sourceMappingURL=shared.d.ts.map