export * from './config';
export * from './poolCreator';
export * from './graduationHandler';
export * from './lpBurner';

import { Connection, PublicKey, Keypair } from '@solana/web3.js';
import BN from 'bn.js';
import { TokenGraduationHandler } from './graduationHandler';

/**
 * Main entry point for token graduation
 */
export async function graduateTokenToRaydium(
  connection: Connection,
  tokenMint: PublicKey,
  bondingCurveData: {
    pda: PublicKey;
    treasuryBalance: BN;
    totalSupply: BN;
    authority: Keypair;
  },
  wallets: {
    creator: PublicKey;
    platform: PublicKey;
  },
  network: 'mainnet' | 'devnet' = 'mainnet'
) {
  const graduationHandler = new TokenGraduationHandler(connection, network);
  
  return await graduationHandler.graduateToken({
    connection,
    tokenMint,
    bondingCurvePda: bondingCurveData.pda,
    treasuryBalance: bondingCurveData.treasuryBalance,
    totalSupply: bondingCurveData.totalSupply,
    creatorWallet: wallets.creator,
    platformWallet: wallets.platform,
    authority: bondingCurveData.authority,
    network,
  });
}

/**
 * Example usage
 */
export async function exampleGraduation() {
  // Connection to Solana
  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
  
  // Example data (would come from your bonding curve)
  const tokenMint = new PublicKey('YourTokenMintAddress');
  const bondingCurvePda = new PublicKey('YourBondingCurvePDA');
  const authority = Keypair.generate(); // Would be your actual authority
  
  const result = await graduateTokenToRaydium(
    connection,
    tokenMint,
    {
      pda: bondingCurvePda,
      treasuryBalance: new BN(69_000_000_000_000), // 69k SOL (in lamports)
      totalSupply: new BN(1_000_000_000), // 1B tokens
      authority,
    },
    {
      creator: new PublicKey('CreatorWalletAddress'),
      platform: new PublicKey('PlatformWalletAddress'),
    },
    'devnet'
  );
  
  console.log('Graduation Result:', result);
}