/**
 * DeGenie Logo Generator Service
 * Main service that orchestrates AI logo generation with multiple providers
 */

import fs from 'fs/promises';
import path from 'path';
import axios from 'axios';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';

import { config } from '../config';
import { PromptGenerator } from './prompt-generator';
import { OpenAIClient } from '../providers/openai-client';
import { StabilityClient } from '../providers/stability-client';
import {
  LogoRequest,
  LogoResponse,
  ValidationResult,
  AIProvider,
  GenerationOptions,
  ImageFormat,
} from '../types';

export class LogoGenerator {
  private promptGenerator: PromptGenerator;
  private openaiClient?: OpenAIClient;
  private stabilityClient?: StabilityClient;
  private generationHistory: LogoResponse[] = [];

  constructor() {
    this.promptGenerator = new PromptGenerator();
    this.initializeClients();
  }

  private initializeClients() {
    try {
      if (config.openai.apiKey) {
        this.openaiClient = new OpenAIClient();
        console.log('✅ OpenAI client initialized');
      }
    } catch (error) {
      console.warn('⚠️ OpenAI client initialization failed:', error instanceof Error ? error.message : String(error));
    }

    try {
      if (config.stabilityAI.apiKey) {
        this.stabilityClient = new StabilityClient();
        console.log('✅ Stability AI client initialized');
      }
    } catch (error) {
      console.warn('⚠️ Stability AI client initialization failed:', error instanceof Error ? error.message : String(error));
    }

    if (!this.openaiClient && !this.stabilityClient) {
      throw new Error('At least one AI provider must be properly configured');
    }
  }

  async generateLogo(request: LogoRequest, options?: GenerationOptions): Promise<LogoResponse> {
    console.log(`🧞‍♂️ Starting logo generation for: ${request.tokenName}`);
    
    // Validate request
    const validation = this.validateRequest(request);
    if (!validation.isValid) {
      return {
        success: false,
        error: `Validation failed: ${validation.errors.join(', ')}`,
        metadata: {
          tokenName: request.tokenName,
          theme: request.theme || 'default',
          style: request.style || config.image.defaultStyle,
          prompt: '',
          provider: config.general.defaultProvider,
          generatedAt: new Date(),
          size: request.size || config.image.defaultSize,
          format: request.format || config.image.defaultFormat,
        },
        generationTime: 0,
      };
    }

    // Generate optimized prompt
    const promptOptions = {
      tokenName: request.tokenName,
      theme: request.theme,
      style: request.style,
      colors: request.colors
    };

    const prompt = config.general.enablePromptEnhancement
      ? this.promptGenerator.generateEnhancedPrompt(promptOptions)
      : this.promptGenerator.generatePrompt(promptOptions);

    console.log(`📝 Generated prompt: ${prompt}`);

    // Determine provider preference
    const primaryProvider = options?.provider || config.general.defaultProvider;
    const fallbackProvider = options?.fallbackProvider || config.general.fallbackProvider;

    // Try primary provider first
    let result = await this.tryProvider(primaryProvider, prompt, request);

    // If primary fails, try fallback
    if (!result.success && fallbackProvider && fallbackProvider !== primaryProvider) {
      console.log(`🔄 Primary provider failed, trying fallback: ${fallbackProvider}`);
      result = await this.tryProvider(fallbackProvider, prompt, request);
    }

    // Save locally if successful and enabled
    if (result.success && result.logoUrl && config.general.enableLocalStorage) {
      try {
        const localPath = await this.saveLogoLocally(result.logoUrl, request, result.metadata.provider);
        result.localPath = localPath;
        console.log(`💾 Logo saved locally: ${localPath}`);
      } catch (error) {
        console.warn(`⚠️ Failed to save logo locally for ${request.tokenName}:`, error instanceof Error ? error.message : String(error));
      }
    }

    // Add to history
    this.generationHistory.push(result);

    // Log result
    if (result.success) {
      console.log(`✅ Logo generation successful in ${result.generationTime}ms`);
    } else {
      console.log(`❌ Logo generation failed: ${result.error}`);
    }

    return result;
  }

  private async tryProvider(provider: AIProvider, prompt: string, request: LogoRequest): Promise<LogoResponse> {
    try {
      switch (provider) {
        case AIProvider.OPENAI_DALLE:
          if (!this.openaiClient) {
            throw new Error('OpenAI client not available');
          }
          return await this.openaiClient.generateLogo(prompt, request);

        case AIProvider.STABILITY_AI:
          if (!this.stabilityClient) {
            throw new Error('Stability AI client not available');
          }
          return await this.stabilityClient.generateLogo(prompt, request);

        default:
          throw new Error(`Unsupported provider: ${provider}`);
      }
    } catch (error) {
      return {
        success: false,
        error: `Provider ${provider} failed: ${error}`,
        metadata: {
          tokenName: request.tokenName,
          theme: request.theme || 'default',
          style: request.style || config.image.defaultStyle,
          prompt: prompt,
          provider: provider,
          generatedAt: new Date(),
          size: request.size || config.image.defaultSize,
          format: request.format || config.image.defaultFormat,
        },
        generationTime: 0,
      };
    }
  }

  private validateRequest(request: LogoRequest): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate token name
    const nameValidation = this.promptGenerator.validateTokenName(request.tokenName);
    if (!nameValidation.isValid) {
      errors.push(nameValidation.suggestion || 'Invalid token name');
    }

    // Validate colors if provided
    if (request.colors) {
      for (const color of request.colors) {
        const isValidColor = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(color) || // Hex colors
                            /^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/.test(color) || // RGB
                            /^rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)$/.test(color) || // RGBA
                            /^[a-zA-Z]+$/.test(color); // Named colors
        if (!isValidColor) {
          warnings.push(`Color '${color}' may not be recognized. Use hex codes (#RRGGBB) or color names.`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  private async saveLogoLocally(logoUrl: string, request: LogoRequest, provider: AIProvider): Promise<string> {
    // Ensure output directory exists
    await fs.mkdir(config.general.outputPath, { recursive: true });

    // Generate filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${request.tokenName.replace(/[^a-zA-Z0-9\\-_]/g, '_')}_${timestamp}_${provider}.png`;
    const filepath = path.join(config.general.outputPath, filename);

    // Download and save image
    if (logoUrl.startsWith('data:')) {
      // Handle base64 data URLs
      const base64Data = logoUrl.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      
      // Process with sharp for consistent format
      await sharp(buffer)
        .png({ quality: 100 })
        .toFile(filepath);
    } else {
      // Handle regular URLs
      const response = await axios({
        method: 'GET',
        url: logoUrl,
        responseType: 'arraybuffer',
        timeout: 30000,
      });

      // Process with sharp for consistent format and optimization
      await sharp(Buffer.from(response.data))
        .png({ quality: 100 })
        .toFile(filepath);
    }

    return filepath;
  }

  // Utility methods

  suggestThemes(tokenName: string): string[] {
    return this.promptGenerator.suggestTheme(tokenName);
  }

  getGenerationHistory(): LogoResponse[] {
    return [...this.generationHistory];
  }

  getUsageStats() {
    const stats: any = {
      totalGenerations: this.generationHistory.length,
      successfulGenerations: this.generationHistory.filter(r => r.success).length,
      failedGenerations: this.generationHistory.filter(r => !r.success).length,
      averageGenerationTime: 0,
      providers: {},
    };

    if (stats.totalGenerations > 0) {
      stats.averageGenerationTime = this.generationHistory.reduce(
        (sum, r) => sum + r.generationTime, 0
      ) / stats.totalGenerations;
    }

    // Provider-specific stats
    if (this.openaiClient) {
      stats.providers.openai = this.openaiClient.getUsageStats();
    }
    if (this.stabilityClient) {
      stats.providers.stability = this.stabilityClient.getUsageStats();
    }

    return stats;
  }

  async clearHistory(): Promise<void> {
    this.generationHistory = [];
  }

  // Generate multiple logo variations
  async generateVariations(request: LogoRequest, count: number = 3): Promise<LogoResponse[]> {
    const results: LogoResponse[] = [];

    for (let i = 0; i < count; i++) {
      console.log(`🎨 Generating variation ${i + 1}/${count}...`);
      
      // Add variation to the request by modifying theme or style slightly
      const variationRequest = { ...request };
      if (i > 0) {
        variationRequest.theme = request.theme ? `${request.theme} variation ${i}` : `variation ${i}`;
      }

      const result = await this.generateLogo(variationRequest);
      results.push(result);

      // Small delay between generations to respect rate limits
      if (i < count - 1) {
        const provider = result.metadata.provider;
        const delay = provider === AIProvider.STABILITY_AI ? 10000 : 6000; // Based on provider rate limits
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    return results;
  }
}