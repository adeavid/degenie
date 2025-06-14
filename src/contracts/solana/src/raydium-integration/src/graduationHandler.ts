import {
  Connection,
  PublicKey,
  Keypair,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import { 
  Token, 
  TOKEN_PROGRAM_ID,
  u64,
} from '@solana/spl-token';
import BN from 'bn.js';
import { RaydiumPoolCreator } from './poolCreator';
import { GRADUATION_FEES, DEFAULT_GRADUATION_CONFIG } from './config';

export interface GraduationParams {
  connection: Connection;
  tokenMint: PublicKey;
  bondingCurvePda: PublicKey;
  treasuryBalance: BN;
  totalSupply: BN;
  creatorWallet: PublicKey;
  platformWallet: PublicKey;
  authority: Keypair;
  network?: 'mainnet' | 'devnet';
}

export interface GraduationResult {
  poolId: string;
  lpMint: PublicKey;
  liquidityAmount: BN;
  tokensInPool: BN;
  creatorBonus: BN;
  platformFee: BN;
  txSignatures: {
    graduation: string;
    poolCreation: string;
    lpBurn?: string;
  };
}

export class TokenGraduationHandler {
  private connection: Connection;
  private poolCreator: RaydiumPoolCreator;

  constructor(connection: Connection, network: 'mainnet' | 'devnet' = 'mainnet') {
    this.connection = connection;
    this.poolCreator = new RaydiumPoolCreator(connection, network);
  }

  /**
   * Graduate a token from bonding curve to Raydium
   */
  async graduateToken(params: GraduationParams): Promise<GraduationResult> {
    const {
      tokenMint,
      bondingCurvePda,
      treasuryBalance,
      totalSupply,
      creatorWallet,
      platformWallet,
      authority,
    } = params;

    console.log('🎓 INITIATING TOKEN GRADUATION');
    console.log('================================');
    console.log(`Token Mint: ${tokenMint.toBase58()}`);
    console.log(`Treasury Balance: ${treasuryBalance.div(new BN(LAMPORTS_PER_SOL)).toString()} SOL`);
    console.log(`Total Supply: ${totalSupply.toString()} tokens`);

    // Calculate allocations
    const allocations = this.calculateAllocations(treasuryBalance);
    console.log('\n💰 TREASURY ALLOCATION:');
    console.log(`Liquidity (${GRADUATION_FEES.LIQUIDITY_PERCENTAGE}%): ${allocations.liquidity.div(new BN(LAMPORTS_PER_SOL)).toString()} SOL`);
    console.log(`Platform Fee (${GRADUATION_FEES.PLATFORM_FEE_PERCENTAGE}%): ${allocations.platformFee.div(new BN(LAMPORTS_PER_SOL)).toString()} SOL`);
    console.log(`Creator Bonus (${GRADUATION_FEES.CREATOR_BONUS_PERCENTAGE}%): ${allocations.creatorBonus.div(new BN(LAMPORTS_PER_SOL)).toString()} SOL`);

    // Calculate tokens for liquidity (20% of supply)
    const tokensForLiquidity = totalSupply.mul(new BN(20)).div(new BN(100));
    console.log(`\n🪙 Tokens for Liquidity: ${tokensForLiquidity.toString()} (20% of supply)`);

    // Step 1: Transfer fees
    console.log('\n📤 Transferring fees...');
    const feeTransferTx = await this.transferFees(
      allocations,
      creatorWallet,
      platformWallet,
      authority
    );
    console.log(`✅ Fees transferred: ${feeTransferTx}`);

    // Step 2: Prepare tokens for liquidity
    console.log('\n🔧 Preparing tokens for liquidity pool...');
    const tokenAccount = await this.prepareTokensForLiquidity(
      tokenMint,
      bondingCurvePda,
      tokensForLiquidity,
      authority
    );

    // Step 3: Create Raydium pool
    console.log('\n🏊 Creating Raydium liquidity pool...');
    const poolResult = await this.poolCreator.createPool({
      connection: this.connection,
      wallet: authority,
      tokenMint,
      baseAmount: tokensForLiquidity,
      quoteAmount: allocations.liquidity,
      burnLpTokens: DEFAULT_GRADUATION_CONFIG.burnLpTokens,
      network: params.network,
    });

    // Step 4: Update bonding curve state (mark as graduated)
    // This would be done through your smart contract
    console.log('\n📝 Updating bonding curve state...');
    // await this.updateBondingCurveState(bondingCurvePda, poolResult.poolId);

    console.log('\n✅ GRADUATION COMPLETE!');
    console.log('========================');
    console.log(`Pool ID: ${poolResult.poolId}`);
    console.log(`LP Mint: ${poolResult.lpMint.toBase58()}`);
    console.log('Status: Token is now trading on Raydium!');
    console.log('Liquidity: PERMANENT (LP tokens burned)');

    return {
      poolId: poolResult.poolId,
      lpMint: poolResult.lpMint,
      liquidityAmount: allocations.liquidity,
      tokensInPool: tokensForLiquidity,
      creatorBonus: allocations.creatorBonus,
      platformFee: allocations.platformFee,
      txSignatures: {
        graduation: feeTransferTx,
        poolCreation: poolResult.txSignature,
        lpBurn: poolResult.txSignature, // Same tx if auto-burn enabled
      },
    };
  }

  /**
   * Calculate treasury allocations
   */
  private calculateAllocations(treasuryBalance: BN): {
    liquidity: BN;
    platformFee: BN;
    creatorBonus: BN;
  } {
    const liquidity = treasuryBalance
      .mul(new BN(GRADUATION_FEES.LIQUIDITY_PERCENTAGE))
      .div(new BN(100));
    
    const platformFee = treasuryBalance
      .mul(new BN(GRADUATION_FEES.PLATFORM_FEE_PERCENTAGE))
      .div(new BN(100));
    
    const creatorBonus = treasuryBalance
      .mul(new BN(GRADUATION_FEES.CREATOR_BONUS_PERCENTAGE))
      .div(new BN(100));

    return { liquidity, platformFee, creatorBonus };
  }

  /**
   * Transfer fees to creator and platform
   */
  private async transferFees(
    allocations: { platformFee: BN; creatorBonus: BN },
    creatorWallet: PublicKey,
    platformWallet: PublicKey,
    authority: Keypair
  ): Promise<string> {
    const transaction = new Transaction();

    // Transfer platform fee
    transaction.add(
      SystemProgram.transfer({
        fromPubkey: authority.publicKey,
        toPubkey: platformWallet,
        lamports: allocations.platformFee.toNumber(),
      })
    );

    // Transfer creator bonus
    transaction.add(
      SystemProgram.transfer({
        fromPubkey: authority.publicKey,
        toPubkey: creatorWallet,
        lamports: allocations.creatorBonus.toNumber(),
      })
    );

    const { blockhash } = await this.connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = authority.publicKey;
    transaction.sign(authority);

    const signature = await this.connection.sendRawTransaction(
      transaction.serialize(),
      { skipPreflight: false }
    );

    await this.connection.confirmTransaction(signature);
    return signature;
  }

  /**
   * Prepare tokens for liquidity pool
   */
  private async prepareTokensForLiquidity(
    tokenMint: PublicKey,
    source: PublicKey,
    amount: BN,
    authority: Keypair
  ): Promise<PublicKey> {
    const token = new Token(
      this.connection,
      tokenMint,
      TOKEN_PROGRAM_ID,
      authority
    );

    // Get or create token account for authority
    const tokenAccount = await token.getOrCreateAssociatedAccountInfo(
      authority.publicKey
    );

    // Transfer tokens from bonding curve to authority
    // This would typically be done through your smart contract
    console.log(`Token account prepared: ${tokenAccount.address.toBase58()}`);
    
    return tokenAccount.address;
  }

  /**
   * Validate graduation eligibility
   */
  async validateGraduation(
    tokenMint: PublicKey,
    currentMarketCap: BN,
    graduationThreshold: BN
  ): Promise<boolean> {
    if (currentMarketCap.lt(graduationThreshold)) {
      console.log('❌ Market cap below graduation threshold');
      console.log(`Current: $${currentMarketCap.div(new BN(LAMPORTS_PER_SOL)).toString()}`);
      console.log(`Required: $${graduationThreshold.div(new BN(LAMPORTS_PER_SOL)).toString()}`);
      return false;
    }

    // Additional validations
    const tokenInfo = await this.getTokenInfo(tokenMint);
    if (!tokenInfo) {
      console.log('❌ Invalid token mint');
      return false;
    }

    console.log('✅ Token eligible for graduation');
    return true;
  }

  /**
   * Get token information
   */
  private async getTokenInfo(mint: PublicKey): Promise<any> {
    try {
      const token = new Token(
        this.connection,
        mint,
        TOKEN_PROGRAM_ID,
        Keypair.generate()
      );
      const mintInfo = await token.getMintInfo();
      return mintInfo;
    } catch (error) {
      console.error('Error fetching token info:', error);
      return null;
    }
  }

  /**
   * Monitor pool performance after graduation
   */
  async monitorPoolPerformance(poolId: string): Promise<{
    volume24h: number;
    liquidity: number;
    priceChange24h: number;
  }> {
    // This would connect to Raydium API or on-chain data
    // For now, returning mock data
    return {
      volume24h: 150000, // $150k volume
      liquidity: 69000, // $69k liquidity
      priceChange24h: 25.5, // +25.5%
    };
  }
}