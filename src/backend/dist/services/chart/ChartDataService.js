"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chartDataService = exports.ChartDataService = void 0;
const BondingCurveService_1 = require("../blockchain/BondingCurveService");
class ChartDataService {
    priceHistory = new Map();
    candleCache = new Map();
    /**
     * Add a new price point from a trade
     */
    addPricePoint(tokenAddress, price, volume, tradeType = 'buy') {
        if (!this.priceHistory.has(tokenAddress)) {
            this.priceHistory.set(tokenAddress, []);
        }
        const history = this.priceHistory.get(tokenAddress);
        history.push({
            timestamp: Date.now(),
            price,
            volume,
            type: tradeType
        });
        // Keep only last 24 hours of data
        const cutoff = Date.now() - (24 * 60 * 60 * 1000);
        this.priceHistory.set(tokenAddress, history.filter(p => p.timestamp > cutoff));
        // Clear candle cache for this token
        this.candleCache.delete(tokenAddress);
        console.log(`📊 [ChartData] Added trade: ${tradeType} @ ${price} SOL, volume: ${volume}`);
    }
    /**
     * Get chart data for a token with specified timeframe
     */
    async getChartData(tokenAddress, timeframe = '15m', limit = 300) {
        // Check cache first
        const cacheKey = `${timeframe}_${limit}`;
        const tokenCache = this.candleCache.get(tokenAddress);
        if (tokenCache?.has(cacheKey)) {
            const cached = tokenCache.get(cacheKey);
            if (cached.length > 0 && cached[cached.length - 1].time > Date.now() / 1000 - 60) {
                return { candles: cached, lastUpdate: Date.now() };
            }
        }
        // Get current price from bonding curve
        const metrics = await BondingCurveService_1.bondingCurveService.getTokenMetrics(tokenAddress);
        if (!metrics) {
            return { candles: [], lastUpdate: Date.now() };
        }
        const history = this.priceHistory.get(tokenAddress) || [];
        const candles = this.generateCandles(history, metrics.currentPrice, timeframe, limit);
        // Cache the result
        if (!this.candleCache.has(tokenAddress)) {
            this.candleCache.set(tokenAddress, new Map());
        }
        this.candleCache.get(tokenAddress).set(cacheKey, candles);
        return { candles, lastUpdate: Date.now() };
    }
    /**
     * Generate candles from price history - ONLY REAL TRADES
     */
    generateCandles(history, currentPrice, timeframe, limit) {
        const intervalMs = this.getIntervalMs(timeframe);
        const now = Date.now();
        const startTime = now - (limit * intervalMs);
        const candles = [];
        // If no history, return single initial candle from bonding curve (like pump.fun)
        if (history.length === 0) {
            // Return a single candle at current time with bonding curve price
            const candleTime = Math.floor(now / 1000);
            candles.push({
                time: candleTime,
                open: currentPrice,
                high: currentPrice,
                low: currentPrice,
                close: currentPrice,
                volume: 0
            });
            console.log(`📊 [ChartData] New token - returning initial candle at ${currentPrice}`);
            return candles;
        }
        // Group real trades into candles
        const groups = new Map();
        history.forEach(point => {
            const candleTime = Math.floor(point.timestamp / intervalMs) * intervalMs;
            if (candleTime >= startTime) {
                if (!groups.has(candleTime)) {
                    groups.set(candleTime, []);
                }
                groups.get(candleTime).push(point);
            }
        });
        // Only create candles where we have real trades
        const sortedTimes = Array.from(groups.keys()).sort((a, b) => a - b);
        let lastPrice = currentPrice;
        sortedTimes.forEach((time, index) => {
            const points = groups.get(time);
            if (points.length > 0) {
                // Use first trade price as open, or previous close if not first candle
                const open = index === 0 ? points[0].price : lastPrice;
                const close = points[points.length - 1].price;
                const high = Math.max(open, ...points.map(p => p.price));
                const low = Math.min(open, ...points.map(p => p.price));
                const volume = points.reduce((sum, p) => sum + p.volume, 0);
                candles.push({
                    time: Math.floor(time / 1000),
                    open,
                    high,
                    low,
                    close,
                    volume
                });
                lastPrice = close;
            }
        });
        // If we have trades but no candles in the time range, show last trade as current candle
        if (candles.length === 0 && history.length > 0) {
            const lastTrade = history[history.length - 1];
            const candleTime = Math.floor(now / 1000);
            candles.push({
                time: candleTime,
                open: lastTrade.price,
                high: lastTrade.price,
                low: lastTrade.price,
                close: lastTrade.price,
                volume: lastTrade.volume
            });
        }
        console.log(`📊 [ChartData] Generated ${candles.length} candles from ${history.length} trades`);
        return candles;
    }
    /**
     * Convert timeframe to milliseconds
     */
    getIntervalMs(timeframe) {
        switch (timeframe) {
            case '1m': return 60 * 1000;
            case '5m': return 5 * 60 * 1000;
            case '15m': return 15 * 60 * 1000;
            case '1h': return 60 * 60 * 1000;
            case '4h': return 4 * 60 * 60 * 1000;
            case '1d': return 24 * 60 * 60 * 1000;
            default: return 15 * 60 * 1000;
        }
    }
    /**
     * Get latest price for a token
     */
    async getLatestPrice(tokenAddress) {
        const metrics = await BondingCurveService_1.bondingCurveService.getTokenMetrics(tokenAddress);
        return metrics?.currentPrice || null;
    }
}
exports.ChartDataService = ChartDataService;
// Export singleton instance
exports.chartDataService = new ChartDataService();
//# sourceMappingURL=ChartDataService.js.map