'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useWalletConnection } from '@/hooks/useWalletConnection';
import { useWebSocket } from '@/hooks/useWebSocket';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  Heart, 
  Share2, 
  ExternalLink,
  Twitter,
  Globe,
  MessageCircle,
  Users,
  Activity,
  Filter,
  Search,
  ChevronDown,
  Star,
  StarOff
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Progress } from '@/components/ui/Progress';
import { cn, formatNumber, formatPrice, formatAddress, getTimeAgo } from '@/lib/utils';
import { apiService } from '@/lib/api';
import { TradingViewChart } from '@/components/TradingViewChart';
import { EnhancedTradingInterface } from '@/components/EnhancedTradingInterface';
import { CommentsSection } from '@/components/CommentsSection';
import { TradesTable } from '@/components/TradesTable';
import { HoldersTable } from '@/components/HoldersTable';
import toast from 'react-hot-toast';
import { cleanupLocalStorage } from '@/utils/storageCleanup';

interface TokenData {
  address: string;
  name: string;
  symbol: string;
  description: string;
  logoUrl?: string;
  website?: string;
  twitter?: string;
  telegram?: string;
  creator: string;
  createdAt: number;
  totalSupply: number;
  currentPrice: number;
  marketCap: number;
  volume24h: number;
  priceChange24h: number;
  holdersCount: number;
  bondingCurveProgress: number;
  graduationThreshold: number;
  liquidityCollected: number;
  isGraduated: boolean;
  isWatchlisted?: boolean;
}

interface Trade {
  id: string;
  type: 'buy' | 'sell';
  account: string;
  solAmount: number;
  tokenAmount: number;
  price: number;
  timestamp: number;
  signature: string;
}

interface Holder {
  address: string;
  balance: number;
  percentage: number;
  firstBuy: number;
}

interface Comment {
  id: string;
  author: string;
  content: string;
  timestamp: number;
  replies?: Comment[];
  likes: number;
  isLiked?: boolean;
}

export default function TokenPage() {
  const params = useParams();
  const { connected, publicKey } = useWalletConnection();
  const { 
    subscribeToToken, 
    unsubscribeFromToken, 
    onTradeUpdate, 
    onPriceUpdate,
    onGraduation,
    connected: wsConnected 
  } = useWebSocket();
  
  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [holders, setHolders] = useState<Holder[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'trades' | 'comments' | 'holders'>('comments');
  const [tradesFilter, setTradesFilter] = useState<'all' | 'following' | 'own'>('all');
  const [minTradeSize, setMinTradeSize] = useState<number>(0.05);

  const tokenAddress = params.address as string;

  useEffect(() => {
    if (tokenAddress) {
      // Clean localStorage to prevent quota issues
      cleanupLocalStorage();
      
      loadTokenData();
      loadTrades();
      loadHolders();
      loadComments();
      
      // Subscribe to WebSocket updates
      if (wsConnected) {
        subscribeToToken(tokenAddress);
      }
    }
    
    // Cleanup
    return () => {
      if (tokenAddress && wsConnected) {
        unsubscribeFromToken(tokenAddress);
      }
    };
  }, [tokenAddress, wsConnected]);
  
  // Listen for trade updates
  useEffect(() => {
    if (!wsConnected) return;
    
    const cleanup = onTradeUpdate((update) => {
      if (update.tokenAddress === tokenAddress) {
        // Add new trade to the beginning of the list
        setTrades(prev => [update.trade, ...prev]);
        
        // Update token data with new price if available
        if (update.newPrice && tokenData) {
          setTokenData(prev => prev ? {
            ...prev,
            currentPrice: update.newPrice,
            bondingCurveProgress: update.graduationProgress
          } : null);
        }
        
        // Chart will update automatically via its own interval - no forced re-render needed
        
        // Show toast for large trades
        if (update.trade.solAmount >= 1) {
          toast.success(
            `Big ${update.trade.type}! ${formatNumber(update.trade.tokenAmount)} ${tokenData?.symbol} for ${formatPrice(update.trade.solAmount)}`,
            { duration: 5000 }
          );
        }
      }
    });
    
    return cleanup;
  }, [wsConnected, tokenAddress, tokenData?.symbol]);
  
  // Listen for price updates
  useEffect(() => {
    if (!wsConnected) return;
    
    const cleanup = onPriceUpdate((update) => {
      if (update.tokenAddress === tokenAddress) {
        setTokenData(prev => prev ? {
          ...prev,
          currentPrice: update.price,
          priceChange24h: update.priceChange24h,
          volume24h: update.volume24h,
          marketCap: update.marketCap,
          bondingCurveProgress: update.bondingCurveProgress
        } : null);
      }
    });
    
    return cleanup;
  }, [wsConnected, tokenAddress]);
  
  // Listen for graduation events
  useEffect(() => {
    if (!wsConnected) return;
    
    const cleanup = onGraduation((event) => {
      if (event.tokenAddress === tokenAddress) {
        setTokenData(prev => prev ? {
          ...prev,
          isGraduated: true,
          bondingCurveProgress: 100
        } : null);
        
        toast.success(
          `🎓 ${tokenData?.name} has graduated! Liquidity: ${formatPrice(event.totalLiquidity)}`,
          { duration: 10000 }
        );
      }
    });
    
    return cleanup;
  }, [wsConnected, tokenAddress, tokenData?.name]);

  const loadTokenData = async () => {
    try {
      const response = await apiService.getTokenInfo(tokenAddress);
      if (response.data) {
        setTokenData(response.data);
      }
    } catch (error) {
      console.error('Error loading token data:', error);
      toast.error('Failed to load token data');
    } finally {
      setLoading(false);
    }
  };

  const loadTrades = async () => {
    try {
      const response = await apiService.getTokenTrades(tokenAddress);
      if (response.data) {
        setTrades(response.data);
      }
    } catch (error) {
      console.error('Error loading trades:', error);
    }
  };

  const loadHolders = async () => {
    try {
      const response = await apiService.getTokenHolders(tokenAddress);
      if (response.data) {
        setHolders(response.data);
      }
    } catch (error) {
      console.error('Error loading holders:', error);
    }
  };

  const loadComments = async () => {
    try {
      const response = await apiService.getTokenComments(tokenAddress);
      if (response.data) {
        setComments(response.data);
      }
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  const toggleWatchlist = async () => {
    if (!connected) {
      toast.error('Connect wallet to add to watchlist');
      return;
    }
    
    try {
      const newStatus = !tokenData?.isWatchlisted;
      await apiService.toggleWatchlist(tokenAddress, newStatus);
      
      setTokenData(prev => prev ? { ...prev, isWatchlisted: newStatus } : null);
      toast.success(newStatus ? 'Added to watchlist' : 'Removed from watchlist');
    } catch (error) {
      toast.error('Failed to update watchlist');
    }
  };

  const filteredTrades = trades.filter(trade => {
    if (tradesFilter === 'own' && connected) {
      return trade.account === publicKey?.toString();
    }
    if (tradesFilter === 'following') {
      // TODO: Implement following logic
      return false;
    }
    return trade.solAmount >= minTradeSize;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500 mx-auto"></div>
          <p className="text-gray-400 mt-4">Loading token data...</p>
        </div>
      </div>
    );
  }

  if (!tokenData) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Token Not Found</h1>
          <p className="text-gray-400">The token you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-6">
        {/* Enhanced Header Section */}
        <div className="mb-6">
          <div className="flex items-start justify-between mb-8">
            <div className="flex items-center space-x-6">
              {tokenData.logoUrl && (
                <div className="relative">
                  <img 
                    src={tokenData.logoUrl} 
                    alt={tokenData.name}
                    className="w-20 h-20 rounded-full bg-gray-800 border-2 border-green-500/30 shadow-lg shadow-green-500/20"
                  />
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  </div>
                </div>
              )}
              <div className="space-y-1">
                <h1 className="text-4xl font-black tracking-tight">{tokenData.name}</h1>
                <p className="text-2xl text-green-400 font-bold">${tokenData.symbol}</p>
                <p className="text-sm text-gray-400">
                  By {formatAddress(tokenData.creator)} • {getTimeAgo(tokenData.createdAt)}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button
                onClick={toggleWatchlist}
                variant="outline"
                size="sm"
                className="border-gray-600"
              >
                {tokenData.isWatchlisted ? (
                  <Star className="w-4 h-4 mr-2 fill-yellow-400 text-yellow-400" />
                ) : (
                  <StarOff className="w-4 h-4 mr-2" />
                )}
                Watchlist
              </Button>
              
              <Button variant="outline" size="sm" className="border-gray-600">
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
              
              {/* Social Links */}
              <div className="flex space-x-2">
                {tokenData.website && (
                  <a 
                    href={tokenData.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <Globe className="w-4 h-4" />
                  </a>
                )}
                {tokenData.twitter && (
                  <a 
                    href={tokenData.twitter} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <Twitter className="w-4 h-4" />
                  </a>
                )}
                {tokenData.telegram && (
                  <a 
                    href={tokenData.telegram} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Enhanced Token Stats */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-8">
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-4 border border-gray-700/50 hover:border-green-500/30 transition-colors">
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Price</p>
              <div className="flex items-center">
                <p className="text-xl font-black text-white">{formatPrice(tokenData.currentPrice)}</p>
                <div className={cn(
                  "flex items-center ml-2 text-sm font-bold",
                  tokenData.priceChange24h >= 0 ? "text-green-400" : "text-red-400"
                )}>
                  {tokenData.priceChange24h >= 0 ? (
                    <TrendingUp className="w-4 h-4 mr-1" />
                  ) : (
                    <TrendingDown className="w-4 h-4 mr-1" />
                  )}
                  {Math.abs(tokenData.priceChange24h).toFixed(2)}%
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-4 border border-gray-700/50 hover:border-purple-500/30 transition-colors">
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Market Cap</p>
              <p className="text-xl font-black text-purple-400">{formatPrice(tokenData.marketCap)}</p>
            </div>
            
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-4 border border-gray-700/50 hover:border-blue-500/30 transition-colors">
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Volume 24H</p>
              <p className="text-xl font-black text-blue-400">{formatPrice(tokenData.volume24h)}</p>
            </div>
            
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-4 border border-gray-700/50 hover:border-yellow-500/30 transition-colors">
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Holders</p>
              <p className="text-xl font-black text-yellow-400">{formatNumber(tokenData.holdersCount)}</p>
            </div>
            
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-4 border border-gray-700/50 hover:border-pink-500/30 transition-colors">
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Total Supply</p>
              <p className="text-xl font-black text-pink-400">{formatNumber(tokenData.totalSupply)}</p>
            </div>
            
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-4 border border-gray-700/50 hover:border-orange-500/30 transition-colors">
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Contract</p>
              <div className="flex items-center">
                <p className="text-sm font-mono text-orange-400">{formatAddress(tokenData.address)}</p>
                <ExternalLink className="w-4 h-4 ml-2 cursor-pointer text-orange-400 hover:text-orange-300" />
              </div>
            </div>
          </div>

          {/* Bonding Curve Progress */}
          {!tokenData.isGraduated && (
            <Card className="p-6 bg-gradient-to-r from-purple-900/20 to-pink-900/20 border-purple-500/30 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Bonding Curve Progress</h3>
                <div className="text-right">
                  <div className="text-sm text-gray-400">
                    {formatPrice(tokenData.liquidityCollected)} / {formatPrice(tokenData.graduationThreshold)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {((tokenData.liquidityCollected / tokenData.graduationThreshold) * 100).toFixed(1)}% to graduation
                  </div>
                </div>
              </div>
              <Progress 
                value={(tokenData.liquidityCollected / tokenData.graduationThreshold) * 100}
                className="h-3"
              />
              <p className="text-sm text-gray-400 mt-2">
                When the market cap reaches {formatPrice(tokenData.graduationThreshold)}, 
                liquidity will be deposited to Raydium and burned.
              </p>
            </Card>
          )}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Column - Chart & Activity */}
          <div className="lg:col-span-3 space-y-6">
            {/* TradingView Chart - Real trades only, no fake data */}
            <TradingViewChart 
              tokenAddress={tokenAddress} 
              symbol={tokenData.symbol}
              className="border border-gray-800/50"
            />

            {/* Enhanced Activity Tabs */}
            <Card className="p-6 bg-gradient-to-br from-gray-900/50 to-gray-800/50 border border-gray-700/50">
              <div className="flex items-center justify-between mb-6">
                <div className="flex space-x-1">
                  <Button
                    onClick={() => setActiveTab('comments')}
                    variant={activeTab === 'comments' ? 'default' : 'outline'}
                    size="sm"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Comments ({comments.length})
                  </Button>
                  <Button
                    onClick={() => setActiveTab('trades')}
                    variant={activeTab === 'trades' ? 'default' : 'outline'}
                    size="sm"
                  >
                    <Activity className="w-4 h-4 mr-2" />
                    Trades ({filteredTrades.length})
                  </Button>
                  <Button
                    onClick={() => setActiveTab('holders')}
                    variant={activeTab === 'holders' ? 'default' : 'outline'}
                    size="sm"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Holders ({holders.length})
                  </Button>
                </div>

                {/* Filters for Trades Tab */}
                {activeTab === 'trades' && (
                  <div className="flex items-center space-x-2">
                    <select
                      value={tradesFilter}
                      onChange={(e) => setTradesFilter(e.target.value as 'all' | 'following' | 'own')}
                      className="bg-gray-800 border border-gray-600 rounded px-3 py-1 text-sm"
                    >
                      <option value="all">All Trades</option>
                      <option value="following">Following</option>
                      <option value="own">My Trades</option>
                    </select>
                    <Input
                      type="number"
                      placeholder="Min SOL"
                      value={minTradeSize}
                      onChange={(e) => setMinTradeSize(Number(e.target.value) || 0)}
                      className="w-20 h-8 text-sm bg-gray-800 border-gray-600"
                      step="0.01"
                      min="0"
                    />
                  </div>
                )}
              </div>

              {/* Tab Content */}
              {activeTab === 'comments' && (
                <CommentsSection 
                  comments={comments}
                  tokenAddress={tokenAddress}
                  onCommentAdd={(comment) => setComments(prev => [comment, ...prev])}
                />
              )}
              
              {activeTab === 'trades' && (
                <TradesTable 
                  trades={filteredTrades}
                  loading={false}
                />
              )}
              
              {activeTab === 'holders' && (
                <HoldersTable 
                  holders={holders}
                  totalSupply={tokenData.totalSupply}
                />
              )}
            </Card>
          </div>

          {/* Right Column - Trading Interface */}
          <div className="space-y-6">
            <EnhancedTradingInterface 
              tokenData={tokenData}
              onTradeComplete={() => {
                console.log('🔄 Trade completed, refreshing data...');
                loadTokenData();
                loadTrades();
                loadHolders();
                // Chart will update automatically via WebSocket
              }}
            />

            {/* Enhanced Token Description */}
            {tokenData.description && (
              <Card className="p-6 bg-gradient-to-br from-gray-900/50 to-gray-800/50 border border-gray-700/50">
                <h3 className="text-xl font-black mb-4 text-white">About {tokenData.name}</h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  {tokenData.description}
                </p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}