"use strict";
/**
 * Shared service instances used across the application
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.tradingViewDatafeed = exports.tokenMetadata = exports.tradeStorage = void 0;
const TradeStorageService_1 = require("./trading/TradeStorageService");
const TradingViewDatafeed_1 = require("./trading/TradingViewDatafeed");
// Create singleton instances
exports.tradeStorage = new TradeStorageService_1.TradeStorageService();
exports.tokenMetadata = new Map();
exports.tradingViewDatafeed = new TradingViewDatafeed_1.TradingViewDatafeed(exports.tradeStorage, exports.tokenMetadata);
//# sourceMappingURL=shared.js.map