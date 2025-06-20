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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [candles, setCandles] = useState<CandleData[]>([]);
  const [stats, setStats] = useState<TokenStats | null>(null);
  const [timeframe, setTimeframe] = useState('5m');
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredCandle, setHoveredCandle] = useState<number | null>(null);

  // Fetch data
  const fetchData = async () => {
    try {
      // Fetch candles
      const candlesRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/tokens/${tokenAddress}/candles?timeframe=${timeframe}`);
      const candlesData = await candlesRes.json();
      
      // Fetch token stats
      const statsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/tokens/${tokenAddress}/metrics`);
      const statsData = await statsRes.json();
      
      if (statsData.success) {
        setStats(statsData.data);
      }
      
      if (candlesData.success) {
        setCandles(candlesData.data);
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching chart data:', error);
      setIsLoading(false);
    }
  };

  // Draw chart on canvas
  const drawChart = () => {
    const canvas = canvasRef.current;
    if (!canvas || candles.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size with device pixel ratio for crisp rendering
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, rect.width, rect.height);

    // Calculate dimensions
    const padding = { top: 20, right: 60, bottom: 80, left: 10 };
    const chartWidth = rect.width - padding.left - padding.right;
    const chartHeight = rect.height - padding.top - padding.bottom;
    const volumeHeight = chartHeight * 0.2;
    const priceHeight = chartHeight * 0.75;
    
    // Calculate price range
    const prices = candles.flatMap(c => [c.high, c.low]);
    const minPrice = Math.min(...prices) * 0.999;
    const maxPrice = Math.max(...prices) * 1.001;
    const priceRange = maxPrice - minPrice;
    
    // Calculate volume range
    const maxVolume = Math.max(...candles.map(c => c.volume)) * 1.1 || 1;

    // Draw grid lines
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 0.5;
    
    // Horizontal grid lines for price
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (priceHeight / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(rect.width - padding.right, y);
      ctx.stroke();
      
      // Price labels
      const price = maxPrice - (priceRange / 4) * i;
      ctx.fillStyle = '#B2B5BE';
      ctx.font = '11px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(formatPrice(price), rect.width - padding.right + 5, y + 3);
    }

    // Draw candles
    const candleWidth = Math.max(1, (chartWidth / candles.length) * 0.8);
    const candleSpacing = chartWidth / candles.length;

    candles.forEach((candle, index) => {
      const x = padding.left + index * candleSpacing + candleSpacing / 2;
      
      // Calculate Y positions
      const highY = padding.top + (1 - (candle.high - minPrice) / priceRange) * priceHeight;
      const lowY = padding.top + (1 - (candle.low - minPrice) / priceRange) * priceHeight;
      const openY = padding.top + (1 - (candle.open - minPrice) / priceRange) * priceHeight;
      const closeY = padding.top + (1 - (candle.close - minPrice) / priceRange) * priceHeight;
      
      // Determine color
      const isGreen = candle.close >= candle.open;
      const color = isGreen ? '#0ECB81' : '#F6465D';
      
      // Draw wick
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, highY);
      ctx.lineTo(x, lowY);
      ctx.stroke();
      
      // Draw body
      const bodyTop = Math.min(openY, closeY);
      const bodyHeight = Math.max(1, Math.abs(closeY - openY));
      
      ctx.fillStyle = color;
      ctx.fillRect(x - candleWidth / 2, bodyTop, candleWidth, bodyHeight);
      
      // Draw border for hollow effect
      if (bodyHeight > 2) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.strokeRect(x - candleWidth / 2, bodyTop, candleWidth, bodyHeight);
      }
    });

    // Draw volume bars
    const volumeTop = padding.top + priceHeight + 20;
    
    candles.forEach((candle, index) => {
      const x = padding.left + index * candleSpacing + candleSpacing / 2;
      const height = (candle.volume / maxVolume) * volumeHeight;
      const isGreen = candle.close >= candle.open;
      
      ctx.fillStyle = isGreen ? '#0ECB8133' : '#F6465D33';
      ctx.fillRect(x - candleWidth / 2, volumeTop + volumeHeight - height, candleWidth, height);
    });

    // Draw volume axis label
    ctx.fillStyle = '#666';
    ctx.font = '10px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('Volume', padding.left, volumeTop - 5);
    
    // Draw latest price line
    if (candles.length > 0) {
      const lastCandle = candles[candles.length - 1];
      const lastPriceY = padding.top + (1 - (lastCandle.close - minPrice) / priceRange) * priceHeight;
      
      ctx.strokeStyle = '#758696';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(padding.left, lastPriceY);
      ctx.lineTo(rect.width - padding.right, lastPriceY);
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Price label background
      ctx.fillStyle = lastCandle.close >= lastCandle.open ? '#0ECB81' : '#F6465D';
      ctx.fillRect(rect.width - padding.right + 5, lastPriceY - 10, 55, 20);
      
      // Price label text
      ctx.fillStyle = '#000';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(formatPrice(lastCandle.close), rect.width - padding.right + 8, lastPriceY + 3);
    }
  };

  const formatPrice = (price: number) => {
    if (!price || isNaN(price)) return '0.00';
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

  // Initial fetch
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, [tokenAddress, timeframe]);

  // Draw chart when data changes
  useEffect(() => {
    drawChart();
    
    const handleResize = () => drawChart();
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, [candles]);

  // Handle mouse move for tooltips
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || candles.length === 0) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const padding = { left: 10, right: 60 };
    const chartWidth = rect.width - padding.left - padding.right;
    const candleSpacing = chartWidth / candles.length;
    
    const index = Math.floor((x - padding.left) / candleSpacing);
    if (index >= 0 && index < candles.length) {
      setHoveredCandle(index);
    } else {
      setHoveredCandle(null);
    }
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
              SOL Raised: <span className="text-white">{stats.solRaised?.toFixed(2) || '0'}</span>
            </div>
            <div>
              Progress: <span className="text-green-400">{stats.graduationProgress?.toFixed(1) || '0'}%</span>
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
        
        <canvas 
          ref={canvasRef} 
          className="w-full h-[500px] cursor-crosshair" 
          style={{ imageRendering: 'crisp-edges' }}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoveredCandle(null)}
        />
        
        {/* Tooltip */}
        {hoveredCandle !== null && candles[hoveredCandle] && (
          <div className="absolute top-2 left-2 bg-gray-900 border border-gray-700 rounded p-2 text-xs">
            <div className="text-gray-400">
              {new Date(candles[hoveredCandle].time * 1000).toLocaleString()}
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-1">
              <div>O: <span className="text-white">{formatPrice(candles[hoveredCandle].open)}</span></div>
              <div>H: <span className="text-white">{formatPrice(candles[hoveredCandle].high)}</span></div>
              <div>C: <span className="text-white">{formatPrice(candles[hoveredCandle].close)}</span></div>
              <div>L: <span className="text-white">{formatPrice(candles[hoveredCandle].low)}</span></div>
              <div className="col-span-2">
                Vol: <span className="text-white">{formatVolume(candles[hoveredCandle].volume)} SOL</span>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Footer info */}
      <div className="mt-2 text-xs text-gray-500 text-center">
        Real-time data • Updates every 5s • Powered by DeGenie
      </div>
    </div>
  );
}