'use client';

import { useState, useEffect } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Activity,
  Calendar,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn, formatPrice, formatNumber, getTimeAgo } from '@/lib/utils';
import { apiService } from '@/lib/api';

interface ChartDataPoint {
  timestamp: number;
  price: number;
  volume: number;
  marketCap: number;
  formattedTime: string;
}

interface BondingCurveChartProps {
  tokenAddress: string;
}

const timeframes = [
  { label: '1H', value: '1h', hours: 1 },
  { label: '4H', value: '4h', hours: 4 },
  { label: '1D', value: '1d', hours: 24 },
  { label: '3D', value: '3d', hours: 72 },
  { label: '1W', value: '1w', hours: 168 },
  { label: 'ALL', value: 'all', hours: null }
];

export function BondingCurveChart({ tokenAddress }: BondingCurveChartProps) {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState('1d');
  const [chartType, setChartType] = useState<'price' | 'volume'>('price');

  useEffect(() => {
    loadChartData();
  }, [tokenAddress, selectedTimeframe]);

  const loadChartData = async () => {
    setLoading(true);
    try {
      const response = await apiService.getTokenChart(tokenAddress, selectedTimeframe);
      if (response.data) {
        const formattedData = response.data.map((point: any) => ({
          ...point,
          formattedTime: formatChartTime(point.timestamp, selectedTimeframe)
        }));
        setChartData(formattedData);
      }
    } catch (error) {
      console.error('Error loading chart data:', error);
      // Generate mock data for development
      generateMockData();
    } finally {
      setLoading(false);
    }
  };

  const generateMockData = () => {
    const now = Date.now();
    const timeframe = timeframes.find(tf => tf.value === selectedTimeframe);
    const hours = timeframe?.hours || 24;
    const points = Math.min(100, hours * 4); // 4 points per hour max
    const interval = (hours * 60 * 60 * 1000) / points;

    const mockData: ChartDataPoint[] = [];
    let currentPrice = 0.000001; // Starting price
    
    for (let i = 0; i < points; i++) {
      const timestamp = now - (hours * 60 * 60 * 1000) + (i * interval);
      
      // Simulate price movement with some randomness
      const change = (Math.random() - 0.45) * 0.1; // Slight upward bias
      currentPrice = Math.max(0.0000001, currentPrice * (1 + change));
      
      const volume = Math.random() * 50 + 10; // Random volume between 10-60 SOL
      const marketCap = currentPrice * 1000000000; // Assuming 1B total supply
      
      mockData.push({
        timestamp,
        price: currentPrice,
        volume,
        marketCap,
        formattedTime: formatChartTime(timestamp, selectedTimeframe)
      });
    }
    
    setChartData(mockData);
  };

  const formatChartTime = (timestamp: number, timeframe: string) => {
    const date = new Date(timestamp);
    
    switch (timeframe) {
      case '1h':
      case '4h':
        return date.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
      case '1d':
      case '3d':
        return date.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
      case '1w':
        return date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        });
      case 'all':
        return date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        });
      default:
        return date.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
    }
  };

  const getPriceChange = () => {
    if (chartData.length < 2) return { change: 0, percentage: 0 };
    
    const currentPrice = chartData[chartData.length - 1].price;
    const previousPrice = chartData[0].price;
    const change = currentPrice - previousPrice;
    const percentage = (change / previousPrice) * 100;
    
    return { change, percentage };
  };

  const getVolumeTotal = () => {
    return chartData.reduce((total, point) => total + point.volume, 0);
  };

  const priceChange = getPriceChange();
  const totalVolume = getVolumeTotal();

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-gray-800 border border-gray-600 rounded-lg p-3 shadow-lg">
          <p className="text-sm text-gray-300 mb-1">{label}</p>
          {chartType === 'price' ? (
            <>
              <p className="text-sm font-medium text-white">
                Price: {formatPrice(data.price)}
              </p>
              <p className="text-sm text-gray-400">
                Market Cap: {formatPrice(data.marketCap)}
              </p>
            </>
          ) : (
            <p className="text-sm font-medium text-white">
              Volume: {data.volume.toFixed(2)} SOL
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-3"
          />
          <p className="text-gray-400 text-sm">Loading chart data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Chart Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Chart Type Toggle */}
          <div className="flex rounded-lg bg-gray-800 p-1">
            <Button
              onClick={() => setChartType('price')}
              variant={chartType === 'price' ? 'default' : 'ghost'}
              size="sm"
              className="h-8 px-3"
            >
              <TrendingUp className="w-4 h-4 mr-1" />
              Price
            </Button>
            <Button
              onClick={() => setChartType('volume')}
              variant={chartType === 'volume' ? 'default' : 'ghost'}
              size="sm"
              className="h-8 px-3"
            >
              <BarChart3 className="w-4 h-4 mr-1" />
              Volume
            </Button>
          </div>

          {/* Stats */}
          <div className="flex items-center space-x-4 text-sm">
            {chartType === 'price' && (
              <div className="flex items-center space-x-1">
                <span className="text-gray-400">Change:</span>
                <span className={cn(
                  "font-medium",
                  priceChange.percentage >= 0 ? "text-green-400" : "text-red-400"
                )}>
                  {priceChange.percentage >= 0 ? '+' : ''}
                  {priceChange.percentage.toFixed(2)}%
                </span>
              </div>
            )}
            
            {chartType === 'volume' && (
              <div className="flex items-center space-x-1">
                <span className="text-gray-400">Total Volume:</span>
                <span className="font-medium text-white">
                  {totalVolume.toFixed(2)} SOL
                </span>
              </div>
            )}
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
              className="h-8 px-3 text-xs"
            >
              {timeframe.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Chart Container */}
      <div className="h-96 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'price' ? (
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="formattedTime" 
                stroke="#9ca3af"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="#9ca3af"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => formatPrice(value)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="price"
                stroke="#8b5cf6"
                strokeWidth={2}
                fill="url(#priceGradient)"
                dot={false}
                activeDot={{ r: 4, fill: "#8b5cf6" }}
              />
            </AreaChart>
          ) : (
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="formattedTime" 
                stroke="#9ca3af"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="#9ca3af"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value.toFixed(1)} SOL`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="volume"
                stroke="#06b6d4"
                strokeWidth={2}
                fill="url(#volumeGradient)"
                dot={false}
                activeDot={{ r: 4, fill: "#06b6d4" }}
              />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Chart Info */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <Activity className="w-3 h-3" />
            <span>{chartData.length} data points</span>
          </div>
          <div className="flex items-center space-x-1">
            <Clock className="w-3 h-3" />
            <span>
              Last updated: {chartData.length > 0 ? getTimeAgo(chartData[chartData.length - 1].timestamp) : 'Never'}
            </span>
          </div>
        </div>
        
        <div className="text-gray-400">
          Powered by DeGenie Analytics
        </div>
      </div>
    </div>
  );
}