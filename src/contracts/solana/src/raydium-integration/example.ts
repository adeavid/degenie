#!/usr/bin/env ts-node

/**
 * Example: How to graduate a token from DeGenie bonding curve to Raydium
 */

import { Connection, PublicKey, Keypair, LAMPORTS_PER_SOL } from '@solana/web3.js';
import BN from 'bn.js';
import { graduateTokenToRaydium } from './src';

async function main() {
  console.log('🎓 DeGenie Token Graduation Example');
  console.log('===================================\n');

  // Setup connection (use mainnet-beta in production)
  const connection = new Connection(
    'https://api.devnet.solana.com',
    'confirmed'
  );

  // Example token that has reached graduation threshold
  const tokenMint = new PublicKey('GenieMintExamplexxxxxxxxxxxxxxxxxxxxxx');
  const bondingCurvePda = new PublicKey('BondingCurvePDAxxxxxxxxxxxxxxxxxxxxxxx');
  
  // Authority keypair (in production, this comes from your wallet/signer)
  const authority = Keypair.generate();
  
  // Graduation data (this would come from your bonding curve account)
  const graduationData = {
    treasuryBalance: new BN(12_000).mul(new BN(LAMPORTS_PER_SOL)), // 12,000 SOL
    totalSupply: new BN(800_000_000), // 800M tokens
    marketCap: new BN(69_000).mul(new BN(LAMPORTS_PER_SOL)), // $69k
  };

  // Wallet addresses
  const wallets = {
    creator: new PublicKey('CreatorWalletxxxxxxxxxxxxxxxxxxxxxxxxx'),
    platform: new PublicKey('PlatformWalletxxxxxxxxxxxxxxxxxxxxxxxx'),
  };

  console.log('📊 Token Status:');
  console.log(`Token Mint: ${tokenMint.toBase58()}`);
  console.log(`Market Cap: $${graduationData.marketCap.div(new BN(LAMPORTS_PER_SOL)).toString()}`);
  console.log(`Treasury: ${graduationData.treasuryBalance.div(new BN(LAMPORTS_PER_SOL)).toString()} SOL`);
  console.log(`Total Supply: ${graduationData.totalSupply.toString()} tokens`);
  console.log('');

  console.log('💰 Graduation Allocations:');
  console.log(`Liquidity (85%): ${graduationData.treasuryBalance.mul(new BN(85)).div(new BN(100)).div(new BN(LAMPORTS_PER_SOL)).toString()} SOL`);
  console.log(`Platform Fee (10%): ${graduationData.treasuryBalance.mul(new BN(10)).div(new BN(100)).div(new BN(LAMPORTS_PER_SOL)).toString()} SOL`);
  console.log(`Creator Bonus (5%): ${graduationData.treasuryBalance.mul(new BN(5)).div(new BN(100)).div(new BN(LAMPORTS_PER_SOL)).toString()} SOL`);
  console.log('');

  try {
    console.log('🚀 Starting graduation process...\n');
    
    const result = await graduateTokenToRaydium(
      connection,
      tokenMint,
      {
        pda: bondingCurvePda,
        treasuryBalance: graduationData.treasuryBalance,
        totalSupply: graduationData.totalSupply,
        authority,
      },
      wallets,
      'devnet'
    );

    console.log('\n✅ GRADUATION SUCCESSFUL!');
    console.log('========================');
    console.log(`Pool ID: ${result.poolId}`);
    console.log(`LP Mint: ${result.lpMint.toBase58()}`);
    console.log(`Liquidity Added: ${result.liquidityAmount.div(new BN(LAMPORTS_PER_SOL)).toString()} SOL`);
    console.log(`Tokens in Pool: ${result.tokensInPool.toString()}`);
    console.log('');
    console.log('📜 Transaction Signatures:');
    console.log(`Fee Transfer: ${result.txSignatures.graduation}`);
    console.log(`Pool Creation: ${result.txSignatures.poolCreation}`);
    if (result.txSignatures.lpBurn) {
      console.log(`LP Burn: ${result.txSignatures.lpBurn}`);
    }
    console.log('');
    console.log('🎉 Token is now trading on Raydium!');
    console.log('🔒 Liquidity is PERMANENT (LP tokens burned)');
    console.log('📈 Users can now trade freely on the DEX');

  } catch (error) {
    console.error('❌ Graduation failed:', error);
    process.exit(1);
  }
}

// Helper function to simulate monitoring after graduation
async function monitorPoolPerformance(poolId: string) {
  console.log('\n📊 Monitoring Pool Performance (24h)...');
  console.log('=====================================');
  
  // Simulated data (in production, fetch from Raydium API)
  const performanceData = {
    volume24h: 285_000, // $285k
    liquidity: 75_000, // $75k (increased from initial)
    priceChange24h: 42.5, // +42.5%
    holders: 1_234,
    transactions: 5_678,
  };

  console.log(`Volume (24h): $${performanceData.volume24h.toLocaleString()}`);
  console.log(`Current Liquidity: $${performanceData.liquidity.toLocaleString()}`);
  console.log(`Price Change: ${performanceData.priceChange24h > 0 ? '+' : ''}${performanceData.priceChange24h}%`);
  console.log(`Holders: ${performanceData.holders.toLocaleString()}`);
  console.log(`Transactions: ${performanceData.transactions.toLocaleString()}`);
  
  return performanceData;
}

// Run the example
main()
  .then(async () => {
    // Simulate monitoring after graduation
    const poolId = 'ExamplePoolIdxxxxxxxxxxxxxxxxxxxxxx';
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
    await monitorPoolPerformance(poolId);
    
    console.log('\n✨ Example completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error in example:', error);
    process.exit(1);
  });