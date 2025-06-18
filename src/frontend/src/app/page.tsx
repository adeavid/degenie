'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Zap, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Rocket, 
  Sparkles,
  ArrowRight,
  PlayCircle,
  Star
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { BackendStatus } from '@/components/BackendStatus';
import { PhantomDebugInfo } from '@/components/PhantomDebugInfo';
import { formatNumber, formatPrice } from '@/lib/utils';

// Mock data - in real app this would come from API
const stats = {
  tokensCreated: 42547,
  totalVolume: 127000000,
  graduatedTokens: 3892,
  activeUsers: 28650
};

const featuredTokens = [
  {
    id: 1,
    name: 'PepeAI',
    symbol: 'PAI',
    price: 0.000234,
    change24h: 1284.5,
    marketCap: 2300000,
    logo: '/api/placeholder/32/32',
    isGraduated: true
  },
  {
    id: 2,
    name: 'DogeGenie',
    symbol: 'DGENIE',
    price: 0.00891,
    change24h: 456.2,
    marketCap: 890000,
    logo: '/api/placeholder/32/32',
    isGraduated: false
  },
  {
    id: 3,
    name: 'MoonCat',
    symbol: 'MCAT',
    price: 0.00156,
    change24h: 234.1,
    marketCap: 560000,
    logo: '/api/placeholder/32/32',
    isGraduated: true
  }
];

const recentActivity = [
  { action: 'Token Created', token: 'FluffyCoin', user: '7x9k...4m2n', time: '2s ago' },
  { action: 'Graduated', token: 'RocketDoge', user: 'Az4m...8p1q', time: '15s ago' },
  { action: 'Trade', token: 'MemeKing', user: 'Bk7n...9s2r', time: '23s ago' },
  { action: 'Token Created', token: 'CryptoFrog', user: 'Cv2p...1h4t', time: '31s ago' },
];

export default function Home() {
  const router = useRouter();
  const [tokenName, setTokenName] = useState('');
  const [liveStats, setLiveStats] = useState(stats);

  // Simulate live updates
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveStats(prev => ({
        ...prev,
        tokensCreated: prev.tokensCreated + Math.floor(Math.random() * 3),
        totalVolume: prev.totalVolume + Math.floor(Math.random() * 10000),
        activeUsers: prev.activeUsers + Math.floor(Math.random() * 5 - 2)
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const handleLaunchToken = () => {
    router.push('/create');
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tokenName.trim()) {
      router.push(`/create?name=${encodeURIComponent(tokenName)}`);
    }
  };

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
