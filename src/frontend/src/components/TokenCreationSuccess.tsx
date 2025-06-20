import { motion } from 'framer-motion';
import { Check, ExternalLink, Copy, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { formatAddress } from '@/lib/utils';
import toast from 'react-hot-toast';

interface TokenCreationSuccessProps {
  tokenData: {
    name: string;
    symbol: string;
    tokenAddress: string;
    mintKey?: string;
    signature?: string;
    logoUrl?: string;
  };
  onViewDashboard: () => void;
  onCreateAnother: () => void;
}

export function TokenCreationSuccess({ 
  tokenData, 
  onViewDashboard, 
  onCreateAnother 
}: TokenCreationSuccessProps) {
  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    toast.success('Address copied to clipboard');
  };

  const shareToken = () => {
    const shareText = `🚀 Just launched ${tokenData.name} ($${tokenData.symbol}) on DeGenie!

Contract: ${tokenData.tokenAddress}

#DeFi #Solana #MemeCoins`;
    
    if (navigator.share) {
      navigator.share({
        title: `${tokenData.name} Token Launch`,
        text: shareText,
        url: window.location.origin
      });
    } else {
      navigator.clipboard.writeText(shareText);
      toast.success('Share text copied to clipboard');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="min-h-screen flex items-center justify-center p-4"
    >
      <Card className="max-w-md w-full bg-gray-800/50 border-gray-700 text-center">
        <div className="p-8">
          {/* Success Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="mx-auto w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-6"
          >
            <Check className="w-8 h-8 text-white" />
          </motion.div>

          {/* Token Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-2xl font-bold text-white mb-2">
              🎉 Token Created Successfully!
            </h2>
            <p className="text-gray-400 mb-6">
              Your token is now live on the Solana blockchain
            </p>

            {/* Token Display */}
            <div className="bg-gray-900/50 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-center space-x-3 mb-3">
                {tokenData.logoUrl && (
                  <img 
                    src={tokenData.logoUrl} 
                    alt={tokenData.name}
                    className="w-10 h-10 rounded-full"
                  />
                )}
                <div>
                  <h3 className="text-lg font-semibold text-white">{tokenData.name}</h3>
                  <p className="text-gray-400">${tokenData.symbol}</p>
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Contract Address:</span>
                  <div className="flex items-center space-x-1">
                    <span className="text-white font-mono">
                      {formatAddress(tokenData.tokenAddress)}
                    </span>
                    <button
                      onClick={() => copyAddress(tokenData.tokenAddress)}
                      className="text-purple-400 hover:text-purple-300 transition-colors"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                
                {tokenData.signature && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Transaction:</span>
                    <div className="flex items-center space-x-1">
                      <span className="text-white font-mono">
                        {formatAddress(tokenData.signature)}
                      </span>
                      <a
                        href={`https://solscan.io/tx/${tokenData.signature}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-400 hover:text-purple-300 transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-3"
          >
            <Button
              onClick={onViewDashboard}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              View in Dashboard
            </Button>
            
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={shareToken}
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                <Share2 className="w-4 h-4 mr-1" />
                Share
              </Button>
              
              <Button
                onClick={onCreateAnother}
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                Create Another
              </Button>
            </div>
          </motion.div>

          {/* Next Steps */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-6 p-4 bg-blue-500/10 rounded-lg border border-blue-500/20"
          >
            <h4 className="text-blue-400 font-medium mb-2">What&apos;s Next?</h4>
            <ul className="text-sm text-gray-300 space-y-1 text-left">
              <li>• Your token is now tradeable on DEXs</li>
              <li>• Share it on social media to build community</li>
              <li>• Monitor progress in your dashboard</li>
              <li>• Add liquidity to increase trading volume</li>
            </ul>
          </motion.div>
        </div>
      </Card>
    </motion.div>
  );
}