/**
 * DeGenie Logo Generation Service Configuration
 */

import dotenv from 'dotenv';
import { AIProvider, ImageSize, ImageFormat, LogoStyle } from '../types';

dotenv.config();

export interface Config {
  openai: {
    apiKey: string;
    model: string;
    maxRetries: number;
    timeout: number;
  };
  stabilityAI: {
    apiKey: string;
    model: string;
    maxRetries: number;
    timeout: number;
  };
  general: {
    defaultProvider: AIProvider;
    fallbackProvider: AIProvider;
    outputPath: string;
    enableLocalStorage: boolean;
    enablePromptEnhancement: boolean;
  };
  image: {
    defaultSize: ImageSize;
    defaultFormat: ImageFormat;
    defaultStyle: LogoStyle;
    quality: string;
  };
  rateLimiting: {
    maxRequestsPerMinute: number;
    maxRequestsPerHour: number;
  };
  logging: {
    level: string;
    enableMetrics: boolean;
  };
}

export const config: Config = {
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    model: process.env.OPENAI_MODEL || 'dall-e-3',
    maxRetries: parseInt(process.env.OPENAI_MAX_RETRIES || '3'),
    timeout: parseInt(process.env.OPENAI_TIMEOUT || '60000'),
  },
  stabilityAI: {
    apiKey: process.env.STABILITY_API_KEY || '',
    model: process.env.STABILITY_MODEL || 'stable-diffusion-xl-1024-v1-0',
    maxRetries: parseInt(process.env.STABILITY_MAX_RETRIES || '3'),
    timeout: parseInt(process.env.STABILITY_TIMEOUT || '120000'),
  },
  general: {
    defaultProvider: (process.env.DEFAULT_PROVIDER as AIProvider) || AIProvider.OPENAI_DALLE,
    fallbackProvider: (process.env.FALLBACK_PROVIDER as AIProvider) || AIProvider.STABILITY_AI,
    outputPath: process.env.OUTPUT_PATH || './generated-logos',
    enableLocalStorage: process.env.ENABLE_LOCAL_STORAGE === 'true',
    enablePromptEnhancement: process.env.ENABLE_PROMPT_ENHANCEMENT === 'true',
  },
  image: {
    defaultSize: (process.env.DEFAULT_SIZE as ImageSize) || ImageSize.LARGE,
    defaultFormat: (process.env.DEFAULT_FORMAT as ImageFormat) || ImageFormat.PNG,
    defaultStyle: (process.env.DEFAULT_STYLE as LogoStyle) || LogoStyle.MODERN,
    quality: process.env.QUALITY || 'hd',
  },
  rateLimiting: {
    maxRequestsPerMinute: parseInt(process.env.MAX_REQUESTS_PER_MINUTE || '10'),
    maxRequestsPerHour: parseInt(process.env.MAX_REQUESTS_PER_HOUR || '100'),
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    enableMetrics: process.env.ENABLE_METRICS === 'true',
  },
};

export function validateConfig(): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!config.openai.apiKey && config.general.defaultProvider === AIProvider.OPENAI_DALLE) {
    errors.push('OpenAI API key is required when using OpenAI as default provider');
  }

  if (!config.stabilityAI.apiKey && config.general.fallbackProvider === AIProvider.STABILITY_AI) {
    errors.push('Stability AI API key is required when using Stability AI as fallback provider');
  }

  if (!config.openai.apiKey && !config.stabilityAI.apiKey) {
    errors.push('At least one AI provider API key must be configured');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}