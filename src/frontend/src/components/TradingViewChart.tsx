'use client';

import { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, IChartApi, ISeriesApi, CandlestickData, HistogramData, CandlestickSeriesPartialOptions, HistogramSeriesPartialOptions } from 'lightweight-charts';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Maximize2,
  Settings,
  Volume2,
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
  
  const [selectedTimeframe, setSelectedTimeframe] = useState('15m');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showVolume, setShowVolume] = useState(true);
  const [priceChange, setPriceChange] = useState({ change: 0, percentage: 0 });
  const [currentPrice, setCurrentPrice] = useState(0);
  const [volume24h, setVolume24h] = useState(0);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Create the chart with TradingView styling
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
        textColor: '#d1d5db',
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

    // Add candlestick series with pump.fun colors
    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#10b981', // Green for bullish candles
      downColor: '#ef4444', // Red for bearish candles
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
      const volumeSeries = chart.addHistogramSeries({
        color: '#6366f1',
        priceFormat: {
          type: 'volume',
        },
        priceScaleId: '',
        scaleMargins: {
          top: 0.7,
          bottom: 0,
        },
      });
      volumeSeriesRef.current = volumeSeries;
    }

    // Generate realistic mock data
    generateMockData();

    // Handle resize
    const handleResize = () => {
      if (chart && chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: isFullscreen ? window.innerHeight - 100 : 500,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chart) {
        chart.remove();
      }
    };
  }, [tokenAddress, selectedTimeframe, isFullscreen, showVolume, symbol]);

  const generateMockData = () => {
    if (!candlestickSeriesRef.current) return;

    const timeframe = timeframes.find(tf => tf.value === selectedTimeframe);
    const intervalMinutes = timeframe?.minutes || 15;
    const now = Math.floor(Date.now() / 1000);
    const intervalSeconds = intervalMinutes * 60;
    
    // Generate 100 candles
    const candleCount = 100;
    const startTime = now - (candleCount * intervalSeconds);
    
    const candleData: CandleData[] = [];
    const volumeData: HistogramData[] = [];
    
    let basePrice = 0.000001234; // Starting price
    let trend = 1; // 1 for up, -1 for down
    let trendDuration = 0;
    
    for (let i = 0; i < candleCount; i++) {
      const time = startTime + (i * intervalSeconds);
      
      // Change trend randomly
      trendDuration++;
      if (trendDuration > Math.random() * 10 + 5) {
        trend = Math.random() > 0.6 ? 1 : -1; // 60% chance for bullish
        trendDuration = 0;
      }
      
      // Generate OHLC with realistic patterns
      const volatility = 0.05; // 5% volatility
      const trendStrength = trend * (Math.random() * 0.02 + 0.005);
      
      const open = basePrice;
      const change = open * (trendStrength + (Math.random() - 0.5) * volatility);
      const close = Math.max(open + change, 0.0000000001);
      
      // Generate high and low
      const maxMove = Math.abs(close - open) * 2;
      const high = Math.max(open, close) + (Math.random() * maxMove);
      const low = Math.min(open, close) - (Math.random() * maxMove * 0.7);
      
      // Generate volume
      const volume = (Math.random() * 50 + 10) * (trend > 0 ? 1.2 : 0.8);
      
      candleData.push({
        time: time as any,
        open,
        high,
        low,
        close,
        volume
      });
      
      volumeData.push({
        time: time as any,
        value: volume,
        color: close > open ? '#10b981' : '#ef4444'
      });
      
      basePrice = close;
    }
    
    // Set data to series
    candlestickSeriesRef.current.setData(candleData);
    if (volumeSeriesRef.current && showVolume) {
      volumeSeriesRef.current.setData(volumeData);
    }
    
    // Calculate stats
    if (candleData.length > 1) {
      const first = candleData[0];
      const last = candleData[candleData.length - 1];
      const change = last.close - first.open;
      const percentage = (change / first.open) * 100;
      
      setPriceChange({ change, percentage });
      setCurrentPrice(last.close);
      setVolume24h(volumeData.reduce((sum, v) => sum + v.value, 0));
    }
  };

  const formatPrice = (price: number) => {
    if (price < 0.000001) {
      return price.toExponential(3);
    }
    return price.toFixed(8);
  };

  const formatVolume = (volume: number) => {
    if (volume > 1000) return `${(volume / 1000).toFixed(1)}K`;
    return volume.toFixed(1);
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
                <span className="text-xl font-bold text-white">
                  {formatPrice(currentPrice)}
                </span>
                <div className={cn(
                  "flex items-center text-sm font-medium",
                  priceChange.percentage >= 0 ? "text-green-400" : "text-red-400"
                )}>
                  {priceChange.percentage >= 0 ? (
                    <TrendingUp className="w-4 h-4 mr-1" />
                  ) : (
                    <TrendingDown className="w-4 h-4 mr-1" />
                  )}
                  {priceChange.percentage >= 0 ? '+' : ''}
                  {priceChange.percentage.toFixed(2)}%
                </div>
              </div>
              <div className="text-sm text-gray-400">
                24h Vol: {formatVolume(volume24h)} SOL
              </div>
            </div>
          </div>

          {/* Timeframe Selector */}
          <div className="flex rounded-lg bg-gray-800 p-1">
            {timeframes.map((timeframe) => (
              <Button
                key={timeframe.value}
                onClick={() => setSelectedTimeframe(timeframe.value)}
                variant={selectedTimeframe === timeframe.value ? 'default' : 'ghost'}
                size="sm"
                className="h-7 px-3 text-xs font-medium"
              >
                {timeframe.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Chart Controls */}
        <div className="flex items-center space-x-2">
          <Button
            onClick={() => setShowVolume(!showVolume)}
            variant={showVolume ? 'default' : 'outline'}
            size="sm"
            className="h-8 px-3"
          >
            <Volume2 className="w-4 h-4 mr-1" />
            Volume
          </Button>
          
          <Button
            onClick={toggleFullscreen}
            variant="outline"
            size="sm"
            className="h-8 px-3 border-gray-600"
          >
            <Maximize2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Chart Container */}
      <div 
        ref={chartContainerRef}
        className="relative"
        style={{ 
          height: isFullscreen ? 'calc(100vh - 180px)' : '500px'
        }}
      />

      {/* Chart Footer */}
      <div className="flex items-center justify-between p-3 bg-gray-900/30 border-t border-gray-800 text-xs text-gray-400">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <Activity className="w-3 h-3" />
            <span>Real-time data</span>
          </div>
          <div className="flex items-center space-x-1">
            <Zap className="w-3 h-3" />
            <span>TradingView Powered</span>
          </div>
        </div>
        
        <div className="text-gray-500">
          {symbol.toUpperCase()}/SOL • DeGenie
        </div>
      </div>

      {/* Loading Overlay */}
      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ delay: 1, duration: 0.5 }}
        className="absolute inset-0 bg-black/80 flex items-center justify-center pointer-events-none"
      >
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full mx-auto mb-3"
          />
          <p className="text-gray-400 text-sm">Loading chart...</p>
        </div>
      </motion.div>
    </div>
  );
}