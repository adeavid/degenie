import { PrismaClient, Trade } from '@prisma/client';
import { webSocketService } from '../websocket/WebSocketService';

type Timeframe = '1m' | '5m' | '15m' | '1h' | '4h' | '1d';

interface CandleData {
  time: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  trades: number;
}

export class CandleService {
  private prisma: PrismaClient;
  private candleBuffers: Map<string, CandleData[]> = new Map();

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Get the start time for a candle period
   */
  private getCandleStartTime(timestamp: Date, timeframe: Timeframe): Date {
    const time = new Date(timestamp);
    
    switch (timeframe) {
      case '1m':
        time.setSeconds(0, 0);
        break;
      case '5m':
        time.setMinutes(Math.floor(time.getMinutes() / 5) * 5, 0, 0);
        break;
      case '15m':
        time.setMinutes(Math.floor(time.getMinutes() / 15) * 15, 0, 0);
        break;
      case '1h':
        time.setMinutes(0, 0, 0);
        break;
      case '4h':
        time.setHours(Math.floor(time.getHours() / 4) * 4, 0, 0, 0);
        break;
      case '1d':
        time.setHours(0, 0, 0, 0);
        break;
    }
    
    return time;
  }

  /**
   * Update candles from a new trade
   */
  async updateCandlesFromTrade(trade: Trade) {
    try {
      console.log(`📊 [CandleService] Updating candles for trade ${trade.id}`);
      
      // Update all timeframes
      await Promise.all([
        this.updateCandle(trade, '1m'),
        this.updateCandle(trade, '5m'),
        this.updateCandle(trade, '15m'),
        this.updateCandle(trade, '1h'),
        this.updateCandle(trade, '4h'),
        this.updateCandle(trade, '1d'),
      ]);

      // Broadcast latest candle updates
      const latest1m = await this.getLatestCandle(trade.tokenAddress, '1m');
      if (latest1m) {
        webSocketService.broadcastCandleUpdate(trade.tokenAddress, latest1m);
      }
    } catch (error) {
      console.error('❌ [CandleService] Error updating candles:', error);
    }
  }

  /**
   * Update a single candle for a specific timeframe
   */
  private async updateCandle(trade: Trade, timeframe: Timeframe) {
    const candleTime = this.getCandleStartTime(trade.blockTime, timeframe);
    const tableName = `candle${timeframe}`;
    
    try {
      // Try to find existing candle
      const existingCandle = await this.prisma[tableName].findUnique({
        where: {
          tokenAddress_time: {
            tokenAddress: trade.tokenAddress,
            time: candleTime
          }
        }
      });

      if (existingCandle) {
        // Update existing candle
        await this.prisma[tableName].update({
          where: {
            tokenAddress_time: {
              tokenAddress: trade.tokenAddress,
              time: candleTime
            }
          },
          data: {
            high: Math.max(existingCandle.high, trade.price),
            low: Math.min(existingCandle.low, trade.price),
            close: trade.price,
            volume: existingCandle.volume + trade.solAmount,
            trades: existingCandle.trades + 1
          }
        });
      } else {
        // Create new candle
        await this.prisma[tableName].create({
          data: {
            tokenAddress: trade.tokenAddress,
            time: candleTime,
            open: trade.price,
            high: trade.price,
            low: trade.price,
            close: trade.price,
            volume: trade.solAmount,
            trades: 1
          }
        });
      }
    } catch (error) {
      console.error(`❌ [CandleService] Error updating ${timeframe} candle:`, error);
    }
  }

  /**
   * Get candles for a token and timeframe
   */
  async getCandles(tokenAddress: string, timeframe: Timeframe, limit: number = 500) {
    const tableName = `candle${timeframe}`;
    
    try {
      const candles = await this.prisma[tableName].findMany({
        where: { tokenAddress },
        orderBy: { time: 'desc' },
        take: limit
      });

      // Convert to TradingView format
      return candles.reverse().map(candle => ({
        time: Math.floor(candle.time.getTime() / 1000), // Unix timestamp in seconds
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
        volume: candle.volume
      }));
    } catch (error) {
      console.error(`❌ [CandleService] Error fetching ${timeframe} candles:`, error);
      return [];
    }
  }

  /**
   * Get latest candle for a token
   */
  async getLatestCandle(tokenAddress: string, timeframe: Timeframe) {
    const tableName = `candle${timeframe}`;
    
    try {
      const candle = await this.prisma[tableName].findFirst({
        where: { tokenAddress },
        orderBy: { time: 'desc' }
      });

      if (candle) {
        return {
          time: Math.floor(candle.time.getTime() / 1000),
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close,
          volume: candle.volume
        };
      }
      
      return null;
    } catch (error) {
      console.error(`❌ [CandleService] Error fetching latest ${timeframe} candle:`, error);
      return null;
    }
  }

  /**
   * Process all candles periodically
   */
  async processAllCandles() {
    try {
      console.log('📊 [CandleService] Processing candles...');
      
      // Get all active tokens
      const tokens = await this.prisma.token.findMany({
        where: {
          isGraduated: false,
          totalVolume: { gt: 0 }
        },
        select: { address: true }
      });

      // Process each token
      for (const token of tokens) {
        await this.fillMissingCandles(token.address);
      }

      console.log('✅ [CandleService] Candle processing complete');
    } catch (error) {
      console.error('❌ [CandleService] Error processing candles:', error);
    }
  }

  /**
   * Fill any missing candles for a token
   */
  private async fillMissingCandles(tokenAddress: string) {
    // Get recent trades
    const trades = await this.prisma.trade.findMany({
      where: { tokenAddress },
      orderBy: { blockTime: 'desc' },
      take: 1000
    });

    if (trades.length === 0) return;

    // Group trades by candle periods
    const timeframes: Timeframe[] = ['1m', '5m', '15m', '1h', '4h', '1d'];
    
    for (const timeframe of timeframes) {
      const candleMap = new Map<string, Trade[]>();
      
      // Group trades by candle time
      for (const trade of trades) {
        const candleTime = this.getCandleStartTime(trade.blockTime, timeframe);
        const key = candleTime.toISOString();
        
        if (!candleMap.has(key)) {
          candleMap.set(key, []);
        }
        candleMap.get(key)!.push(trade);
      }

      // Create missing candles
      for (const [timeKey, candleTrades] of candleMap) {
        const candleTime = new Date(timeKey);
        const tableName = `candle${timeframe}`;
        
        // Check if candle exists
        const exists = await this.prisma[tableName].findUnique({
          where: {
            tokenAddress_time: {
              tokenAddress,
              time: candleTime
            }
          }
        });

        if (!exists && candleTrades.length > 0) {
          // Calculate OHLCV
          const prices = candleTrades.map(t => t.price);
          const open = candleTrades[candleTrades.length - 1].price; // First trade
          const close = candleTrades[0].price; // Last trade
          const high = Math.max(...prices);
          const low = Math.min(...prices);
          const volume = candleTrades.reduce((sum, t) => sum + t.solAmount, 0);

          await this.prisma[tableName].create({
            data: {
              tokenAddress,
              time: candleTime,
              open,
              high,
              low,
              close,
              volume,
              trades: candleTrades.length
            }
          });
        }
      }
    }
  }

  /**
   * Get TradingView datafeed configuration
   */
  getTradingViewConfig() {
    return {
      supported_resolutions: ['1', '5', '15', '60', '240', 'D'],
      exchanges: [{
        value: 'DEGENIE',
        name: 'DeGenie',
        desc: 'DeGenie DEX'
      }],
      symbols_types: [{
        name: 'crypto',
        value: 'crypto'
      }]
    };
  }

  /**
   * Convert TradingView resolution to timeframe
   */
  private resolutionToTimeframe(resolution: string): Timeframe {
    switch (resolution) {
      case '1': return '1m';
      case '5': return '5m';
      case '15': return '15m';
      case '60': return '1h';
      case '240': return '4h';
      case 'D': return '1d';
      default: return '1m';
    }
  }

  /**
   * Get candles for TradingView
   */
  async getTradingViewBars(
    symbol: string,
    resolution: string,
    from: number,
    to: number,
    firstDataRequest: boolean
  ) {
    const tokenAddress = symbol.split(':')[1]; // Format: DEGENIE:tokenAddress
    const timeframe = this.resolutionToTimeframe(resolution);
    
    const candles = await this.getCandles(tokenAddress, timeframe, 1000);
    
    // Filter by time range
    const bars = candles.filter(c => c.time >= from && c.time <= to);
    
    return {
      s: bars.length > 0 ? 'ok' : 'no_data',
      t: bars.map(b => b.time),
      o: bars.map(b => b.open),
      h: bars.map(b => b.high),
      l: bars.map(b => b.low),
      c: bars.map(b => b.close),
      v: bars.map(b => b.volume)
    };
  }
}

// Export singleton instance
export const candleService = new CandleService();