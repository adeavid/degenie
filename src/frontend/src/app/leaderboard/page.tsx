'use client';

import { useState } from 'react';

// Force this page to be client-side only
export const dynamic = 'force-dynamic';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Trophy,
  Medal,
  Crown,
  TrendingUp,
  TrendingDown,
  Users,
  BarChart3,
  Zap,
  Star,
  Flame,
  Target,
  DollarSign,
  Eye,
  Copy,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Progress } from '@/components/ui/Progress';
import { formatNumber, formatPrice, formatAddress, getTimeAgo } from '@/lib/utils';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

interface LeaderboardToken {
  rank: number;
  id: string;
  name: string;
  symbol: string;
  logo?: string;
  contractAddress: string;
  creator: {
    address: string;
    username?: string;
    tier: 'free' | 'starter' | 'viral';
  };
  currentPrice: number;
  priceChange24h: number;
  priceChange7d: number;
  marketCap: number;
  volume24h: number;
  volume7d: number;
  holders: number;
  graduationProgress: number;
  isGraduated: boolean;
  createdAt: number;
  viralityScore: number;
  socialScore: number;
  liquidityScore: number;
}

interface LeaderboardCreator {
  rank: number;
  address: string;
  username?: string;
  tier: 'free' | 'starter' | 'viral';
  tokensCreated: number;
  tokensGraduated: number;
  totalVolume: number;
  successRate: number;
  avgViralityScore: number;
  totalMarketCap: number;
  followers: number;
  joinedAt: number;
}

type LeaderboardTab = 'tokens' | 'creators' | 'trending' | 'graduated';
type TimeFilter = '24h' | '7d' | '30d' | 'all';

// Mock data
const mockTokenLeaderboard: LeaderboardToken[] = [
  {
    rank: 1,
    id: '1',
    name: 'PepeAI Revolution',
    symbol: 'PAI',
    contractAddress: 'So11111111111111111111111111111111111111112',
    creator: {
      address: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
      username: 'CryptoWhale',
      tier: 'viral'
    },
    currentPrice: 0.000234,
    priceChange24h: 1284.5,
    priceChange7d: 2456.8,
    marketCap: 2300000,
    volume24h: 450000,
    volume7d: 1200000,
    holders: 1250,
    graduationProgress: 100,
    isGraduated: true,
    createdAt: Date.now() - 86400000 * 2,
    viralityScore: 95,
    socialScore: 88,
    liquidityScore: 92
  },
  {
    rank: 2,
    id: '2',
    name: 'MoonCat Supreme',
    symbol: 'MCAT',
    contractAddress: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    creator: {
      address: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
      username: 'TokenMaster',
      tier: 'starter'
    },
    currentPrice: 0.00156,
    priceChange24h: 456.2,
    priceChange7d: 789.1,
    marketCap: 890000,
    volume24h: 125000,
    volume7d: 340000,
    holders: 780,
    graduationProgress: 85,
    isGraduated: false,
    createdAt: Date.now() - 86400000 * 3,
    viralityScore: 82,
    socialScore: 75,
    liquidityScore: 78
  },
  {
    rank: 3,
    id: '3',
    name: 'DogeGenie Magic',
    symbol: 'DGENIE',
    contractAddress: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
    creator: {
      address: 'HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH',
      tier: 'free'
    },
    currentPrice: 0.00891,
    priceChange24h: 234.7,
    priceChange7d: 445.2,
    marketCap: 560000,
    volume24h: 89000,
    volume7d: 210000,
    holders: 420,
    graduationProgress: 65,
    isGraduated: false,
    createdAt: Date.now() - 86400000 * 1,
    viralityScore: 71,
    socialScore: 68,
    liquidityScore: 69
  }
];

const mockCreatorLeaderboard: LeaderboardCreator[] = [
  {
    rank: 1,
    address: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
    username: 'CryptoWhale',
    tier: 'viral',
    tokensCreated: 12,
    tokensGraduated: 8,
    totalVolume: 2500000,
    successRate: 66.7,
    avgViralityScore: 85.2,
    totalMarketCap: 5600000,
    followers: 2340,
    joinedAt: Date.now() - 86400000 * 30
  },
  {
    rank: 2,
    address: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
    username: 'TokenMaster',
    tier: 'starter',
    tokensCreated: 8,
    tokensGraduated: 4,
    totalVolume: 1200000,
    successRate: 50.0,
    avgViralityScore: 78.5,
    totalMarketCap: 2300000,
    followers: 1156,
    joinedAt: Date.now() - 86400000 * 45
  },
  {
    rank: 3,
    address: 'HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH',
    tier: 'free',
    tokensCreated: 5,
    tokensGraduated: 1,
    totalVolume: 450000,
    successRate: 20.0,
    avgViralityScore: 65.8,
    totalMarketCap: 890000,
    followers: 423,
    joinedAt: Date.now() - 86400000 * 15
  }
];

export default function LeaderboardPage() {
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState<LeaderboardTab>('tokens');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('24h');
  const [tokenLeaderboard] = useState(mockTokenLeaderboard);
  const [creatorLeaderboard] = useState(mockCreatorLeaderboard);
  const [isLoading, setIsLoading] = useState(false);

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    toast.success('Address copied to clipboard');
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'viral': return <Crown className="w-4 h-4 text-purple-400" />;
      case 'starter': return <Zap className="w-4 h-4 text-blue-400" />;
      default: return null;
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'viral': return 'text-purple-400';
      case 'starter': return 'text-blue-400';
      default: return 'text-gray-400';
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="w-6 h-6 text-yellow-400" />;
      case 2: return <Medal className="w-6 h-6 text-gray-300" />;
      case 3: return <Medal className="w-6 h-6 text-amber-600" />;
      default: return <span className="text-xl font-bold text-gray-400">#{rank}</span>;
    }
  };

  const getRankBg = (rank: number) => {
    switch (rank) {
      case 1: return 'bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 border-yellow-500/30';
      case 2: return 'bg-gradient-to-r from-gray-400/20 to-gray-500/20 border-gray-400/30';
      case 3: return 'bg-gradient-to-r from-amber-600/20 to-amber-700/20 border-amber-600/30';
      default: return 'bg-gray-800/50 border-gray-700';
    }
  };

  const refreshData = () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      toast.success('Leaderboard updated');
    }, 1000);
  };

  return (
    <div className="min-h-screen pb-16 md:pb-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2 flex items-center">
                <Trophy className="w-8 h-8 mr-3 text-yellow-400" />
                Leaderboard
              </h1>
              <p className="text-gray-400">Top performing tokens and creators on DeGenie</p>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                onClick={refreshData}
                disabled={isLoading}
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                <RefreshCw className={cn("w-4 h-4 mr-2", isLoading && "animate-spin")} />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <Card className="bg-gray-800/50 border-gray-700">
            <div className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                <div className="flex rounded-lg bg-gray-700 p-1">
                  {(['tokens', 'creators', 'trending', 'graduated'] as LeaderboardTab[]).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setSelectedTab(tab)}
                      className={cn(
                        "px-4 py-2 text-sm font-medium rounded-md transition-colors capitalize",
                        selectedTab === tab
                          ? "bg-purple-600 text-white"
                          : "text-gray-400 hover:text-white"
                      )}
                    >
                      {tab === 'tokens' && <BarChart3 className="w-4 h-4 mr-2 inline" />}
                      {tab === 'creators' && <Users className="w-4 h-4 mr-2 inline" />}
                      {tab === 'trending' && <TrendingUp className="w-4 h-4 mr-2 inline" />}
                      {tab === 'graduated' && <Star className="w-4 h-4 mr-2 inline" />}
                      {tab}
                    </button>
                  ))}
                </div>

                {selectedTab === 'tokens' && (
                  <div className="flex rounded-lg bg-gray-700 p-1">
                    {(['24h', '7d', '30d', 'all'] as TimeFilter[]).map((filter) => (
                      <button
                        key={filter}
                        onClick={() => setTimeFilter(filter)}
                        className={cn(
                          "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                          timeFilter === filter
                            ? "bg-purple-600 text-white"
                            : "text-gray-400 hover:text-white"
                        )}
                      >
                        {filter}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Leaderboard Content */}
        {selectedTab === 'tokens' || selectedTab === 'trending' || selectedTab === 'graduated' ? (
          <div className="space-y-4">
            {tokenLeaderboard
              .filter(token => {
                if (selectedTab === 'graduated') return token.isGraduated;
                if (selectedTab === 'trending') return token.priceChange24h > 100;
                return true;
              })
              .map((token) => (
                <motion.div
                  key={token.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: token.rank * 0.05 }}
                >
                  <Card className={cn("border transition-all duration-300 hover:scale-[1.02]", getRankBg(token.rank))}>
                    <div className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          {/* Rank */}
                          <div className="flex items-center justify-center w-12 h-12">
                            {getRankIcon(token.rank)}
                          </div>

                          {/* Token Info */}
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                              {token.symbol.charAt(0)}
                            </div>
                            <div>
                              <div className="flex items-center space-x-2">
                                <h3 className="font-bold text-white text-lg">{token.name}</h3>
                                <span className="text-gray-400">${token.symbol}</span>
                                {token.isGraduated && (
                                  <div className="bg-green-500/20 text-green-400 px-2 py-0.5 rounded text-xs font-medium">
                                    <Star className="w-3 h-3 inline mr-1" />
                                    Graduated
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center space-x-4 text-sm text-gray-400 mt-1">
                                <span>by {token.creator.username || formatAddress(token.creator.address)}</span>
                                {getTierIcon(token.creator.tier)}
                                <button
                                  onClick={() => copyAddress(token.contractAddress)}
                                  className="flex items-center hover:text-white transition-colors"
                                >
                                  {formatAddress(token.contractAddress)}
                                  <Copy className="w-3 h-3 ml-1" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Metrics */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-right">
                          <div>
                            <p className="text-gray-400 text-xs">Price</p>
                            <p className="text-white font-medium">{formatPrice(token.currentPrice)}</p>
                            <div className={cn(
                              "flex items-center justify-end text-xs",
                              token.priceChange24h >= 0 ? "text-green-400" : "text-red-400"
                            )}>
                              {token.priceChange24h >= 0 ? (
                                <TrendingUp className="w-3 h-3 mr-1" />
                              ) : (
                                <TrendingDown className="w-3 h-3 mr-1" />
                              )}
                              {token.priceChange24h >= 0 ? '+' : ''}{token.priceChange24h.toFixed(1)}%
                            </div>
                          </div>

                          <div>
                            <p className="text-gray-400 text-xs">Market Cap</p>
                            <p className="text-white font-medium">${formatNumber(token.marketCap)}</p>
                            <p className="text-gray-400 text-xs">{token.holders} holders</p>
                          </div>

                          <div>
                            <p className="text-gray-400 text-xs">Volume 24h</p>
                            <p className="text-white font-medium">${formatNumber(token.volume24h)}</p>
                            <p className="text-gray-400 text-xs">{getTimeAgo(token.createdAt)}</p>
                          </div>

                          <div>
                            <p className="text-gray-400 text-xs">Virality Score</p>
                            <div className="flex items-center justify-end space-x-1">
                              <Flame className="w-4 h-4 text-orange-400" />
                              <span className="text-white font-medium">{token.viralityScore}/100</span>
                            </div>
                            <div className="w-16 ml-auto mt-1">
                              <Progress 
                                value={token.viralityScore} 
                                className="h-1 bg-gray-700"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Graduation Progress (for non-graduated tokens) */}
                      {!token.isGraduated && (
                        <div className="mt-4 pt-4 border-t border-gray-700/50">
                          <div className="flex items-center justify-between text-sm mb-2">
                            <span className="text-gray-400">Graduation Progress</span>
                            <span className="text-white">{token.graduationProgress}%</span>
                          </div>
                          <Progress 
                            value={token.graduationProgress} 
                            className="h-2 bg-gray-700"
                          />
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="mt-4 pt-4 border-t border-gray-700/50 flex justify-between items-center">
                        <div className="flex items-center space-x-4 text-sm text-gray-400">
                          <div className="flex items-center space-x-1">
                            <Target className="w-4 h-4" />
                            <span>Social: {token.socialScore}/100</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <DollarSign className="w-4 h-4" />
                            <span>Liquidity: {token.liquidityScore}/100</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-gray-600 text-gray-300 hover:bg-gray-700"
                            onClick={() => router.push(`/token/${token.contractAddress}`)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                          <Button
                            size="sm"
                            className="bg-purple-600 hover:bg-purple-700"
                            onClick={() => router.push(`/trade/${token.contractAddress}`)}
                          >
                            Trade
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
          </div>
        ) : (
          /* Creator Leaderboard */
          <div className="space-y-4">
            {creatorLeaderboard.map((creator) => (
              <motion.div
                key={creator.address}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: creator.rank * 0.05 }}
              >
                <Card className={cn("border transition-all duration-300 hover:scale-[1.02]", getRankBg(creator.rank))}>
                  <div className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {/* Rank */}
                        <div className="flex items-center justify-center w-12 h-12">
                          {getRankIcon(creator.rank)}
                        </div>

                        {/* Creator Info */}
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                            {(creator.username || creator.address).charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <h3 className="font-bold text-white text-lg">
                                {creator.username || formatAddress(creator.address)}
                              </h3>
                              {getTierIcon(creator.tier)}
                              <span className={cn("text-sm", getTierColor(creator.tier))}>
                                {creator.tier} tier
                              </span>
                            </div>
                            <div className="flex items-center space-x-4 text-sm text-gray-400 mt-1">
                              <span>{creator.followers} followers</span>
                              <span>Joined {getTimeAgo(creator.joinedAt)}</span>
                              <button
                                onClick={() => copyAddress(creator.address)}
                                className="flex items-center hover:text-white transition-colors"
                              >
                                {formatAddress(creator.address)}
                                <Copy className="w-3 h-3 ml-1" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Creator Metrics */}
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-6 text-right">
                        <div>
                          <p className="text-gray-400 text-xs">Tokens Created</p>
                          <p className="text-white font-medium">{creator.tokensCreated}</p>
                        </div>

                        <div>
                          <p className="text-gray-400 text-xs">Success Rate</p>
                          <p className="text-white font-medium">{creator.successRate.toFixed(1)}%</p>
                          <p className="text-gray-400 text-xs">{creator.tokensGraduated} graduated</p>
                        </div>

                        <div>
                          <p className="text-gray-400 text-xs">Total Volume</p>
                          <p className="text-white font-medium">${formatNumber(creator.totalVolume)}</p>
                        </div>

                        <div>
                          <p className="text-gray-400 text-xs">Market Cap</p>
                          <p className="text-white font-medium">${formatNumber(creator.totalMarketCap)}</p>
                        </div>

                        <div>
                          <p className="text-gray-400 text-xs">Avg Virality</p>
                          <div className="flex items-center justify-end space-x-1">
                            <Flame className="w-4 h-4 text-orange-400" />
                            <span className="text-white font-medium">{creator.avgViralityScore.toFixed(1)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}