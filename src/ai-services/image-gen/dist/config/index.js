"use strict";
/**
 * DeGenie Logo Generation Service Configuration
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
exports.validateConfig = validateConfig;
const dotenv_1 = __importDefault(require("dotenv"));
const types_1 = require("../types");
dotenv_1.default.config();
exports.config = {
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
        defaultProvider: Object.values(types_1.AIProvider).includes(process.env.DEFAULT_PROVIDER)
            ? process.env.DEFAULT_PROVIDER
            : types_1.AIProvider.OPENAI_DALLE,
        fallbackProvider: Object.values(types_1.AIProvider).includes(process.env.FALLBACK_PROVIDER)
            ? process.env.FALLBACK_PROVIDER
            : types_1.AIProvider.STABILITY_AI,
        outputPath: process.env.OUTPUT_PATH || './generated-logos',
        enableLocalStorage: process.env.ENABLE_LOCAL_STORAGE === 'true',
        enablePromptEnhancement: process.env.ENABLE_PROMPT_ENHANCEMENT === 'true',
    },
    image: {
        defaultSize: Object.values(types_1.ImageSize).includes(process.env.DEFAULT_SIZE)
            ? process.env.DEFAULT_SIZE
            : types_1.ImageSize.LARGE,
        defaultFormat: Object.values(types_1.ImageFormat).includes(process.env.DEFAULT_FORMAT)
            ? process.env.DEFAULT_FORMAT
            : types_1.ImageFormat.PNG,
        defaultStyle: Object.values(types_1.LogoStyle).includes(process.env.DEFAULT_STYLE)
            ? process.env.DEFAULT_STYLE
            : types_1.LogoStyle.MODERN,
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
function validateConfig() {
    const errors = [];
    if (!exports.config.openai.apiKey && exports.config.general.defaultProvider === types_1.AIProvider.OPENAI_DALLE) {
        errors.push('OpenAI API key is required when using OpenAI as default provider');
    }
    if (!exports.config.stabilityAI.apiKey && exports.config.general.fallbackProvider === types_1.AIProvider.STABILITY_AI) {
        errors.push('Stability AI API key is required when using Stability AI as fallback provider');
    }
    if (!exports.config.openai.apiKey && !exports.config.stabilityAI.apiKey) {
        errors.push('At least one AI provider API key must be configured');
    }
    // Validate numeric values
    if (exports.config.openai.maxRetries < 1 || exports.config.openai.maxRetries > 10) {
        errors.push('OpenAI max retries must be between 1 and 10');
    }
    if (exports.config.stabilityAI.maxRetries < 1 || exports.config.stabilityAI.maxRetries > 10) {
        errors.push('Stability AI max retries must be between 1 and 10');
    }
    if (exports.config.openai.timeout < 1000) {
        errors.push('OpenAI timeout must be at least 1000ms');
    }
    if (exports.config.stabilityAI.timeout < 1000) {
        errors.push('Stability AI timeout must be at least 1000ms');
    }
    // Validate rate limiting
    if (exports.config.rateLimiting.maxRequestsPerMinute < 1) {
        errors.push('Max requests per minute must be at least 1');
    }
    if (exports.config.rateLimiting.maxRequestsPerHour < exports.config.rateLimiting.maxRequestsPerMinute) {
        errors.push('Max requests per hour must be greater than max requests per minute');
    }
    // Validate provider configuration
    if (exports.config.general.defaultProvider === exports.config.general.fallbackProvider) {
        errors.push('Default and fallback providers must be different');
    }
    return {
        isValid: errors.length === 0,
        errors,
    };
}
//# sourceMappingURL=index.js.map