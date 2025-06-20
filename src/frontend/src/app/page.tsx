'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  Rocket, 
  Crown,
  Coins,
  Users,
  Activity,
  Star,
  Sparkles,
  Timer,
  Search,
  Filter,
  Plus,
  Zap,
  Trophy,
  Flame
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Progress } from '@/components/ui/Progress';
import { cn, formatNumber, formatPrice, formatAddress } from '@/lib/utils';
import { apiService } from '@/lib/api';
import { useWalletConnection } from '@/hooks/useWalletConnection';
import toast from 'react-hot-toast';

interface Token {
  address: string;
  name: string;
  symbol: string;
  description?: string;
  logoUrl?: string;
  creator: string;
  createdAt: string;
  currentPrice: number;
  marketCap: number;
  volume24h: number;
  priceChange24h: number;
  bondingCurveProgress: number;
  isGraduated: boolean;
  holders: number;
  trades?: any[];
}

export default function Home() {
  const router = useRouter();
  const { connected, connectWallet } = useWalletConnection();
  const [tokens, setTokens] = useState<Token[]>([]);
  const [filteredTokens, setFilteredTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'marketCap' | 'volume' | 'newest' | 'progress'>('marketCap');
  const [showGraduated, setShowGraduated] = useState(false);
  const [kingOfTheHill, setKingOfTheHill] = useState<Token | null>(null);

  // Fetch tokens
  useEffect(() => {
    fetchTokens();
    const interval = setInterval(fetchTokens, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchTokens = async () => {
    try {
      const response = await apiService.getTokens();
      if (response.data) {
        setTokens(response.data);
        
        // Find king of the hill (highest 24h gain among non-graduated tokens)
        const nonGraduated = response.data.filter((t: Token) => !t.isGraduated);
        if (nonGraduated.length > 0) {
          const king = nonGraduated.reduce((prev: Token, current: Token) => 
            (current.priceChange24h > prev.priceChange24h) ? current : prev
          );
          setKingOfTheHill(king);
        }
      }
    } catch (error) {
      console.error('Failed to fetch tokens:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort tokens
  useEffect(() => {
    let filtered = tokens.filter(token => {
      // Search filter
      const matchesSearch = searchQuery === '' || 
        token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        token.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        token.address.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Graduated filter
      const matchesGraduated = showGraduated ? token.isGraduated : !token.isGraduated;
      
      return matchesSearch && matchesGraduated;
    });

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'marketCap':
          return b.marketCap - a.marketCap;
        case 'volume':
          return b.volume24h - a.volume24h;
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'progress':
          return b.bondingCurveProgress - a.bondingCurveProgress;
        default:
          return 0;
      }
    });

    setFilteredTokens(filtered);
  }, [tokens, searchQuery, sortBy, showGraduated]);

  const handleCreateToken = () => {
    if (!connected) {
      connectWallet();
      return;
    }
    router.push('/create');
  };

  const stats = {
    totalTokens: tokens.length,
    totalVolume: tokens.reduce((sum, t) => sum + t.volume24h, 0),
    graduatedTokens: tokens.filter(t => t.isGraduated).length,
    activeTraders: tokens.reduce((sum, t) => sum + t.holders, 0)
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-transparent to-blue-900/20" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        
        <div className="relative container mx-auto px-4 py-8">
          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <motion.div 
              className="bg-black/40 backdrop-blur-sm rounded-lg p-4 border border-white/10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                <Coins className="w-4 h-4" />
                <span>Tokens Created</span>
              </div>
              <div className="text-2xl font-bold text-white">
                {formatNumber(stats.totalTokens)}
              </div>
            </motion.div>

            <motion.div 
              className="bg-black/40 backdrop-blur-sm rounded-lg p-4 border border-white/10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                <Activity className="w-4 h-4" />
                <span>24h Volume</span>
              </div>
              <div className="text-2xl font-bold text-white">
                ${formatNumber(stats.totalVolume)}
              </div>
            </motion.div>

            <motion.div 
              className="bg-black/40 backdrop-blur-sm rounded-lg p-4 border border-white/10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                <Trophy className="w-4 h-4" />
                <span>Graduated</span>
              </div>
              <div className="text-2xl font-bold text-white">
                {formatNumber(stats.graduatedTokens)}
              </div>
            </motion.div>

            <motion.div 
              className="bg-black/40 backdrop-blur-sm rounded-lg p-4 border border-white/10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                <Users className="w-4 h-4" />
                <span>Active Traders</span>
              </div>
              <div className="text-2xl font-bold text-white">
                {formatNumber(stats.activeTraders)}
              </div>
            </motion.div>
          </div>

          {/* King of the Hill */}
          {kingOfTheHill && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-8"
            >
              <Card className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500/50 p-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Crown className="w-12 h-12 text-yellow-500 animate-pulse" />
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-500 rounded-full animate-ping" />
                    </div>
                    <div>
                      <div className="text-sm text-yellow-500 font-medium mb-1">
                        👑 King of the Hill
                      </div>
                      <div className="flex items-center gap-3">
                        {kingOfTheHill.logoUrl && (
                          <img 
                            src={kingOfTheHill.logoUrl} 
                            alt={kingOfTheHill.name}
                            className="w-8 h-8 rounded-full"
                          />
                        )}
                        <Link 
                          href={`/token/${kingOfTheHill.address}`}
                          className="text-xl font-bold text-white hover:text-yellow-500 transition-colors"
                        >
                          {kingOfTheHill.name} ({kingOfTheHill.symbol})
                        </Link>
                        <span className={cn(
                          "text-2xl font-bold flex items-center gap-1",
                          kingOfTheHill.priceChange24h >= 0 ? "text-green-500" : "text-red-500"
                        )}>
                          <TrendingUp className="w-5 h-5" />
                          +{formatNumber(kingOfTheHill.priceChange24h)}%
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div>
                      <div className="text-sm text-gray-400">Market Cap</div>
                      <div className="text-lg font-semibold text-white">
                        ${formatNumber(kingOfTheHill.marketCap)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">Progress</div>
                      <div className="flex items-center gap-2">
                        <Progress 
                          value={kingOfTheHill.bondingCurveProgress} 
                          className="w-20 h-2"
                        />
                        <span className="text-sm text-white">
                          {kingOfTheHill.bondingCurveProgress}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Create Token CTA */}
          <motion.div 
            className="text-center mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-5xl font-bold text-white mb-4">
              Create Your Token with{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-blue-500">
                AI Magic
              </span>
            </h1>
            <p className="text-xl text-gray-400 mb-6">
              From idea to viral token in 60 seconds. No coding required.
            </p>
            <Button
              size="lg"
              onClick={handleCreateToken}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold px-8 py-4 text-lg rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
            >
              <Plus className="w-5 h-5 mr-2" />
              Start a new coin
            </Button>
          </motion.div>

          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search by name, symbol, or address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-black/50 border-white/10 text-white placeholder:text-gray-500"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowGraduated(!showGraduated)}
                className={cn(
                  "border-white/10",
                  showGraduated ? "bg-white/10 text-white" : "text-gray-400"
                )}
              >
                <Trophy className="w-4 h-4 mr-2" />
                Graduated
              </Button>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-black/50 border border-white/10 text-white rounded-lg px-3 py-2 text-sm"
              >
                <option value="marketCap">Market Cap</option>
                <option value="volume">Volume</option>
                <option value="newest">Newest</option>
                <option value="progress">Progress</option>
              </select>
            </div>
          </div>

          {/* Token Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <AnimatePresence mode="popLayout">
              {filteredTokens.map((token, index) => (
                <motion.div
                  key={token.address}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.02 }}
                  className="group"
                >
                  <Link href={`/token/${token.address}`}>
                    <Card className="bg-black/50 border-white/10 hover:border-purple-500/50 transition-all duration-300 p-4 h-full">
                      {/* Token Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          {token.logoUrl ? (
                            <img 
                              src={token.logoUrl} 
                              alt={token.name}
                              className="w-10 h-10 rounded-full"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-blue-500" />
                          )}
                          <div>
                            <h3 className="font-semibold text-white group-hover:text-purple-400 transition-colors">
                              {token.name}
                            </h3>
                            <p className="text-sm text-gray-400">${token.symbol}</p>
                          </div>
                        </div>
                        {token.isGraduated && (
                          <Trophy className="w-5 h-5 text-yellow-500" />
                        )}
                      </div>

                      {/* Price and Change */}
                      <div className="mb-3">
                        <div className="text-lg font-semibold text-white">
                          ${formatPrice(token.currentPrice)}
                        </div>
                        <div className={cn(
                          "text-sm font-medium flex items-center gap-1",
                          token.priceChange24h >= 0 ? "text-green-500" : "text-red-500"
                        )}>
                          {token.priceChange24h >= 0 ? (
                            <TrendingUp className="w-3 h-3" />
                          ) : (
                            <TrendingDown className="w-3 h-3" />
                          )}
                          {formatNumber(Math.abs(token.priceChange24h))}%
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Market Cap</span>
                          <span className="text-white">${formatNumber(token.marketCap)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Volume 24h</span>
                          <span className="text-white">${formatNumber(token.volume24h)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Holders</span>
                          <span className="text-white">{formatNumber(token.holders)}</span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      {!token.isGraduated && (
                        <div className="mt-3 pt-3 border-t border-white/10">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-gray-400">Bonding Curve</span>
                            <span className="text-xs text-white">{token.bondingCurveProgress}%</span>
                          </div>
                          <Progress 
                            value={token.bondingCurveProgress} 
                            className="h-1.5"
                          />
                        </div>
                      )}

                      {/* Created Time */}
                      <div className="mt-3 pt-3 border-t border-white/10">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-400">Created</span>
                          <span className="text-gray-400">
                            {new Date(token.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Empty State */}
          {!loading && filteredTokens.length === 0 && (
            <div className="text-center py-12">
              <Sparkles className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg mb-4">
                {searchQuery ? 'No tokens found matching your search.' : 'No tokens created yet.'}
              </p>
              <Button onClick={handleCreateToken}>
                <Plus className="w-4 h-4 mr-2" />
                Create the first token
              </Button>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <Card key={i} className="bg-black/50 border-white/10 p-4 animate-pulse">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-white/10" />
                    <div className="flex-1">
                      <div className="h-4 bg-white/10 rounded w-3/4 mb-2" />
                      <div className="h-3 bg-white/10 rounded w-1/2" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 bg-white/10 rounded" />
                    <div className="h-3 bg-white/10 rounded" />
                    <div className="h-3 bg-white/10 rounded" />
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen pb-16 md:pb-0">
      {/* Backend Status Check */}
      <div className="px-4 sm:px-6 lg:px-8 pt-20">
        <div className="max-w-7xl mx-auto space-y-4">
          <BackendStatus />
          <PhantomDebugInfo />
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 sm:px-6 lg:px-8 pt-8 pb-16">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 via-violet-900/20 to-pink-900/20" />
        
        <div className="relative max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold text-white mb-6">
                From{' '}
                <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Idea
                </span>{' '}
                to{' '}
                <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Viral Token
                </span>
                <br />
                in 60 Seconds
              </h1>
              <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
                AI-powered cryptocurrency token creation platform that automates design, 
                marketing, and technical aspects. Launch your next meme coin with AI-generated assets.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
            >
              <Button 
                size="lg" 
                onClick={handleLaunchToken}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                <Rocket className="w-5 h-5 mr-2" />
                Launch Your Token
              </Button>
              <Button variant="outline" size="lg" className="border-gray-600 text-gray-300 hover:bg-gray-800">
                <PlayCircle className="w-5 h-5 mr-2" />
                Watch Demo
              </Button>
            </motion.div>

            {/* Live Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto"
            >
              <div className="text-center">
                <div className="text-2xl lg:text-3xl font-bold text-white mb-1">
                  {formatNumber(liveStats.tokensCreated)}
                </div>
                <div className="text-gray-400 text-sm">Tokens Created</div>
              </div>
              <div className="text-center">
                <div className="text-2xl lg:text-3xl font-bold text-white mb-1">
                  ${formatNumber(liveStats.totalVolume)}
                </div>
                <div className="text-gray-400 text-sm">Total Volume</div>
              </div>
              <div className="text-center">
                <div className="text-2xl lg:text-3xl font-bold text-white mb-1">
                  {formatNumber(liveStats.graduatedTokens)}
                </div>
                <div className="text-gray-400 text-sm">Graduated</div>
              </div>
              <div className="text-center">
                <div className="text-2xl lg:text-3xl font-bold text-white mb-1">
                  {formatNumber(liveStats.activeUsers)}
                </div>
                <div className="text-gray-400 text-sm">Active Users</div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Featured Tokens */}
      <section className="px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-white">🔥 Trending Tokens</h2>
            <Button variant="outline" className="text-purple-400 border-purple-400 hover:bg-purple-400 hover:text-white">
              View All
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredTokens.map((token, index) => (
              <motion.div
                key={token.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-all cursor-pointer">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                          {token.symbol.charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold text-white">{token.name}</div>
                          <div className="text-gray-400 text-sm">${token.symbol}</div>
                        </div>
                      </div>
                      {token.isGraduated && (
                        <div className="bg-green-500/20 text-green-400 px-2 py-1 rounded text-xs font-medium">
                          <Star className="w-3 h-3 inline mr-1" />
                          Graduated
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-400 text-sm">Price</span>
                        <span className="text-white font-medium">{formatPrice(token.price)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400 text-sm">24h Change</span>
                        <span className="text-green-400 font-medium">+{token.change24h.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400 text-sm">Market Cap</span>
                        <span className="text-white font-medium">${formatNumber(token.marketCap)}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-white mb-12">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                title: 'Describe Your Idea',
                description: 'Tell our AI about your token concept, theme, and vision.',
                icon: Sparkles
              },
              {
                step: '2',
                title: 'AI Generates Assets',
                description: 'Watch as AI creates logos, memes, and marketing content.',
                icon: Zap
              },
              {
                step: '3',
                title: 'Deploy & Go Viral',
                description: 'Launch your token with built-in virality features.',
                icon: TrendingUp
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <item.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-4">
                  {item.step}. {item.title}
                </h3>
                <p className="text-gray-400">
                  {item.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Live Activity Feed */}
      <section className="px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-white mb-8">
            🚀 Live Activity
          </h2>
          <Card className="bg-gray-800/50 border-gray-700">
            <div className="p-6">
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b border-gray-700 last:border-b-0">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <span className="text-gray-300">
                        <span className="text-white font-medium">{activity.user}</span>
                        {' '}
                        <span className="text-purple-400">{activity.action}</span>
                        {' '}
                        <span className="text-white font-medium">{activity.token}</span>
                      </span>
                    </div>
                    <span className="text-gray-500 text-sm">{activity.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <Card className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 border-purple-500/20">
            <div className="p-12">
              <h2 className="text-3xl font-bold text-white mb-4">
                Ready to Launch Your Token?
              </h2>
              <p className="text-gray-300 mb-8 text-lg">
                Join thousands of creators who have already launched successful tokens with DeGenie.
              </p>
              <form onSubmit={handleFormSubmit} className="max-w-md mx-auto">
                <div className="flex gap-4">
                  <Input 
                    placeholder="Enter your token name"
                    className="flex-1 bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                    name="tokenName"
                    value={tokenName}
                    onChange={(e) => setTokenName(e.target.value)}
                    required
                  />
                  <Button 
                    type="submit" 
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  >
                    Get Started
                  </Button>
                </div>
              </form>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}
