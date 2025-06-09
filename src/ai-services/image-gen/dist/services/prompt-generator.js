"use strict";
/**
 * DeGenie Logo Prompt Generation Service
 * Generates optimized prompts for AI logo generation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromptGenerator = void 0;
const types_1 = require("../types");
class PromptGenerator {
    constructor() {
        this.template = {
            base: "Create a professional logo for a cryptocurrency token named '{tokenName}'",
            styleModifiers: {
                [types_1.LogoStyle.MODERN]: "with clean, modern design elements, sleek typography, and contemporary aesthetics",
                [types_1.LogoStyle.MINIMALIST]: "using minimalist design principles, simple shapes, and clean lines with lots of white space",
                [types_1.LogoStyle.GRADIENT]: "featuring beautiful gradient colors, smooth color transitions, and dynamic visual flow",
                [types_1.LogoStyle.CRYPTO]: "incorporating blockchain and cryptocurrency visual elements like nodes, chains, or digital patterns",
                [types_1.LogoStyle.PROFESSIONAL]: "with sophisticated business-appropriate design, premium look and trustworthy appearance",
                [types_1.LogoStyle.PLAYFUL]: "using fun, vibrant colors and creative elements that feel approachable and friendly",
                [types_1.LogoStyle.RETRO]: "inspired by retro design trends, vintage aesthetics, and nostalgic visual elements",
                [types_1.LogoStyle.FUTURISTIC]: "with cutting-edge futuristic design, sci-fi elements, and innovative visual concepts"
            },
            themeModifiers: {
                'gaming': 'with gaming-related elements, controllers, or digital entertainment themes',
                'defi': 'incorporating DeFi themes like liquidity, yield farming, or decentralized finance concepts',
                'nft': 'with NFT and digital art themes, unique collectible aesthetics',
                'meme': 'with meme-inspired design, internet culture references, and viral aesthetics',
                'utility': 'focused on practical utility, tools, and functional design elements',
                'community': 'emphasizing community, connection, and social interaction themes',
                'innovation': 'highlighting innovation, technology advancement, and breakthrough concepts',
                'finance': 'with traditional finance elements adapted for crypto, banking themes',
                'art': 'incorporating artistic elements, creativity, and visual expression themes',
                'tech': 'with technology themes, circuits, code, and digital transformation elements'
            },
            qualityEnhancers: [
                "high quality",
                "4K resolution",
                "professional design",
                "crisp and clear",
                "vector graphics style",
                "suitable for branding",
                "scalable design",
                "memorable and distinctive",
                "market-ready appearance",
                "industry-standard quality"
            ]
        };
    }
    generatePrompt(options) {
        const { tokenName, theme, style, colors } = options;
        // Validate token name first
        const validation = this.validateTokenName(tokenName);
        if (!validation.isValid) {
            throw new Error(`Invalid token name: ${validation.suggestion}`);
        }
        // Validate theme if provided
        if (theme && !this.template.themeModifiers[theme.toLowerCase()]) {
            console.warn(`Unknown theme '${theme}', continuing without theme modifier`);
        }
        // Validate style if provided
        if (style && !this.template.styleModifiers[style]) {
            console.warn(`Unknown style '${style}', continuing without style modifier`);
        }
        // Validate colors if provided
        if (colors && (!Array.isArray(colors) || colors.some(color => typeof color !== 'string'))) {
            throw new Error('Colors must be an array of strings');
        }
        let prompt = this.template.base.replace('{tokenName}', tokenName);
        // Add style modifier
        if (style && this.template.styleModifiers[style]) {
            prompt += ` ${this.template.styleModifiers[style]}`;
        }
        // Add theme modifier
        if (theme && this.template.themeModifiers[theme.toLowerCase()]) {
            prompt += ` ${this.template.themeModifiers[theme.toLowerCase()]}`;
        }
        // Add color specifications
        if (colors && colors.length > 0) {
            const colorList = colors.join(', ');
            prompt += ` using colors: ${colorList}`;
        }
        // Add quality enhancers
        const randomEnhancers = this.getRandomEnhancers(3);
        prompt += `. ${randomEnhancers.join(', ')}.`;
        // Add technical specifications for better results
        prompt += " Circular logo format, transparent background, centered composition, logo only without text below.";
        return prompt;
    }
    generateEnhancedPrompt(options) {
        const basePrompt = this.generatePrompt(options);
        // Add advanced prompt engineering techniques
        const enhancedElements = [
            "ultra-detailed",
            "professionally designed",
            "brand identity focused",
            "instantly recognizable",
            "versatile for multiple uses",
            "timeless design principles"
        ];
        const selectedEnhancers = this.getRandomEnhancers(2, enhancedElements);
        return `${basePrompt} Additional requirements: ${selectedEnhancers.join(' and ')}.`;
    }
    validateTokenName(tokenName) {
        if (!tokenName || tokenName.trim().length === 0) {
            return { isValid: false, suggestion: 'Token name cannot be empty' };
        }
        if (tokenName.length > 50) {
            return {
                isValid: false,
                suggestion: 'Token name should be shorter than 50 characters for better logo generation'
            };
        }
        if (!/^[a-zA-Z0-9\s]+$/.test(tokenName)) {
            return {
                isValid: false,
                suggestion: 'Token name should only contain letters, numbers, and spaces'
            };
        }
        return { isValid: true };
    }
    suggestTheme(tokenName) {
        const name = tokenName.toLowerCase();
        const suggestions = [];
        // Keyword-based theme suggestions
        const themeKeywords = {
            'gaming': ['game', 'play', 'quest', 'arena', 'pixel', 'cyber'],
            'defi': ['yield', 'swap', 'pool', 'stake', 'farm', 'vault'],
            'nft': ['art', 'collect', 'rare', 'unique', 'mint', 'gallery'],
            'meme': ['dog', 'cat', 'moon', 'rocket', 'diamond', 'ape'],
            'tech': ['tech', 'ai', 'robot', 'code', 'data', 'chain'],
            'finance': ['coin', 'bank', 'fund', 'invest', 'capital', 'wealth']
        };
        for (const [theme, keywords] of Object.entries(themeKeywords)) {
            if (keywords.some(keyword => name.includes(keyword))) {
                suggestions.push(theme);
            }
        }
        // Default suggestions if no matches
        if (suggestions.length === 0) {
            suggestions.push('modern', 'professional', 'crypto');
        }
        return suggestions.slice(0, 3); // Return top 3 suggestions
    }
    getRandomEnhancers(count, source) {
        const enhancers = source || this.template.qualityEnhancers;
        return this.shuffleArray(enhancers).slice(0, count);
    }
    shuffleArray(array) {
        const shuffled = [...array];
        // Fisher-Yates shuffle algorithm for better randomness
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
}
exports.PromptGenerator = PromptGenerator;
//# sourceMappingURL=prompt-generator.js.map