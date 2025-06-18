'use client';

import { useState, useRef, useEffect } from 'react';

// Force this page to be client-side only
export const dynamic = 'force-dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import { useWalletConnection } from '@/hooks/useWalletConnection';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wand2, 
  Upload, 
  Eye,
  Sparkles,
  RefreshCw,
  Check,
  ArrowLeft,
  ArrowRight,
  Rocket,
  Loader2,
  Image as ImageIcon,
  Film,
  Heart,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import { apiService, type GeneratedAsset as ApiGeneratedAsset } from '@/lib/api';
import { TokenCreationSuccess } from '@/components/TokenCreationSuccess';
import { AIAssetGenerator } from '@/components/AIAssetGenerator';
import { authService } from '@/lib/auth';

interface TokenFormData {
  name: string;
  symbol: string;
  description: string;
  totalSupply: string;
  website?: string;
  twitter?: string;
  telegram?: string;
  theme: string;
  style: string;
}

interface GeneratedAsset {
  id: string;
  type: 'logo' | 'meme' | 'gif';
  url: string;
  prompt: string;
  isSelected: boolean;
  ipfsHash?: string;
}

const themes = [
  { id: 'meme', name: 'Meme Coin', emoji: '😂', description: 'Fun and viral meme token' },
  { id: 'gaming', name: 'Gaming', emoji: '🎮', description: 'Gaming and NFT focused' },
  { id: 'defi', name: 'DeFi', emoji: '🏦', description: 'Decentralized finance utility' },
  { id: 'animal', name: 'Animal', emoji: '🐕', description: 'Cute animal themed' },
  { id: 'ai', name: 'AI/Tech', emoji: '🤖', description: 'AI and technology focused' },
  { id: 'space', name: 'Space', emoji: '🚀', description: 'Space and cosmic themed' }
];

const steps = [
  { id: 1, name: 'Token Details', description: 'Basic token information' },
  { id: 2, name: 'AI Generation', description: 'Generate logos and assets' },
  { id: 3, name: 'Tokenomics', description: 'Configure economics' },
  { id: 4, name: 'Preview & Deploy', description: 'Review and launch' }
];

export default function CreateToken() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Support both Ethereum and Solana wallets - using safe hook
  const { 
    connected, 
    address, 
    isEthConnected, 
    isSolConnected, 
    ethAddress, 
    solanaAddress 
  } = useWalletConnection();
  
  const publicKey = isEthConnected 
    ? ethAddress 
    : solanaAddress;
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [formData, setFormData] = useState<TokenFormData>({
    name: searchParams?.get('name') || '',
    symbol: '',
    description: '',
    totalSupply: '1000000000',
    theme: 'meme',
    style: 'vibrant'
  });
  const [generatedAssets, setGeneratedAssets] = useState<GeneratedAsset[]>([]);
  const [selectedAssets, setSelectedAssets] = useState<Record<string, string>>({});
  const [deploymentSuccess, setDeploymentSuccess] = useState<any>(null);

  useEffect(() => {
    console.log('[CreateToken] Wallet state:', { connected, isEthConnected, isSolConnected, ethAddress, solanaAddress });
    
    // Add delay to allow wallet state to stabilize
    const checkWallet = setTimeout(() => {
      if (!connected) {
        console.log('[CreateToken] No wallet connected after delay, redirecting to home');
        toast.error('Please connect your wallet to create a token');
        router.push('/');
      } else if (publicKey) {
        // Auto-login user when wallet is connected
        const walletAddress = typeof publicKey === 'string' 
          ? publicKey 
          : publicKey.toString();
        console.log('[CreateToken] Auto-login with wallet:', walletAddress);
        authService.loginWithWallet(walletAddress).catch(console.error);
      }
    }, 1000); // Wait 1 second for wallet state to stabilize

    return () => clearTimeout(checkWallet);
  }, [connected, publicKey, router, isEthConnected, isSolConnected, ethAddress, solanaAddress]);

  const updateFormData = (field: keyof TokenFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };


  const selectAsset = (assetId: string, type: string) => {
    setSelectedAssets(prev => ({ ...prev, [type]: assetId }));
  };

  const deployToken = async () => {
    if (!connected || !publicKey) {
      toast.error('Please connect your wallet');
      return;
    }

    try {
      setIsGenerating(true);
      toast.loading('Deploying token to Solana...', { duration: 1000 });
      
      // Get selected logo URL
      const selectedLogo = generatedAssets.find(asset => 
        asset.id === selectedAssets.logo && asset.type === 'logo'
      );
      
      const result = await apiService.deployToken({
        name: formData.name,
        symbol: formData.symbol,
        description: formData.description,
        totalSupply: formData.totalSupply,
        logoUrl: selectedLogo?.url,
        walletAddress: typeof publicKey === 'string' ? publicKey : publicKey.toString(),
        network: 'solana'
      });

      if (result.error) {
        throw new Error(result.error);
      }

      console.log('🚀 [Token Deploy] Full result:', result);
      
      if (result.data) {
        console.log('🚀 [Token Deploy] Backend response data:', JSON.stringify(result.data, null, 2));
        
        // Fix: Access nested data structure correctly
        const deploymentData = result.data.data || result.data;
        console.log('🔍 [Token Deploy] tokenAddress received:', deploymentData.tokenAddress);
        console.log('🔍 [Token Deploy] transactionHash received:', deploymentData.transactionHash);
        
        // Store deployment info for dashboard
        const deploymentInfo = {
          ...formData,
          tokenAddress: deploymentData.tokenAddress,
          mintKey: deploymentData.mintKey,
          signature: deploymentData.transactionHash, // Use transactionHash as signature
          createdAt: Date.now(),
          isDeployed: true,
          logoUrl: selectedLogo?.url
        };
        
        // Store in localStorage temporarily (in real app, this would be in database)
        const existingTokens = JSON.parse(localStorage.getItem('userTokens') || '[]');
        existingTokens.push(deploymentInfo);
        localStorage.setItem('userTokens', JSON.stringify(existingTokens));
        
        // Show success page
        setDeploymentSuccess({
          name: formData.name,
          symbol: formData.symbol,
          tokenAddress: deploymentData.tokenAddress,
          mintKey: deploymentData.mintKey,
          signature: deploymentData.transactionHash,
          logoUrl: selectedLogo?.url
        });
        
        toast.success('Token deployed successfully! 🎉');
      } else {
        throw new Error('No deployment data received');
      }
    } catch (error) {
      console.error('Token deployment failed:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to deploy token. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Don't show "not connected" immediately - give wallet time to initialize
  const [showConnectPrompt, setShowConnectPrompt] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowConnectPrompt(true);
    }, 2000); // Wait 2 seconds before showing connect prompt
    
    return () => clearTimeout(timer);
  }, []);

  if (!connected && showConnectPrompt) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Connect Your Wallet</h2>
          <p className="text-gray-400 mb-6">You need to connect your wallet to create a token</p>
          <Button onClick={() => router.push('/')}>Go Back</Button>
        </Card>
      </div>
    );
  }
  
  // Show loading while wallet is initializing
  if (!connected && !showConnectPrompt) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Initializing Wallet...</h2>
          <p className="text-gray-400 mb-6">Please wait while we detect your wallet connection</p>
        </Card>
      </div>
    );
  }

  // Show success page after deployment
  if (deploymentSuccess) {
    return (
      <TokenCreationSuccess
        tokenData={deploymentSuccess}
        onViewDashboard={() => router.push('/dashboard')}
        onCreateAnother={() => {
          setDeploymentSuccess(null);
          setCurrentStep(1);
          setFormData({
            name: '',
            symbol: '',
            description: '',
            totalSupply: '1000000000',
            theme: 'meme',
            style: 'vibrant'
          });
          setGeneratedAssets([]);
          setSelectedAssets({});
        }}
      />
    );
  }

  return (
    <div className="min-h-screen pb-16 md:pb-0">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="outline"
            onClick={() => router.push('/')}
            className="mb-4 border-gray-600 text-gray-300 hover:bg-gray-800"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
          <h1 className="text-3xl font-bold text-white mb-2">Create Your Token</h1>
          <p className="text-gray-400">Launch your token with AI-generated assets in minutes</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium border-2 transition-colors",
                  currentStep >= step.id
                    ? "bg-purple-600 border-purple-600 text-white"
                    : "border-gray-600 text-gray-400"
                )}>
                  {currentStep > step.id ? <Check className="w-5 h-5" /> : step.id}
                </div>
                <div className="ml-3 hidden md:block">
                  <div className={cn(
                    "text-sm font-medium",
                    currentStep >= step.id ? "text-white" : "text-gray-400"
                  )}>
                    {step.name}
                  </div>
                  <div className="text-xs text-gray-500">{step.description}</div>
                </div>
                {index < steps.length - 1 && (
                  <div className={cn(
                    "w-16 h-0.5 mx-4",
                    currentStep > step.id ? "bg-purple-600" : "bg-gray-600"
                  )} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Step 1: Token Details */}
            {currentStep === 1 && (
              <Card className="bg-gray-800/50 border-gray-700">
                <div className="p-6">
                  <h2 className="text-xl font-bold text-white mb-6">Token Details</h2>
                  
                  <div className="space-y-6">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Token Name *
                        </label>
                        <Input
                          placeholder="e.g. DogeCoin"
                          value={formData.name}
                          onChange={(e) => updateFormData('name', e.target.value)}
                          className="bg-gray-800 border-gray-600 text-white"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Symbol *
                        </label>
                        <Input
                          placeholder="e.g. DOGE"
                          value={formData.symbol}
                          onChange={(e) => updateFormData('symbol', e.target.value.toUpperCase())}
                          className="bg-gray-800 border-gray-600 text-white"
                          maxLength={8}
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Description *
                      </label>
                      <textarea
                        placeholder="Describe your token concept, use case, and vision..."
                        value={formData.description}
                        onChange={(e) => updateFormData('description', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        rows={4}
                        required
                      />
                    </div>

                    {/* Theme Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-4">
                        Choose Theme
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {themes.map((theme) => (
                          <button
                            key={theme.id}
                            onClick={() => updateFormData('theme', theme.id)}
                            className={cn(
                              "p-4 rounded-lg border-2 text-left transition-all hover:scale-105",
                              formData.theme === theme.id
                                ? "border-purple-500 bg-purple-500/20"
                                : "border-gray-600 bg-gray-800/50 hover:border-gray-500"
                            )}
                          >
                            <div className="text-2xl mb-2">{theme.emoji}</div>
                            <div className="text-white font-medium text-sm">{theme.name}</div>
                            <div className="text-gray-400 text-xs">{theme.description}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Social Links */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-4">
                        Social Links (Optional)
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Input
                          placeholder="Website URL"
                          value={formData.website || ''}
                          onChange={(e) => updateFormData('website', e.target.value)}
                          className="bg-gray-800 border-gray-600 text-white"
                        />
                        <Input
                          placeholder="Twitter URL"
                          value={formData.twitter || ''}
                          onChange={(e) => updateFormData('twitter', e.target.value)}
                          className="bg-gray-800 border-gray-600 text-white"
                        />
                        <Input
                          placeholder="Telegram URL"
                          value={formData.telegram || ''}
                          onChange={(e) => updateFormData('telegram', e.target.value)}
                          className="bg-gray-800 border-gray-600 text-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Step 2: AI Generation */}
            {currentStep === 2 && (
              <AIAssetGenerator
                tokenName={formData.name}
                tokenDescription={formData.description}
                theme={formData.theme}
                style={formData.style}
                userId={publicKey?.toString() || ''}
                onAssetsGenerated={(assets) => {
                  const convertedAssets: GeneratedAsset[] = assets.map(asset => ({
                    ...asset,
                    isSelected: false
                  }));
                  setGeneratedAssets(convertedAssets);
                }}
                selectedAssets={selectedAssets}
                onAssetSelect={selectAsset}
              />
            )}

            {/* Step 3: Tokenomics */}
            {currentStep === 3 && (
              <Card className="bg-gray-800/50 border-gray-700">
                <div className="p-6">
                  <h2 className="text-xl font-bold text-white mb-6">Tokenomics</h2>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Total Supply
                      </label>
                      <Input
                        type="number"
                        placeholder="1000000000"
                        value={formData.totalSupply}
                        onChange={(e) => updateFormData('totalSupply', e.target.value)}
                        className="bg-gray-800 border-gray-600 text-white"
                      />
                      <p className="text-gray-400 text-xs mt-1">Total number of tokens to be minted</p>
                    </div>

                    {/* Bonding Curve Info */}
                    <div className="bg-gray-900/50 rounded-lg p-4">
                      <h3 className="text-lg font-medium text-white mb-3">Bonding Curve Configuration</h3>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Graduation Threshold:</span>
                          <span className="text-white">500 SOL</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Platform Fee:</span>
                          <span className="text-white">1%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Creator Fee:</span>
                          <span className="text-white">1%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Initial Price:</span>
                          <span className="text-white">~$0.000001</span>
                        </div>
                      </div>
                      <p className="text-gray-400 text-xs mt-3">
                        After graduation, liquidity will be added to Raydium and LP tokens burned for permanent liquidity.
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Step 4: Preview & Deploy */}
            {currentStep === 4 && (
              <Card className="bg-gray-800/50 border-gray-700">
                <div className="p-6">
                  <h2 className="text-xl font-bold text-white mb-6">Preview & Deploy</h2>
                  
                  <div className="space-y-6">
                    {/* Token Preview */}
                    <div className="bg-gray-900/50 rounded-lg p-6">
                      <div className="flex items-center space-x-4 mb-4">
                        <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                          {formData.symbol.charAt(0)}
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-white">{formData.name}</h3>
                          <p className="text-gray-400">${formData.symbol}</p>
                        </div>
                      </div>
                      <p className="text-gray-300 mb-4">{formData.description}</p>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-400">Total Supply:</span>
                          <span className="text-white ml-2">{Number(formData.totalSupply).toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Theme:</span>
                          <span className="text-white ml-2 capitalize">{formData.theme}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Network:</span>
                          <span className="text-white ml-2">Solana</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Type:</span>
                          <span className="text-white ml-2">Bonding Curve</span>
                        </div>
                      </div>
                    </div>

                    {/* Deployment */}
                    <div className="text-center">
                      <Button
                        onClick={deployToken}
                        disabled={isGenerating}
                        size="lg"
                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                      >
                        {isGenerating ? (
                          <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Deploying Token...
                          </>
                        ) : (
                          <>
                            <Rocket className="w-5 h-5 mr-2" />
                            Deploy Token
                          </>
                        )}
                      </Button>
                      <p className="text-gray-400 text-sm mt-2">
                        This will create your token on Solana with a bonding curve
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <Button
            onClick={prevStep}
            disabled={currentStep === 1}
            variant="outline"
            className="border-gray-600 text-gray-300 hover:bg-gray-800"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>
          
          {currentStep < steps.length ? (
            <Button
              onClick={nextStep}
              disabled={
                (currentStep === 1 && (!formData.name || !formData.symbol || !formData.description)) ||
                (currentStep === 2 && generatedAssets.length === 0)
              }
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}