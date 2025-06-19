import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

interface TokenUpdate {
  tokenAddress: string;
  data: any;
  timestamp: number;
}

interface TradeUpdate {
  tokenAddress: string;
  trade: any;
  newPrice: number;
  graduationProgress: number;
  timestamp: number;
}

interface PriceUpdate {
  tokenAddress: string;
  price: number;
  priceChange24h: number;
  volume24h: number;
  marketCap: number;
  bondingCurveProgress: number;
  timestamp: number;
}

interface GraduationEvent {
  tokenAddress: string;
  finalPrice: number;
  totalLiquidity: number;
  graduationTime: number;
  timestamp: number;
}

export function useWebSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<number>(0);
  const subscribedTokens = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Connect to WebSocket server
    const socketInstance = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000', {
      withCredentials: true,
      transports: ['websocket', 'polling']
    });

    socketInstance.on('connect', () => {
      console.log('🔌 WebSocket connected');
      setConnected(true);
      
      // Resubscribe to any previously subscribed tokens
      subscribedTokens.current.forEach(token => {
        socketInstance.emit('subscribe', token);
      });
    });

    socketInstance.on('disconnect', () => {
      console.log('🔌 WebSocket disconnected');
      setConnected(false);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  // Subscribe to token updates
  const subscribeToToken = useCallback((tokenAddress: string) => {
    if (!socket || !connected) return;
    
    console.log(`📡 Subscribing to token: ${tokenAddress}`);
    socket.emit('subscribe', tokenAddress);
    subscribedTokens.current.add(tokenAddress);
  }, [socket, connected]);

  // Unsubscribe from token updates
  const unsubscribeFromToken = useCallback((tokenAddress: string) => {
    if (!socket) return;
    
    console.log(`🔕 Unsubscribing from token: ${tokenAddress}`);
    socket.emit('unsubscribe', tokenAddress);
    subscribedTokens.current.delete(tokenAddress);
  }, [socket]);

  // Listen for token updates
  const onTokenUpdate = useCallback((callback: (update: TokenUpdate) => void) => {
    if (!socket) return;

    socket.on('tokenUpdate', (update: TokenUpdate) => {
      setLastUpdate(Date.now());
      callback(update);
    });

    return () => {
      socket.off('tokenUpdate');
    };
  }, [socket]);

  // Listen for trade updates
  const onTradeUpdate = useCallback((callback: (update: TradeUpdate) => void) => {
    if (!socket) return;

    socket.on('tradeUpdate', (update: TradeUpdate) => {
      setLastUpdate(Date.now());
      callback(update);
    });

    return () => {
      socket.off('tradeUpdate');
    };
  }, [socket]);

  // Listen for price updates
  const onPriceUpdate = useCallback((callback: (update: PriceUpdate) => void) => {
    if (!socket) return;

    socket.on('priceUpdate', (update: PriceUpdate) => {
      setLastUpdate(Date.now());
      callback(update);
    });

    return () => {
      socket.off('priceUpdate');
    };
  }, [socket]);

  // Listen for graduation events
  const onGraduation = useCallback((callback: (event: GraduationEvent) => void) => {
    if (!socket) return;

    socket.on('graduation', (event: GraduationEvent) => {
      setLastUpdate(Date.now());
      callback(event);
    });

    return () => {
      socket.off('graduation');
    };
  }, [socket]);

  // Listen for new token events
  const onNewToken = useCallback((callback: (token: any) => void) => {
    if (!socket) return;

    socket.on('newToken', (token: any) => {
      setLastUpdate(Date.now());
      callback(token);
    });

    return () => {
      socket.off('newToken');
    };
  }, [socket]);

  // Listen for global graduation events
  const onGlobalGraduation = useCallback((callback: (event: any) => void) => {
    if (!socket) return;

    socket.on('globalGraduation', (event: any) => {
      setLastUpdate(Date.now());
      callback(event);
    });

    return () => {
      socket.off('globalGraduation');
    };
  }, [socket]);

  return {
    socket,
    connected,
    lastUpdate,
    subscribeToToken,
    unsubscribeFromToken,
    onTokenUpdate,
    onTradeUpdate,
    onPriceUpdate,
    onGraduation,
    onNewToken,
    onGlobalGraduation
  };
}