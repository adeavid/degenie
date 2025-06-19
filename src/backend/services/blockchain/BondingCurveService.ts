import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  Keypair,
  LAMPORTS_PER_SOL,
  sendAndConfirmTransaction,
  TransactionSignature,
  ParsedAccountData,
  AccountInfo
} from '@solana/web3.js';
import {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  getAccount,
  TokenAccountNotFoundError
} from '@solana/spl-token';
import { Program, AnchorProvider, Wallet, BN } from '@coral-xyz/anchor';
import { IDL } from '../../idl/degenie_token_creator';
import dotenv from 'dotenv';

dotenv.config();

// Contract constants
// Using a placeholder program ID for development
// In production, this would be the deployed program address
const PROGRAM_ID = new PublicKey('Cu3ZCXsVh7xC64gWH23vjDeytWC6ZGcMRVYZAka92QTq');
const LAMPORTS_PER_TOKEN = 1_000_000; // 6 decimals

export interface BondingCurveState {
  mint: PublicKey;
  currentPrice: BN;
  totalSupply: BN;
  maxSupply: BN;
  treasuryBalance: BN;
  totalVolume: BN;
  isGraduated: boolean;
  creatorFeePercentage: number;
  platformFeePercentage: number;
  transactionFeePercentage: number;
  bondingCurveProgress: number;
}

export interface TradePreview {
  inputAmount: number;
  outputAmount: number;
  pricePerToken: number;
  priceImpact: number;
  platformFee: number;
  creatorFee: number;
  totalFee: number;
  minimumReceived: number;
  maximumCost?: number;
}

export interface TradeResult {
  signature: string;
  inputAmount: number;
  outputAmount: number;
  pricePerToken: number;
  fees: {
    platform: number;
    creator: number;
    total: number;
  };
  newPrice: number;
  newSupply: number;
  graduationProgress: number;
}

export class BondingCurveService {
  private connection: Connection;
  private program: Program | null = null;
  private serverWallet: Keypair | null = null;

  constructor() {
    const rpcUrl = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
    this.connection = new Connection(rpcUrl, 'confirmed');
    
    // Initialize server wallet if private key is provided
    if (process.env.SERVER_WALLET_PRIVATE_KEY) {
      try {
        const privateKey = JSON.parse(process.env.SERVER_WALLET_PRIVATE_KEY);
        this.serverWallet = Keypair.fromSecretKey(new Uint8Array(privateKey));
        console.log('🔑 BondingCurveService initialized with server wallet:', this.serverWallet.publicKey.toBase58());
      } catch (error) {
        console.error('Failed to initialize server wallet:', error);
      }
    }
  }

  /**
   * Get the bonding curve PDA for a token
   */
  private async getBondingCurvePDA(mint: PublicKey): Promise<[PublicKey, number]> {
    return PublicKey.findProgramAddress(
      [Buffer.from('bonding_curve'), mint.toBuffer()],
      PROGRAM_ID
    );
  }

  /**
   * Get the treasury PDA for a token
   */
  private async getTreasuryPDA(mint: PublicKey): Promise<[PublicKey, number]> {
    return PublicKey.findProgramAddress(
      [Buffer.from('treasury'), mint.toBuffer()],
      PROGRAM_ID
    );
  }

  // In-memory state for development (will be replaced with on-chain data)
  private bondingCurveStates = new Map<string, BondingCurveState>();

  /**
   * Initialize bonding curve state for a new token
   */
  initializeBondingCurve(tokenAddress: string): BondingCurveState {
    const mint = new PublicKey(tokenAddress);
    const initialState: BondingCurveState = {
      mint,
      currentPrice: new BN(69000), // 0.000069 SOL per token (starting price like pump.fun)
      totalSupply: new BN(0), // Start with 0 circulating supply
      maxSupply: new BN(1000000000 * LAMPORTS_PER_TOKEN), // 1B max supply
      treasuryBalance: new BN(0), // No initial treasury
      totalVolume: new BN(0), // No initial volume
      isGraduated: false,
      creatorFeePercentage: 0.5,
      platformFeePercentage: 0.5,
      transactionFeePercentage: 1.0,
      bondingCurveProgress: 0 // Start at 0%
    };
    
    this.bondingCurveStates.set(tokenAddress, initialState);
    return initialState;
  }

  /**
   * Fetch bonding curve state from blockchain
   */
  async getBondingCurveState(tokenAddress: string): Promise<BondingCurveState | null> {
    try {
      // For development, use in-memory state
      let state = this.bondingCurveStates.get(tokenAddress);
      
      if (!state) {
        // Initialize if not exists
        state = this.initializeBondingCurve(tokenAddress);
      }

      // Calculate graduation progress based on treasury balance
      // Graduation at 500 SOL (like our smart contract)
      const graduationThreshold = 500 * LAMPORTS_PER_SOL;
      const progress = Math.min(100, (state.treasuryBalance.toNumber() / graduationThreshold) * 100);
      
      return {
        ...state,
        bondingCurveProgress: progress
      };
    } catch (error) {
      console.error('Error fetching bonding curve state:', error);
      return null;
    }
  }

  /**
   * Calculate tokens received for SOL amount (buy)
   * Uses exponential bonding curve: price = initialPrice * (1 + k)^supply
   */
  calculateBuyAmount(
    solAmount: number,
    currentPrice: number,
    priceIncrement: number,
    currentSupply: number
  ): TradePreview {
    const platformFeeRate = 0.005; // 0.5%
    const creatorFeeRate = 0.005; // 0.5%
    const totalFeeRate = platformFeeRate + creatorFeeRate;
    
    // Calculate fees
    const totalFee = solAmount * totalFeeRate;
    const platformFee = solAmount * platformFeeRate;
    const creatorFee = solAmount * creatorFeeRate;
    const netSolAmount = solAmount - totalFee;
    
    // Exponential bonding curve parameters
    const k = 0.00000015; // Growth rate (tuned for realistic price action)
    const initialPrice = 69000; // 0.000069 SOL per token
    
    // Calculate tokens using integration of exponential curve
    // Integral of price curve from supply S to S+x equals SOL amount
    // This gives us: x = ln((netSolAmount * k * (1+k)^S / initialPrice) + 1) / ln(1+k)
    
    const currentMultiplier = Math.pow(1 + k, currentSupply / LAMPORTS_PER_TOKEN);
    const solInLamports = netSolAmount * LAMPORTS_PER_SOL;
    
    // Numerical approximation for token amount
    let tokensOut = 0;
    let remainingSol = solInLamports;
    let tempSupply = currentSupply;
    
    // Step through small increments to calculate exact token amount
    const increment = 1000 * LAMPORTS_PER_TOKEN; // 1000 tokens at a time
    while (remainingSol > 0) {
      const price = initialPrice * Math.pow(1 + k, tempSupply / LAMPORTS_PER_TOKEN);
      const cost = price * increment / LAMPORTS_PER_TOKEN;
      
      if (cost <= remainingSol) {
        tokensOut += increment;
        remainingSol -= cost;
        tempSupply += increment;
      } else {
        // Calculate partial tokens for remaining SOL
        const partialTokens = (remainingSol * LAMPORTS_PER_TOKEN) / price;
        tokensOut += partialTokens;
        remainingSol = 0;
      }
    }
    
    // Calculate new price after buy
    const newSupply = currentSupply + tokensOut;
    const newPrice = initialPrice * Math.pow(1 + k, newSupply / LAMPORTS_PER_TOKEN);
    
    // Calculate price impact
    const priceImpact = ((newPrice - currentPrice) / currentPrice) * 100;
    
    // Calculate average price for this trade
    const averagePrice = solInLamports / tokensOut;
    
    // Calculate minimum received with 1% slippage
    const minimumReceived = tokensOut * 0.99;
    
    return {
      inputAmount: solAmount,
      outputAmount: tokensOut / LAMPORTS_PER_TOKEN,
      pricePerToken: averagePrice / LAMPORTS_PER_SOL,
      priceImpact: Math.min(priceImpact, 99), // Cap at 99%
      platformFee,
      creatorFee,
      totalFee,
      minimumReceived: minimumReceived / LAMPORTS_PER_TOKEN
    };
  }

  /**
   * Calculate SOL received for token amount (sell)
   * Uses exponential bonding curve for accurate pricing
   */
  calculateSellAmount(
    tokenAmount: number,
    currentPrice: number,
    priceIncrement: number,
    currentSupply: number
  ): TradePreview {
    const platformFeeRate = 0.005; // 0.5%
    const creatorFeeRate = 0.005; // 0.5%
    const totalFeeRate = platformFeeRate + creatorFeeRate;
    
    // Exponential bonding curve parameters (same as buy)
    const k = 0.00000015; // Growth rate
    const initialPrice = 69000; // 0.000069 SOL per token
    
    // Calculate SOL received by integrating the price curve
    const tokenAmountInBase = tokenAmount * LAMPORTS_PER_TOKEN;
    let solReceived = 0;
    let remainingTokens = tokenAmountInBase;
    let tempSupply = currentSupply;
    
    // Step through small decrements to calculate exact SOL amount
    const decrement = 1000 * LAMPORTS_PER_TOKEN; // 1000 tokens at a time
    while (remainingTokens > 0 && tempSupply > 0) {
      const tokensToSell = Math.min(remainingTokens, decrement);
      const avgSupply = tempSupply - tokensToSell / 2; // Average supply during this step
      const price = initialPrice * Math.pow(1 + k, avgSupply / LAMPORTS_PER_TOKEN);
      const solFromStep = (price * tokensToSell) / LAMPORTS_PER_TOKEN;
      
      solReceived += solFromStep;
      remainingTokens -= tokensToSell;
      tempSupply -= tokensToSell;
    }
    
    const grossSolAmount = solReceived / LAMPORTS_PER_SOL;
    
    // Calculate fees on output
    const totalFee = grossSolAmount * totalFeeRate;
    const platformFee = grossSolAmount * platformFeeRate;
    const creatorFee = grossSolAmount * creatorFeeRate;
    const netSolAmount = grossSolAmount - totalFee;
    
    // Calculate new price after sell
    const newSupply = Math.max(0, currentSupply - tokenAmountInBase);
    const newPrice = initialPrice * Math.pow(1 + k, newSupply / LAMPORTS_PER_TOKEN);
    
    // Calculate price impact (negative for sells)
    const priceImpact = ((currentPrice - newPrice) / currentPrice) * 100;
    
    // Calculate average price for this trade
    const averagePrice = solReceived / tokenAmountInBase;
    
    // Calculate minimum received with 1% slippage
    const minimumReceived = netSolAmount * 0.99;
    
    return {
      inputAmount: tokenAmount,
      outputAmount: netSolAmount,
      pricePerToken: averagePrice / LAMPORTS_PER_SOL,
      priceImpact: Math.min(priceImpact, 99), // Cap at 99%
      platformFee,
      creatorFee,
      totalFee,
      minimumReceived,
      maximumCost: tokenAmount // For sells, this is the max tokens to sell
    };
  }

  /**
   * Execute buy transaction
   */
  async executeBuy(
    tokenAddress: string,
    buyerWallet: string,
    solAmount: number,
    minTokensOut: number
  ): Promise<TradeResult> {
    try {
      if (!this.serverWallet) {
        throw new Error('Server wallet not configured');
      }

      const mint = new PublicKey(tokenAddress);
      const buyer = new PublicKey(buyerWallet);
      const [bondingCurvePDA] = await this.getBondingCurvePDA(mint);
      const [treasuryPDA] = await this.getTreasuryPDA(mint);
      
      // Get or create buyer's token account
      const buyerTokenAccount = await getAssociatedTokenAddress(mint, buyer);
      
      // Check if token account exists
      let tokenAccountExists = true;
      try {
        await getAccount(this.connection, buyerTokenAccount);
      } catch (error) {
        if (error instanceof TokenAccountNotFoundError) {
          tokenAccountExists = false;
        } else {
          throw error;
        }
      }
      
      // Build transaction
      const transaction = new Transaction();
      
      // Create token account if needed
      if (!tokenAccountExists) {
        transaction.add(
          createAssociatedTokenAccountInstruction(
            this.serverWallet.publicKey, // payer
            buyerTokenAccount, // ata
            buyer, // owner
            mint // mint
          )
        );
      }
      
      // TODO: Add actual buy instruction once IDL is available
      // For now, simulate with a transfer
      const lamports = Math.floor(solAmount * LAMPORTS_PER_SOL);
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: buyer,
          toPubkey: treasuryPDA,
          lamports
        })
      );
      
      // Get recent blockhash
      const { blockhash } = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = this.serverWallet.publicKey;
      
      // Skip simulation in development mode
      console.log(`🔧 [Dev Mode] Skipping transaction simulation for development`);
      
      // In production, this would be signed by the user's wallet
      // For now, simulate the transaction
      const txSignature = `devnet_buy_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      
      // Get current state
      const state = await this.getBondingCurveState(tokenAddress);
      if (!state) throw new Error('Bonding curve not found');
      
      // Calculate trade details
      const preview = this.calculateBuyAmount(
        solAmount,
        state.currentPrice.toNumber(),
        1000, // not used in exponential curve
        state.totalSupply.toNumber()
      );
      
      // Update state with the buy
      const tokensInBase = preview.outputAmount * LAMPORTS_PER_TOKEN;
      const solInLamports = solAmount * LAMPORTS_PER_SOL;
      
      // Update bonding curve state
      state.totalSupply = new BN(state.totalSupply.toNumber() + tokensInBase);
      state.treasuryBalance = new BN(state.treasuryBalance.toNumber() + solInLamports);
      state.totalVolume = new BN(state.totalVolume.toNumber() + solInLamports);
      
      // Calculate new price using exponential curve
      const k = 0.00000015;
      const initialPrice = 69000;
      const newPrice = initialPrice * Math.pow(1 + k, state.totalSupply.toNumber() / LAMPORTS_PER_TOKEN);
      state.currentPrice = new BN(newPrice);
      
      // Check for graduation (500 SOL)
      const graduationThreshold = 500 * LAMPORTS_PER_SOL;
      const progress = Math.min(100, (state.treasuryBalance.toNumber() / graduationThreshold) * 100);
      
      if (progress >= 100 && !state.isGraduated) {
        state.isGraduated = true;
        console.log(`🎓 Token ${tokenAddress} graduated to Raydium!`);
      }
      
      // Save updated state
      this.bondingCurveStates.set(tokenAddress, state);
      
      return {
        signature: txSignature,
        inputAmount: solAmount,
        outputAmount: preview.outputAmount,
        pricePerToken: preview.pricePerToken,
        fees: {
          platform: preview.platformFee,
          creator: preview.creatorFee,
          total: preview.totalFee
        },
        newPrice: newPrice / LAMPORTS_PER_SOL,
        newSupply: state.totalSupply.toNumber() / LAMPORTS_PER_TOKEN,
        graduationProgress: progress
      };
    } catch (error) {
      console.error('Error executing buy:', error);
      throw error;
    }
  }

  /**
   * Execute sell transaction
   */
  async executeSell(
    tokenAddress: string,
    sellerWallet: string,
    tokenAmount: number,
    minSolOut: number
  ): Promise<TradeResult> {
    try {
      if (!this.serverWallet) {
        throw new Error('Server wallet not configured');
      }

      const mint = new PublicKey(tokenAddress);
      const seller = new PublicKey(sellerWallet);
      const [bondingCurvePDA] = await this.getBondingCurvePDA(mint);
      const [treasuryPDA] = await this.getTreasuryPDA(mint);
      
      // Get seller's token account
      const sellerTokenAccount = await getAssociatedTokenAddress(mint, seller);
      
      // Build transaction
      const transaction = new Transaction();
      
      // In production, this would be signed by the user's wallet
      // For now, simulate the transaction
      const txSignature = `devnet_sell_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      
      // Get current state
      const state = await this.getBondingCurveState(tokenAddress);
      if (!state) throw new Error('Bonding curve not found');
      
      // Prevent selling more than exists
      if (tokenAmount * LAMPORTS_PER_TOKEN > state.totalSupply.toNumber()) {
        throw new Error('Insufficient token supply in bonding curve');
      }
      
      // Calculate trade details
      const preview = this.calculateSellAmount(
        tokenAmount,
        state.currentPrice.toNumber(),
        1000, // not used in exponential curve
        state.totalSupply.toNumber()
      );
      
      // Check if treasury has enough SOL
      const solOutLamports = preview.outputAmount * LAMPORTS_PER_SOL;
      if (solOutLamports > state.treasuryBalance.toNumber()) {
        throw new Error('Insufficient SOL in bonding curve treasury');
      }
      
      // Update state with the sell
      const tokensInBase = tokenAmount * LAMPORTS_PER_TOKEN;
      
      // Update bonding curve state
      state.totalSupply = new BN(Math.max(0, state.totalSupply.toNumber() - tokensInBase));
      state.treasuryBalance = new BN(state.treasuryBalance.toNumber() - solOutLamports);
      state.totalVolume = new BN(state.totalVolume.toNumber() + solOutLamports);
      
      // Calculate new price using exponential curve
      const k = 0.00000015;
      const initialPrice = 69000;
      const newPrice = initialPrice * Math.pow(1 + k, state.totalSupply.toNumber() / LAMPORTS_PER_TOKEN);
      state.currentPrice = new BN(newPrice);
      
      // Recalculate graduation progress
      const graduationThreshold = 500 * LAMPORTS_PER_SOL;
      const progress = Math.min(100, (state.treasuryBalance.toNumber() / graduationThreshold) * 100);
      
      // Save updated state
      this.bondingCurveStates.set(tokenAddress, state);
      
      return {
        signature: txSignature,
        inputAmount: tokenAmount,
        outputAmount: preview.outputAmount,
        pricePerToken: preview.pricePerToken,
        fees: {
          platform: preview.platformFee,
          creator: preview.creatorFee,
          total: preview.totalFee
        },
        newPrice: newPrice / LAMPORTS_PER_SOL,
        newSupply: state.totalSupply.toNumber() / LAMPORTS_PER_TOKEN,
        graduationProgress: progress
      };
    } catch (error) {
      console.error('Error executing sell:', error);
      throw error;
    }
  }

  /**
   * Get real-time token metrics
   */
  async getTokenMetrics(tokenAddress: string) {
    const state = await this.getBondingCurveState(tokenAddress);
    if (!state) return null;
    
    return {
      currentPrice: state.currentPrice.toNumber() / LAMPORTS_PER_SOL,
      marketCap: (state.totalSupply.toNumber() / LAMPORTS_PER_TOKEN) * (state.currentPrice.toNumber() / LAMPORTS_PER_SOL),
      totalSupply: state.totalSupply.toNumber() / LAMPORTS_PER_TOKEN,
      maxSupply: state.maxSupply.toNumber() / LAMPORTS_PER_TOKEN,
      volume24h: state.totalVolume.toNumber() / LAMPORTS_PER_SOL,
      liquiditySOL: state.treasuryBalance.toNumber() / LAMPORTS_PER_SOL,
      bondingCurveProgress: state.bondingCurveProgress,
      isGraduated: state.isGraduated,
      priceChange24h: 15.5, // Mock data - would calculate from price history
      holders: 127 // Mock data - would fetch from chain
    };
  }
}

// Export singleton instance
export const bondingCurveService = new BondingCurveService();