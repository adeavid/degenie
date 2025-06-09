"use strict";
/**
 * DeGenie Logo Generation Service Types
 * Defines interfaces and types for AI-powered logo generation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIProvider = exports.ImageFormat = exports.ImageSize = exports.LogoStyle = void 0;
var LogoStyle;
(function (LogoStyle) {
    LogoStyle["MODERN"] = "modern";
    LogoStyle["MINIMALIST"] = "minimalist";
    LogoStyle["GRADIENT"] = "gradient";
    LogoStyle["CRYPTO"] = "crypto";
    LogoStyle["PROFESSIONAL"] = "professional";
    LogoStyle["PLAYFUL"] = "playful";
    LogoStyle["RETRO"] = "retro";
    LogoStyle["FUTURISTIC"] = "futuristic";
})(LogoStyle || (exports.LogoStyle = LogoStyle = {}));
var ImageSize;
(function (ImageSize) {
    ImageSize["SMALL"] = "256x256";
    ImageSize["MEDIUM"] = "512x512";
    ImageSize["LARGE"] = "1024x1024";
    ImageSize["XLARGE"] = "1792x1024";
})(ImageSize || (exports.ImageSize = ImageSize = {}));
var ImageFormat;
(function (ImageFormat) {
    ImageFormat["PNG"] = "png";
    ImageFormat["JPEG"] = "jpeg";
    ImageFormat["WEBP"] = "webp";
})(ImageFormat || (exports.ImageFormat = ImageFormat = {}));
var AIProvider;
(function (AIProvider) {
    AIProvider["OPENAI_DALLE"] = "openai-dalle";
    AIProvider["STABILITY_AI"] = "stability-ai";
    AIProvider["MIDJOURNEY"] = "midjourney";
})(AIProvider || (exports.AIProvider = AIProvider = {}));
//# sourceMappingURL=index.js.map