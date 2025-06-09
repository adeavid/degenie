/**
 * DeGenie Logo Generation Service Types
 * Defines interfaces and types for AI-powered logo generation
 */

export interface LogoRequest {
  tokenName: string;
  theme?: string;
  style?: LogoStyle;
  colors?: string[];
  size?: ImageSize;
  format?: ImageFormat;
}

export interface LogoResponse {
  success: boolean;
  logoUrl?: string;
  localPath?: string;
  metadata: LogoMetadata;
  error?: string;
  generationTime: number;
}

export interface LogoMetadata {
  tokenName: string;
  theme: string;
  style: LogoStyle;
  prompt: string;
  provider: AIProvider;
  generatedAt: Date;
  size: ImageSize;
  format: ImageFormat;
  fileSize?: number;
}

export enum LogoStyle {
  MODERN = 'modern',
  MINIMALIST = 'minimalist',
  GRADIENT = 'gradient',
  CRYPTO = 'crypto',
  PROFESSIONAL = 'professional',
  PLAYFUL = 'playful',
  RETRO = 'retro',
  FUTURISTIC = 'futuristic'
}

export enum ImageSize {
  SMALL = '256x256',
  MEDIUM = '512x512',
  LARGE = '1024x1024',
  XLARGE = '1792x1024'
}

export enum ImageFormat {
  PNG = 'png',
  JPEG = 'jpeg',
  WEBP = 'webp'
}

export enum AIProvider {
  OPENAI_DALLE = 'openai-dalle',
  STABILITY_AI = 'stability-ai',
  MIDJOURNEY = 'midjourney'
}

export interface AIProviderConfig {
  apiKey: string;
  baseUrl?: string;
  model?: string;
  maxRetries?: number;
  timeout?: number;
}

export interface PromptTemplate {
  base: string;
  styleModifiers: Record<LogoStyle, string>;
  themeModifiers: Record<string, string>;
  qualityEnhancers: string[];
}

export interface GenerationOptions {
  provider: AIProvider;
  fallbackProvider?: AIProvider;
  enhancePrompt?: boolean;
  saveLocally?: boolean;
  outputPath?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}