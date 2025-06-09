"use strict";
/**
 * OpenAI DALL-E Client for Logo Generation
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAIClient = void 0;
const openai_1 = __importDefault(require("openai"));
const config_1 = require("../config");
const types_1 = require("../types");
class OpenAIClient {
    constructor() {
        this.requestCount = 0;
        this.lastRequestTime = 0;
        if (!config_1.config.openai.apiKey) {
            throw new Error('OpenAI API key is required');
        }
        this.client = new openai_1.default({
            apiKey: config_1.config.openai.apiKey,
            timeout: config_1.config.openai.timeout,
            maxRetries: config_1.config.openai.maxRetries,
        });
    }
    async generateLogo(prompt, request) {
        const startTime = Date.now();
        try {
            // Rate limiting check
            await this.checkRateLimit();
            // Convert size format for OpenAI
            const size = this.convertSizeForOpenAI(request.size || config_1.config.image.defaultSize);
            console.log(`🎨 Generating logo with OpenAI DALL-E...`);
            console.log(`📝 Prompt: ${prompt}`);
            console.log(`📏 Size: ${size}`);
            const response = await this.client.images.generate({
                model: config_1.config.openai.model,
                prompt: prompt,
                n: 1,
                size: size,
                quality: config_1.config.image.quality,
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
                    style: request.style || config_1.config.image.defaultStyle,
                    prompt: prompt,
                    provider: types_1.AIProvider.OPENAI_DALLE,
                    generatedAt: new Date(),
                    size: request.size || config_1.config.image.defaultSize,
                    format: request.format || config_1.config.image.defaultFormat,
                },
                generationTime,
            };
        }
        catch (error) {
            const generationTime = Date.now() - startTime;
            console.error('❌ OpenAI generation failed:', error);
            return {
                success: false,
                error: this.handleError(error),
                metadata: {
                    tokenName: request.tokenName,
                    theme: request.theme || 'default',
                    style: request.style || config_1.config.image.defaultStyle,
                    prompt: prompt,
                    provider: types_1.AIProvider.OPENAI_DALLE,
                    generatedAt: new Date(),
                    size: request.size || config_1.config.image.defaultSize,
                    format: request.format || config_1.config.image.defaultFormat,
                },
                generationTime,
            };
        }
    }
    async checkRateLimit() {
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
    convertSizeForOpenAI(size) {
        switch (size) {
            case types_1.ImageSize.SMALL:
                return "256x256";
            case types_1.ImageSize.MEDIUM:
                return "512x512";
            case types_1.ImageSize.LARGE:
                return "1024x1024";
            case types_1.ImageSize.XLARGE:
                return "1792x1024";
            default:
                return "1024x1024";
        }
    }
    handleError(error) {
        if (error instanceof openai_1.default.APIError) {
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
            provider: types_1.AIProvider.OPENAI_DALLE,
            requestCount: this.requestCount,
            lastRequestTime: this.lastRequestTime,
            rateLimitInfo: `Minimum 6 seconds between requests`,
        };
    }
}
exports.OpenAIClient = OpenAIClient;
//# sourceMappingURL=openai-client.js.map