"use strict";
/**
 * DeGenie AI Logo Generation Service
 * Main entry point for AI-powered logo generation
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateConfig = exports.config = exports.StabilityClient = exports.OpenAIClient = exports.PromptGenerator = exports.LogoGenerator = void 0;
exports.createLogoGenerator = createLogoGenerator;
exports.generateLogo = generateLogo;
var logo_generator_1 = require("./services/logo-generator");
Object.defineProperty(exports, "LogoGenerator", { enumerable: true, get: function () { return logo_generator_1.LogoGenerator; } });
var prompt_generator_1 = require("./services/prompt-generator");
Object.defineProperty(exports, "PromptGenerator", { enumerable: true, get: function () { return prompt_generator_1.PromptGenerator; } });
var openai_client_1 = require("./providers/openai-client");
Object.defineProperty(exports, "OpenAIClient", { enumerable: true, get: function () { return openai_client_1.OpenAIClient; } });
var stability_client_1 = require("./providers/stability-client");
Object.defineProperty(exports, "StabilityClient", { enumerable: true, get: function () { return stability_client_1.StabilityClient; } });
var config_1 = require("./config");
Object.defineProperty(exports, "config", { enumerable: true, get: function () { return config_1.config; } });
Object.defineProperty(exports, "validateConfig", { enumerable: true, get: function () { return config_1.validateConfig; } });
__exportStar(require("./types"), exports);
// Re-export for convenience
const logo_generator_2 = require("./services/logo-generator");
const config_2 = require("./config");
/**
 * Create a new logo generator instance with configuration validation
 */
function createLogoGenerator() {
    const validation = (0, config_2.validateConfig)();
    if (!validation.isValid) {
        throw new Error(`Configuration validation failed: ${validation.errors.join(', ')}`);
    }
    return new logo_generator_2.LogoGenerator();
}
/**
 * Quick logo generation function for simple use cases
 */
async function generateLogo(tokenName, theme) {
    const generator = createLogoGenerator();
    return await generator.generateLogo({
        tokenName,
        theme,
    });
}
// Default export
exports.default = logo_generator_2.LogoGenerator;
//# sourceMappingURL=index.js.map