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
        defaultProvider: process.env.DEFAULT_PROVIDER || types_1.AIProvider.OPENAI_DALLE,
        fallbackProvider: process.env.FALLBACK_PROVIDER || types_1.AIProvider.STABILITY_AI,
        outputPath: process.env.OUTPUT_PATH || './generated-logos',
        enableLocalStorage: process.env.ENABLE_LOCAL_STORAGE === 'true',
        enablePromptEnhancement: process.env.ENABLE_PROMPT_ENHANCEMENT === 'true',
    },
    image: {
        defaultSize: process.env.DEFAULT_SIZE || types_1.ImageSize.LARGE,
        defaultFormat: process.env.DEFAULT_FORMAT || types_1.ImageFormat.PNG,
        defaultStyle: process.env.DEFAULT_STYLE || types_1.LogoStyle.MODERN,
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
    return {
        isValid: errors.length === 0,
        errors,
    };
}
//# sourceMappingURL=index.js.map