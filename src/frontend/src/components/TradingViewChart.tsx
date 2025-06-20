'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { createChart, ColorType, IChartApi, ISeriesApi, CandlestickData, HistogramData, Time, LineData } from 'lightweight-charts';
import { CandlestickSeries, HistogramSeries, LineSeries } from 'lightweight-charts';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Maximize2,
  Settings,
  BarChart3 as VolumeIcon,
  Activity,
  Zap,
  LineChart
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { useWebSocket } from '@/hooks/useWebSocket';

interface CandleData extends CandlestickData {
  volume: number;
}

interface TradingViewChartProps {
  tokenAddress: string;
  symbol: string;
  className?: string;
}

const timeframes = [
  { label: '1m', value: '1m', minutes: 1 },
  { label: '5m', value: '5m', minutes: 5 },
  { label: '15m', value: '15m', minutes: 15 },
  { label: '1H', value: '1h', minutes: 60 },
  { label: '4H', value: '4h', minutes: 240 },
  { label: '1D', value: '1d', minutes: 1440 },
];

export function TradingViewChart({ tokenAddress, symbol, className }: TradingViewChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const ma20SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const ma50SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const isMountedRef = useRef(true);
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const candleBufferRef = useRef<Map<number, CandleData>>(new Map());
  const currentCandleRef = useRef<CandleData | null>(null);
  
  const [selectedTimeframe, setSelectedTimeframe] = useState('5m');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showVolume, setShowVolume] = useState(true);
  const [showMA, setShowMA] = useState(false);
  const [priceChange, setPriceChange] = useState({ change: 0, percentage: 0 });
  const [currentPrice, setCurrentPrice] = useState(0.000069);
  const [volume24h, setVolume24h] = useState(0);
  const [hasData, setHasData] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // WebSocket integration
  const { subscribeToToken, unsubscribeFromToken, onTradeUpdate, connected } = useWebSocket();

  // Get interval in seconds for the selected timeframe
  const getIntervalSeconds = useCallback(() => {
    const tf = timeframes.find(t => t.value === selectedTimeframe);
    return (tf?.minutes || 5) * 60;
  }, [selectedTimeframe]);

  // Calculate candle time based on interval
  const getCandleTime = useCallback((timestamp: number, intervalSeconds: number): number => {
    return Math.floor(timestamp / intervalSeconds) * intervalSeconds;
  }, []);

  // Update or create candle from trade
  const updateCandleFromTrade = useCallback((trade: any) => {
    if (!candlestickSeriesRef.current || !volumeSeriesRef.current) return;

    const intervalSeconds = getIntervalSeconds();
    const candleTime = getCandleTime(Math.floor(trade.timestamp / 1000), intervalSeconds);
    
    // Get existing candle or create new one
    const existingCandle = candleBufferRef.current.get(candleTime);
    
    if (existingCandle) {
      // Update existing candle
      existingCandle.high = Math.max(existingCandle.high, trade.price);
      existingCandle.low = Math.min(existingCandle.low, trade.price);
      existingCandle.close = trade.price;
      existingCandle.volume += trade.solAmount;
      
      // Update chart
      candlestickSeriesRef.current.update(existingCandle);
      
      // Update volume
      volumeSeriesRef.current.update({
        time: candleTime as Time,
        value: existingCandle.volume,
        color: existingCandle.close >= existingCandle.open ? '#00ff88' : '#ff3366'
      });
    } else {
      // Create new candle
      const newCandle: CandleData = {
        time: candleTime as Time,
        open: trade.price,
        high: trade.price,
        low: trade.price,
        close: trade.price,
        volume: trade.solAmount
      };
      
      candleBufferRef.current.set(candleTime, newCandle);
      candlestickSeriesRef.current.update(newCandle);
      
      // Add volume bar
      volumeSeriesRef.current.update({
        time: candleTime as Time,
        value: trade.solAmount,
        color: '#00ff88'
      });
    }
    
    // Update current price and stats
    setCurrentPrice(trade.price);
    currentCandleRef.current = candleBufferRef.current.get(candleTime) || null;
    
    // Update MA if enabled
    if (showMA) {
      updateMovingAverages();
    }
  }, [getIntervalSeconds, getCandleTime, showMA]);

  // Calculate moving averages
  const updateMovingAverages = useCallback(() => {
    if (!ma20SeriesRef.current || !ma50SeriesRef.current) return;
    
    const candles = Array.from(candleBufferRef.current.values()).sort((a, b) => 
      (a.time as number) - (b.time as number)
    );
    
    if (candles.length < 20) return;
    
    // Calculate MA20
    const ma20Data: LineData[] = [];
    for (let i = 19; i < candles.length; i++) {
      const sum = candles.slice(i - 19, i + 1).reduce((acc, c) => acc + c.close, 0);
      ma20Data.push({
        time: candles[i].time,
        value: sum / 20
      });
    }
    ma20SeriesRef.current.setData(ma20Data);
    
    // Calculate MA50 if enough data
    if (candles.length >= 50) {
      const ma50Data: LineData[] = [];
      for (let i = 49; i < candles.length; i++) {
        const sum = candles.slice(i - 49, i + 1).reduce((acc, c) => acc + c.close, 0);
        ma50Data.push({
          time: candles[i].time,
          value: sum / 50
        });
      }
      ma50SeriesRef.current.setData(ma50Data);
    }
  }, []);

  // Cleanup function
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, []);

  // Load chart data
  const loadChartData = useCallback(async () => {
    if (!isMountedRef.current || !candlestickSeriesRef.current || !chartRef.current) {
      return;
    }

    try {
      setIsLoading(true);
      console.log('📊 [Chart] Loading data for:', tokenAddress, 'timeframe:', selectedTimeframe);
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/tokens/${tokenAddress}/chart?timeframe=${selectedTimeframe}&limit=300`
      );
      
      if (!isMountedRef.current) return;
      
      const data = await response.json();
      console.log('📊 [Chart] Received response:', {
        success: data.success,
        dataLength: data.data?.length,
        currentPrice: data.currentPrice,
        message: data.message
      });
      
      if (!data.success || !data.data || data.data.length === 0) {
        // For new tokens with no trades, show single candle at current price
        console.log('📊 No trades yet, showing initial price candle');
        
        const currentTokenPrice = data.currentPrice || 0.000069;
        const now = Math.floor(Date.now() / 1000);
        const intervalSeconds = getIntervalSeconds();
        const candleTime = getCandleTime(now, intervalSeconds);
        
        console.log('📊 No trade data - creating initial candle:', {
          currentPrice: currentTokenPrice,
          candleTime,
          now
        });
        
        const initialCandle: CandleData = {
          time: candleTime as Time,
          open: currentTokenPrice,
          high: currentTokenPrice,
          low: currentTokenPrice,
          close: currentTokenPrice,
          volume: 0
        };
        
        candleBufferRef.current.clear();
        candleBufferRef.current.set(candleTime, initialCandle);
        
        if (candlestickSeriesRef.current && isMountedRef.current) {
          candlestickSeriesRef.current.setData([initialCandle]);
          
          if (volumeSeriesRef.current && showVolume) {
            volumeSeriesRef.current.setData([{
              time: candleTime as Time,
              value: 0,
              color: '#00ff88'
            }]);
          }
          
          setCurrentPrice(currentTokenPrice);
          setPriceChange({ change: 0, percentage: 0 });
          setVolume24h(0);
          setHasData(false);
        }
        setIsLoading(false);
        return;
      }
      
      const candles = data.data;
      candleBufferRef.current.clear();
      
      console.log(`📊 Received ${candles.length} candles from backend`);
      console.log('📊 Sample candle:', candles[0]);
      
      // Check if we have real trade data (not just synthetic)
      const hasRealTrades = data.realCandleCount > 0 || candles.some(c => c.volume > 0);
      console.log('📊 Has real trades:', hasRealTrades, 'realCandleCount:', data.realCandleCount);
      setHasData(hasRealTrades);
      
      // Convert API data to chart format and populate buffer
      const candleData: CandlestickData[] = [];
      const volumeData: HistogramData[] = [];
      
      candles.forEach((candle: any) => {
        const candleObj: CandleData = {
          time: candle.time as Time,
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close,
          volume: candle.volume
        };
        
        candleBufferRef.current.set(candle.time, candleObj);
        candleData.push(candleObj);
        
        volumeData.push({
          time: candle.time as Time,
          value: candle.volume,
          color: candle.close > candle.open ? '#00ff88' : '#ff3366'
        });
      });
      
      // Update chart only if still mounted
      if (candlestickSeriesRef.current && isMountedRef.current) {
        console.log('📊 [Chart] Updating chart with', candleData.length, 'candles');
        candlestickSeriesRef.current.setData(candleData);
        
        if (volumeSeriesRef.current && showVolume) {
          console.log('📊 [Chart] Updating volume with', volumeData.length, 'bars');
          volumeSeriesRef.current.setData(volumeData);
        }
        
        // Calculate stats
        if (candleData.length > 0) {
          const last = candleData[candleData.length - 1];
          setCurrentPrice(last.close);
          currentCandleRef.current = candleBufferRef.current.get(last.time as number) || null;
          
          // Calculate 24h change if we have enough data
          if (candleData.length > 1) {
            const first = candleData[0];
            const change = last.close - first.open;
            const percentage = (change / first.open) * 100;
            setPriceChange({ change, percentage });
          } else {
            setPriceChange({ change: 0, percentage: 0 });
          }
          
          setVolume24h(volumeData.reduce((sum, v) => sum + v.value, 0));
        }
        
        // Update MA if enabled
        if (showMA) {
          updateMovingAverages();
        }
        
        // Fit content
        if (chartRef.current && isMountedRef.current) {
          chartRef.current.timeScale().fitContent();
        }
        
        console.log('📊 [Chart] Chart update completed');
      }
      
      console.log('📊 [Chart] Setting loading to false');
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading chart data:', error);
      setHasData(false);
      setIsLoading(false);
      // Show initial price on error
      const now = Math.floor(Date.now() / 1000);
      const intervalSeconds = getIntervalSeconds();
      const candleTime = getCandleTime(now, intervalSeconds);
      
      const errorCandle: CandleData = {
        time: candleTime as Time,
        open: 0.000069,
        high: 0.000069,
        low: 0.000069,
        close: 0.000069,
        volume: 0
      };
      
      if (candlestickSeriesRef.current && isMountedRef.current) {
        candlestickSeriesRef.current.setData([errorCandle]);
        if (volumeSeriesRef.current && showVolume) {
          volumeSeriesRef.current.setData([{
            time: candleTime as Time,
            value: 0,
            color: '#00ff88'
          }]);
        }
      }
    }
  }, [tokenAddress, selectedTimeframe, showVolume, showMA, getIntervalSeconds, getCandleTime, updateMovingAverages]);

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current || !isMountedRef.current) return;

    // Create the chart with pump.fun-like styling
    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: isFullscreen ? window.innerHeight - 100 : 400,
      layout: {
        background: { type: ColorType.Solid, color: '#0f0f0f' },
        textColor: '#9ca3af',
        fontSize: 11,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      },
      grid: {
        vertLines: { color: '#1a1a1a', style: 0, visible: true },
        horzLines: { color: '#1a1a1a', style: 0, visible: true },
      },
      crosshair: {
        mode: 1,
        vertLine: {
          color: '#505050',
          width: 1,
          style: 3,
          labelBackgroundColor: '#2d2d2d',
        },
        horzLine: {
          color: '#505050',
          width: 1,
          style: 3,
          labelBackgroundColor: '#2d2d2d',
        },
      },
      rightPriceScale: {
        borderColor: '#2d2d2d',
        textColor: '#9ca3af',
        entireTextOnly: false,
        autoScale: true,
        mode: 1,
        invertScale: false,
        alignLabels: false,
        borderVisible: false,
        scaleMargins: {
          top: 0.1,
          bottom: showVolume ? 0.3 : 0.1,
        },
      },
      timeScale: {
        borderColor: '#2d2d2d',
        timeVisible: true,
        secondsVisible: false,
        borderVisible: false,
        fixLeftEdge: true,
        fixRightEdge: true,
        barSpacing: 8,
        minBarSpacing: 4,
      },
      watermark: {
        visible: false,
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: false,
      },
      handleScale: {
        axisPressedMouseMove: {
          time: true,
          price: true,
        },
        axisDoubleClickReset: true,
        mouseWheel: true,
        pinch: true,
      },
    });

    chartRef.current = chart;

    // Add candlestick series with pump.fun colors
    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#00ff88',
      downColor: '#ff3366',
      borderDownColor: '#ff3366',
      borderUpColor: '#00ff88',
      wickDownColor: '#ff3366',
      wickUpColor: '#00ff88',
      priceFormat: {
        type: 'price',
        precision: 9,
        minMove: 0.000000001,
      },
    });

    candlestickSeriesRef.current = candlestickSeries;

    // Add volume series
    if (showVolume) {
      const volumeSeries = chart.addSeries(HistogramSeries, {
        color: '#2d2d2d',
        priceFormat: {
          type: 'volume',
        },
        priceScaleId: '',
      });
      volumeSeriesRef.current = volumeSeries;
    }

    // Add MA series if enabled
    if (showMA) {
      const ma20Series = chart.addSeries(LineSeries, {
        color: '#2962FF',
        lineWidth: 2,
        priceFormat: {
          type: 'price',
          precision: 9,
          minMove: 0.000000001,
        },
        title: 'MA20',
      });
      ma20SeriesRef.current = ma20Series;

      const ma50Series = chart.addSeries(LineSeries, {
        color: '#FF6D00',
        lineWidth: 2,
        priceFormat: {
          type: 'price',
          precision: 9,
          minMove: 0.000000001,
        },
        title: 'MA50',
      });
      ma50SeriesRef.current = ma50Series;
    }

    // Load initial data
    loadChartData();

    // Subscribe to WebSocket updates
    if (connected) {
      subscribeToToken(tokenAddress);
    }

    // Set up auto-update interval (more frequent for testing)
    updateIntervalRef.current = setInterval(() => {
      if (isMountedRef.current) {
        console.log('📊 [Chart] Auto-refreshing chart data...');
        loadChartData();
      }
    }, 5000); // Refresh every 5 seconds for better real-time updates

    // Handle resize
    const handleResize = () => {
      if (chart && chartContainerRef.current && isMountedRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: isFullscreen ? window.innerHeight - 100 : 500,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      isMountedRef.current = false;
      window.removeEventListener('resize', handleResize);
      
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
        updateIntervalRef.current = null;
      }
      
      if (connected && tokenAddress) {
        unsubscribeFromToken(tokenAddress);
      }
      
      if (chart) {
        try {
          chart.remove();
        } catch (e) {
          console.log('Chart already removed');
        }
      }
      
      chartRef.current = null;
      candlestickSeriesRef.current = null;
      volumeSeriesRef.current = null;
      ma20SeriesRef.current = null;
      ma50SeriesRef.current = null;
      candleBufferRef.current.clear();
    };
  }, [tokenAddress, selectedTimeframe, isFullscreen, showVolume, showMA, symbol, loadChartData, connected, subscribeToToken, unsubscribeFromToken]);

  // Subscribe to trade updates
  useEffect(() => {
    if (!connected) {
      console.log('📊 [Chart] WebSocket not connected, skipping trade updates');
      return;
    }

    console.log('📊 [Chart] Subscribing to trade updates for:', tokenAddress);
    const cleanup = onTradeUpdate((update) => {
      console.log('📊 [Chart] Received trade update for token:', update.tokenAddress);
      if (update.tokenAddress === tokenAddress) {
        console.log('📊 [Chart] Processing trade update for our token:', update);
        updateCandleFromTrade(update.trade);
      }
    });

    return cleanup;
  }, [connected, tokenAddress, onTradeUpdate, updateCandleFromTrade]);

  const formatPrice = (price: number) => {
    if (price < 0.000001) {
      return price.toExponential(3);
    }
    return price.toFixed(8);
  };

  const formatVolume = (volume: number) => {
    if (volume > 1000000) return `${(volume / 1000000).toFixed(2)}M`;
    if (volume > 1000) return `${(volume / 1000).toFixed(1)}K`;
    return volume.toFixed(3);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const toggleMA = () => {
    setShowMA(!showMA);
  };

  return (
    <div className={cn(
      "relative bg-[#0f0f0f] rounded-lg border border-[#1a1a1a] overflow-hidden",
      isFullscreen && "fixed inset-4 z-50 rounded-lg",
      className
    )}>
      {/* Chart Header */}
      <div className="flex items-center justify-between p-3 bg-[#0a0a0a] border-b border-[#1a1a1a]">
        <div className="flex items-center space-x-6">
          {/* Price Info */}
          <div className="flex items-center space-x-3">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-2xl font-bold text-white">
                  ${formatPrice(currentPrice)}
                </span>
                {priceChange.percentage !== 0 && (
                  <div className={cn(
                    "flex items-center space-x-1 px-2 py-1 rounded-md text-sm font-medium",
                    priceChange.percentage > 0 
                      ? "bg-[#00ff88]/20 text-[#00ff88]" 
                      : "bg-[#ff3366]/20 text-[#ff3366]"
                  )}>
                    {priceChange.percentage > 0 ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    <span>{Math.abs(priceChange.percentage).toFixed(2)}%</span>
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-4 text-sm text-gray-400 mt-1">
                <span>Vol: ${formatVolume(volume24h)}</span>
                <span>24h: {priceChange.change > 0 ? '+' : ''}{formatPrice(priceChange.change)}</span>
                {connected && (
                  <span className="flex items-center gap-1 text-xs text-[#00ff88]">
                    <div className="w-1.5 h-1.5 bg-[#00ff88] rounded-full animate-pulse" />
                    LIVE
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Timeframe Selector */}
          <div className="flex items-center space-x-1 bg-[#1a1a1a] rounded-md p-1">
            {timeframes.map((tf) => (
              <Button
                key={tf.value}
                onClick={() => setSelectedTimeframe(tf.value)}
                variant="ghost"
                size="sm"
                className={cn(
                  "px-3 py-1 rounded text-xs font-medium transition-all",
                  selectedTimeframe === tf.value
                    ? "bg-[#00ff88]/20 text-[#00ff88]"
                    : "text-gray-500 hover:text-gray-300 hover:bg-[#2d2d2d]"
                )}
              >
                {tf.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center space-x-2">
          <Button
            onClick={toggleMA}
            variant="ghost"
            size="sm"
            className={cn(
              "text-gray-400",
              showMA && "text-green-400"
            )}
          >
            <LineChart className="w-4 h-4" />
          </Button>
          <Button
            onClick={() => setShowVolume(!showVolume)}
            variant="ghost"
            size="sm"
            className={cn(
              "text-gray-400",
              showVolume && "text-green-400"
            )}
          >
            <VolumeIcon className="w-4 h-4" />
          </Button>
          <Button
            onClick={toggleFullscreen}
            variant="ghost"
            size="sm"
            className="text-gray-400"
          >
            <Maximize2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Chart Container */}
      <div 
        ref={chartContainerRef} 
        className="relative w-full"
        style={{ height: isFullscreen ? 'calc(100vh - 100px)' : '400px' }}
      />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <div className="text-center">
            <Activity className="w-8 h-8 text-green-400 animate-pulse mx-auto mb-2" />
            <p className="text-sm text-gray-400">Loading chart data...</p>
          </div>
        </div>
      )}

      {/* No Data Message */}
      {!hasData && !isLoading && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
          <div className="text-center p-8">
            <Zap className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">New Token Alert!</h3>
            <p className="text-sm text-gray-400 max-w-xs">
              This token was just created. Chart will populate as trades come in.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}