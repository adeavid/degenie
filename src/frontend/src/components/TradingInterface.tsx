'use client';

import { useState } from 'react';
import { useWalletConnection } from '@/hooks/useWalletConnection';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  ArrowUpDown, 
  Settings,
  AlertTriangle,
  Zap,
  DollarSign,
  Coins
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { cn, formatNumber, formatPrice } from '@/lib/utils';
import { apiService } from '@/lib/api';
import toast from 'react-hot-toast';

interface TokenData {
  address: string;
  name: string;
  symbol: string;
  currentPrice: number;
  bondingCurveProgress: number;
  isGraduated: boolean;
}

interface TradingInterfaceProps {
  tokenData: TokenData;
  onTradeComplete: () => void;
}

export function TradingInterface({ tokenData, onTradeComplete }: TradingInterfaceProps) {
  const { connected, publicKey, connectWallet } = useWalletConnection();
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [solAmount, setSolAmount] = useState<string>('');
  const [tokenAmount, setTokenAmount] = useState<string>('');
  const [slippage, setSlippage] = useState<number>(10);
  const [customSlippage, setCustomSlippage] = useState<string>('');
  const [showSlippageSettings, setShowSlippageSettings] = useState(false);
  const [isTrading, setIsTrading] = useState(false);
  const [previewData, setPreviewData] = useState<{
    expectedTokens?: number;
    expectedSol?: number;
    priceImpact?: number;
    minReceived?: number;
    fees?: number;
  } | null>(null);

  const slippageOptions = [0.1, 0.5, 1, 5, 10];

  const calculatePreview = async (amount: string, type: 'sol' | 'token') => {
    if (!amount || isNaN(Number(amount))) {
      setPreviewData(null);
      return;
    }

    try {
      const response = await apiService.calculateTrade({
        tokenAddress: tokenData.address,
        amount: Number(amount),
        type: tradeType,
        inputType: type,
        slippage
      });

      if (response.data) {
        setPreviewData(response.data);
        
        if (type === 'sol' && tradeType === 'buy') {
          setTokenAmount(response.data.expectedTokens?.toString() || '');
        } else if (type === 'token' && tradeType === 'sell') {
          setSolAmount(response.data.expectedSol?.toString() || '');
        }
      }
    } catch (error) {
      console.error('Error calculating preview:', error);
    }
  };

  const handleSolAmountChange = (value: string) => {
    setSolAmount(value);
    if (tradeType === 'buy') {
      calculatePreview(value, 'sol');
    }
  };

  const handleTokenAmountChange = (value: string) => {
    setTokenAmount(value);
    if (tradeType === 'sell') {
      calculatePreview(value, 'token');
    }
  };

  const handleSlippageChange = (newSlippage: number) => {
    setSlippage(newSlippage);
    setCustomSlippage('');
    
    // Recalculate preview with new slippage
    if (tradeType === 'buy' && solAmount) {
      calculatePreview(solAmount, 'sol');
    } else if (tradeType === 'sell' && tokenAmount) {
      calculatePreview(tokenAmount, 'token');
    }
  };

  const handleCustomSlippageChange = (value: string) => {
    setCustomSlippage(value);
    const numValue = Number(value);
    if (!isNaN(numValue) && numValue > 0 && numValue <= 50) {
      setSlippage(numValue);
    }
  };

  const setMaxAmount = async () => {
    if (!connected) return;

    try {
      if (tradeType === 'buy') {
        // Get SOL balance
        const balance = await apiService.getWalletBalance(publicKey?.toString() || '');
        if (balance.data?.sol) {
          // Leave some SOL for transaction fees
          const maxSol = Math.max(0, balance.data.sol - 0.01);
          setSolAmount(maxSol.toFixed(6));
          calculatePreview(maxSol.toString(), 'sol');
        }
      } else {
        // Get token balance
        const balance = await apiService.getTokenBalance(
          publicKey?.toString() || '', 
          tokenData.address
        );
        if (balance.data?.balance) {
          setTokenAmount(balance.data.balance.toString());
          calculatePreview(balance.data.balance.toString(), 'token');
        }
      }
    } catch (error) {
      console.error('Error getting max amount:', error);
      toast.error('Failed to get balance');
    }
  };

  const executeTrade = async () => {
    if (!connected) {
      connectWallet();
      return;
    }

    if (!solAmount && !tokenAmount) {
      toast.error('Enter an amount to trade');
      return;
    }

    setIsTrading(true);

    try {
      const response = await apiService.executeTrade({
        tokenAddress: tokenData.address,
        type: tradeType,
        solAmount: tradeType === 'buy' ? Number(solAmount) : undefined,
        tokenAmount: tradeType === 'sell' ? Number(tokenAmount) : undefined,
        slippage,
        walletAddress: publicKey?.toString() || ''
      });

      if (response.data && !response.error) {
        // Format success message with trade details
        const { outputAmount, inputAmount, pricePerToken } = response.data;
        const message = tradeType === 'buy' 
          ? `Bought ${formatNumber(outputAmount || 0)} ${tokenData.symbol} for ${formatNumber(inputAmount || 0)} SOL`
          : `Sold ${formatNumber(inputAmount || 0)} ${tokenData.symbol} for ${formatNumber(outputAmount || 0)} SOL`;
        
        toast.success(message);
        setSolAmount('');
        setTokenAmount('');
        setPreviewData(null);
        onTradeComplete();
      } else {
        throw new Error(response.error || 'Trade failed');
      }
    } catch (error) {
      console.error('Trade error:', error);
      toast.error('Trade failed. Please try again.');
    } finally {
      setIsTrading(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Trade ${tokenData.symbol}</h3>
          <Button
            onClick={() => setShowSlippageSettings(!showSlippageSettings)}
            variant="outline"
            size="sm"
            className="border-gray-600"
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>

        {/* Trade Type Toggle */}
        <div className="flex rounded-lg bg-gray-800 p-1">
          <Button
            onClick={() => setTradeType('buy')}
            variant={tradeType === 'buy' ? 'default' : 'ghost'}
            className={cn(
              "flex-1 h-10",
              tradeType === 'buy' && "bg-green-600 hover:bg-green-700"
            )}
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Buy
          </Button>
          <Button
            onClick={() => setTradeType('sell')}
            variant={tradeType === 'sell' ? 'default' : 'ghost'}
            className={cn(
              "flex-1 h-10",
              tradeType === 'sell' && "bg-red-600 hover:bg-red-700"
            )}
          >
            <TrendingDown className="w-4 h-4 mr-2" />
            Sell
          </Button>
        </div>

        {/* Slippage Settings */}
        {showSlippageSettings && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-gray-800/50 rounded-lg p-4 space-y-3"
          >
            <h4 className="text-sm font-medium text-gray-300">Max Slippage</h4>
            <div className="flex space-x-2">
              {slippageOptions.map((option) => (
                <Button
                  key={option}
                  onClick={() => handleSlippageChange(option)}
                  variant={slippage === option ? 'default' : 'outline'}
                  size="sm"
                  className="px-3 py-1 text-xs"
                >
                  {option}%
                </Button>
              ))}
            </div>
            <div className="flex items-center space-x-2">
              <Input
                placeholder="Custom %"
                value={customSlippage}
                onChange={(e) => handleCustomSlippageChange(e.target.value)}
                className="flex-1 h-8 text-sm bg-gray-800 border-gray-600"
                type="number"
                min="0"
                max="50"
                step="0.1"
              />
              <span className="text-xs text-gray-400">%</span>
            </div>
          </motion.div>
        )}

        {/* Trading Form */}
        <div className="space-y-4">
          {/* SOL Input */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-300">
                {tradeType === 'buy' ? 'Pay' : 'Receive'}
              </label>
              {connected && (
                <button
                  onClick={setMaxAmount}
                  className="text-xs text-purple-400 hover:text-purple-300"
                >
                  Max
                </button>
              )}
            </div>
            <div className="relative">
              <Input
                value={solAmount}
                onChange={(e) => handleSolAmountChange(e.target.value)}
                placeholder="0.0"
                type="number"
                step="0.001"
                min="0"
                className="pr-16 bg-gray-800 border-gray-600 text-lg font-medium"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-2 text-gray-400">
                <DollarSign className="w-4 h-4" />
                <span className="text-sm font-medium">SOL</span>
              </div>
            </div>
          </div>

          {/* Swap Arrow */}
          <div className="flex justify-center">
            <div className="p-2 bg-gray-800 rounded-full">
              <ArrowUpDown className="w-5 h-5 text-gray-400" />
            </div>
          </div>

          {/* Token Input */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {tradeType === 'buy' ? 'Receive' : 'Pay'}
            </label>
            <div className="relative">
              <Input
                value={tokenAmount}
                onChange={(e) => handleTokenAmountChange(e.target.value)}
                placeholder="0.0"
                type="number"
                step="0.001"
                min="0"
                className="pr-20 bg-gray-800 border-gray-600 text-lg font-medium"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-2 text-gray-400">
                <Coins className="w-4 h-4" />
                <span className="text-sm font-medium">{tokenData.symbol}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Trade Preview */}
        {previewData && (
          <div className="bg-gray-800/50 rounded-lg p-4 space-y-2">
            <h4 className="text-sm font-medium text-gray-300">Trade Preview</h4>
            
            {previewData.priceImpact !== undefined && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Price Impact</span>
                <span className={cn(
                  previewData.priceImpact > 5 ? "text-red-400" : 
                  previewData.priceImpact > 1 ? "text-yellow-400" : "text-gray-300"
                )}>
                  {previewData.priceImpact.toFixed(2)}%
                  {previewData.priceImpact > 5 && (
                    <AlertTriangle className="w-3 h-3 inline ml-1" />
                  )}
                </span>
              </div>
            )}
            
            {previewData.minReceived !== undefined && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Minimum Received</span>
                <span className="text-gray-300">
                  {formatNumber(previewData.minReceived)} {tradeType === 'buy' ? tokenData.symbol : 'SOL'}
                </span>
              </div>
            )}
            
            {previewData.fees !== undefined && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Platform Fee (1%)</span>
                <span className="text-gray-300">{formatPrice(previewData.fees)}</span>
              </div>
            )}
            
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Max Slippage</span>
              <span className="text-gray-300">{slippage}%</span>
            </div>
          </div>
        )}

        {/* High Price Impact Warning */}
        {previewData?.priceImpact && previewData.priceImpact > 5 && (
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3">
            <div className="flex items-center space-x-2 text-red-400">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm font-medium">High Price Impact Warning</span>
            </div>
            <p className="text-xs text-red-300 mt-1">
              This trade will significantly impact the token price. Consider splitting into smaller trades.
            </p>
          </div>
        )}

        {/* Trade Button */}
        <Button
          onClick={executeTrade}
          disabled={isTrading || (!solAmount && !tokenAmount) || !connected}
          className={cn(
            "w-full h-12 text-lg font-semibold",
            tradeType === 'buy' 
              ? "bg-green-600 hover:bg-green-700" 
              : "bg-red-600 hover:bg-red-700"
          )}
        >
          {isTrading ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-5 h-5 mr-2"
              >
                <Zap className="w-5 h-5" />
              </motion.div>
              Processing...
            </>
          ) : !connected ? (
            'Connect Wallet'
          ) : (
            `${tradeType === 'buy' ? 'Buy' : 'Sell'} ${tokenData.symbol}`
          )}
        </Button>

        {/* Bonding Curve Info */}
        {!tokenData.isGraduated && (
          <div className="text-center">
            <p className="text-xs text-gray-400">
              Trading on bonding curve • Progress: {tokenData.bondingCurveProgress.toFixed(1)}%
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}