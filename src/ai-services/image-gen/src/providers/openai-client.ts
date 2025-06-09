/**
 * OpenAI DALL-E Client for Logo Generation
 */

import OpenAI from 'openai';
import { config } from '../config';
import { LogoRequest, LogoResponse, AIProvider, ImageSize } from '../types';
import { v4 as uuidv4 } from 'uuid';

export class OpenAIClient {
  private client: OpenAI;
  private requestCount: number = 0;
  private lastRequestTime: number = 0;

  constructor() {
    if (!config.openai.apiKey) {
      throw new Error('OpenAI API key is required');
    }

    this.client = new OpenAI({
      apiKey: config.openai.apiKey,
      timeout: config.openai.timeout,
      maxRetries: config.openai.maxRetries,
    });
  }

  async generateLogo(prompt: string, request: LogoRequest): Promise<LogoResponse> {
    const startTime = Date.now();
    
    try {
      // Rate limiting check
      await this.checkRateLimit();

      // Convert size format for OpenAI
      const size = this.convertSizeForOpenAI(request.size || config.image.defaultSize);
      
      console.log(`🎨 Generating logo with OpenAI DALL-E...`);
      console.log(`📝 Prompt: ${prompt}`);
      console.log(`📏 Size: ${size}`);

      const response = await this.client.images.generate({
        model: config.openai.model,
        prompt: prompt,
        n: 1,
        size: size,
        quality: config.image.quality as "standard" | "hd",
        style: "vivid", // More creative and dramatic
        response_format: "url",
      });

      const imageUrl = response.data[0]?.url;
      if (!imageUrl) {
        throw new Error('No image URL returned from OpenAI');
      }

      const generationTime = Date.now() - startTime;

      return {
        success: true,
        logoUrl: imageUrl,
        metadata: {
          tokenName: request.tokenName,
          theme: request.theme || 'default',
          style: request.style || config.image.defaultStyle,
          prompt: prompt,
          provider: AIProvider.OPENAI_DALLE,
          generatedAt: new Date(),
          size: request.size || config.image.defaultSize,
          format: request.format || config.image.defaultFormat,
        },
        generationTime,
      };

    } catch (error) {
      const generationTime = Date.now() - startTime;
      
      console.error('❌ OpenAI generation failed:', error);
      
      return {
        success: false,
        error: this.handleError(error),
        metadata: {
          tokenName: request.tokenName,
          theme: request.theme || 'default',
          style: request.style || config.image.defaultStyle,
          prompt: prompt,
          provider: AIProvider.OPENAI_DALLE,
          generatedAt: new Date(),
          size: request.size || config.image.defaultSize,
          format: request.format || config.image.defaultFormat,
        },
        generationTime,
      };
    }
  }

  private async checkRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    // Simple rate limiting: minimum 6 seconds between requests
    if (timeSinceLastRequest < 6000) {
      const waitTime = 6000 - timeSinceLastRequest;
      console.log(`⏳ Rate limiting: waiting ${waitTime}ms...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    this.lastRequestTime = Date.now();
    this.requestCount++;
  }

  private convertSizeForOpenAI(size: ImageSize): "256x256" | "512x512" | "1024x1024" | "1792x1024" | "1024x1792" {
    switch (size) {
      case ImageSize.SMALL:
        return "256x256";
      case ImageSize.MEDIUM:
        return "512x512";
      case ImageSize.LARGE:
        return "1024x1024";
      case ImageSize.XLARGE:
        return "1792x1024";
      default:
        return "1024x1024";
    }
  }

  private handleError(error: any): string {
    if (error instanceof OpenAI.APIError) {
      switch (error.status) {
        case 400:
          return 'Invalid request: ' + error.message;
        case 401:
          return 'Invalid API key or authentication failed';
        case 403:
          return 'Access forbidden - check your OpenAI account permissions';
        case 429:
          return 'Rate limit exceeded - please try again later';
        case 500:
          return 'OpenAI server error - please try again later';
        default:
          return `OpenAI API error (${error.status}): ${error.message}`;
      }
    }

    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return 'Network connection failed - check your internet connection';
    }

    if (error.code === 'ETIMEDOUT') {
      return 'Request timeout - the generation took too long';
    }

    return error.message || 'Unknown error occurred during logo generation';
  }

  getUsageStats() {
    return {
      provider: AIProvider.OPENAI_DALLE,
      requestCount: this.requestCount,
      lastRequestTime: this.lastRequestTime,
      rateLimitInfo: `Minimum 6 seconds between requests`,
    };
  }
}