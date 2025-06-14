"use strict";
/**
 * DeGenie Logo Generation API Server
 * Express.js server that exposes the logo generation service via REST API
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const logo_generator_1 = require("../services/logo-generator");
const types_1 = require("../types");
const config_1 = require("../config");
const app = (0, express_1.default)();
const port = process.env.PORT || 3001;
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.static('public'));
// Initialize logo generator
let logoGenerator;
try {
    const configValidation = (0, config_1.validateConfig)();
    if (!configValidation.isValid) {
        console.error('❌ Configuration validation failed:', configValidation.errors);
        process.exit(1);
    }
    logoGenerator = new logo_generator_1.LogoGenerator();
    console.log('✅ Logo generator initialized');
}
catch (error) {
    console.error('❌ Failed to initialize logo generator:', error);
    process.exit(1);
}
// API Routes
/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'degenie-logo-generator',
        version: '1.0.0',
    });
});
/**
 * Get service information and available options
 */
app.get('/api/info', (req, res) => {
    res.json({
        service: 'DeGenie Logo Generation API',
        version: '1.0.0',
        providers: Object.values(types_1.AIProvider),
        styles: Object.values(types_1.LogoStyle),
        sizes: Object.values(types_1.ImageSize),
        formats: Object.values(types_1.ImageFormat),
        usage: logoGenerator.getUsageStats(),
    });
});
/**
 * Generate a single logo
 */
app.post('/api/generate', async (req, res) => {
    try {
        console.log('📝 Received logo generation request:', req.body);
        const { tokenName, theme, style, colors, size, format, provider, variations = 1, } = req.body;
        // Validate required fields
        if (!tokenName || typeof tokenName !== 'string') {
            return res.status(400).json({
                error: 'tokenName is required and must be a string',
                code: 'INVALID_TOKEN_NAME',
            });
        }
        // Build request object
        const logoRequest = {
            tokenName: tokenName.trim(),
            theme,
            style: style,
            colors: Array.isArray(colors) ? colors : undefined,
            size: size,
            format: format,
        };
        // Generation options
        const options = {
            provider: provider,
        };
        let result;
        if (variations > 1) {
            // Generate multiple variations
            const results = await logoGenerator.generateVariations(logoRequest, Math.min(variations, 5));
            result = {
                success: results.some(r => r.success),
                variations: results,
                count: results.length,
                successCount: results.filter(r => r.success).length,
            };
        }
        else {
            // Generate single logo
            result = await logoGenerator.generateLogo(logoRequest, options);
        }
        console.log('✅ Logo generation completed');
        res.json(result);
    }
    catch (error) {
        console.error('❌ Logo generation failed:', error);
        res.status(500).json({
            error: 'Internal server error during logo generation',
            code: 'GENERATION_ERROR',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
/**
 * Get theme suggestions for a token name
 */
app.post('/api/suggest-themes', (req, res) => {
    try {
        const { tokenName } = req.body;
        if (!tokenName || typeof tokenName !== 'string') {
            return res.status(400).json({
                error: 'tokenName is required and must be a string',
                code: 'INVALID_TOKEN_NAME',
            });
        }
        const suggestions = logoGenerator.suggestThemes(tokenName.trim());
        res.json({
            tokenName: tokenName.trim(),
            suggestions,
            count: suggestions.length,
        });
    }
    catch (error) {
        console.error('❌ Theme suggestion failed:', error);
        res.status(500).json({
            error: 'Internal server error during theme suggestion',
            code: 'SUGGESTION_ERROR',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
/**
 * Get generation history
 */
app.get('/api/history', (req, res) => {
    try {
        const history = logoGenerator.getGenerationHistory();
        const limit = parseInt(req.query.limit) || 50;
        res.json({
            history: history.slice(-limit),
            count: history.length,
            limit,
        });
    }
    catch (error) {
        console.error('❌ History retrieval failed:', error);
        res.status(500).json({
            error: 'Internal server error during history retrieval',
            code: 'HISTORY_ERROR',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
/**
 * Get usage statistics
 */
app.get('/api/stats', (req, res) => {
    try {
        const stats = logoGenerator.getUsageStats();
        res.json(stats);
    }
    catch (error) {
        console.error('❌ Stats retrieval failed:', error);
        res.status(500).json({
            error: 'Internal server error during stats retrieval',
            code: 'STATS_ERROR',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
/**
 * Clear generation history (admin endpoint)
 */
app.delete('/api/history', async (req, res) => {
    try {
        await logoGenerator.clearHistory();
        res.json({
            message: 'Generation history cleared successfully',
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        console.error('❌ History clearing failed:', error);
        res.status(500).json({
            error: 'Internal server error during history clearing',
            code: 'CLEAR_ERROR',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
// Error handling middleware
app.use((error, req, res, next) => {
    console.error('❌ Unhandled error:', error);
    res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
    });
});
// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Endpoint not found',
        code: 'NOT_FOUND',
        path: req.path,
    });
});
// Start server
app.listen(port, () => {
    console.log(`🧞‍♂️ DeGenie Logo Generation API server running on port ${port}`);
    console.log(`📡 API endpoints available at http://localhost:${port}/api/`);
    console.log(`🏥 Health check: http://localhost:${port}/health`);
    console.log(`📊 Service info: http://localhost:${port}/api/info`);
});
exports.default = app;
//# sourceMappingURL=server.js.map