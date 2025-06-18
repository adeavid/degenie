'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Wand2, 
  Upload as UploadIcon, 
  SkipForward, 
  Loader2,
  Image as ImageIcon,
  Film,
  Heart,
  Video,
  Check,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { FileUploadComponent } from './FileUploadComponent';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import { apiService, type AIGenerationRequest, type GeneratedAsset } from '@/lib/api';

interface AssetStepGeneratorProps {
  assetType: 'logo' | 'meme' | 'gif' | 'video';
  tokenName: string;
  tokenDescription: string;
  theme: string;
  style: string;
  userId: string;
  isRequired?: boolean;
  onAssetComplete: (asset: GeneratedAsset | UploadedAsset) => void;
  onSkip?: () => void;
  className?: string;
}

interface UploadedAsset {
  id: string;
  type: 'logo' | 'meme' | 'gif' | 'video';
  url: string;
  prompt: string;
  isUploaded: true;
  file: File;
}

const assetConfig = {
  logo: {
    name: 'Logo',
    icon: ImageIcon,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
    borderColor: 'border-blue-500/30',
    defaultPrompt: 'Create a professional cryptocurrency logo with clean lines, modern typography, and crypto symbols',
    placeholder: 'e.g., "Golden coin with lightning bolt, minimalist design, tech aesthetic"'
  },
  meme: {
    name: 'Meme',
    icon: Heart,
    color: 'text-pink-400',
    bgColor: 'bg-pink-500/20',
    borderColor: 'border-pink-500/30',
    defaultPrompt: 'Create a viral meme image with humor, relatable content, and engaging visual elements',
    placeholder: 'e.g., "Doge dog with sunglasses holding cryptocurrency, funny expression"'
  },
  gif: {
    name: 'GIF',
    icon: Film,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/20',
    borderColor: 'border-purple-500/30',
    defaultPrompt: 'Create an engaging animated GIF with smooth motion, eye-catching effects, and crypto theme',
    placeholder: 'e.g., "Rocket ship flying to the moon with coin trails, space background"'
  },
  video: {
    name: 'Video',
    icon: Video,
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/20',
    borderColor: 'border-orange-500/30',
    defaultPrompt: 'Create a professional cinematic video with dynamic scenes, smooth camera movements, and crypto theme',
    placeholder: 'e.g., "Cinematic shot of cryptocurrency exchange, trading floor atmosphere, modern tech"'
  }
};

export function AssetStepGenerator({
  assetType,
  tokenName,
  tokenDescription,
  theme,
  style,
  userId,
  isRequired = false,
  onAssetComplete,
  onSkip,
  className
}: AssetStepGeneratorProps) {
  const [mode, setMode] = useState<'choose' | 'generate' | 'upload' | 'preview'>('choose');
  const [prompt, setPrompt] = useState(assetConfig[assetType]?.defaultPrompt || '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedAsset, setGeneratedAsset] = useState<GeneratedAsset | null>(null);
  const [uploadedAsset, setUploadedAsset] = useState<UploadedAsset | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  const config = assetConfig[assetType];

  console.log(`[AssetStepGenerator] Rendering ${assetType} in mode: ${mode}`, {
    assetType,
    mode,
    config: config ? 'found' : 'missing',
    isRequired
  });

  const handleGenerate = async () => {
    console.log(`[AssetStepGenerator] Generate clicked for ${assetType}`, {
      prompt: prompt.trim(),
      hasPrompt: !!prompt.trim()
    });
    
    if (!prompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }

    setIsGenerating(true);
    try {
      const request: AIGenerationRequest = {
        name: tokenName,
        description: prompt,
        theme,
        style,
        userId
      };

      let result;
      switch (assetType) {
        case 'logo':
          result = await apiService.generateLogo(request);
          break;
        case 'meme':
          result = await apiService.generateMeme(request);
          break;
        case 'gif':
          result = await apiService.generateGif(request);
          break;
        case 'video':
          result = await apiService.generateVideo(request);
          break;
      }

      if (result.error) {
        throw new Error(result.error);
      }

      if (result.data) {
        const asset: GeneratedAsset = {
          ...result.data,
          id: `${assetType}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: assetType,
          prompt
        };
        setGeneratedAsset(asset);
        setMode('preview');
        toast.success(`${config.name} generated successfully!`);
      }
    } catch (error) {
      console.error(`${config.name} generation failed:`, error);
      toast.error(error instanceof Error ? error.message : `Failed to generate ${assetType}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFileUpload = (file: File, preview: string) => {
    const uploadedAsset: UploadedAsset = {
      id: `uploaded-${assetType}-${Date.now()}`,
      type: assetType,
      url: preview,
      prompt: `Uploaded ${assetType}: ${file.name}`,
      isUploaded: true,
      file
    };
    setUploadedAsset(uploadedAsset);
    setMode('preview');
    toast.success(`${config.name} uploaded successfully!`);
  };

  const confirmAsset = () => {
    if (isConfirming) return; // Prevent double-clicks
    
    const asset = generatedAsset || uploadedAsset;
    if (asset) {
      setIsConfirming(true);
      onAssetComplete(asset);
      // Reset after completion
      setTimeout(() => setIsConfirming(false), 1000);
    }
  };

  const handleSkip = () => {
    if (onSkip) {
      onSkip();
    }
  };

  const Icon = config.icon;

  // Choose Mode: Generate or Upload
  if (mode === 'choose') {
    return (
      <div className={cn("p-6 bg-gray-800 border border-gray-700 rounded-lg shadow-md", config.bgColor, className)}>
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center">
            <div className={cn("w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4", config.bgColor)}>
              <Icon className={cn("w-8 h-8", config.color)} />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              {config.name} {isRequired && <span className="text-red-400">*</span>}
            </h2>
            <p className="text-gray-400">
              {isRequired 
                ? 'Required: Choose how to add your logo' 
                : `Optional: Add a ${assetType} to enhance your token`
              }
            </p>
          </div>

          {/* Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Generate Option */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div 
                className={cn(
                  "p-6 cursor-pointer border-2 transition-all hover:border-purple-500 bg-gray-800 rounded-lg shadow-md",
                  "border-gray-700 hover:bg-gray-800/50"
                )}
                onClick={() => {
                  console.log(`[AssetStepGenerator] Switching to generate mode for ${assetType}`);
                  setMode('generate');
                }}
              >
                <div className="text-center space-y-3">
                  <Wand2 className="w-12 h-12 mx-auto text-purple-400" />
                  <h3 className="text-lg font-semibold text-white">AI Generate</h3>
                  <p className="text-gray-400 text-sm">
                    Create with AI using your prompt
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Upload Option */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div 
                className={cn(
                  "p-6 cursor-pointer border-2 transition-all hover:border-green-500 bg-gray-800 rounded-lg shadow-md",
                  "border-gray-700 hover:bg-gray-800/50"
                )}
                onClick={() => {
                  console.log(`[AssetStepGenerator] Switching to upload mode for ${assetType}`);
                  setMode('upload');
                }}
              >
                <div className="text-center space-y-3">
                  <UploadIcon className="w-12 h-12 mx-auto text-green-400" />
                  <h3 className="text-lg font-semibold text-white">Upload File</h3>
                  <p className="text-gray-400 text-sm">
                    Upload your own {assetType} file
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Skip Option */}
          {!isRequired && (
            <div className="text-center pt-4 border-t border-gray-700">
              <Button 
                onClick={handleSkip}
                variant="outline"
                className="border-gray-600 text-gray-400 hover:bg-gray-800"
              >
                <SkipForward className="w-4 h-4 mr-2" />
                Skip {config.name}
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Generate Mode
  if (mode === 'generate') {
    return (
      <div className={cn("p-6 bg-gray-800 border border-gray-700 rounded-lg shadow-md", className)}>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Icon className={cn("w-6 h-6", config.color)} />
              <h2 className="text-xl font-bold text-white">Generate {config.name}</h2>
            </div>
            <button 
              onClick={() => setMode('choose')}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Prompt Input */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-300">
              Describe your {assetType}
            </label>
            <Input
              placeholder={config.placeholder}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
            />
            <p className="text-xs text-gray-500">
              Default: {config.defaultPrompt}
            </p>
          </div>

          {/* Generate Button */}
          <Button 
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            className={cn(
              "w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700",
              isGenerating && "opacity-50 cursor-not-allowed"
            )}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating {config.name}...
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4 mr-2" />
                Generate {config.name}
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  // Upload Mode
  if (mode === 'upload') {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Icon className={cn("w-6 h-6", config.color)} />
            <h2 className="text-xl font-bold text-white">Upload {config.name}</h2>
          </div>
          <button 
            onClick={() => setMode('choose')}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <FileUploadComponent 
          assetType={assetType}
          onFileSelect={handleFileUpload}
        />
      </div>
    );
  }

  // Preview Mode
  if (mode === 'preview') {
    const asset = generatedAsset || uploadedAsset;
    if (!asset) return null;

    return (
      <div className={cn("p-6 bg-gray-800 border border-gray-700 rounded-lg shadow-md", className)}>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Icon className={cn("w-6 h-6", config.color)} />
              <h2 className="text-xl font-bold text-white">Preview {config.name}</h2>
            </div>
            <button 
              onClick={() => setMode('choose')}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Asset Preview */}
          <div className="bg-gray-900 rounded-lg p-4 flex items-center justify-center min-h-[200px]">
            {assetType === 'video' ? (
              <video 
                src={asset.url} 
                controls 
                className="max-h-48 rounded"
                style={{ maxWidth: '100%' }}
              />
            ) : (
              <img 
                src={asset.url} 
                alt={`Generated ${assetType}`}
                className="max-h-48 max-w-full rounded"
              />
            )}
          </div>

          {/* Asset Info */}
          <div className="text-sm text-gray-400">
            <div><strong>Type:</strong> {config.name}</div>
            <div><strong>Source:</strong> {uploadedAsset ? 'Uploaded' : 'AI Generated'}</div>
            <div><strong>Prompt:</strong> {asset.prompt}</div>
          </div>

          {/* Actions */}
          <div className="flex space-x-3">
            <Button 
              onClick={confirmAsset}
              disabled={isConfirming}
              className={cn(
                "flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700",
                isConfirming && "opacity-50 cursor-not-allowed"
              )}
            >
              {isConfirming ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Using {config.name}...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Use This {config.name}
                </>
              )}
            </Button>
            <Button 
              onClick={() => {
                setGeneratedAsset(null);
                setUploadedAsset(null);
                setMode('choose');
              }}
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              Choose Different
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}