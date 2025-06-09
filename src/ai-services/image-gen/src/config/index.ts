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
    maxRetries: Math.max(1, parseInt(process.env.OPENAI_MAX_RETRIES || '3') || 3),
    timeout: Math.max(1000, parseInt(process.env.OPENAI_TIMEOUT || '60000') || 60000),
  },
  stabilityAI: {
    apiKey: process.env.STABILITY_API_KEY || '',
    model: process.env.STABILITY_MODEL || 'stable-diffusion-xl-1024-v1-0',
    maxRetries: Math.max(1, parseInt(process.env.STABILITY_MAX_RETRIES || '3') || 3),
    timeout: Math.max(1000, parseInt(process.env.STABILITY_TIMEOUT || '120000') || 120000),
  },
  general: {
    defaultProvider: Object.values(AIProvider).includes(process.env.DEFAULT_PROVIDER as AIProvider) 
      ? (process.env.DEFAULT_PROVIDER as AIProvider) 
      : AIProvider.OPENAI_DALLE,
    fallbackProvider: Object.values(AIProvider).includes(process.env.FALLBACK_PROVIDER as AIProvider)
      ? (process.env.FALLBACK_PROVIDER as AIProvider)
      : AIProvider.STABILITY_AI,
    outputPath: process.env.OUTPUT_PATH || './generated-logos',
    enableLocalStorage: process.env.ENABLE_LOCAL_STORAGE === 'true',
    enablePromptEnhancement: process.env.ENABLE_PROMPT_ENHANCEMENT === 'true',
  },
  image: {
    defaultSize: Object.values(ImageSize).includes(process.env.DEFAULT_SIZE as ImageSize)
      ? (process.env.DEFAULT_SIZE as ImageSize)
      : ImageSize.LARGE,
    defaultFormat: Object.values(ImageFormat).includes(process.env.DEFAULT_FORMAT as ImageFormat)
      ? (process.env.DEFAULT_FORMAT as ImageFormat)
      : ImageFormat.PNG,
    defaultStyle: Object.values(LogoStyle).includes(process.env.DEFAULT_STYLE as LogoStyle)
      ? (process.env.DEFAULT_STYLE as LogoStyle)
      : LogoStyle.MODERN,
    quality: process.env.QUALITY || 'hd',
  },
  rateLimiting: {
    maxRequestsPerMinute: Math.max(1, parseInt(process.env.MAX_REQUESTS_PER_MINUTE || '10') || 10),
    maxRequestsPerHour: Math.max(1, parseInt(process.env.MAX_REQUESTS_PER_HOUR || '100') || 100),
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

  if (!config.stabilityAI.apiKey && config.general.defaultProvider === AIProvider.STABILITY_AI) {
    errors.push('Stability AI API key is required when using Stability AI as default provider');
  }


  if (!config.stabilityAI.apiKey && config.general.fallbackProvider === AIProvider.STABILITY_AI) {
    errors.push('Stability AI API key is required when using Stability AI as fallback provider');
  }

  if (!config.openai.apiKey && !config.stabilityAI.apiKey) {
    errors.push('At least one AI provider API key must be configured');
  }

  // Validate numeric values
  if (config.openai.maxRetries < 1 || config.openai.maxRetries > 10) {
    errors.push('OpenAI max retries must be between 1 and 10');
  }
  if (config.stabilityAI.maxRetries < 1 || config.stabilityAI.maxRetries > 10) {
    errors.push('Stability AI max retries must be between 1 and 10');
  }
  if (config.openai.timeout < 1000) {
    errors.push('OpenAI timeout must be at least 1000ms');
  }
  if (config.stabilityAI.timeout < 1000) {
    errors.push('Stability AI timeout must be at least 1000ms');
  }

  // Validate rate limiting
  if (config.rateLimiting.maxRequestsPerMinute < 1) {
    errors.push('Max requests per minute must be at least 1');
  }
  if (config.rateLimiting.maxRequestsPerHour < config.rateLimiting.maxRequestsPerMinute) {
    errors.push('Max requests per hour must be greater than max requests per minute');
  }

  // Validate provider configuration
  if (config.general.defaultProvider === config.general.fallbackProvider) {
    errors.push('Default and fallback providers must be different');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}