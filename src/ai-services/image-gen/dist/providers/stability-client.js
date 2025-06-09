"use strict";
/**
 * Stability AI Client for Logo Generation
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StabilityClient = void 0;
const axios_1 = __importDefault(require("axios"));
const form_data_1 = __importDefault(require("form-data"));
const config_1 = require("../config");
const types_1 = require("../types");
class StabilityClient {
    constructor() {
        this.requestCount = 0;
        this.lastRequestTime = 0;
        if (!config_1.config.stabilityAI.apiKey) {
            throw new Error('Stability AI API key is required');
        }
        this.client = axios_1.default.create({
            baseURL: 'https://api.stability.ai',
            timeout: config_1.config.stabilityAI.timeout,
            headers: {
                'Authorization': `Bearer ${config_1.config.stabilityAI.apiKey}`,
                'Accept': 'application/json',
            },
        });
    }
    async generateLogo(prompt, request) {
        const startTime = Date.now();
        try {
            // Rate limiting check
            await this.checkRateLimit();
            const { width, height } = this.convertSizeForStability(request.size || config_1.config.image.defaultSize);
            console.log(`🎨 Generating logo with Stability AI...`);
            console.log(`📝 Prompt: ${prompt}`);
            console.log(`📏 Size: ${width}x${height}`);
            // Enhanced prompt for logo generation
            const enhancedPrompt = `${prompt}. Logo design, professional branding, clean background, high-quality commercial design.`;
            const formData = new form_data_1.default();
            formData.append('text_prompts[0][text]', enhancedPrompt);
            formData.append('text_prompts[0][weight]', '1');
            formData.append('text_prompts[1][text]', 'blurry, low quality, text, watermark, signature, amateur');
            formData.append('text_prompts[1][weight]', '-1');
            formData.append('cfg_scale', '12');
            formData.append('height', height.toString());
            formData.append('width', width.toString());
            formData.append('samples', '1');
            formData.append('steps', '30');
            formData.append('style_preset', 'digital-art');
            const response = await this.client.post(`/v1/generation/${config_1.config.stabilityAI.model}/text-to-image`, formData, {
                headers: {
                    ...formData.getHeaders(),
                },
            });
            const artifacts = response.data.artifacts;
            if (!artifacts || artifacts.length === 0) {
                throw new Error('No image artifacts returned from Stability AI');
            }
            // Convert base64 to data URL
            const base64Image = artifacts[0].base64;
            const imageUrl = `data:image/png;base64,${base64Image}`;
            const generationTime = Date.now() - startTime;
            return {
                success: true,
                logoUrl: imageUrl,
                metadata: {
                    tokenName: request.tokenName,
                    theme: request.theme || 'default',
                    style: request.style || config_1.config.image.defaultStyle,
                    prompt: enhancedPrompt,
                    provider: types_1.AIProvider.STABILITY_AI,
                    generatedAt: new Date(),
                    size: request.size || config_1.config.image.defaultSize,
                    format: request.format || config_1.config.image.defaultFormat,
                },
                generationTime,
            };
        }
        catch (error) {
            const generationTime = Date.now() - startTime;
            console.error('❌ Stability AI generation failed:', error);
            return {
                success: false,
                error: this.handleError(error),
                metadata: {
                    tokenName: request.tokenName,
                    theme: request.theme || 'default',
                    style: request.style || config_1.config.image.defaultStyle,
                    prompt: prompt,
                    provider: types_1.AIProvider.STABILITY_AI,
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
        // Stability AI rate limiting: minimum 10 seconds between requests for free tier
        if (timeSinceLastRequest < 10000) {
            const waitTime = 10000 - timeSinceLastRequest;
            console.log(`⏳ Rate limiting: waiting ${waitTime}ms...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
        this.lastRequestTime = Date.now();
        this.requestCount++;
    }
    convertSizeForStability(size) {
        switch (size) {
            case types_1.ImageSize.SMALL:
                return { width: 512, height: 512 };
            case types_1.ImageSize.MEDIUM:
                return { width: 768, height: 768 };
            case types_1.ImageSize.LARGE:
                return { width: 1024, height: 1024 };
            case types_1.ImageSize.XLARGE:
                return { width: 1152, height: 896 };
            default:
                return { width: 1024, height: 1024 };
        }
    }
    handleError(error) {
        if (error.response) {
            const status = error.response.status;
            const data = error.response.data;
            switch (status) {
                case 400:
                    return `Invalid request: ${data.message || 'Bad request format'}`;
                case 401:
                    return 'Invalid API key or authentication failed';
                case 402:
                    return 'Insufficient credits - please check your Stability AI account';
                case 403:
                    return 'Access forbidden - check your Stability AI account permissions';
                case 429:
                    return 'Rate limit exceeded - please try again later';
                case 500:
                    return 'Stability AI server error - please try again later';
                default:
                    return `Stability AI error (${status}): ${data.message || 'Unknown error'}`;
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
            provider: types_1.AIProvider.STABILITY_AI,
            requestCount: this.requestCount,
            lastRequestTime: this.lastRequestTime,
            rateLimitInfo: `Minimum 10 seconds between requests`,
        };
    }
}
exports.StabilityClient = StabilityClient;
//# sourceMappingURL=stability-client.js.map