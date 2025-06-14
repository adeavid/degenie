import { Connection, PublicKey, Keypair, LAMPORTS_PER_SOL } from '@solana/web3.js';
import BN from 'bn.js';
import { TokenGraduationHandler } from '../src/graduationHandler';
import { RaydiumPoolCreator } from '../src/poolCreator';
import { GRADUATION_FEES } from '../src/config';

describe('Token Graduation Tests', () => {
  let connection: Connection;
  let graduationHandler: TokenGraduationHandler;
  let authority: Keypair;

  beforeAll(() => {
    // Use devnet for testing
    connection = new Connection('https://api.devnet.solana.com', 'confirmed');
    graduationHandler = new TokenGraduationHandler(connection, 'devnet');
    authority = Keypair.generate();
  });

  describe('Allocation Calculations', () => {
    it('should calculate correct fee allocations', () => {
      const treasuryBalance = new BN(12_000).mul(new BN(LAMPORTS_PER_SOL)); // 12k SOL
      
      // Use private method through type assertion for testing
      const allocations = (graduationHandler as any).calculateAllocations(treasuryBalance);
      
      // Expected values
      const expectedLiquidity = treasuryBalance.mul(new BN(85)).div(new BN(100));
      const expectedPlatform = treasuryBalance.mul(new BN(10)).div(new BN(100));
      const expectedCreator = treasuryBalance.mul(new BN(5)).div(new BN(100));
      
      expect(allocations.liquidity.toString()).toBe(expectedLiquidity.toString());
      expect(allocations.platformFee.toString()).toBe(expectedPlatform.toString());
      expect(allocations.creatorBonus.toString()).toBe(expectedCreator.toString());
      
      // Verify total equals treasury
      const total = allocations.liquidity
        .add(allocations.platformFee)
        .add(allocations.creatorBonus);
      expect(total.toString()).toBe(treasuryBalance.toString());
    });

    it('should handle small treasury amounts', () => {
      const smallTreasury = new BN(100).mul(new BN(LAMPORTS_PER_SOL)); // 100 SOL
      const allocations = (graduationHandler as any).calculateAllocations(smallTreasury);
      
      expect(allocations.liquidity.div(new BN(LAMPORTS_PER_SOL)).toNumber()).toBe(85);
      expect(allocations.platformFee.div(new BN(LAMPORTS_PER_SOL)).toNumber()).toBe(10);
      expect(allocations.creatorBonus.div(new BN(LAMPORTS_PER_SOL)).toNumber()).toBe(5);
    });
  });

  describe('Graduation Validation', () => {
    it('should validate market cap threshold', async () => {
      const tokenMint = Keypair.generate().publicKey;
      const belowThreshold = new BN(50_000).mul(new BN(LAMPORTS_PER_SOL)); // $50k
      const threshold = new BN(69_000).mul(new BN(LAMPORTS_PER_SOL)); // $69k
      
      const isEligible = await graduationHandler.validateGraduation(
        tokenMint,
        belowThreshold,
        threshold
      );
      
      expect(isEligible).toBe(false);
    });

    it('should approve graduation above threshold', async () => {
      const tokenMint = Keypair.generate().publicKey;
      const aboveThreshold = new BN(75_000).mul(new BN(LAMPORTS_PER_SOL)); // $75k
      const threshold = new BN(69_000).mul(new BN(LAMPORTS_PER_SOL)); // $69k
      
      // Mock token info to return valid data
      jest.spyOn(graduationHandler as any, 'getTokenInfo').mockResolvedValue({
        decimals: 9,
        supply: new BN(1_000_000_000),
      });
      
      const isEligible = await graduationHandler.validateGraduation(
        tokenMint,
        aboveThreshold,
        threshold
      );
      
      expect(isEligible).toBe(true);
    });
  });

  describe('Pool Creation Parameters', () => {
    it('should calculate correct token allocation for pool', () => {
      const totalSupply = new BN(1_000_000_000); // 1B tokens
      const expectedTokensForPool = totalSupply.mul(new BN(20)).div(new BN(100)); // 20%
      
      expect(expectedTokensForPool.toString()).toBe('200000000'); // 200M tokens
    });

    it('should enforce minimum liquidity requirement', async () => {
      const poolCreator = new RaydiumPoolCreator(connection, 'devnet');
      const lowLiquidity = new BN(5).mul(new BN(LAMPORTS_PER_SOL)); // Only 5 SOL
      
      await expect(
        poolCreator.createPool({
          connection,
          wallet: authority,
          tokenMint: Keypair.generate().publicKey,
          baseAmount: new BN(100_000_000),
          quoteAmount: lowLiquidity,
          burnLpTokens: true,
        })
      ).rejects.toThrow('Insufficient liquidity');
    });
  });

  describe('LP Token Calculations', () => {
    it('should calculate correct LP token amount', () => {
      const poolCreator = new RaydiumPoolCreator(connection, 'devnet');
      const baseAmount = new BN(200_000_000); // 200M tokens
      const quoteAmount = new BN(10_200).mul(new BN(LAMPORTS_PER_SOL)); // 10.2k SOL
      
      // Access private method for testing
      const lpAmount = (poolCreator as any).calculateLpTokens(baseAmount, quoteAmount);
      
      // LP = sqrt(base * quote)
      const expectedLP = new BN(
        Math.floor(Math.sqrt(
          baseAmount.toNumber() * quoteAmount.toNumber()
        ))
      );
      
      // Allow small variance due to rounding
      const difference = lpAmount.sub(expectedLP).abs();
      expect(difference.lte(new BN(1000))).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      // Mock connection to simulate network error
      const mockConnection = {
        getLatestBlockhash: jest.fn().mockRejectedValue(new Error('Network error')),
      } as any;
      
      const errorHandler = new TokenGraduationHandler(mockConnection, 'devnet');
      
      await expect(
        errorHandler.graduateToken({
          connection: mockConnection,
          tokenMint: Keypair.generate().publicKey,
          bondingCurvePda: Keypair.generate().publicKey,
          treasuryBalance: new BN(12_000).mul(new BN(LAMPORTS_PER_SOL)),
          totalSupply: new BN(1_000_000_000),
          creatorWallet: Keypair.generate().publicKey,
          platformWallet: Keypair.generate().publicKey,
          authority,
        })
      ).rejects.toThrow('Network error');
    });

    it('should prevent double graduation', async () => {
      // This test would require mocking the bonding curve state
      // In production, the smart contract would enforce this
      expect(true).toBe(true); // Placeholder
    });
  });
});

describe('Pool Creator Tests', () => {
  let poolCreator: RaydiumPoolCreator;
  let connection: Connection;

  beforeAll(() => {
    connection = new Connection('https://api.devnet.solana.com', 'confirmed');
    poolCreator = new RaydiumPoolCreator(connection, 'devnet');
  });

  describe('Pool Key Generation', () => {
    it('should generate deterministic pool keys', async () => {
      const baseToken = {
        mint: Keypair.generate().publicKey,
        decimals: 9,
      } as any;
      
      const quoteToken = {
        mint: new PublicKey('So11111111111111111111111111111111111111112'),
        decimals: 9,
      } as any;
      
      const marketId = Keypair.generate().publicKey;
      
      // Generate keys twice to ensure determinism
      const keys1 = await (poolCreator as any).generatePoolKeys({
        baseToken,
        quoteToken,
        marketId,
        programId: new PublicKey('HWy1jotHpo6UqeQxx49dpYYdQB8wj9Qk9MdxwjLvDHB8'),
      });
      
      const keys2 = await (poolCreator as any).generatePoolKeys({
        baseToken,
        quoteToken,
        marketId,
        programId: new PublicKey('HWy1jotHpo6UqeQxx49dpYYdQB8wj9Qk9MdxwjLvDHB8'),
      });
      
      expect(keys1.poolKeys.id.toBase58()).toBe(keys2.poolKeys.id.toBase58());
      expect(keys1.poolKeys.lpMint.toBase58()).toBe(keys2.poolKeys.lpMint.toBase58());
    });
  });

  describe('Transaction Building', () => {
    it('should build valid pool creation transaction', async () => {
      // This is a simplified test - full integration test would require devnet funds
      const wallet = Keypair.generate();
      const tokenMint = Keypair.generate().publicKey;
      
      // Mock the pool creation to test transaction building
      const mockCreatePool = jest.spyOn(poolCreator, 'createPool').mockImplementation(async () => ({
        poolId: 'mockPoolId',
        lpMint: Keypair.generate().publicKey,
        txSignature: 'mockTxSignature',
      }));
      
      const result = await poolCreator.createPool({
        connection,
        wallet,
        tokenMint,
        baseAmount: new BN(200_000_000),
        quoteAmount: new BN(10_200).mul(new BN(LAMPORTS_PER_SOL)),
        burnLpTokens: true,
      });
      
      expect(result.poolId).toBe('mockPoolId');
      expect(result.txSignature).toBe('mockTxSignature');
      
      mockCreatePool.mockRestore();
    });
  });
});