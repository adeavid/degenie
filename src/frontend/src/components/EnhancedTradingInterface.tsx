'use client';

import { useState } from 'react';
import { useWalletConnection } from '@/hooks/useWalletConnection';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  ArrowUpDown, 
  Settings,
  AlertTriangle,
  Zap,
  DollarSign,
  Coins,
  Wallet,
  Zap as Lightning,
  Target,
  Timer
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

interface EnhancedTradingInterfaceProps {
  tokenData: TokenData;
  onTradeComplete: () => void;
}

const quickBuyAmounts = [0.5, 1, 5, 10];

export function EnhancedTradingInterface({ tokenData, onTradeComplete }: EnhancedTradingInterfaceProps) {
  const { connected, publicKey, connectWallet } = useWalletConnection();
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [solAmount, setSolAmount] = useState<string>('');
  const [tokenAmount, setTokenAmount] = useState<string>('');
  const [slippage, setSlippage] = useState<number>(10);
  const [showSlippageSettings, setShowSlippageSettings] = useState(false);
  const [isTrading, setIsTrading] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);

  const handleQuickBuy = (amount: number) => {
    setSolAmount(amount.toString());
    calculatePreview('buy', amount.toString(), '');
  };

  const calculatePreview = async (type: 'buy' | 'sell', solAmount: string, tokenAmount: string) => {
    if (!solAmount && !tokenAmount) return;

    try {
      const response = await apiService.calculateTrade({
        tokenAddress: tokenData.address,
        amount: parseFloat(solAmount || tokenAmount),
        type,
        inputType: solAmount ? 'sol' : 'token',
        slippage
      });

      if (response.data) {
        setPreviewData(response.data);
      }
    } catch (error) {
      console.error('Preview calculation failed:', error);
    }
  };

  const handleTrade = async () => {
    if (!connected) {
      connectWallet();
      return;
    }

    if (!solAmount && !tokenAmount) {
      toast.error('Please enter an amount');
      return;
    }

    setIsTrading(true);

    try {
      const response = await apiService.executeTrade({
        tokenAddress: tokenData.address,
        type: tradeType,
        solAmount: solAmount ? parseFloat(solAmount) : undefined,
        tokenAmount: tokenAmount ? parseFloat(tokenAmount) : undefined,
        slippage,
        walletAddress: publicKey?.toBase58() || ''
      });

      if (response.data?.success) {
        toast.success(`${tradeType === 'buy' ? 'Bought' : 'Sold'} successfully!`);
        setSolAmount('');
        setTokenAmount('');
        setPreviewData(null);
        onTradeComplete();
      } else {
        toast.error('Trade failed');
      }
    } catch (error) {
      console.error('Trade execution failed:', error);
      toast.error('Trade execution failed');
    } finally {
      setIsTrading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Glassmorphism Trading Card */}
      <Card className="relative overflow-hidden bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-xl border border-gray-700/50 shadow-2xl">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 via-purple-500/5 to-blue-500/5 animate-pulse" />
        
        <div className="relative p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                <Lightning className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-black text-white">Trade {tokenData.symbol}</h3>
                <p className="text-sm text-gray-400">Instant swap on Solana</p>
              </div>
            </div>
            
            <Button
              onClick={() => setShowSlippageSettings(!showSlippageSettings)}
              variant="outline"
              size="sm"
              className="border-gray-600 hover:border-gray-500"
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>

          {/* Slippage Settings */}
          <AnimatePresence>
            {showSlippageSettings && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 p-4 bg-gray-800/50 rounded-lg border border-gray-700"
              >
                <h4 className="text-sm font-semibold mb-3 text-white">Slippage Tolerance</h4>
                <div className="flex space-x-2">
                  {[5, 10, 15].map((value) => (
                    <Button
                      key={value}
                      onClick={() => setSlippage(value)}
                      variant={slippage === value ? 'default' : 'outline'}
                      size="sm"
                      className="flex-1"
                    >
                      {value}%
                    </Button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Trade Type Toggle */}
          <div className="flex rounded-xl bg-gray-800/50 p-1 mb-6">
            <Button
              onClick={() => setTradeType('buy')}
              variant={tradeType === 'buy' ? 'default' : 'ghost'}
              className={cn(
                "flex-1 h-12 rounded-lg font-bold",
                tradeType === 'buy' 
                  ? "bg-gradient-to-r from-green-600 to-green-500 text-white shadow-lg shadow-green-500/25" 
                  : "text-gray-400 hover:text-white"
              )}
            >
              <TrendingUp className="w-5 h-5 mr-2" />
              Buy
            </Button>
            <Button
              onClick={() => setTradeType('sell')}
              variant={tradeType === 'sell' ? 'default' : 'ghost'}
              className={cn(
                "flex-1 h-12 rounded-lg font-bold",
                tradeType === 'sell' 
                  ? "bg-gradient-to-r from-red-600 to-red-500 text-white shadow-lg shadow-red-500/25" 
                  : "text-gray-400 hover:text-white"
              )}
            >
              <TrendingDown className="w-5 h-5 mr-2" />
              Sell
            </Button>
          </div>

          {/* Quick Buy Buttons (only for buy mode) */}
          {tradeType === 'buy' && (
            <div className="mb-6">
              <p className="text-sm font-medium text-gray-300 mb-3">Quick Buy</p>
              <div className="grid grid-cols-4 gap-2">
                {quickBuyAmounts.map((amount) => (
                  <Button
                    key={amount}
                    onClick={() => handleQuickBuy(amount)}
                    variant="outline"
                    size="sm"
                    className="border-gray-600 hover:border-green-500 hover:bg-green-500/10 text-center"
                  >
                    {amount} SOL
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Amount Input */}
          <div className="space-y-4 mb-6">
            <div className="relative">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {tradeType === 'buy' ? 'You Pay (SOL)' : 'You Sell (Tokens)'}
              </label>
              <div className="relative">
                <Input
                  type="number"
                  placeholder="0.00"
                  value={tradeType === 'buy' ? solAmount : tokenAmount}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (tradeType === 'buy') {
                      setSolAmount(value);
                      calculatePreview('buy', value, '');
                    } else {
                      setTokenAmount(value);
                      calculatePreview('sell', '', value);
                    }
                  }}
                  className="h-14 text-lg font-bold bg-gray-800/50 border-gray-600 focus:border-green-500 pl-12"
                />
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                  {tradeType === 'buy' ? (
                    <DollarSign className="w-5 h-5 text-yellow-400" />
                  ) : (
                    <Coins className="w-5 h-5 text-purple-400" />
                  )}
                </div>
              </div>
            </div>

            {/* Swap Arrow */}
            <div className="flex justify-center">
              <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center border border-gray-600">
                <ArrowUpDown className="w-4 h-4 text-gray-400" />
              </div>
            </div>

            <div className="relative">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {tradeType === 'buy' ? 'You Receive (Tokens)' : 'You Receive (SOL)'}
              </label>
              <div className="relative">
                <Input
                  type="number"
                  placeholder="0.00"
                  value={tradeType === 'buy' ? tokenAmount : solAmount}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (tradeType === 'buy') {
                      setTokenAmount(value);
                    } else {
                      setSolAmount(value);
                    }
                  }}
                  className="h-14 text-lg font-bold bg-gray-800/50 border-gray-600 focus:border-purple-500 pl-12"
                  readOnly
                />
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                  {tradeType === 'buy' ? (
                    <Coins className="w-5 h-5 text-purple-400" />
                  ) : (
                    <DollarSign className="w-5 h-5 text-yellow-400" />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Preview Data */}
          {previewData && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-gray-800/30 rounded-lg border border-gray-700/50"
            >
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Price Impact:</span>
                  <span className={cn(
                    "font-medium",
                    previewData.priceImpact > 5 ? "text-red-400" : "text-green-400"
                  )}>
                    {previewData.priceImpact?.toFixed(2)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Min Received:</span>
                  <span className="text-white font-medium">
                    {formatNumber(previewData.minReceived)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Network Fee:</span>
                  <span className="text-white font-medium">
                    {formatPrice(previewData.fees)} SOL
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Warning for High Price Impact */}
          {previewData?.priceImpact > 5 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg"
            >
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                <span className="text-yellow-500 font-medium">High Price Impact</span>
              </div>
              <p className="text-sm text-yellow-400 mt-2">
                This trade will significantly impact the token price. Consider reducing the amount.
              </p>
            </motion.div>
          )}

          {/* Trade Button */}
          <Button
            onClick={handleTrade}
            disabled={isTrading || (!solAmount && !tokenAmount)}
            className={cn(
              "w-full h-14 text-lg font-black rounded-xl transition-all duration-300",
              connected 
                ? tradeType === 'buy'
                  ? "bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 shadow-lg shadow-green-500/25"
                  : "bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 shadow-lg shadow-red-500/25"
                : "bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 shadow-lg shadow-purple-500/25"
            )}
          >
            {isTrading ? (
              <div className="flex items-center space-x-2">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                />
                <span>Processing...</span>
              </div>
            ) : !connected ? (
              <div className="flex items-center space-x-2">
                <Wallet className="w-5 h-5" />
                <span>Connect Wallet</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Zap className="w-5 h-5" />
                <span>{tradeType === 'buy' ? 'Buy' : 'Sell'} {tokenData.symbol}</span>
              </div>
            )}
          </Button>

          {/* Disclaimer */}
          <p className="text-xs text-gray-500 text-center mt-4">
            Trading involves risk. Only trade what you can afford to lose.
          </p>
        </div>
      </Card>

      {/* Stats Card */}
      <Card className="p-4 bg-gradient-to-br from-gray-900/50 to-gray-800/50 border border-gray-700/50">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider">Current Price</p>
            <p className="text-lg font-black text-green-400">
              {formatPrice(tokenData.currentPrice)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider">Bonding Progress</p>
            <p className="text-lg font-black text-purple-400">
              {tokenData.bondingCurveProgress.toFixed(1)}%
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}