import { TradeStorageService } from './TradeStorageService';
import { PumpFunBondingCurve } from '../blockchain/PumpFunBondingCurve';

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
  pricescale: 100000000; // 8 decimal places for SOL prices
  has_intraday: true;
  intraday_multipliers: string[];
  supported_resolutions: string[];
  volume_precision: 8;
  data_status: 'streaming';
}

export interface TVBar {
  time: number; // Unix timestamp in milliseconds
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

export class TradingViewDatafeed {
  constructor(
    private tradeStorage: TradeStorageService,
    private tokenInfo: Map<string, { name: string; symbol: string }>
  ) {}

  /**
   * Get datafeed configuration
   */
  getConfig() {
    return {
      supported_resolutions: ['1', '5', '15', '30', '60', '240', '1D'],
      supports_group_request: false,
      supports_marks: false,
      supports_search: true,
      supports_timescale_marks: false,
      supports_time: true,
      exchanges: [
        {
          value: 'PUMP.FUN',
          name: 'Pump.fun',
          desc: 'Pump.fun DEX'
        }
      ],
      symbols_types: [
        {
          name: 'crypto',
          value: 'crypto'
        }
      ]
    };
  }

  /**
   * Search for symbols
   */
  search(query: string, type: string, exchange: string, limit: number): TVSearchResult[] {
    const results: TVSearchResult[] = [];
    const searchLower = query.toLowerCase();

    // Search through all known tokens
    this.tokenInfo.forEach((info, address) => {
      if (
        info.symbol.toLowerCase().includes(searchLower) ||
        info.name.toLowerCase().includes(searchLower) ||
        address.toLowerCase().includes(searchLower)
      ) {
        results.push({
          symbol: address,
          full_name: `${info.symbol}/SOL`,
          description: info.name,
          type: 'crypto',
          exchange: 'PUMP.FUN',
          ticker: address
        });
      }
    });

    return results.slice(0, limit);
  }

  /**
   * Get symbol info
   */
  resolveSymbol(symbolName: string): TVSymbolInfo | null {
    const info = this.tokenInfo.get(symbolName);
    if (!info) {
      return null;
    }

    return {
      symbol: symbolName,
      name: `${info.symbol}/SOL`,
      description: info.name,
      type: 'crypto',
      session: '24x7',
      timezone: 'Etc/UTC',
      ticker: symbolName,
      minmov: 1,
      pricescale: 100000000, // 8 decimals
      has_intraday: true,
      intraday_multipliers: ['1', '5', '15', '30', '60', '240'],
      supported_resolutions: ['1', '5', '15', '30', '60', '240', '1D'],
      volume_precision: 8,
      data_status: 'streaming'
    };
  }

  /**
   * Get historical bars (OHLCV data)
   */
  getBars(
    symbolInfo: string,
    resolution: string,
    from: number,
    to: number,
    firstDataRequest: boolean
  ): { bars: TVBar[]; meta: { noData: boolean } } {
    // Convert resolution to seconds
    const intervalSeconds = this.resolutionToSeconds(resolution);
    
    // Get OHLCV data from trade storage
    const ohlcvData = this.tradeStorage.generateOHLCV(
      symbolInfo,
      intervalSeconds,
      Math.ceil((to - from) / intervalSeconds)
    );

    // If no trades yet, return current price as a single bar
    if (ohlcvData.length === 0) {
      const currentSolRaised = this.tradeStorage.getSolRaised(symbolInfo);
      const currentPrice = PumpFunBondingCurve.getCurrentPrice(currentSolRaised);
      
      // Only show a bar if we're looking at recent time
      const now = Math.floor(Date.now() / 1000);
      if (to >= now - intervalSeconds) {
        return {
          bars: [{
            time: now * 1000, // TradingView expects milliseconds
            open: currentPrice,
            high: currentPrice,
            low: currentPrice,
            close: currentPrice,
            volume: 0
          }],
          meta: { noData: false }
        };
      }
      
      return { bars: [], meta: { noData: true } };
    }

    // Convert OHLCV to TradingView format
    const bars: TVBar[] = ohlcvData
      .filter(candle => candle.time >= from && candle.time <= to)
      .map(candle => ({
        time: candle.time * 1000, // Convert to milliseconds
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
        volume: candle.volume
      }));

    return {
      bars,
      meta: { noData: bars.length === 0 }
    };
  }

  /**
   * Subscribe to real-time updates
   */
  subscribeBars(
    symbolInfo: string,
    resolution: string,
    onRealtimeCallback: (bar: TVBar) => void,
    subscriberUID: string,
    onResetCacheNeededCallback: () => void
  ): void {
    const intervalSeconds = this.resolutionToSeconds(resolution);
    let currentBar: TVBar | null = null;
    let barStartTime: number = 0;

    // Listen for trades
    const handleTrade = (trade: any) => {
      if (trade.tokenAddress !== symbolInfo) return;

      const tradeTime = Math.floor(trade.timestamp / 1000); // Convert to seconds
      const barTime = Math.floor(tradeTime / intervalSeconds) * intervalSeconds;

      // Check if we need a new bar
      if (!currentBar || barTime > barStartTime) {
        // Send completed bar if exists
        if (currentBar) {
          onRealtimeCallback(currentBar);
        }

        // Start new bar
        barStartTime = barTime;
        currentBar = {
          time: barTime * 1000, // Convert back to milliseconds
          open: trade.price,
          high: trade.price,
          low: trade.price,
          close: trade.price,
          volume: trade.solAmount
        };
      } else {
        // Update current bar
        currentBar.high = Math.max(currentBar.high, trade.price);
        currentBar.low = Math.min(currentBar.low, trade.price);
        currentBar.close = trade.price;
        currentBar.volume += trade.solAmount;
      }

      // Send update with proper timestamp
      onRealtimeCallback({
        ...currentBar,
        time: barTime * 1000 // Ensure time is in milliseconds
      });
    };

    // Subscribe to trade events
    this.tradeStorage.on('trade', handleTrade);

    // Store subscription info for unsubscribe
    (this as any)[`sub_${subscriberUID}`] = handleTrade;
  }

  /**
   * Unsubscribe from real-time updates
   */
  unsubscribeBars(subscriberUID: string): void {
    const handler = (this as any)[`sub_${subscriberUID}`];
    if (handler) {
      this.tradeStorage.removeListener('trade', handler);
      delete (this as any)[`sub_${subscriberUID}`];
    }
  }

  /**
   * Convert resolution string to seconds
   */
  private resolutionToSeconds(resolution: string): number {
    const resolutionMap: { [key: string]: number } = {
      '1': 60,
      '5': 300,
      '15': 900,
      '30': 1800,
      '60': 3600,
      '240': 14400,
      '1D': 86400,
      'D': 86400,
      '1W': 604800,
      'W': 604800,
      '1M': 2592000,
      'M': 2592000
    };

    return resolutionMap[resolution] || 900; // Default to 15 minutes
  }
}