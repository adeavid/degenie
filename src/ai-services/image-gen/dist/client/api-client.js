"use strict";
/**
 * DeGenie Logo Generation API Client
 * TypeScript client for interacting with the logo generation API
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogoGenerationApiClient = void 0;
exports.createApiClient = createApiClient;
const axios_1 = __importDefault(require("axios"));
class LogoGenerationApiClient {
    constructor(config = {}) {
        const { baseUrl = process.env.AI_LOGO_API_BASE_URL || 'http://localhost:3001', timeout = 120000, // 2 minutes for AI generation
        apiKey, retries = 3, } = config;
        this.retries = retries;
        this.client = axios_1.default.create({
            baseURL: baseUrl,
            timeout,
            headers: {
                'Content-Type': 'application/json',
                ...(apiKey && { 'Authorization': `Bearer ${apiKey}` }),
            },
        });
        // Response interceptor for error handling
        this.client.interceptors.response.use((response) => response, (error) => {
            if (error.response) {
                // Server responded with error status
                throw new Error(`API Error (${error.response.status}): ${typeof error.response.data === 'string'
                    ? error.response.data
                    : error.response.data?.error || error.message}`);
            }
            else if (error.request) {
                // Request made but no response
                throw new Error('Network Error: No response from server');
            }
            else {
                // Something else happened
                throw new Error(`Request Error: ${error.message}`);
            }
        });
    }
    /**
     * Generate a logo or multiple variations
     */
    async generateLogo(request) {
        const response = await this.makeRequest('POST', '/api/generate', request);
        return response.data;
    }
    /**
     * Get theme suggestions for a token name
     */
    async suggestThemes(tokenName) {
        const response = await this.makeRequest('POST', '/api/suggest-themes', { tokenName });
        return response.data;
    }
    /**
     * Get service information
     */
    async getServiceInfo() {
        const response = await this.makeRequest('GET', '/api/info');
        return response.data;
    }
    /**
     * Get generation history
     */
    async getHistory(limit) {
        const params = limit ? { limit: limit.toString() } : undefined;
        const response = await this.makeRequest('GET', '/api/history', undefined, params);
        return response.data;
    }
    /**
     * Get usage statistics
     */
    async getStats() {
        const response = await this.makeRequest('GET', '/api/stats');
        return response.data;
    }
    /**
     * Clear generation history (admin function)
     */
    async clearHistory() {
        const response = await this.makeRequest('DELETE', '/api/history');
        return response.data;
    }
    /**
     * Health check
     */
    async healthCheck() {
        const response = await this.makeRequest('GET', '/health');
        return response.data;
    }
    /**
     * Convenience method: Generate a simple logo
     */
    async generateSimpleLogo(tokenName, theme, style) {
        const request = {
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
    async generateVariations(tokenName, count = 3, options) {
        const request = {
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
    async generateWithAutoTheme(tokenName, options) {
        // Get theme suggestions
        const suggestions = await this.suggestThemes(tokenName);
        const suggestedTheme = suggestions.suggestions[0] || 'crypto';
        // Generate logo with suggested theme
        const request = {
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
    async testConnection() {
        try {
            await this.healthCheck();
            return true;
        }
        catch (error) {
            console.error('Connection test failed:', error);
            return false;
        }
    }
    async makeRequest(method, endpoint, data, params) {
        let lastError = null;
        for (let attempt = 1; attempt <= this.retries; attempt++) {
            try {
                const config = {
                    method,
                    url: endpoint,
                    params,
                };
                if (data) {
                    config.data = data;
                }
                const response = await this.client.request(config);
                return response;
            }
            catch (err) {
                const error = err;
                lastError = error;
                // Abort retries on non-retryable client errors
                if (error.response &&
                    error.response.status >= 400 &&
                    error.response.status < 500 &&
                    error.response.status !== 429) {
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
exports.LogoGenerationApiClient = LogoGenerationApiClient;
// Factory function for easy instantiation
function createApiClient(config) {
    return new LogoGenerationApiClient(config);
}
// Default export
exports.default = LogoGenerationApiClient;
//# sourceMappingURL=api-client.js.map