import { Router, Request, Response } from 'express';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { getAssociatedTokenAddress, getAccount, TokenAccountNotFoundError } from '@solana/spl-token';

const router = Router();

// Initialize Solana connection
const connection = new Connection(
  process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com',
  'confirmed'
);

// Token list cache (in production, use Redis)
const tokenCache = new Map<string, { balance: number; timestamp: number }>();
const CACHE_DURATION = 10000; // 10 seconds

// Get wallet balance
router.get('/:walletAddress/balance', async (req: Request, res: Response) => {
  try {
    const { walletAddress } = req.params;
    
    // Validate wallet address
    let pubkey: PublicKey;
    try {
      pubkey = new PublicKey(walletAddress);
    } catch {
      res.status(400).json({ error: 'Invalid wallet address' });
      return;
    }
    
    // Get SOL balance
    const solBalance = await connection.getBalance(pubkey);
    const solInDecimal = solBalance / LAMPORTS_PER_SOL;
    
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
  } catch (error) {
    console.error('Error fetching wallet balance:', error);
    res.status(500).json({ error: 'Failed to fetch wallet balance' });
  }
});

// Get specific token balance
router.get('/:walletAddress/balance/:tokenAddress', async (req: Request, res: Response) => {
  try {
    const { walletAddress, tokenAddress } = req.params;
    
    // Validate addresses
    let walletPubkey: PublicKey;
    let mintPubkey: PublicKey;
    
    try {
      walletPubkey = new PublicKey(walletAddress);
      mintPubkey = new PublicKey(tokenAddress);
    } catch {
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
      const tokenAccount = await getAssociatedTokenAddress(mintPubkey, walletPubkey);
      
      // Get token balance
      const accountInfo = await getAccount(connection, tokenAccount);
      const balance = Number(accountInfo.amount) / 1e6; // Assuming 6 decimals
      
      // Update cache
      tokenCache.set(cacheKey, { balance, timestamp: Date.now() });
      
      res.status(200).json({
        success: true,
        data: { balance },
      });
    } catch (error) {
      if (error instanceof TokenAccountNotFoundError) {
        // No token account means 0 balance
        res.status(200).json({
          success: true,
          data: { balance: 0 },
        });
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error('Error fetching token balance:', error);
    res.status(500).json({ error: 'Failed to fetch token balance' });
  }
});

export default router;