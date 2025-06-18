'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, Eye, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  assetType: 'logo' | 'meme' | 'gif' | 'video';
  onFileSelect: (file: File, preview: string) => void;
  maxSize?: number; // in MB
  className?: string;
}

const fileTypeConfig = {
  logo: {
    accept: '.png,.jpg,.jpeg,.svg',
    maxSize: 5, // 5MB
    description: 'PNG, JPG, or SVG up to 5MB',
    preview: true
  },
  meme: {
    accept: '.png,.jpg,.jpeg',
    maxSize: 10, // 10MB
    description: 'PNG or JPG up to 10MB',
    preview: true
  },
  gif: {
    accept: '.gif',
    maxSize: 20, // 20MB
    description: 'GIF up to 20MB',
    preview: true
  },
  video: {
    accept: '.mp4,.mov,.webm',
    maxSize: 100, // 100MB
    description: 'MP4, MOV, or WebM up to 100MB',
    preview: false // Video preview more complex
  }
};

export function FileUploadComponent({ 
  assetType, 
  onFileSelect, 
  maxSize,
  className 
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const config = fileTypeConfig[assetType];
  const fileSizeLimit = maxSize || config.maxSize;

  const handleFileSelect = (file: File) => {
    // Validate file type
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!config.accept.includes(fileExtension)) {
      alert(`Invalid file type. Please select: ${config.description}`);
      return;
    }

    // Validate file size
    if (file.size > fileSizeLimit * 1024 * 1024) {
      alert(`File too large. Maximum size: ${fileSizeLimit}MB`);
      return;
    }

    setSelectedFile(file);

    // Create preview
    if (config.preview && (file.type.startsWith('image/') || file.type === 'image/gif')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const preview = e.target?.result as string;
        setPreviewUrl(preview);
      };
      reader.readAsDataURL(file);
    } else if (assetType === 'video') {
      // For video, create a simple preview with file info
      const videoUrl = URL.createObjectURL(file);
      setPreviewUrl(videoUrl);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const confirmUpload = () => {
    if (selectedFile && previewUrl) {
      setIsUploading(true);
      onFileSelect(selectedFile, previewUrl);
      // Reset after a delay to show success
      setTimeout(() => {
        setIsUploading(false);
      }, 1000);
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (selectedFile && previewUrl) {
    return (
      <div className={cn("p-6 bg-gray-800 border border-gray-700 rounded-lg shadow-md", className)}>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Preview {assetType}</h3>
            <button 
              onClick={clearSelection}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Preview */}
          <div className="relative bg-gray-900 rounded-lg p-4 min-h-[200px] flex items-center justify-center">
            {assetType === 'video' ? (
              <video 
                src={previewUrl} 
                controls 
                className="max-h-48 rounded"
                style={{ maxWidth: '100%' }}
              />
            ) : (
              <img 
                src={previewUrl} 
                alt={`${assetType} preview`}
                className="max-h-48 max-w-full rounded"
              />
            )}
          </div>

          {/* File Info */}
          <div className="text-sm text-gray-400">
            <div>File: {selectedFile.name}</div>
            <div>Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB</div>
            <div>Type: {selectedFile.type || 'Unknown'}</div>
          </div>

          {/* Actions */}
          <div className="flex space-x-3">
            <Button 
              onClick={confirmUpload}
              disabled={isUploading}
              className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            >
              {isUploading ? (
                <>
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-4 h-4 mr-2"
                  >
                    ⏳
                  </motion.div>
                  Uploading...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Use This {assetType}
                </>
              )}
            </Button>
            <Button 
              onClick={clearSelection}
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

  return (
    <div 
      className={cn(
        "p-6 border-2 border-dashed transition-all duration-200 cursor-pointer bg-gray-800 rounded-lg shadow-md",
        isDragging 
          ? "border-purple-500 bg-purple-500/10" 
          : "border-gray-600 hover:border-gray-500",
        className
      )}
      onDrop={handleDrop}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onClick={() => fileInputRef.current?.click()}
    >
      <div className="text-center space-y-4">
        <motion.div 
          animate={{ 
            scale: isDragging ? 1.1 : 1,
            rotate: isDragging ? 5 : 0 
          }}
          className="mx-auto w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center"
        >
          <Upload className="w-8 h-8 text-white" />
        </motion.div>

        <div>
          <h3 className="text-lg font-semibold text-white mb-2">
            Upload {assetType} file
          </h3>
          <p className="text-gray-400 text-sm mb-4">
            {config.description}
          </p>
          <p className="text-gray-500 text-xs">
            Drag and drop or click to browse
          </p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept={config.accept}
          onChange={handleFileInputChange}
          className="hidden"
        />
      </div>
    </div>
  );
}