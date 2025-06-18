'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Crown, 
  Copy, 
  ExternalLink,
  TrendingUp,
  Calendar,
  Percent
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Progress } from '@/components/ui/Progress';
import { cn, formatNumber, formatAddress, getTimeAgo } from '@/lib/utils';
import toast from 'react-hot-toast';

interface Holder {
  address: string;
  balance: number;
  percentage: number;
  firstBuy: number;
  isCreator?: boolean;
  rank?: number;
}

interface HoldersTableProps {
  holders: Holder[];
  totalSupply: number;
  loading?: boolean;
}

export function HoldersTable({ holders, totalSupply, loading = false }: HoldersTableProps) {
  const [sortBy, setSortBy] = useState<'percentage' | 'balance' | 'firstBuy'>('percentage');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  const sortedHolders = [...holders].sort((a, b) => {
    const aValue = a[sortBy];
    const bValue = b[sortBy];
    
    if (sortOrder === 'desc') {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    } else {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    }
  });

  const handleSort = (field: 'percentage' | 'balance' | 'firstBuy') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Address copied to clipboard');
  };

  const openAddress = (address: string) => {
    window.open(`https://solscan.io/account/${address}`, '_blank');
  };

  const getHolderIcon = (holder: Holder, index: number) => {
    if (holder.isCreator) {
      return <Crown className="w-4 h-4 text-yellow-400" />;
    }
    
    if (index === 0) {
      return <Crown className="w-4 h-4 text-gold" />;
    }
    
    return (
      <div className="w-4 h-4 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-xs font-bold text-white">
        {index + 1}
      </div>
    );
  };

  const getHolderBadge = (holder: Holder, index: number) => {
    if (holder.isCreator) {
      return (
        <span className="text-xs bg-yellow-600 px-2 py-0.5 rounded text-white font-medium">
          Creator
        </span>
      );
    }
    
    if (holder.percentage >= 10) {
      return (
        <span className="text-xs bg-red-600 px-2 py-0.5 rounded text-white font-medium">
          Whale
        </span>
      );
    }
    
    if (holder.percentage >= 5) {
      return (
        <span className="text-xs bg-orange-600 px-2 py-0.5 rounded text-white font-medium">
          Large
        </span>
      );
    }
    
    if (holder.percentage >= 1) {
      return (
        <span className="text-xs bg-blue-600 px-2 py-0.5 rounded text-white font-medium">
          Medium
        </span>
      );
    }
    
    return null;
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="animate-pulse bg-gray-800/30 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-700 rounded-full"></div>
                <div className="space-y-2">
                  <div className="w-32 h-4 bg-gray-700 rounded"></div>
                  <div className="w-20 h-3 bg-gray-700 rounded"></div>
                </div>
              </div>
              <div className="text-right space-y-2">
                <div className="w-24 h-4 bg-gray-700 rounded"></div>
                <div className="w-16 h-3 bg-gray-700 rounded"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (holders.length === 0) {
    return (
      <div className="text-center py-8">
        <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
        <p className="text-gray-400">No holders found</p>
        <p className="text-sm text-gray-500">
          Holder information will appear here once tokens are distributed
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-800/50 rounded-lg p-3">
          <div className="text-sm text-gray-400">Total Holders</div>
          <div className="text-lg font-bold">{formatNumber(holders.length)}</div>
        </div>
        
        <div className="bg-gray-800/50 rounded-lg p-3">
          <div className="text-sm text-gray-400">Top Holder</div>
          <div className="text-lg font-bold">
            {holders[0] ? `${holders[0].percentage.toFixed(1)}%` : '0%'}
          </div>
        </div>
        
        <div className="bg-gray-800/50 rounded-lg p-3">
          <div className="text-sm text-gray-400">Top 10 Hold</div>
          <div className="text-lg font-bold">
            {holders.slice(0, 10).reduce((sum, h) => sum + h.percentage, 0).toFixed(1)}%
          </div>
        </div>
        
        <div className="bg-gray-800/50 rounded-lg p-3">
          <div className="text-sm text-gray-400">Distribution</div>
          <div className="text-lg font-bold">
            {holders.filter(h => h.percentage < 1).length}/{holders.length}
          </div>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-gray-400 border-b border-gray-700">
                <th className="pb-2">Rank</th>
                <th className="pb-2">Address</th>
                <th 
                  className="pb-2 cursor-pointer hover:text-gray-300 transition-colors"
                  onClick={() => handleSort('balance')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Balance</span>
                    {sortBy === 'balance' && (
                      <span className="text-purple-400">
                        {sortOrder === 'desc' ? '↓' : '↑'}
                      </span>
                    )}
                  </div>
                </th>
                <th 
                  className="pb-2 cursor-pointer hover:text-gray-300 transition-colors"
                  onClick={() => handleSort('percentage')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Percentage</span>
                    {sortBy === 'percentage' && (
                      <span className="text-purple-400">
                        {sortOrder === 'desc' ? '↓' : '↑'}
                      </span>
                    )}
                  </div>
                </th>
                <th 
                  className="pb-2 cursor-pointer hover:text-gray-300 transition-colors"
                  onClick={() => handleSort('firstBuy')}
                >
                  <div className="flex items-center space-x-1">
                    <span>First Buy</span>
                    {sortBy === 'firstBuy' && (
                      <span className="text-purple-400">
                        {sortOrder === 'desc' ? '↓' : '↑'}
                      </span>
                    )}
                  </div>
                </th>
                <th className="pb-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedHolders.map((holder, index) => (
                <motion.tr
                  key={holder.address}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                  className={cn(
                    "border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors",
                    holder.isCreator && "bg-yellow-900/10"
                  )}
                >
                  <td className="py-3">
                    <div className="flex items-center space-x-2">
                      {getHolderIcon(holder, index)}
                      <span className="text-sm font-medium">#{index + 1}</span>
                    </div>
                  </td>
                  
                  <td className="py-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-xs font-bold">
                        {formatAddress(holder.address, 2).slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-sm">
                          {formatAddress(holder.address)}
                        </span>
                        {getHolderBadge(holder, index)}
                      </div>
                    </div>
                  </td>
                  
                  <td className="py-3">
                    <div className="text-sm font-medium">
                      {formatNumber(holder.balance)}
                    </div>
                  </td>
                  
                  <td className="py-3">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">
                          {holder.percentage.toFixed(2)}%
                        </span>
                      </div>
                      <Progress 
                        value={holder.percentage} 
                        max={Math.max(10, holders[0]?.percentage || 0)}
                        className="h-1"
                      />
                    </div>
                  </td>
                  
                  <td className="py-3 text-sm text-gray-400">
                    {getTimeAgo(holder.firstBuy)}
                  </td>
                  
                  <td className="py-3">
                    <div className="flex space-x-1">
                      <Button
                        onClick={() => copyToClipboard(holder.address)}
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        title="Copy address"
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                      <Button
                        onClick={() => openAddress(holder.address)}
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        title="View on Solscan"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {sortedHolders.map((holder, index) => (
          <motion.div
            key={holder.address}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.02 }}
            className={cn(
              "bg-gray-800/30 rounded-lg p-4",
              holder.isCreator && "bg-yellow-900/10 border border-yellow-500/20"
            )}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                {getHolderIcon(holder, index)}
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-sm">
                      {formatAddress(holder.address)}
                    </span>
                    {getHolderBadge(holder, index)}
                  </div>
                  <div className="text-xs text-gray-500">
                    Rank #{index + 1} • First buy {getTimeAgo(holder.firstBuy)}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div>
                <div className="text-xs text-gray-400">Balance</div>
                <div className="text-sm font-medium">
                  {formatNumber(holder.balance)}
                </div>
              </div>
              
              <div>
                <div className="text-xs text-gray-400">Percentage</div>
                <div className="text-sm font-medium">
                  {holder.percentage.toFixed(2)}%
                </div>
              </div>
            </div>
            
            <div className="mb-3">
              <Progress 
                value={holder.percentage} 
                max={Math.max(10, holders[0]?.percentage || 0)}
                className="h-2"
              />
            </div>
            
            <div className="flex justify-between items-center">
              <div className="text-xs text-gray-500">
                Address: {formatAddress(holder.address, 6)}
              </div>
              <div className="flex space-x-1">
                <Button
                  onClick={() => copyToClipboard(holder.address)}
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs"
                >
                  <Copy className="w-3 h-3 mr-1" />
                  Copy
                </Button>
                <Button
                  onClick={() => openAddress(holder.address)}
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs"
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  View
                </Button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}