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
    addPricePoint(tokenAddress, price, volume) {
        if (!this.priceHistory.has(tokenAddress)) {
            this.priceHistory.set(tokenAddress, []);
        }
        const history = this.priceHistory.get(tokenAddress);
        history.push({
            timestamp: Date.now(),
            price,
            volume
        });
        // Keep only last 24 hours of data
        const cutoff = Date.now() - (24 * 60 * 60 * 1000);
        this.priceHistory.set(tokenAddress, history.filter(p => p.timestamp > cutoff));
        // Clear candle cache for this token
        this.candleCache.delete(tokenAddress);
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
     * Generate candles from price history
     */
    generateCandles(history, currentPrice, timeframe, limit) {
        const intervalMs = this.getIntervalMs(timeframe);
        const now = Date.now();
        const startTime = now - (limit * intervalMs);
        const candles = [];
        // If no history, generate synthetic data based on current price
        if (history.length === 0) {
            let price = currentPrice * 0.8; // Start 20% lower
            const priceStep = (currentPrice - price) / limit;
            for (let i = 0; i < limit; i++) {
                const time = startTime + (i * intervalMs);
                const variation = (Math.random() - 0.5) * 0.02; // 2% variation
                const open = price;
                const close = price + priceStep + (price * variation);
                const high = Math.max(open, close) * (1 + Math.random() * 0.01);
                const low = Math.min(open, close) * (1 - Math.random() * 0.01);
                const volume = Math.random() * 10 + 1; // Random volume 1-11 SOL
                candles.push({
                    time: Math.floor(time / 1000),
                    open,
                    high,
                    low,
                    close,
                    volume
                });
                price = close;
            }
        }
        else {
            // Group history into candles
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
            // Fill in missing candles and convert groups to candles
            let lastPrice = history[0]?.price || currentPrice;
            for (let time = startTime; time <= now; time += intervalMs) {
                const points = groups.get(time) || [];
                if (points.length > 0) {
                    const open = points[0].price;
                    const close = points[points.length - 1].price;
                    const high = Math.max(...points.map(p => p.price));
                    const low = Math.min(...points.map(p => p.price));
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
                else {
                    // Generate synthetic candle
                    const variation = (Math.random() - 0.5) * 0.001; // 0.1% variation
                    const open = lastPrice;
                    const close = lastPrice * (1 + variation);
                    const high = Math.max(open, close) * (1 + Math.random() * 0.0005);
                    const low = Math.min(open, close) * (1 - Math.random() * 0.0005);
                    candles.push({
                        time: Math.floor(time / 1000),
                        open,
                        high,
                        low,
                        close,
                        volume: 0
                    });
                    lastPrice = close;
                }
            }
        }
        // Ensure we have the right number of candles
        return candles.slice(-limit);
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