'use client';

import { useState, useEffect } from 'react';

// Force this page to be client-side only
export const dynamic = 'force-dynamic';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Search,
  Filter,
  Star,
  Download,
  Eye,
  Heart,
  TrendingUp,
  Zap,
  Image as ImageIcon,
  Palette,
  MessageSquare,
  Brain,
  ShoppingCart,
  ExternalLink,
  Crown,
  Award
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { formatNumber, formatPrice } from '@/lib/utils';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

interface MarketplaceItem {
  id: string;
  type: 'lora' | 'nft' | 'prompt' | 'alpha';
  title: string;
  description: string;
  price: number;
  creator: string;
  rating: number;
  downloads: number;
  views: number;
  likes: number;
  image: string;
  tags: string[];
  isPremium: boolean;
  isVerified: boolean;
  createdAt: number;
}

const categories = [
  { id: 'all', name: 'All Items', icon: ShoppingCart, count: 1247 },
  { id: 'lora', name: 'LoRA Models', icon: Brain, count: 342 },
  { id: 'nft', name: 'NFT Collections', icon: ImageIcon, count: 456 },
  { id: 'prompt', name: 'AI Prompts', icon: MessageSquare, count: 289 },
  { id: 'alpha', name: 'Alpha Calls', icon: TrendingUp, count: 160 }
];

const sortOptions = [
  { id: 'trending', name: 'Trending' },
  { id: 'newest', name: 'Newest' },
  { id: 'price_low', name: 'Price: Low to High' },
  { id: 'price_high', name: 'Price: High to Low' },
  { id: 'rating', name: 'Highest Rated' },
  { id: 'downloads', name: 'Most Downloaded' }
];

// Mock data
const mockItems: MarketplaceItem[] = [
  {
    id: '1',
    type: 'lora',
    title: 'Viral Meme Style LoRA',
    description: 'Fine-tuned model for generating viral meme-style images with high engagement potential',
    price: 2.5,
    creator: 'AIArtist_Pro',
    rating: 4.8,
    downloads: 1250,
    views: 5430,
    likes: 892,
    image: '/api/placeholder/300/200',
    tags: ['meme', 'viral', 'social-media'],
    isPremium: true,
    isVerified: true,
    createdAt: Date.now() - 86400000
  },
  {
    id: '2',
    type: 'nft',
    title: 'DeGenie Genesis Collection',
    description: 'Exclusive NFT collection featuring AI-generated characters from the DeGenie universe',
    price: 0.5,
    creator: 'DeGenieTeam',
    rating: 4.9,
    downloads: 890,
    views: 3420,
    likes: 1340,
    image: '/api/placeholder/300/200',
    tags: ['genesis', 'collectible', 'exclusive'],
    isPremium: false,
    isVerified: true,
    createdAt: Date.now() - 172800000
  },
  {
    id: '3',
    type: 'prompt',
    title: 'Crypto Token Logo Prompts Pack',
    description: 'Collection of 50+ proven prompts for generating professional cryptocurrency logos',
    price: 1.0,
    creator: 'PromptMaster',
    rating: 4.7,
    downloads: 2340,
    views: 8920,
    likes: 567,
    image: '/api/placeholder/300/200',
    tags: ['logo', 'crypto', 'professional'],
    isPremium: false,
    isVerified: false,
    createdAt: Date.now() - 259200000
  },
  {
    id: '4',
    type: 'alpha',
    title: 'Solana Meme Coin Alpha',
    description: 'Exclusive alpha call on upcoming Solana meme coin with 100x potential',
    price: 5.0,
    creator: 'CryptoWhale_87',
    rating: 4.6,
    downloads: 156,
    views: 890,
    likes: 234,
    image: '/api/placeholder/300/200',
    tags: ['solana', 'alpha', 'meme'],
    isPremium: true,
    isVerified: true,
    createdAt: Date.now() - 3600000
  },
  {
    id: '5',
    type: 'lora',
    title: 'Anime Token Mascots',
    description: 'LoRA model specialized in creating anime-style mascots for crypto tokens',
    price: 3.0,
    creator: 'AnimeAI_Studio',
    rating: 4.5,
    downloads: 780,
    views: 2340,
    likes: 445,
    image: '/api/placeholder/300/200',
    tags: ['anime', 'mascot', 'token'],
    isPremium: false,
    isVerified: true,
    createdAt: Date.now() - 345600000
  },
  {
    id: '6',
    type: 'nft',
    title: 'Pixel Pepe Collection',
    description: 'Retro pixel art collection featuring various Pepe characters',
    price: 0.25,
    creator: 'PixelArtist',
    rating: 4.4,
    downloads: 1890,
    views: 7650,
    likes: 1234,
    image: '/api/placeholder/300/200',
    tags: ['pixel', 'pepe', 'retro'],
    isPremium: false,
    isVerified: false,
    createdAt: Date.now() - 432000000
  }
];

export default function Marketplace() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('trending');
  const [items, setItems] = useState(mockItems);
  const [isLoading, setIsLoading] = useState(false);

  const filteredItems = items.filter(item => {
    if (selectedCategory !== 'all' && item.type !== selectedCategory) return false;
    if (searchQuery && !item.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !item.description.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))) return false;
    return true;
  });

  const handlePurchase = (item: MarketplaceItem) => {
    toast.success(`Purchased ${item.title} for ${item.price} SOL`);
  };

  const handleLike = (itemId: string) => {
    setItems(prev => prev.map(item => 
      item.id === itemId 
        ? { ...item, likes: item.likes + 1 }
        : item
    ));
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'lora': return Brain;
      case 'nft': return ImageIcon;
      case 'prompt': return MessageSquare;
      case 'alpha': return TrendingUp;
      default: return ShoppingCart;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'lora': return 'text-purple-400 bg-purple-500/20';
      case 'nft': return 'text-blue-400 bg-blue-500/20';
      case 'prompt': return 'text-green-400 bg-green-500/20';
      case 'alpha': return 'text-yellow-400 bg-yellow-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  return (
    <div className="min-h-screen pb-16 md:pb-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Marketplace</h1>
          <p className="text-gray-400">Discover and purchase AI models, NFTs, prompts, and alpha calls</p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search marketplace..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-gray-800 border-gray-600 text-white"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white text-sm"
              >
                {sortOptions.map(option => (
                  <option key={option.id} value={option.id}>{option.name}</option>
                ))}
              </select>
              
              <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-800">
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </Button>
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-4">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={cn(
                    "flex items-center space-x-2 px-4 py-2 rounded-lg border-2 transition-all hover:scale-105",
                    selectedCategory === category.id
                      ? "border-purple-500 bg-purple-500/20 text-white"
                      : "border-gray-600 bg-gray-800/50 text-gray-300 hover:border-gray-500"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-medium">{category.name}</span>
                  <span className="text-xs bg-gray-700 px-2 py-0.5 rounded-full">{category.count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item, index) => {
            const TypeIcon = getTypeIcon(item.type);
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-all overflow-hidden group">
                  {/* Image */}
                  <div className="relative aspect-video bg-gray-700 overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                      <TypeIcon className="w-16 h-16" />
                    </div>
                    
                    {/* Overlays */}
                    <div className="absolute top-3 left-3 flex items-center space-x-2">
                      <div className={cn("px-2 py-1 rounded text-xs font-medium", getTypeColor(item.type))}>
                        {item.type.toUpperCase()}
                      </div>
                      {item.isPremium && (
                        <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-2 py-1 rounded text-xs font-medium">
                          <Crown className="w-3 h-3 inline mr-1" />
                          Premium
                        </div>
                      )}
                    </div>
                    
                    <div className="absolute top-3 right-3">
                      <button
                        onClick={() => handleLike(item.id)}
                        className="w-8 h-8 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                      >
                        <Heart className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="absolute bottom-3 right-3 flex items-center space-x-2 text-white text-xs">
                      <div className="bg-black/50 backdrop-blur-sm px-2 py-1 rounded flex items-center">
                        <Eye className="w-3 h-3 mr-1" />
                        {formatNumber(item.views)}
                      </div>
                      <div className="bg-black/50 backdrop-blur-sm px-2 py-1 rounded flex items-center">
                        <Download className="w-3 h-3 mr-1" />
                        {formatNumber(item.downloads)}
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-white group-hover:text-purple-400 transition-colors line-clamp-1">
                        {item.title}
                      </h3>
                      <div className="flex items-center space-x-1 text-yellow-400">
                        <Star className="w-4 h-4 fill-current" />
                        <span className="text-white text-sm">{item.rating}</span>
                      </div>
                    </div>

                    <p className="text-gray-400 text-sm line-clamp-2 mb-3">
                      {item.description}
                    </p>

                    {/* Creator */}
                    <div className="flex items-center space-x-2 mb-3">
                      <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                        {item.creator.charAt(0)}
                      </div>
                      <span className="text-gray-300 text-sm">{item.creator}</span>
                      {item.isVerified && (
                        <Award className="w-4 h-4 text-blue-400" />
                      )}
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1 mb-4">
                      {item.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="bg-gray-700 text-gray-300 px-2 py-1 rounded text-xs">
                          #{tag}
                        </span>
                      ))}
                    </div>

                    {/* Stats */}
                    <div className="flex items-center justify-between mb-4 text-sm text-gray-400">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center">
                          <Heart className="w-4 h-4 mr-1" />
                          {formatNumber(item.likes)}
                        </div>
                        <div className="flex items-center">
                          <Download className="w-4 h-4 mr-1" />
                          {formatNumber(item.downloads)}
                        </div>
                      </div>
                      <div className="text-white font-bold">
                        {item.price} SOL
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => handlePurchase(item)}
                        className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                        size="sm"
                      >
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Buy Now
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-gray-600 text-gray-300 hover:bg-gray-700"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Load More */}
        <div className="text-center mt-12">
          <Button
            variant="outline"
            className="border-gray-600 text-gray-300 hover:bg-gray-800"
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : 'Load More Items'}
          </Button>
        </div>
      </div>
    </div>
  );
}