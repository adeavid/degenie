/**
 * Shared service instances used across the application
 */

import { TradeStorageService } from './trading/TradeStorageService';
import { TradingViewDatafeed } from './trading/TradingViewDatafeed';

// Create singleton instances
export const tradeStorage = new TradeStorageService();
export const tokenMetadata = new Map<string, { 
  name: string; 
  symbol: string; 
  description: string; 
  creator: string; 
  createdAt: number 
}>();
export const tradingViewDatafeed = new TradingViewDatafeed(tradeStorage, tokenMetadata);