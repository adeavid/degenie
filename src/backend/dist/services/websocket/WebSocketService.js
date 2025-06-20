"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.webSocketService = exports.WebSocketService = void 0;
const socket_io_1 = require("socket.io");
const BondingCurveService_1 = require("../blockchain/BondingCurveService");
class WebSocketService {
    io = null;
    priceUpdateInterval = null;
    connectedClients = new Map(); // tokenAddress -> socketIds
    initialize(server) {
        this.io = new socket_io_1.Server(server, {
            cors: {
                origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3003'],
                credentials: true
            }
        });
        this.io.on('connection', (socket) => {
            console.log(`🔌 [WebSocket] Client connected: ${socket.id}`);
            // Subscribe to token updates
            socket.on('subscribe', async (tokenAddress) => {
                console.log(`📡 [WebSocket] Client ${socket.id} subscribing to ${tokenAddress}`);
                // Add to room for token-specific updates
                socket.join(`token:${tokenAddress}`);
                // Track subscription
                if (!this.connectedClients.has(tokenAddress)) {
                    this.connectedClients.set(tokenAddress, new Set());
                }
                this.connectedClients.get(tokenAddress).add(socket.id);
                // Send initial data
                const metrics = await BondingCurveService_1.bondingCurveService.getTokenMetrics(tokenAddress);
                if (metrics) {
                    socket.emit('tokenUpdate', {
                        tokenAddress,
                        data: metrics,
                        timestamp: Date.now()
                    });
                }
            });
            // Unsubscribe from token updates
            socket.on('unsubscribe', (tokenAddress) => {
                console.log(`🔕 [WebSocket] Client ${socket.id} unsubscribing from ${tokenAddress}`);
                socket.leave(`token:${tokenAddress}`);
                // Remove from tracking
                const clients = this.connectedClients.get(tokenAddress);
                if (clients) {
                    clients.delete(socket.id);
                    if (clients.size === 0) {
                        this.connectedClients.delete(tokenAddress);
                    }
                }
            });
            // Handle disconnect
            socket.on('disconnect', () => {
                console.log(`🔌 [WebSocket] Client disconnected: ${socket.id}`);
                // Clean up subscriptions
                for (const [tokenAddress, clients] of this.connectedClients.entries()) {
                    if (clients.has(socket.id)) {
                        clients.delete(socket.id);
                        if (clients.size === 0) {
                            this.connectedClients.delete(tokenAddress);
                        }
                    }
                }
            });
        });
        // Start price update loop
        this.startPriceUpdates();
        console.log('✅ [WebSocket] WebSocket service initialized');
    }
    /**
     * Broadcast trade event to all subscribers
     */
    broadcastTrade(tokenAddress, trade) {
        if (!this.io)
            return;
        console.log(`📢 [WebSocket] Broadcasting trade for ${tokenAddress}`);
        this.io.to(`token:${tokenAddress}`).emit('tradeUpdate', {
            tokenAddress,
            trade,
            timestamp: Date.now()
        });
    }
    /**
     * Broadcast price update to all subscribers
     */
    broadcastPriceUpdate(tokenAddress, priceData) {
        if (!this.io)
            return;
        this.io.to(`token:${tokenAddress}`).emit('priceUpdate', {
            tokenAddress,
            price: priceData.currentPrice,
            priceChange24h: priceData.priceChange24h,
            volume24h: priceData.volume24h,
            marketCap: priceData.marketCap,
            bondingCurveProgress: priceData.bondingCurveProgress,
            timestamp: Date.now()
        });
    }
    /**
     * Start periodic price updates for all subscribed tokens
     */
    startPriceUpdates() {
        // Update prices every 5 seconds for subscribed tokens
        this.priceUpdateInterval = setInterval(async () => {
            for (const tokenAddress of this.connectedClients.keys()) {
                try {
                    const metrics = await BondingCurveService_1.bondingCurveService.getTokenMetrics(tokenAddress);
                    if (metrics) {
                        this.broadcastPriceUpdate(tokenAddress, metrics);
                    }
                }
                catch (error) {
                    console.error(`Error updating price for ${tokenAddress}:`, error);
                }
            }
        }, 5000); // 5 seconds
    }
    /**
     * Broadcast graduation event
     */
    broadcastGraduation(tokenAddress, graduationData) {
        if (!this.io)
            return;
        console.log(`🎓 [WebSocket] Broadcasting graduation for ${tokenAddress}`);
        this.io.to(`token:${tokenAddress}`).emit('graduation', {
            tokenAddress,
            ...graduationData,
            timestamp: Date.now()
        });
        // Also broadcast to a general channel for homepage updates
        this.io.emit('globalGraduation', {
            tokenAddress,
            ...graduationData,
            timestamp: Date.now()
        });
    }
    /**
     * Broadcast new token creation
     */
    broadcastNewToken(tokenData) {
        if (!this.io)
            return;
        console.log(`🆕 [WebSocket] Broadcasting new token: ${tokenData.symbol}`);
        this.io.emit('newToken', {
            ...tokenData,
            timestamp: Date.now()
        });
    }
    /**
     * Get connection statistics
     */
    getStats() {
        const stats = {
            totalConnections: this.io?.sockets.sockets.size || 0,
            subscribedTokens: this.connectedClients.size,
            tokenSubscriptions: {}
        };
        for (const [token, clients] of this.connectedClients.entries()) {
            stats.tokenSubscriptions[token] = clients.size;
        }
        return stats;
    }
    /**
     * Cleanup resources
     */
    cleanup() {
        if (this.priceUpdateInterval) {
            clearInterval(this.priceUpdateInterval);
            this.priceUpdateInterval = null;
        }
        if (this.io) {
            this.io.close();
            this.io = null;
        }
    }
}
exports.WebSocketService = WebSocketService;
// Export singleton instance
exports.webSocketService = new WebSocketService();
//# sourceMappingURL=WebSocketService.js.map