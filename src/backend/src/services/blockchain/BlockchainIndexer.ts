import {
  Connection,
  PublicKey,
  Context,
  KeyedAccountInfo,
  Logs,
  ConfirmedSignatureInfo,
  ParsedTransactionWithMeta,
  LAMPORTS_PER_SOL
} from '@solana/web3.js';
import { Program, AnchorProvider, Wallet, BN, EventParser } from '@coral-xyz/anchor';
import { PrismaClient } from '@prisma/client';
import { webSocketService } from '../websocket/WebSocketService';
import { candleService } from './CandleService';
import dotenv from 'dotenv';

dotenv.config();

// Program IDs
const PUMP_FUN_PROGRAM_ID = new PublicKey('6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P'); // pump.fun mainnet
const DEGENIE_PROGRAM_ID = new PublicKey('Cu3ZCXsVh7xC64gWH23vjDeytWC6ZGcMRVYZAka92QTq'); // Our devnet program

export class BlockchainIndexer {
  private connection: Connection;
  private prisma: PrismaClient;
  private program: Program | null = null;
  private isRunning: boolean = false;
  private processedSignatures: Set<string> = new Set();

  constructor() {
    const rpcUrl = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
    this.connection = new Connection(rpcUrl, {
      commitment: 'confirmed',
      wsEndpoint: rpcUrl.replace('https', 'wss')
    });
    this.prisma = new PrismaClient();
  }

  async start() {
    if (this.isRunning) return;
    this.isRunning = true;

    console.log('🚀 [BlockchainIndexer] Starting blockchain indexer...');

    // Subscribe to program logs
    this.subscribeToLogs();

    // Poll for historical trades every 5 seconds
    this.pollHistoricalTrades();

    // Process candles every minute
    this.processCandlesPeriodically();
  }

  private subscribeToLogs() {
    // Subscribe to our program logs
    this.connection.onLogs(
      DEGENIE_PROGRAM_ID,
      async (logs: Logs, ctx: Context) => {
        console.log('📝 [BlockchainIndexer] Program logs received:', logs.signature);
        await this.processTransaction(logs.signature);
      },
      'confirmed'
    );

    console.log('📡 [BlockchainIndexer] Subscribed to program logs');
  }

  private async pollHistoricalTrades() {
    while (this.isRunning) {
      try {
        // Get recent signatures for our program
        const signatures = await this.connection.getSignaturesForAddress(
          DEGENIE_PROGRAM_ID,
          { limit: 100 },
          'confirmed'
        );

        for (const sig of signatures) {
          if (!this.processedSignatures.has(sig.signature)) {
            await this.processTransaction(sig.signature);
          }
        }
      } catch (error) {
        console.error('❌ [BlockchainIndexer] Error polling trades:', error);
      }

      // Wait 5 seconds before next poll
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }

  private async processTransaction(signature: string) {
    if (this.processedSignatures.has(signature)) return;
    this.processedSignatures.add(signature);

    try {
      console.log(`🔍 [BlockchainIndexer] Processing transaction: ${signature}`);

      // Get transaction details
      const tx = await this.connection.getParsedTransaction(signature, {
        maxSupportedTransactionVersion: 0,
        commitment: 'confirmed'
      });

      if (!tx || !tx.meta) return;

      // Parse logs to determine trade type
      const logs = tx.meta.logMessages || [];
      const isBuy = logs.some(log => log.includes('Instruction: Buy'));
      const isSell = logs.some(log => log.includes('Instruction: Sell'));
      const isCreate = logs.some(log => log.includes('Instruction: Create'));

      if (isCreate) {
        await this.processTokenCreation(tx);
      } else if (isBuy || isSell) {
        await this.processTrade(tx, isBuy ? 'BUY' : 'SELL');
      }
    } catch (error) {
      console.error(`❌ [BlockchainIndexer] Error processing transaction ${signature}:`, error);
    }
  }

  private async processTokenCreation(tx: ParsedTransactionWithMeta) {
    try {
      // Extract token creation data from logs
      const logs = tx.meta?.logMessages || [];
      let tokenAddress = '';
      let name = '';
      let symbol = '';

      // Parse logs for token info
      logs.forEach(log => {
        if (log.includes('Token created successfully:')) {
          const match = log.match(/Token created successfully: (.+) \((.+)\)/);
          if (match) {
            name = match[1];
            symbol = match[2];
          }
        }
        if (log.includes('Mint address:')) {
          tokenAddress = log.split('Mint address: ')[1];
        }
      });

      if (!tokenAddress) return;

      // Get creator from transaction
      const creator = tx.transaction.message.accountKeys[0].pubkey.toString();

      // Check if user exists, create if not
      let user = await this.prisma.user.findUnique({
        where: { walletAddress: creator }
      });

      if (!user) {
        user = await this.prisma.user.create({
          data: { walletAddress: creator }
        });
      }

      // Create token in database
      await this.prisma.token.upsert({
        where: { address: tokenAddress },
        update: {},
        create: {
          address: tokenAddress,
          name,
          symbol,
          creatorId: user.id,
          totalSupply: BigInt(1000000000 * 1e6), // 1B tokens with 6 decimals
          decimals: 6,
          currentPrice: 0.000069,
          marketCap: 69000,
          bondingProgress: 0
        }
      });

      console.log(`✅ [BlockchainIndexer] Token created: ${name} (${symbol}) - ${tokenAddress}`);

      // Broadcast via WebSocket
      webSocketService.broadcastTokenCreated({
        address: tokenAddress,
        name,
        symbol,
        creator,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('❌ [BlockchainIndexer] Error processing token creation:', error);
    }
  }

  private async processTrade(tx: ParsedTransactionWithMeta, type: 'BUY' | 'SELL') {
    try {
      const logs = tx.meta?.logMessages || [];
      let tokenAddress = '';
      let solAmount = 0;
      let tokenAmount = 0;
      let newPrice = 0;
      let newSupply = 0;
      let bondingProgress = 0;

      // Parse trade details from logs
      logs.forEach(log => {
        // Example log format: "Bought 1000000 tokens for 0.1 SOL (fee: 0.001 SOL)"
        if (log.includes('Bought') || log.includes('Sold')) {
          const match = log.match(/(\d+) tokens for ([\d.]+) SOL \(fee: ([\d.]+) SOL\)/);
          if (match) {
            tokenAmount = parseFloat(match[1]);
            solAmount = parseFloat(match[2]);
          }
        }
      });

      // Get token address from instruction accounts
      const instructions = tx.transaction.message.instructions;
      if (instructions.length > 0) {
        // Token address is usually in the instruction accounts
        const accounts = instructions[0].accounts;
        if (accounts && accounts.length > 1) {
          tokenAddress = accounts[1].toString(); // This varies by program
        }
      }

      if (!tokenAddress || !solAmount) return;

      // Get trader from transaction
      const trader = tx.transaction.message.accountKeys[0].pubkey.toString();

      // Ensure user exists
      let user = await this.prisma.user.findUnique({
        where: { walletAddress: trader }
      });

      if (!user) {
        user = await this.prisma.user.create({
          data: { walletAddress: trader }
        });
      }

      // Get token
      const token = await this.prisma.token.findUnique({
        where: { address: tokenAddress }
      });

      if (!token) {
        console.warn(`⚠️ [BlockchainIndexer] Token not found: ${tokenAddress}`);
        return;
      }

      // Calculate fees (1% total: 0.5% platform, 0.5% creator)
      const totalFee = solAmount * 0.01;
      const platformFee = totalFee * 0.5;
      const creatorFee = totalFee * 0.5;

      // Calculate new price based on bonding curve
      const k = 0.00000015; // Growth rate from our bonding curve
      const initialPrice = 69000; // 0.000069 SOL
      
      // Update supply based on trade type
      let newTotalSupply = parseFloat(token.totalSupply.toString());
      if (type === 'BUY') {
        newTotalSupply += tokenAmount;
      } else {
        newTotalSupply -= tokenAmount;
      }

      newPrice = (initialPrice * Math.pow(1 + k, newTotalSupply / 1e6)) / LAMPORTS_PER_SOL;
      newSupply = newTotalSupply / 1e6; // Convert to millions

      // Calculate bonding progress (graduation at 500 SOL)
      const newTreasuryBalance = token.treasuryBalance + (type === 'BUY' ? solAmount : -solAmount);
      bondingProgress = Math.min(100, (newTreasuryBalance / 500) * 100);

      // Create trade record
      const trade = await this.prisma.trade.create({
        data: {
          signature: tx.transaction.signatures[0],
          tokenAddress,
          traderId: user.id,
          type,
          solAmount,
          tokenAmount: tokenAmount / 1e6, // Convert to token units
          price: newPrice,
          platformFee,
          creatorFee,
          newPrice,
          newSupply,
          bondingProgress,
          blockTime: new Date(tx.blockTime! * 1000)
        }
      });

      // Update token stats
      await this.prisma.token.update({
        where: { address: tokenAddress },
        data: {
          currentPrice: newPrice,
          treasuryBalance: newTreasuryBalance,
          totalVolume: { increment: solAmount },
          bondingProgress,
          marketCap: newPrice * 1000000000, // 1B supply
          isGraduated: bondingProgress >= 100
        }
      });

      // Update 24h volume (simplified - in production use time-series data)
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const volume24h = await this.prisma.trade.aggregate({
        where: {
          tokenAddress,
          blockTime: { gte: yesterday }
        },
        _sum: { solAmount: true }
      });

      await this.prisma.token.update({
        where: { address: tokenAddress },
        data: {
          volume24h: volume24h._sum.solAmount || 0
        }
      });

      console.log(`✅ [BlockchainIndexer] Trade processed: ${type} ${tokenAmount / 1e6} tokens for ${solAmount} SOL`);

      // Update candles
      await candleService.updateCandlesFromTrade(trade);

      // Broadcast via WebSocket
      webSocketService.broadcastTrade(tokenAddress, {
        id: trade.id,
        type,
        account: trader,
        solAmount,
        tokenAmount: tokenAmount / 1e6,
        price: newPrice,
        timestamp: trade.blockTime.getTime(),
        signature: trade.signature,
        newPrice,
        graduationProgress: bondingProgress
      });

      // Check for graduation
      if (bondingProgress >= 100 && !token.isGraduated) {
        webSocketService.broadcastGraduation(tokenAddress, {
          tokenAddress,
          finalPrice: newPrice,
          totalLiquidity: newTreasuryBalance,
          graduationTime: Date.now()
        });
      }
    } catch (error) {
      console.error('❌ [BlockchainIndexer] Error processing trade:', error);
    }
  }

  private async processCandlesPeriodically() {
    while (this.isRunning) {
      try {
        await candleService.processAllCandles();
      } catch (error) {
        console.error('❌ [BlockchainIndexer] Error processing candles:', error);
      }

      // Wait 1 minute
      await new Promise(resolve => setTimeout(resolve, 60000));
    }
  }

  async stop() {
    this.isRunning = false;
    await this.prisma.$disconnect();
    console.log('🛑 [BlockchainIndexer] Stopped');
  }
}

// Export singleton instance
export const blockchainIndexer = new BlockchainIndexer();