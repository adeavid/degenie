"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const web3_js_1 = require("@solana/web3.js");
const spl_token_1 = require("@solana/spl-token");
const router = (0, express_1.Router)();
// Initialize Solana connection
const connection = new web3_js_1.Connection(process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com', 'confirmed');
// Token list cache (in production, use Redis)
const tokenCache = new Map();
const CACHE_DURATION = 10000; // 10 seconds
// Get wallet balance
router.get('/:walletAddress/balance', async (req, res) => {
    try {
        const { walletAddress } = req.params;
        // Validate wallet address
        let pubkey;
        try {
            pubkey = new web3_js_1.PublicKey(walletAddress);
        }
        catch {
            res.status(400).json({ error: 'Invalid wallet address' });
            return;
        }
        // Get SOL balance
        const solBalance = await connection.getBalance(pubkey);
        const solInDecimal = solBalance / web3_js_1.LAMPORTS_PER_SOL;
        // For development, return simplified response
        // In production, you'd scan for all token accounts
        const balance = {
            sol: solInDecimal,
            tokens: {} // Would populate with actual token balances
        };
        res.status(200).json({
            success: true,
            data: balance,
        });
    }
    catch (error) {
        console.error('Error fetching wallet balance:', error);
        res.status(500).json({ error: 'Failed to fetch wallet balance' });
    }
});
// Get specific token balance
router.get('/:walletAddress/balance/:tokenAddress', async (req, res) => {
    try {
        const { walletAddress, tokenAddress } = req.params;
        // Validate addresses
        let walletPubkey;
        let mintPubkey;
        try {
            walletPubkey = new web3_js_1.PublicKey(walletAddress);
            mintPubkey = new web3_js_1.PublicKey(tokenAddress);
        }
        catch {
            res.status(400).json({ error: 'Invalid address' });
            return;
        }
        // Check cache first
        const cacheKey = `${walletAddress}:${tokenAddress}`;
        const cached = tokenCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
            res.status(200).json({
                success: true,
                data: { balance: cached.balance },
            });
            return;
        }
        try {
            // Get associated token account
            const tokenAccount = await (0, spl_token_1.getAssociatedTokenAddress)(mintPubkey, walletPubkey);
            // Get token balance
            const accountInfo = await (0, spl_token_1.getAccount)(connection, tokenAccount);
            const balance = Number(accountInfo.amount) / 1e6; // Assuming 6 decimals
            // Update cache
            tokenCache.set(cacheKey, { balance, timestamp: Date.now() });
            res.status(200).json({
                success: true,
                data: { balance },
            });
        }
        catch (error) {
            if (error instanceof spl_token_1.TokenAccountNotFoundError) {
                // No token account means 0 balance
                res.status(200).json({
                    success: true,
                    data: { balance: 0 },
                });
            }
            else {
                throw error;
            }
        }
    }
    catch (error) {
        console.error('Error fetching token balance:', error);
        res.status(500).json({ error: 'Failed to fetch token balance' });
    }
});
exports.default = router;
//# sourceMappingURL=wallet.routes.js.map