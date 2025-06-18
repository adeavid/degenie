'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  ExternalLink,
  Copy,
  Eye,
  User,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn, formatNumber, formatPrice, formatAddress, getTimeAgo } from '@/lib/utils';
import toast from 'react-hot-toast';

interface Trade {
  id: string;
  type: 'buy' | 'sell';
  account: string;
  solAmount: number;
  tokenAmount: number;
  price: number;
  timestamp: number;
  signature: string;
  priceChange?: number; // Price change from previous trade
}

interface TradesTableProps {
  trades: Trade[];
  loading: boolean;
  showPagination?: boolean;
  pageSize?: number;
}

export function TradesTable({ 
  trades, 
  loading, 
  showPagination = true, 
  pageSize = 20 
}: TradesTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<'timestamp' | 'solAmount' | 'price'>('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const sortedTrades = [...trades].sort((a, b) => {
    const aValue = a[sortBy];
    const bValue = b[sortBy];
    
    if (sortOrder === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

  const paginatedTrades = showPagination 
    ? sortedTrades.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    : sortedTrades;

  const totalPages = Math.ceil(trades.length / pageSize);

  const handleSort = (field: 'timestamp' | 'solAmount' | 'price') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const openTransaction = (signature: string) => {
    window.open(`https://solscan.io/tx/${signature}`, '_blank');
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="animate-pulse bg-gray-800/30 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-700 rounded-full"></div>
                <div className="space-y-2">
                  <div className="w-24 h-4 bg-gray-700 rounded"></div>
                  <div className="w-16 h-3 bg-gray-700 rounded"></div>
                </div>
              </div>
              <div className="text-right space-y-2">
                <div className="w-20 h-4 bg-gray-700 rounded"></div>
                <div className="w-16 h-3 bg-gray-700 rounded"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (trades.length === 0) {
    return (
      <div className="text-center py-8">
        <TrendingUp className="w-12 h-12 text-gray-600 mx-auto mb-3" />
        <p className="text-gray-400">No trades found</p>
        <p className="text-sm text-gray-500">
          Trades will appear here when users buy or sell this token
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Desktop Table View */}
      <div className="hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-gray-400 border-b border-gray-700">
                <th className="pb-2">Account</th>
                <th className="pb-2">Type</th>
                <th 
                  className="pb-2 cursor-pointer hover:text-gray-300 transition-colors"
                  onClick={() => handleSort('solAmount')}
                >
                  <div className="flex items-center space-x-1">
                    <span>SOL</span>
                    {sortBy === 'solAmount' && (
                      <span className="text-purple-400">
                        {sortOrder === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th 
                  className="pb-2 cursor-pointer hover:text-gray-300 transition-colors"
                  onClick={() => handleSort('price')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Price</span>
                    {sortBy === 'price' && (
                      <span className="text-purple-400">
                        {sortOrder === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th className="pb-2">Change</th>
                <th 
                  className="pb-2 cursor-pointer hover:text-gray-300 transition-colors"
                  onClick={() => handleSort('timestamp')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Date</span>
                    {sortBy === 'timestamp' && (
                      <span className="text-purple-400">
                        {sortOrder === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th className="pb-2">Transaction</th>
              </tr>
            </thead>
            <tbody>
              {paginatedTrades.map((trade, index) => (
                <motion.tr
                  key={trade.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors"
                >
                  <td className="py-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-xs font-bold">
                        {formatAddress(trade.account, 2).slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex items-center space-x-1">
                        <span className="font-mono text-sm">
                          {formatAddress(trade.account)}
                        </span>
                        <button
                          onClick={() => copyToClipboard(trade.account)}
                          className="text-gray-500 hover:text-gray-300 transition-colors"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </td>
                  
                  <td className="py-3">
                    <div className={cn(
                      "flex items-center space-x-1 text-sm font-medium",
                      trade.type === 'buy' ? "text-green-400" : "text-red-400"
                    )}>
                      {trade.type === 'buy' ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : (
                        <TrendingDown className="w-4 h-4" />
                      )}
                      <span className="capitalize">{trade.type}</span>
                    </div>
                  </td>
                  
                  <td className="py-3 text-sm">
                    <div>
                      <div className="font-medium">{trade.solAmount.toFixed(4)} SOL</div>
                      <div className="text-xs text-gray-500">
                        {formatNumber(trade.tokenAmount)} tokens
                      </div>
                    </div>
                  </td>
                  
                  <td className="py-3 text-sm font-medium">
                    {formatPrice(trade.price)}
                  </td>
                  
                  <td className="py-3">
                    {trade.priceChange !== undefined && (
                      <div className={cn(
                        "text-sm font-medium",
                        trade.priceChange >= 0 ? "text-green-400" : "text-red-400"
                      )}>
                        {trade.priceChange >= 0 ? '+' : ''}
                        {trade.priceChange.toFixed(2)}%
                      </div>
                    )}
                  </td>
                  
                  <td className="py-3 text-sm text-gray-400">
                    {getTimeAgo(trade.timestamp)}
                  </td>
                  
                  <td className="py-3">
                    <Button
                      onClick={() => openTransaction(trade.signature)}
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {paginatedTrades.map((trade, index) => (
          <motion.div
            key={trade.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-gray-800/30 rounded-lg p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-xs font-bold">
                  {formatAddress(trade.account, 2).slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center space-x-1">
                    <span className="font-mono text-sm">
                      {formatAddress(trade.account)}
                    </span>
                    <button
                      onClick={() => copyToClipboard(trade.account)}
                      className="text-gray-500"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="text-xs text-gray-500">
                    {getTimeAgo(trade.timestamp)}
                  </div>
                </div>
              </div>
              
              <div className={cn(
                "flex items-center space-x-1 text-sm font-medium",
                trade.type === 'buy' ? "text-green-400" : "text-red-400"
              )}>
                {trade.type === 'buy' ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                <span className="capitalize">{trade.type}</span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-400 text-xs">Amount</div>
                <div className="font-medium">{trade.solAmount.toFixed(4)} SOL</div>
                <div className="text-xs text-gray-500">
                  {formatNumber(trade.tokenAmount)} tokens
                </div>
              </div>
              
              <div>
                <div className="text-gray-400 text-xs">Price</div>
                <div className="font-medium">{formatPrice(trade.price)}</div>
                {trade.priceChange !== undefined && (
                  <div className={cn(
                    "text-xs",
                    trade.priceChange >= 0 ? "text-green-400" : "text-red-400"
                  )}>
                    {trade.priceChange >= 0 ? '+' : ''}
                    {trade.priceChange.toFixed(2)}%
                  </div>
                )}
              </div>
            </div>
            
            <div className="mt-3 pt-3 border-t border-gray-700 flex justify-between items-center">
              <div className="text-xs text-gray-500">
                TX: {formatAddress(trade.signature, 6)}
              </div>
              <Button
                onClick={() => openTransaction(trade.signature)}
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                View
              </Button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Pagination */}
      {showPagination && totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-gray-700">
          <div className="text-sm text-gray-400">
            Showing {(currentPage - 1) * pageSize + 1} to{' '}
            {Math.min(currentPage * pageSize, trades.length)} of {trades.length} trades
          </div>
          
          <div className="flex space-x-1">
            <Button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              variant="outline"
              size="sm"
              className="border-gray-600"
            >
              Previous
            </Button>
            
            {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
              const page = i + Math.max(1, currentPage - 2);
              if (page > totalPages) return null;
              
              return (
                <Button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  variant={currentPage === page ? 'default' : 'outline'}
                  size="sm"
                  className="border-gray-600 w-8"
                >
                  {page}
                </Button>
              );
            })}
            
            <Button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              variant="outline"
              size="sm"
              className="border-gray-600"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}