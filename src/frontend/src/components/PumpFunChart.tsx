'use client';

import { useEffect, useRef, useState } from 'react';
import { createChart, IChartApi, ISeriesApi, CandlestickData, HistogramData, ColorType } from 'lightweight-charts';

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
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const [stats, setStats] = useState<TokenStats | null>(null);
  const [timeframe, setTimeframe] = useState('5m');
  const [isLoading, setIsLoading] = useState(true);
  const wsRef = useRef<WebSocket | null>(null);

  // Fetch initial data and stats
  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch candles
      const candlesRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/tokens/${tokenAddress}/candles?timeframe=${timeframe}`);
      const candlesData = await candlesRes.json();
      
      // Fetch token stats
      const statsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/tokens/${tokenAddress}/metrics`);
      const statsData = await statsRes.json();
      
      if (statsData.success) {
        setStats(statsData.data);
      }
      
      if (candlesData.success && candleSeriesRef.current && volumeSeriesRef.current) {
        const candles: CandlestickData[] = candlesData.data.map((c: CandleData) => ({
          time: c.time,
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close
        }));
        
        const volumes: HistogramData[] = candlesData.data.map((c: CandleData) => ({
          time: c.time,
          value: c.volume,
          color: c.close >= c.open ? '#0ECB81' : '#F6465D'
        }));
        
        candleSeriesRef.current.setData(candles);
        volumeSeriesRef.current.setData(volumes);
        
        // Fit content
        if (chartRef.current) {
          chartRef.current.timeScale().fitContent();
        }
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching chart data:', error);
      setIsLoading(false);
    }
  };

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#0a0a0a' },
        textColor: '#B2B5BE',
      },
      grid: {
        vertLines: { color: '#1a1a1a' },
        horzLines: { color: '#1a1a1a' },
      },
      width: chartContainerRef.current.clientWidth,
      height: 500,
      timeScale: {
        borderColor: '#2B2B43',
        timeVisible: true,
        secondsVisible: false,
      },
      rightPriceScale: {
        borderColor: '#2B2B43',
        scaleMargins: {
          top: 0.3,
          bottom: 0.25,
        },
      },
      crosshair: {
        mode: 1,
        vertLine: {
          color: '#758696',
          width: 1,
          style: 3,
          labelBackgroundColor: '#2B2B43',
        },
        horzLine: {
          color: '#758696',
          width: 1,
          style: 3,
          labelBackgroundColor: '#2B2B43',
        },
      },
    });

    // Create candle series
    const candleSeries = chart.addCandlestickSeries({
      upColor: '#0ECB81',
      downColor: '#F6465D',
      borderUpColor: '#0ECB81',
      borderDownColor: '#F6465D',
      wickUpColor: '#0ECB81',
      wickDownColor: '#F6465D',
    });

    // Create volume series
    const volumeSeries = chart.addHistogramSeries({
      color: '#26a69a',
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: '',
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chart) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, []);

  // Fetch data when timeframe changes
  useEffect(() => {
    fetchData();
  }, [tokenAddress, timeframe]);

  // WebSocket connection for real-time updates
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
          // Update current candle
          const timestamp = Math.floor(data.timestamp / 1000);
          const intervalSeconds = timeframeToSeconds(timeframe);
          const candleTime = Math.floor(timestamp / intervalSeconds) * intervalSeconds;
          
          if (candleSeriesRef.current && volumeSeriesRef.current) {
            // Update candle
            candleSeriesRef.current.update({
              time: candleTime,
              open: data.open || data.price,
              high: data.high || data.price,
              low: data.low || data.price,
              close: data.price
            });
            
            // Update volume
            volumeSeriesRef.current.update({
              time: candleTime,
              value: data.volume || data.solAmount,
              color: data.type === 'buy' ? '#0ECB81' : '#F6465D'
            });
          }
          
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
        console.log('WebSocket disconnected, reconnecting in 5s...');
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
  }, [tokenAddress, timeframe]);

  const timeframeToSeconds = (tf: string): number => {
    const map: { [key: string]: number } = {
      '1m': 60,
      '5m': 300,
      '15m': 900,
      '1h': 3600,
      '4h': 14400,
      '1d': 86400
    };
    return map[tf] || 300;
  };

  const formatPrice = (price: number) => {
    if (price < 0.00001) return price.toExponential(2);
    if (price < 0.01) return price.toFixed(6);
    if (price < 1) return price.toFixed(4);
    return price.toFixed(2);
  };

  const formatVolume = (volume: number) => {
    if (volume >= 1000000) return `${(volume / 1000000).toFixed(2)}M`;
    if (volume >= 1000) return `${(volume / 1000).toFixed(2)}K`;
    return volume.toFixed(2);
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
            {['1m', '5m', '15m', '1h', '4h', '1d'].map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1 text-sm rounded transition-colors ${
                  timeframe === tf
                    ? 'bg-green-500 text-black font-semibold'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {tf}
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
              SOL Raised: <span className="text-white">{stats.solRaised.toFixed(2)}</span>
            </div>
            <div>
              Progress: <span className="text-green-400">{stats.graduationProgress.toFixed(1)}%</span>
            </div>
          </div>
        )}
      </div>
      
      {/* Chart container */}
      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400 mx-auto mb-4"></div>
              <p className="text-gray-400">Loading chart...</p>
            </div>
          </div>
        )}
        <div ref={chartContainerRef} className="w-full h-[500px]" />
      </div>
      
      {/* Footer info */}
      <div className="mt-2 text-xs text-gray-500 text-center">
        Real-time data • Powered by DeGenie
      </div>
    </div>
  );
}