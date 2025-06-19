// API service for backend integration
import { authService } from './auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface GeneratedAsset {
  id: string;
  type: 'logo' | 'meme' | 'gif' | 'video';
  url: string;
  prompt: string;
  ipfsHash?: string;
}

export interface TokenDeployment {
  tokenAddress: string;
  signature: string;
  mintKey: string;
}

export interface AIGenerationRequest {
  name: string;
  description: string;
  theme: string;
  style: string;
  userId: string;
}

class ApiService {
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${API_BASE_URL}${endpoint}`;
      console.log(`[API] Making request to: ${url}`, {
        method: options.method || 'GET',
        body: options.body ? JSON.parse(options.body as string) : undefined
      });
      
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...authService.getAuthHeaders(),
          ...options.headers,
        },
        ...options,
      });

      const data = await response.json();
      
      console.log(`[API] Response from ${endpoint}:`, {
        status: response.status,
        ok: response.ok,
        data
      });
      
      if (endpoint === '/api/tokens/deploy') {
        console.log(`[API] DEPLOY SPECIFIC - data.tokenAddress:`, data?.data?.tokenAddress);
        console.log(`[API] DEPLOY SPECIFIC - full data:`, JSON.stringify(data, null, 2));
      }

      if (!response.ok) {
        return { error: data.error || `HTTP ${response.status}` };
      }

      // Extract the actual data from backend response structure
      // Backend sends: { success: true, data: actual_data }
      // Frontend expects: { data: actual_data }
      const actualData = data.success && data.data !== undefined ? data.data : data;
      
      return { data: actualData };
    } catch (error) {
      console.error(`[API] Request failed for ${endpoint}:`, error);
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async generateLogo(request: AIGenerationRequest): Promise<ApiResponse<GeneratedAsset>> {
    // Format request for backend validation
    const formattedRequest = {
      prompt: `Create a ${request.style} style logo for "${request.name}", ${request.description}. Theme: ${request.theme}`,
      tokenSymbol: request.name.slice(0, 8).toUpperCase(),
      userId: request.userId,
      tier: 'starter', // Default tier
    };

    console.log('[API] Generating logo with request:', formattedRequest);
    
    const result = await this.makeRequest<any>('/api/generate/logo', {
      method: 'POST',
      body: JSON.stringify(formattedRequest),
    });
    
    console.log('[API] Logo generation response:', result);
    
    if (result.error) {
      return result;
    }
    
    // Transform response to match frontend interface
    if (result.data?.success && result.data?.data) {
      return {
        data: {
          id: `logo-${Date.now()}`,
          type: 'logo',
          url: result.data.data.url,
          prompt: result.data.data.prompt,
        }
      };
    }
    
    return { error: 'Invalid response format' };
  }

  async generateMeme(request: AIGenerationRequest): Promise<ApiResponse<GeneratedAsset>> {
    const formattedRequest = {
      prompt: `Create a viral ${request.style} style meme for "${request.name}", ${request.description}. Theme: ${request.theme}`,
      tokenSymbol: request.name.slice(0, 8).toUpperCase(),
      userId: request.userId,
      tier: 'starter', // Default tier
    };

    console.log('[API] Generating meme with request:', formattedRequest);

    const result = await this.makeRequest<any>('/api/generate/meme', {
      method: 'POST',
      body: JSON.stringify(formattedRequest),
    });
    
    console.log('[API] Meme generation response:', result);
    
    if (result.error) {
      return result;
    }
    
    if (result.data?.success && result.data?.data) {
      return {
        data: {
          id: `meme-${Date.now()}`,
          type: 'meme',
          url: result.data.data.url,
          prompt: result.data.data.prompt,
        }
      };
    }
    
    return { error: 'Invalid response format' };
  }

  async generateGif(request: AIGenerationRequest): Promise<ApiResponse<GeneratedAsset>> {
    const formattedRequest = {
      prompt: `Create an animated ${request.style} style GIF for "${request.name}", ${request.description}. Theme: ${request.theme}`,
      tokenSymbol: request.name.slice(0, 8).toUpperCase(),
      userId: request.userId,
      tier: 'starter', // Default tier
    };

    console.log('[API] Generating GIF with request:', formattedRequest);

    const result = await this.makeRequest<any>('/api/generate/gif', {
      method: 'POST',
      body: JSON.stringify(formattedRequest),
    });
    
    console.log('[API] GIF generation response:', result);
    
    if (result.error) {
      return result;
    }
    
    if (result.data?.success && result.data?.data) {
      return {
        data: {
          id: `gif-${Date.now()}`,
          type: 'gif',
          url: result.data.data.url,
          prompt: result.data.data.prompt,
        }
      };
    }
    
    return { error: 'Invalid response format' };
  }

  async generateVideo(request: AIGenerationRequest): Promise<ApiResponse<GeneratedAsset>> {
    const formattedRequest = {
      prompt: `Create a ${request.style} style video for "${request.name}", ${request.description}. Theme: ${request.theme}`,
      tokenSymbol: request.name.slice(0, 8).toUpperCase(),
      userId: request.userId,
      tier: 'starter', // Default tier
    };

    console.log('[API] Generating video with request:', formattedRequest);

    const result = await this.makeRequest<any>('/api/generate/video', {
      method: 'POST',
      body: JSON.stringify(formattedRequest),
    });
    
    console.log('[API] Video generation response:', result);
    
    if (result.error) {
      return result;
    }
    
    if (result.data?.success && result.data?.data) {
      return {
        data: {
          id: `video-${Date.now()}`,
          type: 'video',
          url: result.data.data.url,
          prompt: result.data.data.prompt,
        }
      };
    }
    
    return { error: 'Invalid response format' };
  }

  async generateMultipleAssets(request: AIGenerationRequest): Promise<ApiResponse<GeneratedAsset[]>> {
    try {
      // Generate multiple assets in parallel
      const [logoResult1, logoResult2, memeResult, gifResult] = await Promise.allSettled([
        this.generateLogo({ ...request, style: 'professional' }),
        this.generateLogo({ ...request, style: 'minimalist' }),
        this.generateMeme(request),
        this.generateGif(request),
      ]);

      const assets: GeneratedAsset[] = [];
      let hasError = false;
      let errorMessage = '';

      // Process logo results
      if (logoResult1.status === 'fulfilled' && logoResult1.value.data) {
        assets.push({ ...logoResult1.value.data, id: `logo-1-${Date.now()}` });
      } else if (logoResult1.status === 'rejected') {
        hasError = true;
        errorMessage = 'Failed to generate professional logo';
      }

      if (logoResult2.status === 'fulfilled' && logoResult2.value.data) {
        assets.push({ ...logoResult2.value.data, id: `logo-2-${Date.now()}` });
      } else if (logoResult2.status === 'rejected') {
        hasError = true;
        errorMessage = errorMessage || 'Failed to generate minimalist logo';
      }

      // Process meme result
      if (memeResult.status === 'fulfilled' && memeResult.value.data) {
        assets.push({ ...memeResult.value.data, id: `meme-${Date.now()}` });
      } else if (memeResult.status === 'rejected') {
        hasError = true;
        errorMessage = errorMessage || 'Failed to generate meme';
      }

      // Process GIF result
      if (gifResult.status === 'fulfilled' && gifResult.value.data) {
        assets.push({ ...gifResult.value.data, id: `gif-${Date.now()}` });
      } else if (gifResult.status === 'rejected') {
        hasError = true;
        errorMessage = errorMessage || 'Failed to generate GIF';
      }

      if (assets.length === 0) {
        return { error: errorMessage || 'Failed to generate any assets' };
      }

      return { data: assets };
    } catch (error) {
      console.error('Multiple asset generation failed:', error);
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Helper to compress large data URLs
  private compressDataUrl(dataUrl: string, maxLength: number = 100000): string {
    if (!dataUrl || dataUrl.length <= maxLength) return dataUrl;
    
    // If too large, return a placeholder or truncate
    console.warn(`[API] Data URL too large (${dataUrl.length} chars), using placeholder`);
    return 'data:image/placeholder;base64,placeholder'; // Could implement actual compression here
  }

  async deployToken(tokenData: {
    name: string;
    symbol: string;
    description: string;
    totalSupply: string;
    logoUrl?: string;
    walletAddress: string;
    network?: string;
    website?: string;
    twitter?: string;
    telegram?: string;
    selectedAssets?: Record<string, any>;
  }): Promise<ApiResponse<TokenDeployment>> {
    
    // Compress or remove large data if needed
    const optimizedData = {
      ...tokenData,
      logoUrl: tokenData.logoUrl ? this.compressDataUrl(tokenData.logoUrl) : undefined,
      selectedAssets: tokenData.selectedAssets ? 
        Object.fromEntries(
          Object.entries(tokenData.selectedAssets).map(([key, asset]: [string, any]) => [
            key, 
            {
              ...asset,
              url: typeof asset.url === 'string' ? this.compressDataUrl(asset.url) : asset.url
            }
          ])
        ) : undefined
    };

    console.log(`[API] Deploying token with optimized payload size:`, {
      originalLogoSize: tokenData.logoUrl?.length || 0,
      optimizedLogoSize: optimizedData.logoUrl?.length || 0,
      assetsCount: tokenData.selectedAssets ? Object.keys(tokenData.selectedAssets).length : 0
    });

    return this.makeRequest<TokenDeployment>('/api/tokens/deploy', {
      method: 'POST',
      body: JSON.stringify(optimizedData),
    });
  }

  async getUserTokens(walletAddress: string): Promise<ApiResponse<any[]>> {
    return this.makeRequest<any[]>(`/api/tokens/user/${walletAddress}`);
  }

  async getTokenInfo(tokenAddress: string): Promise<ApiResponse<any>> {
    return this.makeRequest<any>(`/api/tokens/${tokenAddress}`);
  }

  async healthCheck(): Promise<ApiResponse<{ status: string; services: any }>> {
    return this.makeRequest<{ status: string; services: any }>('/health');
  }

  // Trading and Token Page Methods

  async getTokenTrades(tokenAddress: string): Promise<ApiResponse<any[]>> {
    return this.makeRequest<any[]>(`/api/tokens/${tokenAddress}/trades`);
  }

  async getTokenHolders(tokenAddress: string): Promise<ApiResponse<any[]>> {
    return this.makeRequest<any[]>(`/api/tokens/${tokenAddress}/holders`);
  }

  async getTokenComments(tokenAddress: string): Promise<ApiResponse<any[]>> {
    return this.makeRequest<any[]>(`/api/tokens/${tokenAddress}/comments`);
  }

  async getTokenChart(tokenAddress: string, timeframe: string): Promise<ApiResponse<any[]>> {
    return this.makeRequest<any[]>(`/api/tokens/${tokenAddress}/chart?timeframe=${timeframe}`);
  }

  async calculateTrade(params: {
    tokenAddress: string;
    amount: number;
    type: 'buy' | 'sell';
    inputType: 'sol' | 'token';
    slippage: number;
  }): Promise<ApiResponse<{
    expectedTokens?: number;
    expectedSol?: number;
    priceImpact?: number;
    minReceived?: number;
    fees?: number;
  }>> {
    return this.makeRequest(`/api/tokens/${params.tokenAddress}/calculate-trade`, {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async executeTrade(params: {
    tokenAddress: string;
    type: 'buy' | 'sell';
    solAmount?: number;
    tokenAmount?: number;
    slippage: number;
    walletAddress: string;
  }): Promise<ApiResponse<{
    signature?: string;
    success: boolean;
    trade?: any;
    newPrice?: number;
    tokenAmount?: number;
    solAmount?: number;
    graduationProgress?: number;
    inputAmount?: number;
    outputAmount?: number;
    pricePerToken?: number;
    fees?: any;
    newSupply?: number;
    priceImpact?: number;
  }>> {
    // Use the correct endpoint based on trade type
    const endpoint = `/api/tokens/${params.tokenAddress}/${params.type}`;
    
    // Prepare the payload based on trade type
    const payload = params.type === 'buy' ? {
      walletAddress: params.walletAddress,
      solAmount: params.solAmount?.toString(),
      slippage: params.slippage
    } : {
      walletAddress: params.walletAddress,
      tokenAmount: params.tokenAmount?.toString(),
      slippage: params.slippage
    };
    
    return this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getWalletBalance(walletAddress: string): Promise<ApiResponse<{
    sol: number;
    tokens: { [tokenAddress: string]: number };
  }>> {
    return this.makeRequest<any>(`/api/wallet/${walletAddress}/balance`);
  }

  async getTokenBalance(walletAddress: string, tokenAddress: string): Promise<ApiResponse<{
    balance: number;
  }>> {
    return this.makeRequest<any>(`/api/wallet/${walletAddress}/balance/${tokenAddress}`);
  }

  async toggleWatchlist(tokenAddress: string, add: boolean): Promise<ApiResponse<{ success: boolean }>> {
    return this.makeRequest(`/api/tokens/${tokenAddress}/watchlist`, {
      method: add ? 'POST' : 'DELETE',
    });
  }

  async postComment(params: {
    tokenAddress: string;
    content: string;
    author: string;
    parentId?: string;
  }): Promise<ApiResponse<any>> {
    return this.makeRequest(`/api/tokens/${params.tokenAddress}/comments`, {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async likeComment(commentId: string, userAddress: string): Promise<ApiResponse<{ success: boolean }>> {
    return this.makeRequest(`/api/comments/${commentId}/like`, {
      method: 'POST',
      body: JSON.stringify({ userAddress }),
    });
  }

  async deleteComment(commentId: string, userAddress: string): Promise<ApiResponse<{ success: boolean }>> {
    return this.makeRequest(`/api/comments/${commentId}`, {
      method: 'DELETE',
      body: JSON.stringify({ userAddress }),
    });
  }
}

export const apiService = new ApiService();
export default apiService;