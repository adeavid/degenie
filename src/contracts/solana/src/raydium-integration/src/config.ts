import { PublicKey } from '@solana/web3.js';

// Raydium Program IDs (Mainnet)
export const RAYDIUM_MAINNET = {
  LIQUIDITY_POOL_PROGRAM_ID_V4: new PublicKey('675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8'),
  LIQUIDITY_POOL_PROGRAM_ID_V5: new PublicKey('5quBtoiQqxF9Jv6KYKctB59NT3gtJD2Y65kdnB1Uev3h'),
  SERUM_PROGRAM_ID_V3: new PublicKey('9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin'),
  OPEN_BOOK_PROGRAM: new PublicKey('srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX'),
  UTIL1216: new PublicKey('CLaimxFqjHzgTJtAGHU47NPhg6qrc5sCnpC4tBLyABQS'),
};

// Raydium Program IDs (Devnet)
export const RAYDIUM_DEVNET = {
  LIQUIDITY_POOL_PROGRAM_ID_V4: new PublicKey('HWy1jotHpo6UqeQxx49dpYYdQB8wj9Qk9MdxwjLvDHB8'),
  LIQUIDITY_POOL_PROGRAM_ID_V5: new PublicKey('5quBtoiQqxF9Jv6KYKctB59NT3gtJD2Y65kdnB1Uev3h'),
  SERUM_PROGRAM_ID_V3: new PublicKey('DESVgJVGajEgKGXhb6XmqDHGz3VjdgP7rEVESBgxmroY'),
  OPEN_BOOK_PROGRAM: new PublicKey('EoTcMgcDRTJVZDMZWBoU6rhYHZfkNTVEAfz3uUJRcYGj'),
  UTIL1216: new PublicKey('CLaimxFqjHzgTJtAGHU47NPhg6qrc5sCnpC4tBLyABQS'),
};

// Token Standards
export const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
export const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');
export const SYSVAR_RENT_PUBKEY = new PublicKey('SysvarRent111111111111111111111111111111111');

// Native SOL mint
export const NATIVE_MINT = new PublicKey('So11111111111111111111111111111111111111112');

// Pool Configuration
export interface PoolConfig {
  baseAmount: number;  // Amount of base token (our token)
  quoteAmount: number; // Amount of quote token (SOL)
  lpTokensToCreator: boolean; // Whether to send LP tokens to creator
  burnLpTokens: boolean; // Whether to burn LP tokens immediately
}

// Default configuration for graduation
export const DEFAULT_GRADUATION_CONFIG: PoolConfig = {
  baseAmount: 0, // Will be calculated based on supply
  quoteAmount: 0, // Will be calculated based on treasury (85%)
  lpTokensToCreator: false, // We burn them instead
  burnLpTokens: true, // Permanent liquidity
};

// Fees and Percentages
export const GRADUATION_FEES = {
  LIQUIDITY_PERCENTAGE: 85, // 85% of treasury goes to liquidity
  PLATFORM_FEE_PERCENTAGE: 10, // 10% platform fee
  CREATOR_BONUS_PERCENTAGE: 5, // 5% bonus to creator
  RAYDIUM_INIT_FEE: 0.4, // 0.4 SOL to initialize pool
};

// Minimum thresholds
export const MIN_LIQUIDITY_THRESHOLD = 10; // Minimum 10 SOL for pool creation