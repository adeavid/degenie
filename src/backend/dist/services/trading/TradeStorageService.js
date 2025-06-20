"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TradeStorageService = void 0;
const events_1 = require("events");
class TradeStorageService extends events_1.EventEmitter {
    trades = new Map();
    latestPrices = new Map();
    solRaised = new Map();
    /**
     * Store a new trade and emit events
     */
    addTrade(trade) {
        // Initialize array if needed
        if (!this.trades.has(trade.tokenAddress)) {
            this.trades.set(trade.tokenAddress, []);
        }
        // Add trade
        const trades = this.trades.get(trade.tokenAddress);
        trades.push(trade);
        // Update latest price and SOL raised
        this.latestPrices.set(trade.tokenAddress, trade.priceAfter);
        this.solRaised.set(trade.tokenAddress, trade.solRaisedAfter);
        // Emit trade event
        this.emit('trade', trade);
        this.emit(`trade:${trade.tokenAddress}`, trade);
        console.log(`📊 [TradeStorage] New ${trade.type} trade: ${trade.tokenAmount.toFixed(2)} tokens @ ${trade.price.toFixed(8)} SOL`);
    }
    /**
     * Get all trades for a token
     */
    getTrades(tokenAddress) {
        return this.trades.get(tokenAddress) || [];
    }
    /**
     * Get trades within a time range
     */
    getTradesInRange(tokenAddress, startTime, endTime) {
        const trades = this.getTrades(tokenAddress);
        return trades.filter(t => t.timestamp >= startTime && t.timestamp <= endTime);
    }
    /**
     * Get latest price for a token
     */
    getLatestPrice(tokenAddress) {
        return this.latestPrices.get(tokenAddress) || null;
    }
    /**
     * Get total SOL raised for a token
     */
    getSolRaised(tokenAddress) {
        return this.solRaised.get(tokenAddress) || 0;
    }
    /**
     * Generate OHLCV candles from trades
     * Only returns candles where actual trades occurred
     */
    generateOHLCV(tokenAddress, interval, // Interval in seconds (60 = 1m, 300 = 5m, etc)
    limit = 300) {
        const trades = this.getTrades(tokenAddress);
        if (trades.length === 0) {
            return [];
        }
        const now = Date.now();
        const startTime = now - (limit * interval * 1000);
        const candles = new Map();
        // Group trades into candles
        trades.forEach(trade => {
            if (trade.timestamp < startTime)
                return;
            // Find candle time (floor to interval)
            const candleTime = Math.floor(trade.timestamp / (interval * 1000)) * interval;
            if (!candles.has(candleTime)) {
                // First trade in this candle
                candles.set(candleTime, {
                    time: candleTime,
                    open: trade.price,
                    high: trade.price,
                    low: trade.price,
                    close: trade.price,
                    volume: trade.solAmount
                });
            }
            else {
                // Update existing candle
                const candle = candles.get(candleTime);
                candle.high = Math.max(candle.high, trade.price);
                candle.low = Math.min(candle.low, trade.price);
                candle.close = trade.price; // Last trade price
                candle.volume += trade.solAmount;
            }
        });
        // Convert to array and sort by time
        return Array.from(candles.values()).sort((a, b) => a.time - b.time);
    }
    /**
     * Get 24h volume for a token
     */
    get24hVolume(tokenAddress) {
        const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
        const trades = this.getTrades(tokenAddress);
        return trades
            .filter(t => t.timestamp >= oneDayAgo)
            .reduce((sum, t) => sum + t.solAmount, 0);
    }
    /**
     * Get 24h price change
     */
    get24hPriceChange(tokenAddress) {
        const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
        const trades = this.getTrades(tokenAddress).sort((a, b) => a.timestamp - b.timestamp);
        if (trades.length === 0) {
            return null;
        }
        // Find first trade from 24h ago
        const oldTrade = trades.find(t => t.timestamp >= oneDayAgo);
        if (!oldTrade) {
            // If no trades from 24h ago, use first trade
            const firstTrade = trades[0];
            const lastTrade = trades[trades.length - 1];
            const change = lastTrade.price - firstTrade.price;
            const percentage = (change / firstTrade.price) * 100;
            return { change, percentage };
        }
        const currentPrice = this.getLatestPrice(tokenAddress) || trades[trades.length - 1].price;
        const change = currentPrice - oldTrade.price;
        const percentage = (change / oldTrade.price) * 100;
        return { change, percentage };
    }
    /**
     * Get holder count (unique wallets that have traded)
     */
    getHolderCount(tokenAddress) {
        const trades = this.getTrades(tokenAddress);
        const uniqueWallets = new Set(trades.map(t => t.wallet));
        return uniqueWallets.size;
    }
    /**
     * Clear all data for a token (useful for testing)
     */
    clearToken(tokenAddress) {
        this.trades.delete(tokenAddress);
        this.latestPrices.delete(tokenAddress);
        this.solRaised.delete(tokenAddress);
    }
}
exports.TradeStorageService = TradeStorageService;
//# sourceMappingURL=TradeStorageService.js.map