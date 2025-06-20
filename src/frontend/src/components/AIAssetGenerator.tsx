'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft,
  ArrowRight,
  Check,
  Image as ImageIcon,
  Film,
  Heart,
  Video,
  CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { AssetStepGenerator } from './AssetStepGenerator';
import { cn } from '@/lib/utils';
import { type GeneratedAsset } from '@/lib/api';

interface GeneratedAssetExtended extends GeneratedAsset {
  isUploaded?: boolean;
  file?: File;
}

interface AIAssetGeneratorProps {
  tokenName: string;
  tokenDescription: string;
  theme: string;
  style: string;
  userId: string;
  onAssetsGenerated: (assets: GeneratedAssetExtended[]) => void;
  selectedAssets: Record<string, string>;
  onAssetSelect: (assetId: string, type: string) => void;
}

const steps = [
  { 
    id: 'logo', 
    name: 'Logo', 
    icon: ImageIcon, 
    required: true,
    description: 'Professional token logo (Required)'
  },
  { 
    id: 'meme', 
    name: 'Meme', 
    icon: Heart, 
    required: false,
    description: 'Viral meme content (Optional)'
  },
  { 
    id: 'gif', 
    name: 'GIF', 
    icon: Film, 
    required: false,
    description: 'Animated content (Optional)'
  },
  { 
    id: 'video', 
    name: 'Video', 
    icon: Video, 
    required: false,
    description: 'Professional video content (Optional)'
  }
];

export function AIAssetGenerator({
  tokenName,
  tokenDescription,
  theme,
  style,
  userId,
  onAssetsGenerated,
  selectedAssets,
  onAssetSelect
}: AIAssetGeneratorProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedAssets, setCompletedAssets] = useState<Record<string, GeneratedAssetExtended>>({});
  const [isComplete, setIsComplete] = useState(false);

  const currentStepConfig = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  // Note: canProceed logic moved to button disabled state

  const handleAssetComplete = (asset: GeneratedAssetExtended) => {
    const stepId = currentStepConfig.id;
    setCompletedAssets(prev => ({
      ...prev,
      [stepId]: asset
    }));

    // Auto-select the asset
    onAssetSelect(asset.id, asset.type);

    // Note: Removed auto-advance - user controls navigation with buttons
  };

  const handleSkip = () => {
    if (!currentStepConfig.required) {
      if (isLastStep) {
        completeFlow();
      } else {
        nextStep();
      }
    }
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const completeFlow = () => {
    const assets = Object.values(completedAssets);
    onAssetsGenerated(assets);
    setIsComplete(true);
  };

  if (isComplete) {
    return (
      <Card className="p-8 bg-gradient-to-r from-green-900/20 to-emerald-900/20 border-green-500/30">
        <div className="text-center space-y-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-20 h-20 mx-auto bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center"
          >
            <CheckCircle className="w-10 h-10 text-white" />
          </motion.div>
          
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Assets Complete! 🎉</h2>
            <p className="text-gray-300">
              {Object.keys(completedAssets).length} asset(s) ready for your token
            </p>
          </div>

          {/* Asset Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {Object.entries(completedAssets).map(([stepId, asset]) => {
              const stepConfig = steps.find(s => s.id === stepId);
              if (!stepConfig) return null;
              
              const Icon = stepConfig.icon;
              return (
                <motion.div
                  key={stepId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gray-800/50 rounded-lg p-4 text-center"
                >
                  <Icon className="w-8 h-8 mx-auto mb-2 text-green-400" />
                  <div className="text-sm font-medium text-white">{stepConfig.name}</div>
                  <div className="text-xs text-gray-400">
                    {asset.isUploaded ? 'Uploaded' : 'AI Generated'}
                  </div>
                </motion.div>
              );
            })}
          </div>

          <Button
            onClick={() => {
              setIsComplete(false);
              setCurrentStep(0);
            }}
            variant="outline"
            className="border-gray-600 text-gray-300 hover:bg-gray-800"
          >
            Modify Assets
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <Card className="p-6 bg-gray-800/50 border-gray-700">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">AI Asset Generation</h2>
            <div className="text-sm text-gray-400">
              Step {currentStep + 1} of {steps.length}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-700 rounded-full h-2">
            <motion.div
              className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>

          {/* Steps */}
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isCompleted = completedAssets[step.id];
              const isCurrent = index === currentStep;
              const isPast = index < currentStep;
              
              return (
                <div 
                  key={step.id}
                  className={cn(
                    "flex flex-col items-center space-y-2 flex-1",
                    index > 0 && "ml-4"
                  )}
                >
                  <motion.div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all",
                      isCompleted 
                        ? "bg-green-500 border-green-500 text-white"
                        : isCurrent
                          ? "border-purple-500 text-purple-400 bg-purple-500/20"
                          : isPast
                            ? "border-gray-500 text-gray-400"
                            : "border-gray-600 text-gray-500"
                    )}
                    animate={{ scale: isCurrent ? 1.1 : 1 }}
                  >
                    {isCompleted ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </motion.div>
                  
                  <div className="text-center">
                    <div className={cn(
                      "text-sm font-medium",
                      isCompleted 
                        ? "text-green-400"
                        : isCurrent
                          ? "text-white"
                          : "text-gray-400"
                    )}>
                      {step.name}
                      {step.required && <span className="text-red-400 ml-1">*</span>}
                    </div>
                    <div className="text-xs text-gray-500 hidden md:block">
                      {step.required ? 'Required' : 'Optional'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Current Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          <AssetStepGenerator
            assetType={currentStepConfig.id as 'logo' | 'meme' | 'gif' | 'video'}
            tokenName={tokenName}
            tokenDescription={tokenDescription}
            theme={theme}
            style={style}
            userId={userId}
            isRequired={currentStepConfig.required}
            onAssetComplete={handleAssetComplete}
            onSkip={handleSkip}
          />
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          onClick={prevStep}
          disabled={currentStep === 0}
          variant="outline"
          className="border-gray-600 text-gray-300 hover:bg-gray-800"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>

        <div className="flex items-center space-x-2 text-sm">
          {completedAssets[currentStepConfig.id] ? (
            <span className="text-green-400 flex items-center">
              <CheckCircle className="w-4 h-4 mr-1" />
              {currentStepConfig.name} completed - Ready to continue
            </span>
          ) : (
            <span className="text-gray-400">
              {Object.keys(completedAssets).length} of {steps.length} assets completed
            </span>
          )}
        </div>

        <Button
          onClick={isLastStep ? completeFlow : nextStep}
          disabled={currentStepConfig.required && !completedAssets[currentStepConfig.id]}
          className={cn(
            "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700",
            completedAssets[currentStepConfig.id] && !isLastStep && "animate-pulse border-2 border-green-400"
          )}
        >
          {isLastStep ? (
            <>
              Complete
              <CheckCircle className="w-4 h-4 ml-2" />
            </>
          ) : (
            <>
              {completedAssets[currentStepConfig.id] ? 'Continue' : 'Next'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}