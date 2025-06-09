/**
 * DeGenie Logo Generation API Client
 * TypeScript client for interacting with the logo generation API
 */

import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { LogoRequest, LogoResponse, AIProvider, LogoStyle } from '../types';

export interface ApiClientConfig {
  baseUrl?: string;
  timeout?: number;
  apiKey?: string;
  retries?: number;
}

export interface GenerationRequest extends LogoRequest {
  variations?: number;
  provider?: AIProvider;
}


export interface ThemeSuggestionsResponse {
  tokenName: string;
  suggestions: string[];
  count: number;
}

export interface VariationsResponse {
  variations: LogoResponse[];
  count: number;
  successCount: number;
}

export interface ServiceInfoResponse {
  service: string;
  version: string;
  providers: AIProvider[];
  styles: string[];
  sizes: string[];
  formats: string[];
  usage: any;
}

export class LogoGenerationApiClient {
  private client: AxiosInstance;
  private retries: number;

  constructor(config: ApiClientConfig = {}) {
    const {
      baseUrl = process.env.AI_LOGO_API_BASE_URL || 'http://localhost:3001',
      timeout = 120000, // 2 minutes for AI generation
      apiKey,
      retries = 3,
    } = config;

    this.retries = retries;

    this.client = axios.create({
      baseURL: baseUrl,
      timeout,
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey && { 'Authorization': `Bearer ${apiKey}` }),
      },
    });

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response) {
          // Server responded with error status
          throw new Error(
            `API Error (${error.response.status}): ${
              typeof error.response.data === 'string'
                ? error.response.data
                : error.response.data?.error || error.message
            }`
          );
        } else if (error.request) {
          // Request made but no response
          throw new Error('Network Error: No response from server');
        } else {
          // Something else happened
          throw new Error(`Request Error: ${error.message}`);
        }
      }
    );
  }

  /**
   * Generate a logo or multiple variations
   */
  async generateLogo(
    request: GenerationRequest
  ): Promise<LogoResponse | VariationsResponse> {
    const response = await this.makeRequest<LogoResponse | VariationsResponse>(
      'POST',
      '/api/generate',
      request
    );
    return response.data;
  }

  /**
   * Get theme suggestions for a token name
   */
  async suggestThemes(tokenName: string): Promise<ThemeSuggestionsResponse> {
    const response = await this.makeRequest<ThemeSuggestionsResponse>('POST', '/api/suggest-themes', { tokenName });
    return response.data;
  }

  /**
   * Get service information
   */
  async getServiceInfo(): Promise<ServiceInfoResponse> {
    const response = await this.makeRequest<ServiceInfoResponse>('GET', '/api/info');
    return response.data;
  }

  /**
   * Get generation history
   */
  async getHistory(limit?: number): Promise<{ history: LogoResponse[]; count: number; limit: number }> {
    const params = limit ? { limit: limit.toString() } : undefined;
    const response = await this.makeRequest<any>('GET', '/api/history', undefined, params);
    return response.data;
  }

  /**
   * Get usage statistics
   */
  async getStats(): Promise<any> {
    const response = await this.makeRequest<any>('GET', '/api/stats');
    return response.data;
  }

  /**
   * Clear generation history (admin function)
   */
  async clearHistory(): Promise<{ message: string; timestamp: string }> {
    const response = await this.makeRequest<any>('DELETE', '/api/history');
    return response.data;
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ status: string; timestamp: string; service: string; version: string }> {
    const response = await this.makeRequest<any>('GET', '/health');
    return response.data;
  }

  /**
   * Convenience method: Generate a simple logo
   */
  async generateSimpleLogo(
    tokenName: string,
    theme?: string,
    style?: LogoStyle
  ): Promise<LogoResponse> {
    const request: GenerationRequest = {
      tokenName,
      theme,
      style,
      variations: 1,
    };

    const result = await this.generateLogo(request);
    
    // Return single result if variations array
    if ('variations' in result) {
      const successfulVariation = result.variations.find(v => v.success);
      if (successfulVariation) {
        return successfulVariation;
      }
      throw new Error('No successful logo generation in variations');
    }

    return result;
  }

  /**
   * Convenience method: Generate multiple logo variations
   */
  async generateVariations(tokenName: string, count: number = 3, options?: Partial<GenerationRequest>): Promise<LogoResponse[]> {
    const request: GenerationRequest = {
      tokenName,
      variations: Math.min(count, 5), // Max 5 variations
      ...options,
    };

    const result = await this.generateLogo(request);
    
    if ('variations' in result) {
      return result.variations;
    }

    // Single result, return as array
    return [result];
  }

  /**
   * Convenience method: Get auto-suggested theme and generate logo
   */
  async generateWithAutoTheme(tokenName: string, options?: Partial<GenerationRequest>): Promise<LogoResponse> {
    // Get theme suggestions
    const suggestions = await this.suggestThemes(tokenName);
    const suggestedTheme = suggestions.suggestions[0] || 'crypto';

    // Generate logo with suggested theme
    const request: GenerationRequest = {
      tokenName,
      theme: suggestedTheme,
      variations: 1,
      ...options,
    };

    const result = await this.generateLogo(request);
    
    if ('variations' in result) {
      const successfulVariation = result.variations.find(v => v.success);
      if (successfulVariation) {
        return successfulVariation;
      }
      throw new Error('No successful logo generation');
    }

    return result;
  }

  /**
   * Test connection to the API
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.healthCheck();
      return true;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }

  private async makeRequest<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    data?: any,
    params?: Record<string, string>
  ): Promise<AxiosResponse<T>> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.retries; attempt++) {
      try {
        const config: any = {
          method,
          url: endpoint,
          params,
        };

        if (data) {
          config.data = data;
        }

        const response = await this.client.request<T>(config);
        return response;

      } catch (err) {
        const error = err as AxiosError;
        lastError = error;
        
        // Abort retries on non-retryable client errors
        if (
          error.response &&
          error.response.status >= 400 &&
          error.response.status < 500 &&
          error.response.status !== 429
        ) {
          throw error;
        }

        // Wait before retry (exponential backoff)
        if (attempt < this.retries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000); // Max 10s delay
          console.warn(`Request failed (attempt ${attempt}/${this.retries}), retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error('All retry attempts failed');
  }
}

// Factory function for easy instantiation
export function createApiClient(config?: ApiClientConfig): LogoGenerationApiClient {
  return new LogoGenerationApiClient(config);
}

// Default export
export default LogoGenerationApiClient;