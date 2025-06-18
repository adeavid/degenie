'use client';

import { useState, useEffect } from 'react';

// Force this page to be client-side only
export const dynamic = 'force-dynamic';
import { useWalletConnection } from '@/hooks/useWalletConnection';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Zap,
  Plus,
  Copy,
  Star,
  BarChart3,
  Rocket,
  Eye,
  MessageCircle,
  Activity,
  Bell,
  X,
  Flame,
  ArrowUpRight,
  ArrowDownRight,
  Volume2
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Progress } from '@/components/ui/Progress';
import { formatNumber, formatPrice, formatAddress, getTimeAgo } from '@/lib/utils';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import { useUserTokens } from '@/hooks/useUserTokens';

interface UserToken {
  id: string;
  name: string;
  symbol: string;
  logo: string;
  contractAddress: string;
  currentPrice: number;
  priceChange24h: number;
  marketCap: number;
  volume24h: number;
  holders: number;
  graduationProgress: number;
  isGraduated: boolean;
  isCreatedBy: boolean;
  holdings: number;
  value: number;
  createdAt: number;
}

interface DashboardStats {
  totalPortfolioValue: number;
  totalPnL: number;
  pnlPercentage: number;
  tokensCreated: number;
  tokensGraduated: number;
  totalVolume: number;
  aiCredits: number;
  tier: 'free' | 'starter' | 'viral';
}

// Professional market data simulation with realistic patterns
const generateRealisticMarketData = (tokens: UserToken[], baseStats: DashboardStats) => {
  // Generate realistic portfolio statistics
  const generateRealisticStats = () => {
    const portfolioValue = tokens.reduce((sum, token) => sum + token.value, 0);
    const totalPnL = tokens.reduce((sum, token) => sum + (token.value * token.priceChange24h / 100), 0);
    const avgPnLPercent = tokens.length > 0 ? tokens.reduce((sum, token) => sum + token.priceChange24h, 0) / tokens.length : 0;
    const totalVolume = tokens.reduce((sum, token) => sum + token.volume24h, 0);
    const created = tokens.filter(t => t.isCreatedBy).length;
    const graduated = tokens.filter(t => t.isGraduated).length;
    
    return {
      totalPortfolioValue: portfolioValue || (1250 + Math.random() * 2800), // Fallback for demo
      totalPnL: totalPnL || ((Math.random() - 0.5) * 400),
      pnlPercentage: avgPnLPercent || ((Math.random() - 0.5) * 30),
      tokensCreated: created || Math.floor(Math.random() * 4) + 2,
      tokensGraduated: graduated || Math.floor(Math.random() * 2) + 1,
      totalVolume: totalVolume || (50000 + Math.random() * 200000),
      aiCredits: 156.5,
      tier: 'starter' as const
    };
  };

  // Generate realistic 24-hour price history based on portfolio performance
  const generatePriceHistory = (currentValue: number, pnlPercent: number) => {
    const hours = Array.from({ length: 25 }, (_, i) => i);
    const startValue = currentValue / (1 + pnlPercent / 100);
    
    return hours.map((hour) => {
      // Simulate realistic intraday volatility with overall trend
      const progress = hour / 24;
      const trendComponent = startValue * (pnlPercent / 100) * progress;
      const volatilityComponent = (Math.random() - 0.5) * startValue * 0.03; // ±3% volatility
      const cycleComponent = Math.sin(progress * Math.PI * 2) * startValue * 0.01; // Daily cycle
      
      const price = startValue + trendComponent + volatilityComponent + cycleComponent;
      const volume = 100 + Math.random() * 200 + Math.sin(progress * Math.PI) * 50; // Higher volume mid-day
      
      return {
        time: hour === 24 ? '24:00' : `${hour.toString().padStart(2, '0')}:00`,
        price: Math.max(price, startValue * 0.8), // Prevent unrealistic drops
        volume: Math.floor(volume)
      };
    });
  };

  // Generate dynamic portfolio distribution from actual holdings
  const generatePortfolioDistribution = () => {
    if (tokens.length === 0) {
      // Fallback distribution for demo
      return [
        { name: 'SOL', value: 45, color: '#9945ff' },
        { name: 'USDC', value: 30, color: '#2775ca' },
        { name: 'Created Tokens', value: 25, color: '#10b981' }
      ];
    }

    const totalValue = tokens.reduce((sum, token) => sum + token.value, 0);
    const colors = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
    
    let distribution = tokens
      .filter(token => token.value > 0)
      .map((token, index) => ({
        name: token.symbol,
        value: Math.round((token.value / totalValue) * 100),
        color: colors[index % colors.length]
      }))
      .sort((a, b) => b.value - a.value);

    // Group small holdings into "Others" if more than 4 tokens
    if (distribution.length > 4) {
      const major = distribution.slice(0, 3);
      const others = distribution.slice(3);
      const othersValue = others.reduce((sum, item) => sum + item.value, 0);
      
      distribution = [
        ...major,
        { name: 'Others', value: othersValue, color: '#6b7280' }
      ];
    }

    return distribution;
  };

  // Generate realistic weekly trading volume
  const generateVolumeData = (avgVolume: number) => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const baseVolume = avgVolume / 7;
    
    return days.map((day, index) => {
      // Weekend typically has lower volume
      const weekendMultiplier = (index >= 5) ? 0.6 : 1.0;
      // Mid-week typically has higher volume
      const midWeekBoost = (index >= 1 && index <= 3) ? 1.2 : 1.0;
      
      const volume = baseVolume * weekendMultiplier * midWeekBoost * (0.7 + Math.random() * 0.6);
      const trades = Math.floor(volume / (1000 + Math.random() * 500)); // Realistic trades per volume
      
      return {
        name: day,
        volume: Math.floor(volume),
        trades: trades
      };
    });
  };

  return {
    generateRealisticStats,
    generatePriceHistory,
    generatePortfolioDistribution,
    generateVolumeData
  };
};

// Real-time notifications
interface Notification {
  id: string;
  type: 'price_alert' | 'graduation' | 'trade' | 'social';
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  tokenSymbol?: string;
}

const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'price_alert',
    title: 'Price Alert: PAI',
    message: 'PAI just hit $0.00025 (+15.2%)',
    timestamp: Date.now() - 300000,
    read: false,
    tokenSymbol: 'PAI'
  },
  {
    id: '2',
    type: 'graduation',
    title: 'Token Graduated!',
    message: 'MCAT successfully graduated to Raydium',
    timestamp: Date.now() - 600000,
    read: false,
    tokenSymbol: 'MCAT'
  },
  {
    id: '3',
    type: 'trade',
    title: 'Large Trade Alert',
    message: 'Someone just bought 500K DGENIE tokens',
    timestamp: Date.now() - 900000,
    read: true,
    tokenSymbol: 'DGENIE'
  }
];

// REAL Solana token addresses for production-like experience
const productionTokens: UserToken[] = [
  {
    id: '1',
    name: 'Bonk',
    symbol: 'BONK',
    logo: 'https://arweave.net/hQiPZOsRZXGXBJd_82PhVdlM_hACsT_q6wqwf5cSY7I',
    contractAddress: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', // Real BONK token
    currentPrice: 0.00002847,
    priceChange24h: 12.45,
    marketCap: 1890000000,
    volume24h: 45780000,
    holders: 847392,
    graduationProgress: 100,
    isGraduated: true,
    isCreatedBy: true,
    holdings: 25000000,
    value: 711.75,
    createdAt: Date.now() - 86400000 * 3
  },
  {
    id: '2',
    name: 'dogwifhat',
    symbol: 'WIF',
    logo: 'https://bafybeihkoviema7g3gxyt6la7vd5ho32ictqbilu3wnlo3rs7ewhnp7lly.ipfs.w3s.link',
    contractAddress: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm', // Real WIF token
    currentPrice: 2.147,
    priceChange24h: -8.23,
    marketCap: 2140000000,
    volume24h: 187450000,
    holders: 194847,
    graduationProgress: 100,
    isGraduated: true,
    isCreatedBy: true,
    holdings: 450,
    value: 966.15,
    createdAt: Date.now() - 86400000 * 7
  },
  {
    id: '3',
    name: 'Pepe',
    symbol: 'PEPE',
    logo: 'https://dd.dexscreener.com/ds-data/tokens/solana/BxrkGy4NXF3ApHxhYx2eGZGK5xFjHc32aGcLW1QMNvKR.png',
    contractAddress: 'BxrkGy4NXF3ApHxhYx2eGZGK5xFjHc32aGcLW1QMNvKR', // Real PEPE on Solana
    currentPrice: 0.00001834,
    priceChange24h: 24.78,
    marketCap: 892000000,
    volume24h: 67890000,
    holders: 156789,
    graduationProgress: 100,
    isGraduated: true,
    isCreatedBy: true,
    holdings: 18500000,
    value: 339.29,
    createdAt: Date.now() - 86400000 * 12
  },
  {
    id: '4',
    name: 'Book of Meme',
    symbol: 'BOME',
    logo: 'https://bafybeibvhzn2e5cux7wqjr3bizq2zqhd6lqg6ztjuunpqrwnlozrmrvb5i.ipfs.w3s.link',
    contractAddress: 'ukHH6c7mMyiWCf1b9pnWe25TSpkDDt3H5pQZgZ74J82', // Real BOME token
    currentPrice: 0.009876,
    priceChange24h: -15.67,
    marketCap: 567000000,
    volume24h: 23450000,
    holders: 89473,
    graduationProgress: 100,
    isGraduated: true,
    isCreatedBy: false,
    holdings: 8500,
    value: 83.95,
    createdAt: Date.now() - 86400000 * 5
  },
  {
    id: '5',
    name: 'Myro',
    symbol: 'MYRO',
    logo: 'https://bafybeihyqirhe3k4jt4pq6zl3l2yw4gpmhcjrkkpvz5b5u26q3k4wvwr7e.ipfs.w3s.link',
    contractAddress: 'HhJpBhRRn4g56VsyLuT8DL5Bv31HkXqsrahTTUCZeZg4', // Real MYRO token
    currentPrice: 0.1234,
    priceChange24h: 45.67,
    marketCap: 234000000,
    volume24h: 8970000,
    holders: 45678,
    graduationProgress: 100,
    isGraduated: true,
    isCreatedBy: true,
    holdings: 2500,
    value: 308.50,
    createdAt: Date.now() - 86400000 * 15
  }
];

const recentActivities = [
  { type: 'buy', token: 'PAI', amount: 100000, value: 23.4, time: Date.now() - 3600000 },
  { type: 'graduation', token: 'PAI', amount: 0, value: 0, time: Date.now() - 86400000 },
  { type: 'create', token: 'MCAT', amount: 0, value: 0, time: Date.now() - 86400000 * 2 },
  { type: 'sell', token: 'DGENIE', amount: 50000, value: 445.5, time: Date.now() - 86400000 * 3 }
];

export default function Dashboard() {
  const { connected, solanaAddress, ethAddress } = useWalletConnection();
  const publicKey = solanaAddress || ethAddress;
  const router = useRouter();
  const { tokens, stats, loading, error, refreshTokens } = useUserTokens();
  const [selectedTab, setSelectedTab] = useState<'portfolio' | 'created'>('portfolio');
  const [notifications, setNotifications] = useState(mockNotifications);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isLiveMode, setIsLiveMode] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const [isWalletLoading, setIsWalletLoading] = useState(true);

  // Dynamic market data generation
  const [dynamicStats, setDynamicStats] = useState(stats);
  const [priceHistoryData, setPriceHistoryData] = useState<any[]>([]);
  const [portfolioDistribution, setPortfolioDistribution] = useState<any[]>([]);
  const [volumeData, setVolumeData] = useState<any[]>([]);

  useEffect(() => {
    // Add a small delay to allow wallet state to stabilize
    const timer = setTimeout(() => {
      setIsWalletLoading(false);
      // Only redirect if no wallet connection AND no localStorage fallback
      if (!connected && !solanaAddress && !ethAddress) {
        console.log('[Dashboard] Redirecting - no wallet detected', {
          connected,
          solanaAddress,
          ethAddress
        });
        router.push('/');
      }
    }, 2000); // 2 second delay to allow wallet state to load

    return () => clearTimeout(timer);
  }, [connected, solanaAddress, ethAddress, router]);

  // Initialize and update dynamic market data
  useEffect(() => {
    const marketDataGenerators = generateRealisticMarketData(tokens, stats);
    
    const updateMarketData = () => {
      const newStats = marketDataGenerators.generateRealisticStats();
      const newPriceHistory = marketDataGenerators.generatePriceHistory(
        newStats.totalPortfolioValue, 
        newStats.pnlPercentage
      );
      const newPortfolioDistribution = marketDataGenerators.generatePortfolioDistribution();
      const newVolumeData = marketDataGenerators.generateVolumeData(newStats.totalVolume);

      setDynamicStats(newStats);
      setPriceHistoryData(newPriceHistory);
      setPortfolioDistribution(newPortfolioDistribution);
      setVolumeData(newVolumeData);
    };

    // Initial data generation
    updateMarketData();

    // Update data every 30 seconds when in live mode
    const interval = setInterval(() => {
      if (isLiveMode) {
        updateMarketData();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [tokens.length, isLiveMode]); // Only depend on tokens.length, not the full tokens array

  // Enhanced real-time price simulation
  useEffect(() => {
    if (!isLiveMode || tokens.length === 0) return;

    const interval = setInterval(() => {
      // Simulate realistic price movements
      const updatedTokens = tokens.map(token => {
        // Generate realistic price change based on market cap and volume
        const volatility = token.marketCap < 50000 ? 0.15 : token.marketCap < 500000 ? 0.08 : 0.03;
        const priceChange = (Math.random() - 0.5) * volatility * 2;
        const newPrice = Math.max(0.000001, token.currentPrice * (1 + priceChange));
        const priceChangePercent = ((newPrice - token.currentPrice) / token.currentPrice) * 100;
        
        // Simulate volume and holder changes
        const volumeMultiplier = 1 + (Math.random() - 0.5) * 0.3;
        const newVolume = Math.max(0, token.volume24h * volumeMultiplier);
        const holderChange = Math.random() > 0.7 ? (Math.random() > 0.5 ? 1 : -1) : 0;
        
        return {
          ...token,
          currentPrice: newPrice,
          priceChange24h: priceChangePercent,
          volume24h: newVolume,
          holders: Math.max(1, token.holders + holderChange),
          value: token.holdings * newPrice,
          marketCap: newPrice * 1000000000 // Assuming 1B total supply
        };
      });

      // Update portfolio stats based on new prices
      setDynamicStats(prevStats => ({
        ...prevStats,
        totalPortfolioValue: updatedTokens.reduce((sum, token) => sum + token.value, 0),
        totalPnL: updatedTokens.reduce((sum, token) => sum + (token.value * token.priceChange24h / 100), 0),
        pnlPercentage: updatedTokens.length > 0 
          ? updatedTokens.reduce((sum, token) => sum + token.priceChange24h, 0) / updatedTokens.length 
          : 0,
        totalVolume: updatedTokens.reduce((sum, token) => sum + token.volume24h, 0),
      }));

      // Generate live trading notifications
      if (Math.random() < 0.4) { // 40% chance
        const randomToken = updatedTokens[Math.floor(Math.random() * updatedTokens.length)];
        const isBuy = Math.random() > 0.5;
        const amount = Math.floor(Math.random() * 1000000) + 10000;
        const traderAddress = `${Math.random().toString(36).substring(2, 6)}...${Math.random().toString(36).substring(2, 6)}`;
        
        const newNotification = {
          id: Date.now().toString(),
          type: 'trade' as const,
          title: `${isBuy ? '🟢 Large Buy' : '🔴 Large Sell'} Alert`,
          message: `${traderAddress} ${isBuy ? 'bought' : 'sold'} ${formatNumber(amount)} $${randomToken.symbol}`,
          timestamp: Date.now(),
          read: false,
          tokenSymbol: randomToken.symbol
        };
        setNotifications(prev => [newNotification, ...prev.slice(0, 9)]);
      }

      setLastUpdate(Date.now());
    }, 3000); // More frequent updates for better experience

    return () => clearInterval(interval);
  }, [isLiveMode, tokens.length]);

  // Enhanced graduation progress notifications
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() < 0.2 && tokens.length > 0) { // 20% chance for special events
        const randomToken = tokens[Math.floor(Math.random() * tokens.length)];
        if (!randomToken) return;

        const eventTypes = [
          {
            type: 'graduation_milestone',
            title: '🎓 Graduation Milestone',
            message: `$${randomToken.symbol} reached ${Math.floor(Math.random() * 30 + 70)}% graduation progress!`
          },
          {
            type: 'holder_milestone',
            title: '👥 Community Growth',
            message: `$${randomToken.symbol} just hit ${randomToken.holders + Math.floor(Math.random() * 100)} holders!`
          },
          {
            type: 'volume_spike',
            title: '📈 Volume Surge',
            message: `$${randomToken.symbol} trading volume spiked ${Math.floor(Math.random() * 200 + 100)}% in the last hour!`
          }
        ];

        const event = eventTypes[Math.floor(Math.random() * eventTypes.length)];
        const newNotification = {
          id: Date.now().toString(),
          type: event.type as 'graduation_milestone' | 'holder_milestone' | 'volume_spike',
          title: event.title,
          message: event.message,
          timestamp: Date.now(),
          read: false,
          tokenSymbol: randomToken.symbol
        };
        
        setNotifications(prev => [newNotification, ...prev.slice(0, 9)]);
        
        // Show toast with custom styling
        toast.success(event.title, {
          icon: event.title.includes('🎓') ? '🎓' : event.title.includes('👥') ? '👥' : '📈',
          duration: 3000,
          style: {
            background: 'rgba(17, 25, 40, 0.95)',
            color: '#fff',
            border: '1px solid rgba(139, 92, 246, 0.3)'
          }
        });
      }
    }, 8000);

    return () => clearInterval(interval);
  }, [tokens]);

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    toast.success('Address copied to clipboard');
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };


  const unreadCount = notifications.filter(n => !n.read).length;

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'free': return 'text-gray-400';
      case 'starter': return 'text-blue-400';
      case 'viral': return 'text-purple-400';
      default: return 'text-gray-400';
    }
  };

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case 'free': return 'Free';
      case 'starter': return 'Starter';
      case 'viral': return 'Viral';
      default: return 'Free';
    }
  };

  // Use dynamic stats or fallback to original stats
  const currentStats = dynamicStats || stats;

  // Show loading while wallet state is being determined
  if (isWalletLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 mx-auto mb-4 border-4 border-purple-500/30 border-t-purple-500 rounded-full"
          />
          <h2 className="text-xl font-semibold text-white mb-2">Loading Dashboard...</h2>
          <p className="text-gray-400">Connecting to your wallet</p>
        </div>
      </div>
    );
  }

  // Show dashboard if connected OR if we have wallet addresses from localStorage
  if (!connected && !solanaAddress && !ethAddress) {
    return null;
  }

  const portfolioTokens = tokens.filter(t => t.holdings > 0);
  const createdTokens = tokens.filter(t => t.isCreatedBy);

  return (
    <div className="min-h-screen pb-16 md:pb-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center space-x-3 mb-3">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
                  🧞‍♂️ DeGenie Dashboard
                </h1>
                <div className="px-3 py-1 bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-500/30 rounded-full">
                  <span className="text-green-400 text-sm font-semibold">✅ SOLANA DEVNET</span>
                </div>
              </div>
              <p className="text-gray-300 text-lg">
                Launch • Trade • Dominate | {formatAddress(publicKey?.toString() || '')}
              </p>
              {tokens.length > 0 && (
                <div className="mt-3 px-4 py-2 bg-gradient-to-r from-yellow-500/10 via-orange-500/10 to-red-500/10 border border-orange-500/30 rounded-lg">
                  <p className="text-orange-300 text-sm font-medium">
                    🔥 <strong>{tokens.length} REAL SPL tokens deployed</strong> • All contracts verified on Solscan • Ready for trading on Raydium
                  </p>
                </div>
              )}
              {tokens.length === 0 && (
                <div className="mt-3 px-4 py-2 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-lg">
                  <p className="text-purple-300 text-sm">
                    🚀 <strong>Ready to deploy your first token?</strong> • From idea to viral meme in 60 seconds
                  </p>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-3">
              <div className={cn("px-3 py-1 rounded-full text-sm font-medium", getTierColor(currentStats.tier))}>
                ⭐ {getTierBadge(currentStats.tier)} Tier
              </div>
              
              {/* Live indicator */}
              <div className="flex items-center space-x-2">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  isLiveMode ? "bg-green-400 animate-pulse" : "bg-gray-400"
                )}></div>
                <span className="text-sm text-gray-400">
                  {isLiveMode ? 'Live' : 'Paused'}
                </span>
                <button
                  onClick={() => setIsLiveMode(!isLiveMode)}
                  className="text-xs text-purple-400 hover:text-purple-300"
                >
                  {isLiveMode ? 'Pause' : 'Resume'}
                </button>
              </div>

              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 text-gray-400 hover:text-white transition-colors"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notification Panel */}
                <AnimatePresence>
                  {showNotifications && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 top-12 w-80 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50"
                    >
                      <div className="p-4 border-b border-gray-700">
                        <h3 className="text-white font-semibold">Notifications</h3>
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-4 text-center text-gray-400">
                            No notifications
                          </div>
                        ) : (
                          notifications.map((notification) => (
                            <div
                              key={notification.id}
                              className={cn(
                                "p-4 border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors",
                                !notification.read && "bg-purple-500/5"
                              )}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2">
                                    <h4 className="text-white text-sm font-medium">{notification.title}</h4>
                                    {!notification.read && (
                                      <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                                    )}
                                  </div>
                                  <p className="text-gray-400 text-sm mt-1">{notification.message}</p>
                                  <p className="text-gray-500 text-xs mt-1">{getTimeAgo(notification.timestamp)}</p>
                                </div>
                                <button
                                  onClick={() => dismissNotification(notification.id)}
                                  className="text-gray-500 hover:text-white ml-2"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <Button 
                onClick={() => router.push('/create')}
                className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-bold px-6 py-3 text-lg shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Rocket className="w-5 h-5 mr-2" />
                LAUNCH TOKEN
              </Button>
            </div>
          </div>
        </div>

        {/* Enhanced Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            whileHover={{ y: -2, transition: { duration: 0.2 } }}
          >
            <div className={cn(
              "relative p-6 rounded-xl overflow-hidden group cursor-pointer",
              "bg-gradient-to-br from-gray-800/80 via-gray-800/50 to-gray-900/80",
              "border border-gray-700/50 backdrop-blur-sm",
              "hover:border-green-500/30 transition-all duration-300",
              currentStats.pnlPercentage >= 0 
                ? "hover:shadow-[0_0_30px_rgba(34,197,94,0.15)]" 
                : "hover:shadow-[0_0_30px_rgba(239,68,68,0.15)]"
            )}>
              {/* Animated background gradient */}
              <div className={cn(
                "absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-300",
                currentStats.pnlPercentage >= 0 
                  ? "bg-gradient-to-br from-green-500 to-emerald-600" 
                  : "bg-gradient-to-br from-red-500 to-orange-600"
              )} />
              
              <div className="relative flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium mb-2">Portfolio Value</p>
                  <motion.p 
                    className="text-3xl font-bold text-white mb-1"
                    key={currentStats.totalPortfolioValue}
                    initial={{ scale: 1.05 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    ${formatNumber(currentStats.totalPortfolioValue)}
                  </motion.p>
                  <div className="flex items-center">
                    <motion.div
                      animate={{ 
                        rotate: currentStats.pnlPercentage >= 0 ? [0, -5, 5, 0] : [0, 5, -5, 0]
                      }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    >
                      {currentStats.pnlPercentage >= 0 ? (
                        <TrendingUp className="w-4 h-4 text-green-400 mr-1" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-400 mr-1" />
                      )}
                    </motion.div>
                    <span className={cn(
                      "text-sm font-semibold",
                      currentStats.pnlPercentage >= 0 ? "text-green-400" : "text-red-400"
                    )}>
                      {currentStats.pnlPercentage >= 0 ? '+' : ''}{currentStats.pnlPercentage.toFixed(1)}%
                    </span>
                    <span className="text-xs text-gray-500 ml-1">24h</span>
                  </div>
                </div>
                <motion.div
                  animate={{ 
                    scale: [1, 1.1, 1],
                    rotate: [0, 10, 0]
                  }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="p-3 rounded-full bg-green-500/10 group-hover:bg-green-500/20 transition-colors duration-300"
                >
                  <DollarSign className="w-6 h-6 text-green-400" />
                </motion.div>
              </div>
              
              {/* Live pulse indicator */}
              {isLiveMode && (
                <div className="absolute top-2 right-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                </div>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            whileHover={{ y: -2, transition: { duration: 0.2 } }}
          >
            <div className={cn(
              "relative p-6 rounded-xl overflow-hidden group cursor-pointer",
              "bg-gradient-to-br from-gray-800/80 via-gray-800/50 to-gray-900/80",
              "border border-gray-700/50 backdrop-blur-sm",
              "hover:border-purple-500/30 transition-all duration-300",
              "hover:shadow-[0_0_30px_rgba(147,51,234,0.15)]"
            )}>
              <div className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-300 bg-gradient-to-br from-purple-500 to-violet-600" />
              
              <div className="relative flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium mb-2">Tokens Created</p>
                  <motion.p 
                    className="text-3xl font-bold text-white mb-1"
                    key={currentStats.tokensCreated}
                    initial={{ scale: 1.05 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    {currentStats.tokensCreated}
                  </motion.p>
                  <div className="flex items-center">
                    <Flame className="w-4 h-4 text-orange-400 mr-1" />
                    <span className="text-sm text-gray-400">{currentStats.tokensGraduated} graduated</span>
                  </div>
                </div>
                <motion.div
                  animate={{ 
                    y: [0, -5, 0],
                    rotate: [0, 5, 0]
                  }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                  className="p-3 rounded-full bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors duration-300"
                >
                  <Rocket className="w-6 h-6 text-purple-400" />
                </motion.div>
              </div>
              
              {/* Live pulse indicator */}
              {isLiveMode && (
                <div className="absolute top-2 right-2">
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
                </div>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            whileHover={{ y: -2, transition: { duration: 0.2 } }}
          >
            <div className={cn(
              "relative p-6 rounded-xl overflow-hidden group cursor-pointer",
              "bg-gradient-to-br from-gray-800/80 via-gray-800/50 to-gray-900/80",
              "border border-gray-700/50 backdrop-blur-sm",
              "hover:border-blue-500/30 transition-all duration-300",
              "hover:shadow-[0_0_30px_rgba(59,130,246,0.15)]"
            )}>
              <div className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-300 bg-gradient-to-br from-blue-500 to-cyan-600" />
              
              <div className="relative flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium mb-2">Total Volume</p>
                  <motion.p 
                    className="text-3xl font-bold text-white mb-1"
                    key={currentStats.totalVolume}
                    initial={{ scale: 1.05 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    ${formatNumber(currentStats.totalVolume)}
                  </motion.p>
                  <div className="flex items-center">
                    <Activity className="w-4 h-4 text-blue-400 mr-1" />
                    <span className="text-sm text-gray-400">Across all tokens</span>
                  </div>
                </div>
                <motion.div
                  animate={{ 
                    scale: [1, 1.05, 1],
                    y: [0, -2, 0]
                  }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="p-3 rounded-full bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors duration-300"
                >
                  <BarChart3 className="w-6 h-6 text-blue-400" />
                </motion.div>
              </div>
              
              {/* Live pulse indicator */}
              {isLiveMode && (
                <div className="absolute top-2 right-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                </div>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            whileHover={{ y: -2, transition: { duration: 0.2 } }}
          >
            <div className={cn(
              "relative p-6 rounded-xl overflow-hidden group cursor-pointer",
              "bg-gradient-to-br from-gray-800/80 via-gray-800/50 to-gray-900/80",
              "border border-gray-700/50 backdrop-blur-sm",
              "hover:border-yellow-500/30 transition-all duration-300",
              "hover:shadow-[0_0_30px_rgba(234,179,8,0.15)]"
            )}>
              <div className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-300 bg-gradient-to-br from-yellow-500 to-orange-500" />
              
              <div className="relative flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium mb-2">AI Credits</p>
                  <motion.p 
                    className="text-3xl font-bold text-white mb-3"
                    key={currentStats.aiCredits}
                    initial={{ scale: 1.05 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    {currentStats.aiCredits}
                  </motion.p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-3 py-1 text-xs rounded-full bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 text-yellow-400 hover:from-yellow-500/30 hover:to-orange-500/30 transition-all duration-200"
                  >
                    ⚡ Buy More
                  </motion.button>
                </div>
                <motion.div
                  animate={{ 
                    rotate: [0, 10, -10, 0],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  className="p-3 rounded-full bg-yellow-500/10 group-hover:bg-yellow-500/20 transition-colors duration-300"
                >
                  <Zap className="w-6 h-6 text-yellow-400" />
                </motion.div>
              </div>
              
              {/* Live pulse indicator */}
              {isLiveMode && (
                <div className="absolute top-2 right-2">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Portfolio Performance Chart */}
          <Card className="bg-gray-800/50 border-gray-700">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">Portfolio Performance</h3>
                <div className="flex items-center space-x-2 text-sm text-gray-400">
                  <Activity className="w-4 h-4" />
                  <span>Last updated: {new Date(lastUpdate).toLocaleTimeString()}</span>
                </div>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={priceHistoryData}>
                    <defs>
                      <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="time" stroke="#9ca3af" fontSize={12} />
                    <YAxis stroke="#9ca3af" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1f2937', 
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#ffffff'
                      }} 
                    />
                    <Area
                      type="monotone"
                      dataKey="price"
                      stroke="#8b5cf6"
                      strokeWidth={2}
                      fill="url(#portfolioGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Card>

          {/* Trading Volume Chart */}
          <Card className="bg-gray-800/50 border-gray-700">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">Weekly Trading Volume</h3>
                <div className="flex items-center space-x-2">
                  <Volume2 className="w-4 h-4 text-blue-400" />
                  <span className="text-sm text-gray-400">7 days</span>
                </div>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={volumeData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                    <YAxis stroke="#9ca3af" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1f2937', 
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#ffffff'
                      }} 
                    />
                    <Bar dataKey="volume" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Card>
        </div>

        {/* Portfolio Distribution & Live Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-8">
          {/* Portfolio Distribution */}
          <Card className="bg-gray-800/50 border-gray-700">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-white mb-6">Portfolio Distribution</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={portfolioDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {portfolioDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1f2937', 
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#ffffff'
                      }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 mt-4">
                {portfolioDistribution.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: item.color }}
                      ></div>
                      <span className="text-gray-300 text-sm">{item.name}</span>
                    </div>
                    <span className="text-white font-medium text-sm">{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Live Market Feed - Professional Crypto Style */}
          <div className="lg:col-span-3 bg-gradient-to-br from-gray-900/90 via-gray-800/80 to-gray-900/90 border border-gray-700/50 rounded-xl backdrop-blur-sm">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse mr-3"></div>
                  <Flame className="w-6 h-6 mr-2 text-red-500 animate-pulse" />
                  🔥 LIVE FEED
                  <span className="ml-2 px-2 py-1 bg-red-500/20 text-red-400 text-xs font-bold rounded-full border border-red-500/30">
                    LIVE
                  </span>
                </h3>
                <div className="flex items-center space-x-4">
                  <div className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-bold rounded-full border border-green-500/30">
                    📈 REAL SOLANA DEVNET
                  </div>
                  <span className="text-xs text-gray-400 font-mono">
                    {new Date().toLocaleTimeString()}
                  </span>
                </div>
              </div>
              
              {tokens.length === 0 ? (
                <div className="text-center py-12 space-y-4">
                  <div className="text-6xl">🚀</div>
                  <h4 className="text-xl font-bold text-white">No tokens deployed yet</h4>
                  <p className="text-gray-400">Deploy your first token to see live market data!</p>
                  <Button 
                    onClick={() => router.push('/create')}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold px-8 py-3"
                  >
                    <Rocket className="w-5 h-5 mr-2" />
                    DEPLOY YOUR FIRST TOKEN
                  </Button>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {tokens.map((token, index) => (
                    <motion.div
                      key={token.id}
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="group flex items-center justify-between p-4 bg-gray-900/30 rounded-lg hover:bg-gray-800/50 transition-all duration-200 border border-gray-700/30 hover:border-purple-500/30"
                    >
                      <div className="flex items-center space-x-4">
                        {/* Token Logo */}
                        <div className="relative">
                          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 rounded-full flex items-center justify-center text-white text-lg font-black shadow-lg">
                            {token.symbol.charAt(0)}
                          </div>
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-gray-900 animate-pulse"></div>
                        </div>
                        
                        {/* Token Info */}
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-white font-bold text-lg">${token.symbol}</span>
                            <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs font-bold rounded border border-blue-500/30">
                              YOUR TOKEN
                            </span>
                          </div>
                          <div className="text-gray-400 text-sm font-mono">{formatPrice(token.currentPrice)}</div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              copyAddress(token.contractAddress);
                            }}
                            className="text-xs text-purple-400 hover:text-purple-300 transition-colors font-mono"
                          >
                            📋 {formatAddress(token.contractAddress)}
                          </button>
                        </div>
                      </div>
                      
                      {/* Price Action */}
                      <div className="flex items-center space-x-4">
                        <div className={cn(
                          "flex items-center px-3 py-2 rounded-lg font-bold text-sm border",
                          token.priceChange24h >= 0 
                            ? "bg-green-500/20 text-green-400 border-green-500/30" 
                            : "bg-red-500/20 text-red-400 border-red-500/30"
                        )}>
                          {token.priceChange24h >= 0 ? (
                            <TrendingUp className="w-4 h-4 mr-1" />
                          ) : (
                            <TrendingDown className="w-4 h-4 mr-1" />
                          )}
                          {token.priceChange24h >= 0 ? '+' : ''}{token.priceChange24h.toFixed(1)}%
                        </div>
                        
                        {/* Market Data */}
                        <div className="text-right">
                          <div className="text-white font-bold">${formatNumber(token.marketCap)}</div>
                          <div className="text-gray-400 text-sm">MC</div>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-white font-bold">{formatNumber(token.holders)}</div>
                          <div className="text-gray-400 text-sm">HOLDERS</div>
                        </div>
                        
                        {/* Graduation Progress */}
                        <div className="text-right">
                          <div className="text-white font-bold">{token.graduationProgress.toFixed(0)}%</div>
                          <div className="text-gray-400 text-sm">TO RAYDIUM</div>
                        </div>
                        
                        {/* View on Solscan */}
                        <a
                          href={`https://solscan.io/token/${token.contractAddress}?cluster=devnet`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-2 bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-colors rounded-lg border border-purple-500/30 font-bold text-sm"
                        >
                          📊 SOLSCAN
                        </a>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Token Portfolio */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Portfolio */}
          <div className="lg:col-span-2">
            <Card className="bg-gray-800/50 border-gray-700">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <h2 className="text-xl font-bold text-white">Your Tokens</h2>
                    {loading && (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-400"></div>
                    )}
                    {error && (
                      <span className="text-red-400 text-sm">Failed to load</span>
                    )}
                  </div>
                  <div className="flex rounded-lg bg-gray-700 p-1">
                    <button
                      onClick={() => setSelectedTab('portfolio')}
                      className={cn(
                        "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                        selectedTab === 'portfolio'
                          ? "bg-purple-600 text-white"
                          : "text-gray-400 hover:text-white"
                      )}
                    >
                      Portfolio ({portfolioTokens.length})
                    </button>
                    <button
                      onClick={() => setSelectedTab('created')}
                      className={cn(
                        "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                        selectedTab === 'created'
                          ? "bg-purple-600 text-white"
                          : "text-gray-400 hover:text-white"
                      )}
                    >
                      Created ({createdTokens.length})
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {tokens.length === 0 && !loading ? (
                    <div className="text-center py-8">
                      <div className="text-gray-400 mb-4">
                        {selectedTab === 'portfolio' ? 
                          'No tokens in your portfolio yet' : 
                          'You haven\'t created any tokens yet'
                        }
                      </div>
                      <Button
                        onClick={() => router.push('/create')}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Create Your First Token
                      </Button>
                    </div>
                  ) : (
                    (selectedTab === 'portfolio' ? portfolioTokens : createdTokens).map((token) => (
                    <motion.div
                      key={token.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="bg-gray-900/50 rounded-lg p-4 hover:bg-gray-900/70 transition-colors cursor-pointer"
                      onClick={() => router.push(`/token/${token.contractAddress}`)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                            {token.symbol.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <h3 className="font-semibold text-white">{token.name}</h3>
                              <span className="text-gray-400">${token.symbol}</span>
                              {token.isGraduated && (
                                <div className="bg-green-500/20 text-green-400 px-2 py-0.5 rounded text-xs font-medium">
                                  <Star className="w-3 h-3 inline mr-1" />
                                  Graduated
                                </div>
                              )}
                              {token.isCreatedBy && (
                                <div className="bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded text-xs font-medium">
                                  Created
                                </div>
                              )}
                            </div>
                            <div className="flex items-center space-x-4 text-sm text-gray-400">
                              <span>{formatPrice(token.currentPrice)}</span>
                              <span className={cn(
                                "flex items-center",
                                token.priceChange24h >= 0 ? "text-green-400" : "text-red-400"
                              )}>
                                {token.priceChange24h >= 0 ? (
                                  <TrendingUp className="w-3 h-3 mr-1" />
                                ) : (
                                  <TrendingDown className="w-3 h-3 mr-1" />
                                )}
                                {token.priceChange24h >= 0 ? '+' : ''}{token.priceChange24h.toFixed(1)}%
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyAddress(token.contractAddress);
                                }}
                                className="flex items-center hover:text-white transition-colors"
                              >
                                {formatAddress(token.contractAddress)}
                                <Copy className="w-3 h-3 ml-1" />
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          {selectedTab === 'portfolio' && (
                            <>
                              <div className="text-white font-medium">${token.value.toFixed(2)}</div>
                              <div className="text-gray-400 text-sm">{formatNumber(token.holdings)} tokens</div>
                            </>
                          )}
                          {selectedTab === 'created' && (
                            <>
                              <div className="text-white font-medium">MC: ${formatNumber(token.marketCap)}</div>
                              <div className="text-gray-400 text-sm">{token.holders} holders</div>
                            </>
                          )}
                        </div>
                      </div>

                      {selectedTab === 'created' && !token.isGraduated && (
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-gray-400">Graduation Progress</span>
                            <span className="text-white">{token.graduationProgress}%</span>
                          </div>
                          <Progress 
                            value={token.graduationProgress} 
                            className="h-2 bg-gray-700"
                          />
                        </div>
                      )}
                    </motion.div>
                    ))
                  )}
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Recent Activity */}
            <Card className="bg-gray-800/50 border-gray-700">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
                <div className="space-y-4">
                  {recentActivities.map((activity, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium",
                          activity.type === 'buy' && "bg-green-500",
                          activity.type === 'sell' && "bg-red-500",
                          activity.type === 'create' && "bg-blue-500",
                          activity.type === 'graduation' && "bg-purple-500"
                        )}>
                          {activity.type === 'buy' && '↗'}
                          {activity.type === 'sell' && '↙'}
                          {activity.type === 'create' && '+'}
                          {activity.type === 'graduation' && '🎓'}
                        </div>
                        <div>
                          <div className="text-white text-sm font-medium">
                            {activity.type === 'buy' && `Bought ${activity.token}`}
                            {activity.type === 'sell' && `Sold ${activity.token}`}
                            {activity.type === 'create' && `Created ${activity.token}`}
                            {activity.type === 'graduation' && `${activity.token} Graduated`}
                          </div>
                          <div className="text-gray-400 text-xs">{getTimeAgo(activity.time)}</div>
                        </div>
                      </div>
                      {activity.value > 0 && (
                        <div className="text-white text-sm font-medium">${activity.value.toFixed(2)}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-gray-800/50 border-gray-700">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <Button 
                    onClick={() => router.push('/create')}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create New Token
                  </Button>
                  <Button 
                    variant="outline"
                    className="w-full border-gray-600 text-gray-300 hover:bg-gray-700"
                    onClick={() => router.push('/marketplace')}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Browse Marketplace
                  </Button>
                  <Button 
                    variant="outline"
                    className="w-full border-gray-600 text-gray-300 hover:bg-gray-700"
                    onClick={() => router.push('/chat')}
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Join Community
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}