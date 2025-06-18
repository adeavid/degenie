"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.earnCreditsRequestSchema = exports.batchGenerationRequestSchema = exports.generationRequestSchema = void 0;
exports.validateGenerationRequest = validateGenerationRequest;
exports.validateBatchRequest = validateBatchRequest;
exports.sanitizePrompt = sanitizePrompt;
const zod_1 = require("zod");
const assetTypes = ['logo', 'meme', 'gif'];
exports.generationRequestSchema = zod_1.z.object({
    prompt: zod_1.z.string().min(3).max(500),
    assetType: zod_1.z.enum(assetTypes),
    tokenSymbol: zod_1.z.string().min(2).max(10).optional(),
    tokenName: zod_1.z.string().min(2).max(50).optional(),
    style: zod_1.z.string().max(100).optional(),
    additionalContext: zod_1.z.string().max(200).optional(),
});
exports.batchGenerationRequestSchema = zod_1.z.object({
    requests: zod_1.z.array(exports.generationRequestSchema).min(1).max(10),
});
exports.earnCreditsRequestSchema = zod_1.z.object({
    action: zod_1.z.enum([
        'dailyLogin',
        'shareOnTwitter',
        'referralSignup',
        'communityEngagement'
    ]),
    metadata: zod_1.z.record(zod_1.z.any()).optional(),
});
function validateGenerationRequest(data) {
    try {
        const validated = exports.generationRequestSchema.parse(data);
        return { valid: true, data: validated };
    }
    catch (error) {
        return {
            valid: false,
            error: error.errors?.[0]?.message || 'Invalid request format'
        };
    }
}
function validateBatchRequest(data) {
    try {
        const validated = exports.batchGenerationRequestSchema.parse(data);
        return { valid: true, data: validated };
    }
    catch (error) {
        return {
            valid: false,
            error: error.errors?.[0]?.message || 'Invalid batch request format'
        };
    }
}
function sanitizePrompt(prompt) {
    if (typeof prompt !== 'string') {
        throw new Error('Prompt must be a string');
    }
    if (prompt.length === 0) {
        throw new Error('Prompt cannot be empty');
    }
    // Remove potentially harmful content
    const blockedTerms = [
        'nsfw',
        'nude',
        'explicit',
        'sexual',
        'violence',
        // Add more as needed
    ];
    const normalizedPrompt = prompt.toLowerCase();
    for (const term of blockedTerms) {
        if (normalizedPrompt.includes(term)) {
            throw new Error(`Prompt contains inappropriate content: ${term}`);
        }
    }
    // Enhanced XSS prevention and sanitization
    return prompt
        .replace(/[<>]/g, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '')
        .trim();
}
//# sourceMappingURL=aiValidators.js.map