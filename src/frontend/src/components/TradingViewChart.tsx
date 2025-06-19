'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { createChart, ColorType, IChartApi, ISeriesApi, CandlestickData, HistogramData, Time, CandlestickSeries, HistogramSeries } from 'lightweight-charts';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Maximize2,
  Settings,
  BarChart3 as VolumeIcon,
  Activity,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

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
  const isMountedRef = useRef(true);
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const [selectedTimeframe, setSelectedTimeframe] = useState('15m');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showVolume, setShowVolume] = useState(true);
  const [priceChange, setPriceChange] = useState({ change: 0, percentage: 0 });
  const [currentPrice, setCurrentPrice] = useState(0.000069);
  const [volume24h, setVolume24h] = useState(0);
  const [hasData, setHasData] = useState(false); // Start with no data assumption
  const [isLoading, setIsLoading] = useState(false);

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

  // Persistent chart data - maintains across re-renders
  const chartDataRef = useRef<{
    candleData: CandlestickData[];
    volumeData: HistogramData[];
    lastGenerated: number;
  } | null>(null);

  // Generate initial data for new tokens (only the current price candle)
  const generateInitialData = useCallback((price: number = 0.000069) => {
    const now = Math.floor(Date.now() / 1000);
    const data: CandlestickData[] = [];
    const volumeData: HistogramData[] = [];
    
    // Only show current price as a single candle (like pump.fun)
    data.push({
      time: now as Time,
      open: price,
      high: price,
      low: price,
      close: price
    });
    
    volumeData.push({
      time: now as Time,
      value: 0,
      color: '#10b981'
    });
    
    return { candleData: data, volumeData };
  }, []);

  // Load chart data
  const loadChartData = useCallback(async () => {
    if (!isMountedRef.current || !candlestickSeriesRef.current || !chartRef.current) {
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/tokens/${tokenAddress}/chart?timeframe=${selectedTimeframe}&limit=100`
      );
      
      if (!isMountedRef.current) return;
      
      const data = await response.json();
      
      if (!data.success || !data.data || data.data.length === 0) {
        // For new tokens with no trades, show single candle at current price
        console.log('📊 No trades yet, showing initial price candle');
        
        // Get current price from token data or use initial price
        const currentTokenPrice = data.currentPrice || 0.000069;
        const { candleData, volumeData } = generateInitialData(currentTokenPrice);
        
        if (candlestickSeriesRef.current && isMountedRef.current) {
          try {
            candlestickSeriesRef.current.setData(candleData);
            
            if (volumeSeriesRef.current && showVolume) {
              volumeSeriesRef.current.setData(volumeData);
            }
            
            // Update stats
            setCurrentPrice(currentTokenPrice);
            setPriceChange({ change: 0, percentage: 0 });
            setVolume24h(0);
            setHasData(false); // Show "New Token Alert" overlay
          } catch (e) {
            console.log('Chart update skipped - component unmounted');
          }
        }
        return;
      }
      
      const candles = data.data;
      const candleData: CandlestickData[] = [];
      const volumeData: HistogramData[] = [];
      
      console.log(`📊 Received ${candles.length} candles from backend`);
      setHasData(candles.length > 0);
      
      // If no candles, the chart will show "New Token Alert"
      
      // Convert API data to chart format
      candles.forEach((candle: any) => {
        candleData.push({
          time: candle.time as Time,
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close
        });
        
        volumeData.push({
          time: candle.time as Time,
          value: candle.volume,
          color: candle.close > candle.open ? '#10b981' : '#ef4444'
        });
      });
      
      // Update chart only if still mounted
      if (candlestickSeriesRef.current && isMountedRef.current) {
        try {
          candlestickSeriesRef.current.setData(candleData);
          
          if (volumeSeriesRef.current && showVolume) {
            volumeSeriesRef.current.setData(volumeData);
          }
          
          // Calculate stats
          if (candleData.length > 0) {
            const last = candleData[candleData.length - 1];
            setCurrentPrice(last.close);
            
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
          
          // Fit content
          if (chartRef.current && isMountedRef.current) {
            chartRef.current.timeScale().fitContent();
          }
        } catch (e) {
          console.log('Chart update skipped - chart disposed');
        }
      }
    } catch (error) {
      console.error('Error loading chart data:', error);
      setHasData(false);
      // Show single candle at current price on error
      if (isMountedRef.current) {
        const { candleData, volumeData } = generateInitialData(currentPrice);
        
        if (candlestickSeriesRef.current) {
          try {
            candlestickSeriesRef.current.setData(candleData);
            if (volumeSeriesRef.current && showVolume) {
              volumeSeriesRef.current.setData(volumeData);
            }
          } catch (e) {
            console.log('Chart update skipped on error');
          }
        }
      }
    }
  }, [tokenAddress, selectedTimeframe, showVolume, generateInitialData]);

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current || !isMountedRef.current) return;

    // Create the chart
    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: isFullscreen ? window.innerHeight - 100 : 500,
      layout: {
        background: { type: ColorType.Solid, color: '#0a0a0a' },
        textColor: '#d1d5db',
        fontSize: 12,
        fontFamily: 'Inter, sans-serif',
      },
      grid: {
        vertLines: { color: '#1f2937', style: 0, visible: true },
        horzLines: { color: '#1f2937', style: 0, visible: true },
      },
      crosshair: {
        mode: 1,
        vertLine: {
          color: '#6366f1',
          width: 1,
          style: 2,
          labelBackgroundColor: '#6366f1',
        },
        horzLine: {
          color: '#6366f1',
          width: 1,
          style: 2,
          labelBackgroundColor: '#6366f1',
        },
      },
      rightPriceScale: {
        borderColor: '#374151',
        textColor: '#d1d5db',
        entireTextOnly: false,
        scaleMargins: {
          top: 0.1,
          bottom: showVolume ? 0.4 : 0.1,
        },
      },
      timeScale: {
        borderColor: '#374151',
        timeVisible: true,
        secondsVisible: false,
      },
      watermark: {
        visible: true,
        fontSize: 48,
        horzAlign: 'center',
        vertAlign: 'center',
        color: 'rgba(107, 114, 128, 0.1)',
        text: symbol.toUpperCase(),
      },
    });

    chartRef.current = chart;

    // Add candlestick series
    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#10b981',
      downColor: '#ef4444',
      borderDownColor: '#ef4444',
      borderUpColor: '#10b981',
      wickDownColor: '#ef4444',
      wickUpColor: '#10b981',
      priceFormat: {
        type: 'price',
        precision: 8,
        minMove: 0.00000001,
      },
    });

    candlestickSeriesRef.current = candlestickSeries;

    // Add volume series if enabled
    if (showVolume) {
      const volumeSeries = chart.addSeries(HistogramSeries, {
        color: '#6366f1',
        priceFormat: {
          type: 'volume',
        },
        priceScaleId: '',
      });
      volumeSeriesRef.current = volumeSeries;
    }

    // Load initial data
    loadChartData();

    // Set up auto-update interval (less frequent, like real trading charts)
    updateIntervalRef.current = setInterval(() => {
      if (isMountedRef.current) {
        loadChartData();
      }
    }, 5000); // Update every 5 seconds for real-time data

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
    };
  }, [tokenAddress, selectedTimeframe, isFullscreen, showVolume, symbol, loadChartData]);

  const formatPrice = (price: number) => {
    if (price < 0.000001) {
      return price.toExponential(3);
    }
    return price.toFixed(8);
  };

  const formatVolume = (volume: number) => {
    if (volume > 1000) return `${(volume / 1000).toFixed(1)}K`;
    return volume.toFixed(3);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className={cn(
      "relative bg-black rounded-xl border border-gray-800 overflow-hidden",
      isFullscreen && "fixed inset-4 z-50 rounded-xl",
      className
    )}>
      {/* Chart Header */}
      <div className="flex items-center justify-between p-4 bg-gray-900/50 border-b border-gray-800">
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
                    "flex items-center space-x-1 px-2 py-1 rounded-lg text-sm font-medium",
                    priceChange.percentage > 0 
                      ? "bg-green-500/20 text-green-400" 
                      : "bg-red-500/20 text-red-400"
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
              </div>
            </div>
          </div>

          {/* Timeframe Selector */}
          <div className="flex items-center space-x-1 bg-gray-800/50 rounded-lg p-1">
            {timeframes.map((tf) => (
              <Button
                key={tf.value}
                onClick={() => setSelectedTimeframe(tf.value)}
                variant="ghost"
                size="sm"
                className={cn(
                  "px-3 py-1 rounded-md text-xs font-medium transition-all",
                  selectedTimeframe === tf.value
                    ? "bg-green-500/20 text-green-400"
                    : "text-gray-400 hover:text-white hover:bg-gray-700/50"
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
        style={{ height: isFullscreen ? 'calc(100vh - 100px)' : '500px' }}
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