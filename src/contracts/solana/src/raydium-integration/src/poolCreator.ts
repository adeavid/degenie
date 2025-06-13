import {
  Connection,
  PublicKey,
  Keypair,
  Transaction,
  TransactionInstruction,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
} from '@solana/web3.js';
import { 
  Token, 
  TOKEN_PROGRAM_ID, 
  ASSOCIATED_TOKEN_PROGRAM_ID,
  u64 
} from '@solana/spl-token';
import { 
  Liquidity, 
  LiquidityPoolKeys, 
  jsonInfo2PoolKeys,
  LiquidityPoolJsonInfo,
  TokenAmount,
  Token as RaydiumToken,
  Currency,
  CurrencyAmount,
  Percent,
  LIQUIDITY_STATE_LAYOUT_V4,
} from '@raydium-io/raydium-sdk';
import BN from 'bn.js';
import { Decimal } from 'decimal.js';
import {
  RAYDIUM_MAINNET,
  RAYDIUM_DEVNET,
  NATIVE_MINT,
  GRADUATION_FEES,
  MIN_LIQUIDITY_THRESHOLD,
  PoolConfig,
} from './config';

export interface CreatePoolParams {
  connection: Connection;
  wallet: Keypair;
  tokenMint: PublicKey;
  baseAmount: BN; // Amount of our token
  quoteAmount: BN; // Amount of SOL
  burnLpTokens?: boolean;
  network?: 'mainnet' | 'devnet';
}

export class RaydiumPoolCreator {
  private connection: Connection;
  private programIds: typeof RAYDIUM_MAINNET;

  constructor(connection: Connection, network: 'mainnet' | 'devnet' = 'mainnet') {
    this.connection = connection;
    this.programIds = network === 'mainnet' ? RAYDIUM_MAINNET : RAYDIUM_DEVNET;
  }

  /**
   * Create a new liquidity pool on Raydium
   */
  async createPool(params: CreatePoolParams): Promise<{
    poolId: string;
    lpMint: PublicKey;
    txSignature: string;
  }> {
    const {
      wallet,
      tokenMint,
      baseAmount,
      quoteAmount,
      burnLpTokens = true,
    } = params;

    console.log('🚀 Creating Raydium pool...');
    console.log(`Token mint: ${tokenMint.toBase58()}`);
    console.log(`Base amount: ${baseAmount.toString()}`);
    console.log(`Quote amount (SOL): ${quoteAmount.toString()}`);

    // Validate minimum liquidity
    const solAmount = new Decimal(quoteAmount.toString()).div(1e9);
    if (solAmount.lt(MIN_LIQUIDITY_THRESHOLD)) {
      throw new Error(`Insufficient liquidity. Minimum ${MIN_LIQUIDITY_THRESHOLD} SOL required`);
    }

    // Get token info
    const tokenInfo = await this.getTokenInfo(tokenMint);
    const baseToken = new RaydiumToken(
      TOKEN_PROGRAM_ID,
      tokenMint,
      tokenInfo.decimals,
      tokenInfo.symbol || 'Unknown',
      tokenInfo.name || 'Unknown Token'
    );

    // SOL token info
    const quoteToken = new RaydiumToken(
      TOKEN_PROGRAM_ID,
      NATIVE_MINT,
      9,
      'SOL',
      'Solana'
    );

    // Create market (required for Raydium V4)
    const marketInfo = await this.createMarket(
      wallet,
      baseToken,
      quoteToken,
      baseAmount,
      quoteAmount
    );

    // Initialize pool
    const poolKeys = await this.initializePool(
      wallet,
      baseToken,
      quoteToken,
      marketInfo.marketId,
      baseAmount,
      quoteAmount
    );

    // Add initial liquidity
    const { lpAmount, transaction } = await this.addLiquidity(
      wallet,
      poolKeys,
      baseAmount,
      quoteAmount
    );

    // Send transaction
    const txSignature = await this.sendTransaction(transaction, [wallet]);
    console.log(`✅ Pool created! Transaction: ${txSignature}`);
    console.log(`Pool ID: ${poolKeys.id.toBase58()}`);
    console.log(`LP Mint: ${poolKeys.lpMint.toBase58()}`);
    console.log(`LP Amount: ${lpAmount.toString()}`);

    // Burn LP tokens if requested
    if (burnLpTokens) {
      await this.burnLpTokens(wallet, poolKeys.lpMint, lpAmount);
    }

    return {
      poolId: poolKeys.id.toBase58(),
      lpMint: poolKeys.lpMint,
      txSignature,
    };
  }

  /**
   * Create OpenBook market (required for Raydium V4)
   */
  private async createMarket(
    wallet: Keypair,
    baseToken: RaydiumToken,
    quoteToken: RaydiumToken,
    baseAmount: BN,
    quoteAmount: BN
  ): Promise<{ marketId: PublicKey }> {
    console.log('📈 Creating OpenBook market...');
    
    // For mainnet, you would integrate with OpenBook SDK
    // For now, we'll use a mock implementation
    // In production, this would create an actual OpenBook market
    
    // Generate a deterministic market ID for testing
    const [marketId] = await PublicKey.findProgramAddress(
      [
        Buffer.from('openbook-market'),
        baseToken.mint.toBuffer(),
        quoteToken.mint.toBuffer(),
      ],
      this.programIds.OPEN_BOOK_PROGRAM
    );

    console.log(`Market ID: ${marketId.toBase58()}`);
    return { marketId };
  }

  /**
   * Initialize the liquidity pool
   */
  private async initializePool(
    wallet: Keypair,
    baseToken: RaydiumToken,
    quoteToken: RaydiumToken,
    marketId: PublicKey,
    baseAmount: BN,
    quoteAmount: BN
  ): Promise<LiquidityPoolKeys> {
    console.log('🏊 Initializing liquidity pool...');

    // Calculate initial price
    const initialPrice = new Decimal(quoteAmount.toString())
      .div(baseAmount.toString())
      .mul(Math.pow(10, baseToken.decimals - quoteToken.decimals));

    console.log(`Initial price: ${initialPrice.toString()} ${quoteToken.symbol} per ${baseToken.symbol}`);

    // Generate pool keys
    const { poolKeys } = await this.generatePoolKeys({
      baseToken,
      quoteToken,
      marketId,
      programId: this.programIds.LIQUIDITY_POOL_PROGRAM_ID_V4,
    });

    return poolKeys;
  }

  /**
   * Add liquidity to the pool
   */
  private async addLiquidity(
    wallet: Keypair,
    poolKeys: LiquidityPoolKeys,
    baseAmount: BN,
    quoteAmount: BN
  ): Promise<{ lpAmount: BN; transaction: Transaction }> {
    console.log('💧 Adding initial liquidity...');

    const baseTokenAmount = new TokenAmount(
      poolKeys.baseMint,
      baseAmount.toString()
    );
    const quoteTokenAmount = new TokenAmount(
      poolKeys.quoteMint,
      quoteAmount.toString()
    );

    // Create add liquidity instruction
    const { transaction, signers } = await Liquidity.makeAddLiquidityTransaction({
      connection: this.connection,
      poolKeys,
      userKeys: {
        tokenAccounts: [], // Will be created if needed
        owner: wallet.publicKey,
      },
      baseAmountIn: baseTokenAmount,
      quoteAmountIn: quoteTokenAmount,
      fixedSide: 'base',
    });

    // Calculate LP tokens received
    const lpAmount = this.calculateLpTokens(baseAmount, quoteAmount);

    return { lpAmount, transaction };
  }

  /**
   * Burn LP tokens to make liquidity permanent
   */
  async burnLpTokens(
    wallet: Keypair,
    lpMint: PublicKey,
    amount: BN
  ): Promise<string> {
    console.log('🔥 Burning LP tokens for permanent liquidity...');

    const lpToken = new Token(
      this.connection,
      lpMint,
      TOKEN_PROGRAM_ID,
      wallet
    );

    // Get or create LP token account
    const lpTokenAccount = await lpToken.getOrCreateAssociatedAccountInfo(
      wallet.publicKey
    );

    // Create burn instruction
    const burnIx = Token.createBurnInstruction(
      TOKEN_PROGRAM_ID,
      lpMint,
      lpTokenAccount.address,
      wallet.publicKey,
      [],
      amount.toNumber()
    );

    // Create and send transaction
    const transaction = new Transaction().add(burnIx);
    const txSignature = await this.sendTransaction(transaction, [wallet]);

    console.log(`✅ LP tokens burned! Transaction: ${txSignature}`);
    console.log('Liquidity is now PERMANENT - no rug pulls possible! 🔒');

    return txSignature;
  }

  /**
   * Get token metadata
   */
  private async getTokenInfo(mint: PublicKey): Promise<{
    decimals: number;
    symbol?: string;
    name?: string;
  }> {
    const token = new Token(
      this.connection,
      mint,
      TOKEN_PROGRAM_ID,
      Keypair.generate() // Dummy keypair for read-only
    );

    const mintInfo = await token.getMintInfo();

    return {
      decimals: mintInfo.decimals,
      // In production, fetch metadata from token metadata program
      symbol: 'TOKEN',
      name: 'DeGenie Token',
    };
  }

  /**
   * Generate pool keys for the new pool
   */
  private async generatePoolKeys(params: {
    baseToken: RaydiumToken;
    quoteToken: RaydiumToken;
    marketId: PublicKey;
    programId: PublicKey;
  }): Promise<{ poolKeys: LiquidityPoolKeys }> {
    // This is a simplified version
    // In production, use Raydium SDK's proper pool key generation
    
    const [poolId] = await PublicKey.findProgramAddress(
      [
        params.programId.toBuffer(),
        params.marketId.toBuffer(),
        Buffer.from('pool'),
      ],
      params.programId
    );

    const [lpMint] = await PublicKey.findProgramAddress(
      [
        params.programId.toBuffer(),
        poolId.toBuffer(),
        Buffer.from('lp_mint'),
      ],
      params.programId
    );

    const [baseVault] = await PublicKey.findProgramAddress(
      [
        params.programId.toBuffer(),
        poolId.toBuffer(),
        Buffer.from('base_vault'),
      ],
      params.programId
    );

    const [quoteVault] = await PublicKey.findProgramAddress(
      [
        params.programId.toBuffer(),
        poolId.toBuffer(),
        Buffer.from('quote_vault'),
      ],
      params.programId
    );

    const poolKeys: LiquidityPoolKeys = {
      id: poolId,
      baseMint: params.baseToken.mint,
      quoteMint: params.quoteToken.mint,
      lpMint,
      baseDecimals: params.baseToken.decimals,
      quoteDecimals: params.quoteToken.decimals,
      lpDecimals: 9,
      version: 4,
      programId: params.programId,
      authority: PublicKey.default, // Will be derived
      openOrders: PublicKey.default, // Will be derived
      targetOrders: PublicKey.default, // Will be derived
      baseVault,
      quoteVault,
      withdrawQueue: PublicKey.default, // V4 specific
      lpVault: PublicKey.default, // V4 specific
      marketVersion: 3,
      marketProgramId: this.programIds.OPEN_BOOK_PROGRAM,
      marketId: params.marketId,
      marketAuthority: PublicKey.default, // Will be derived
      marketBaseVault: PublicKey.default, // Will be derived
      marketQuoteVault: PublicKey.default, // Will be derived
      marketBids: PublicKey.default, // Will be derived
      marketAsks: PublicKey.default, // Will be derived
      marketEventQueue: PublicKey.default, // Will be derived
      lookupTableAccount: PublicKey.default, // Optional
    };

    return { poolKeys };
  }

  /**
   * Calculate LP tokens to be minted
   */
  private calculateLpTokens(baseAmount: BN, quoteAmount: BN): BN {
    // Simplified calculation
    // LP = sqrt(baseAmount * quoteAmount)
    const product = baseAmount.mul(quoteAmount);
    const lpAmount = new BN(Math.floor(Math.sqrt(product.toNumber())));
    return lpAmount;
  }

  /**
   * Send transaction helper
   */
  private async sendTransaction(
    transaction: Transaction,
    signers: Keypair[]
  ): Promise<string> {
    const { blockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = signers[0].publicKey;

    // Sign transaction
    transaction.sign(...signers);

    // Send and confirm
    const signature = await this.connection.sendRawTransaction(
      transaction.serialize(),
      {
        skipPreflight: false,
        preflightCommitment: 'confirmed',
      }
    );

    // Confirm transaction
    await this.connection.confirmTransaction({
      signature,
      blockhash,
      lastValidBlockHeight,
    });

    return signature;
  }
}