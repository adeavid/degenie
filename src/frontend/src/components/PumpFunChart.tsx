'use client';

import { useEffect, useRef, useState } from 'react';

interface PumpFunChartProps {
  tokenAddress: string;
  symbol: string;
  className?: string;
}

interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface TokenStats {
  price: number;
  priceChange24h: number;
  volume24h: number;
  marketCap: number;
  solRaised: number;
  graduationProgress: number;
}

export function PumpFunChart({ tokenAddress, symbol, className }: PumpFunChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const [stats, setStats] = useState<TokenStats | null>(null);
  const [timeframe, setTimeframe] = useState('5');
  const [isLoading, setIsLoading] = useState(true);
  const wsRef = useRef<WebSocket | null>(null);

  // Fetch stats
  const fetchStats = async () => {
    try {
      const statsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/tokens/${tokenAddress}/metrics`);
      const statsData = await statsRes.json();
      
      if (statsData.success) {
        setStats(statsData.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  // Initialize TradingView widget
  useEffect(() => {
    if (!containerRef.current) return;

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = () => {
      if (window.TradingView && containerRef.current) {
        const widget = new window.TradingView.widget({
          symbol: tokenAddress,
          interval: timeframe,
          container_id: containerRef.current.id,
          datafeed: {
            onReady: (callback: any) => {
              setTimeout(() => callback({
                supported_resolutions: ['1', '5', '15', '60', '240', '1D'],
                supports_group_request: false,
                supports_marks: false,
                supports_search: true,
                supports_timescale_marks: false,
              }), 0);
            },
            resolveSymbol: (symbolName: string, onSymbolResolvedCallback: any, onResolveErrorCallback: any) => {
              setTimeout(() => {
                onSymbolResolvedCallback({
                  name: symbolName,
                  description: `${symbol}/SOL`,
                  type: 'crypto',
                  session: '24x7',
                  timezone: 'Etc/UTC',
                  ticker: symbolName,
                  minmov: 1,
                  pricescale: 100000000,
                  has_intraday: true,
                  intraday_multipliers: ['1', '5', '15', '60', '240'],
                  supported_resolutions: ['1', '5', '15', '60', '240', '1D'],
                  volume_precision: 8,
                  data_status: 'streaming',
                });
              }, 0);
            },
            getBars: async (symbolInfo: any, resolution: string, periodParams: any, onHistoryCallback: any, onErrorCallback: any) => {
              try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/tokens/${tokenAddress}/candles?timeframe=${resolution}m`);
                const data = await response.json();
                
                if (data.success && data.data.length > 0) {
                  const bars = data.data.map((candle: CandleData) => ({
                    time: candle.time * 1000,
                    open: candle.open,
                    high: candle.high,
                    low: candle.low,
                    close: candle.close,
                    volume: candle.volume
                  }));
                  onHistoryCallback(bars, { noData: false });
                } else {
                  onHistoryCallback([], { noData: true });
                }
              } catch (error) {
                console.error('Error loading bars:', error);
                onErrorCallback(error);
              }
            },
            subscribeBars: () => {},
            unsubscribeBars: () => {},
            getServerTime: (cb: any) => cb(Math.floor(Date.now() / 1000))
          },
          library_path: '/charting_library/',
          locale: 'en',
          disabled_features: [
            'header_symbol_search',
            'header_compare',
            'header_saveload',
            'header_screenshot',
            'header_settings',
            'timeframes_toolbar',
            'volume_force_overlay',
            'create_volume_indicator_by_default',
            'header_indicators',
            'header_chart_type',
            'main_series_scale_menu',
            'display_market_status',
            'go_to_date',
            'control_bar'
          ],
          enabled_features: [
            'hide_left_toolbar_by_default',
            'hide_volume_ma'
          ],
          charts_storage_url: 'https://saveload.tradingview.com',
          charts_storage_api_version: '1.1',
          client_id: 'degenie.com',
          user_id: 'public_user',
          fullscreen: false,
          autosize: true,
          theme: 'dark',
          overrides: {
            'paneProperties.background': '#0a0a0a',
            'paneProperties.vertGridProperties.color': '#1a1a1a',
            'paneProperties.horzGridProperties.color': '#1a1a1a',
            'scalesProperties.textColor': '#B2B5BE',
            'mainSeriesProperties.candleStyle.upColor': '#0ECB81',
            'mainSeriesProperties.candleStyle.downColor': '#F6465D',
            'mainSeriesProperties.candleStyle.borderUpColor': '#0ECB81',
            'mainSeriesProperties.candleStyle.borderDownColor': '#F6465D',
            'mainSeriesProperties.candleStyle.wickUpColor': '#0ECB81',
            'mainSeriesProperties.candleStyle.wickDownColor': '#F6465D'
          }
        });

        widgetRef.current = widget;
        
        widget.onChartReady(() => {
          setIsLoading(false);
        });
      }
    };

    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
      if (widgetRef.current) {
        widgetRef.current.remove();
      }
    };
  }, [tokenAddress, symbol, timeframe]);

  // Fetch initial stats
  useEffect(() => {
    fetchStats();
  }, [tokenAddress]);

  // WebSocket for real-time updates
  useEffect(() => {
    const connectWebSocket = () => {
      const ws = new WebSocket(`${process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:4000'}/ws`);
      
      ws.onopen = () => {
        console.log('WebSocket connected for chart');
        ws.send(JSON.stringify({ type: 'subscribe', tokenAddress }));
      };
      
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        if (data.type === 'tradeUpdate' && data.tokenAddress === tokenAddress) {
          // Update stats
          if (data.newPrice && data.graduationProgress !== undefined) {
            setStats(prev => prev ? {
              ...prev,
              price: data.newPrice,
              solRaised: data.solRaisedAfter || prev.solRaised,
              graduationProgress: data.graduationProgress
            } : null);
          }
        }
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
      
      ws.onclose = () => {
        setTimeout(connectWebSocket, 5000);
      };
      
      wsRef.current = ws;
    };
    
    connectWebSocket();
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [tokenAddress]);

  const formatPrice = (price: number) => {
    if (!price) return '0.00';
    if (price < 0.00001) return price.toExponential(2);
    if (price < 0.01) return price.toFixed(6);
    if (price < 1) return price.toFixed(4);
    return price.toFixed(2);
  };

  const formatVolume = (volume: number) => {
    if (!volume) return '0';
    if (volume >= 1000000) return `${(volume / 1000000).toFixed(2)}M`;
    if (volume >= 1000) return `${(volume / 1000).toFixed(2)}K`;
    return volume.toFixed(2);
  };

  // Use SimpleChart as fallback
  const SimpleChartFallback = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [candles, setCandles] = useState<CandleData[]>([]);

    useEffect(() => {
      const fetchCandles = async () => {
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/tokens/${tokenAddress}/candles?timeframe=${timeframe}m`);
          const data = await res.json();
          if (data.success) {
            setCandles(data.data);
          }
        } catch (error) {
          console.error('Error fetching candles:', error);
        }
      };
      
      fetchCandles();
      const interval = setInterval(fetchCandles, 5000);
      return () => clearInterval(interval);
    }, []);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas || candles.length === 0) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;

      // Clear canvas
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, rect.width, rect.height);

      // Calculate scales
      const padding = 50;
      const chartWidth = rect.width - padding * 2;
      const chartHeight = rect.height - padding * 2;
      
      const minPrice = Math.min(...candles.map(c => c.low));
      const maxPrice = Math.max(...candles.map(c => c.high));
      const priceRange = maxPrice - minPrice || 1;

      // Draw candles
      const candleWidth = Math.max(2, chartWidth / candles.length * 0.8);
      candles.forEach((candle, i) => {
        const x = padding + (i / candles.length) * chartWidth + candleWidth / 2;
        const openY = padding + (1 - (candle.open - minPrice) / priceRange) * chartHeight;
        const closeY = padding + (1 - (candle.close - minPrice) / priceRange) * chartHeight;
        const highY = padding + (1 - (candle.high - minPrice) / priceRange) * chartHeight;
        const lowY = padding + (1 - (candle.low - minPrice) / priceRange) * chartHeight;

        const color = candle.close >= candle.open ? '#0ECB81' : '#F6465D';
        
        // Draw wick
        ctx.strokeStyle = color;
        ctx.beginPath();
        ctx.moveTo(x, highY);
        ctx.lineTo(x, lowY);
        ctx.stroke();

        // Draw body
        ctx.fillStyle = color;
        ctx.fillRect(x - candleWidth / 2, Math.min(openY, closeY), candleWidth, Math.abs(closeY - openY) || 1);
      });
    }, [candles]);

    return <canvas ref={canvasRef} className="w-full h-full" />;
  };

  return (
    <div className={`bg-black rounded-xl border border-gray-800 p-4 ${className}`}>
      {/* Header with stats */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-bold text-white">{symbol}/SOL</h3>
            {stats && (
              <>
                <span className="text-2xl font-bold text-white">
                  ${formatPrice(stats.price)}
                </span>
                <span className={`text-lg font-semibold ${stats.priceChange24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {stats.priceChange24h >= 0 ? '+' : ''}{stats.priceChange24h.toFixed(2)}%
                </span>
              </>
            )}
          </div>
          
          {/* Timeframe selector */}
          <div className="flex gap-1">
            {[
              { label: '1m', value: '1' },
              { label: '5m', value: '5' },
              { label: '15m', value: '15' },
              { label: '1h', value: '60' },
              { label: '4h', value: '240' },
              { label: '1d', value: '1D' }
            ].map(({ label, value }) => (
              <button
                key={value}
                onClick={() => setTimeframe(value)}
                className={`px-3 py-1 text-sm rounded transition-colors ${
                  timeframe === value
                    ? 'bg-green-500 text-black font-semibold'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        
        {/* Additional stats */}
        {stats && (
          <div className="flex gap-6 text-sm text-gray-400">
            <div>
              Vol 24h: <span className="text-white">${formatVolume(stats.volume24h)}</span>
            </div>
            <div>
              MCap: <span className="text-white">${formatVolume(stats.marketCap)}</span>
            </div>
            <div>
              SOL Raised: <span className="text-white">{stats.solRaised?.toFixed(2) || '0'}</span>
            </div>
            <div>
              Progress: <span className="text-green-400">{stats.graduationProgress?.toFixed(1) || '0'}%</span>
            </div>
          </div>
        )}
      </div>
      
      {/* Chart container */}
      <div className="relative h-[500px]">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400 mx-auto mb-4"></div>
              <p className="text-gray-400">Loading chart...</p>
            </div>
          </div>
        )}
        {typeof window !== 'undefined' && window.TradingView ? (
          <div ref={containerRef} id={`tv_chart_${tokenAddress}`} className="w-full h-full" />
        ) : (
          <SimpleChartFallback />
        )}
      </div>
      
      {/* Footer info */}
      <div className="mt-2 text-xs text-gray-500 text-center">
        Real-time data • Powered by DeGenie
      </div>
    </div>
  );
}

// Add global declaration
declare global {
  interface Window {
    TradingView: any;
  }
}