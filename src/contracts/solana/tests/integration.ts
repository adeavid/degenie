import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { DegenieTokenCreator } from "../target/types/degenie_token_creator";
import { PublicKey, Keypair, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from "@solana/spl-token";
import { expect } from "chai";

describe("🧞‍♂️ DeGenie Token Creator - Integration Tests", () => {
  // Configure the client to use the local cluster
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.DegenieTokenCreator as Program<DegenieTokenCreator>;
  
  // Test accounts
  let mint: Keypair;
  let bondingCurve: PublicKey;
  let treasury: Keypair;
  let userTokenAccount: PublicKey;
  
  const testTokenName = "DeGenie Test Token";
  const testTokenSymbol = "DGT";
  const testTokenUri = "https://degenie.ai/metadata/test-token";
  const testDecimals = 6;
  const initialSupply = 1000000; // 1M tokens
  
  beforeEach(async () => {
    // Generate new mint for each test
    mint = Keypair.generate();
    treasury = Keypair.generate();
    
    // Derive bonding curve PDA
    [bondingCurve] = PublicKey.findProgramAddressSync(
      [Buffer.from("bonding_curve"), mint.publicKey.toBuffer()],
      program.programId
    );
    
    // Get user's associated token account
    userTokenAccount = await getAssociatedTokenAddress(
      mint.publicKey,
      provider.wallet.publicKey
    );
  });

  afterEach(async () => {
    // Cleanup test accounts to prevent conflicts
    try {
      // Note: In production, cleanup might involve closing accounts
      // For testing, we'll just clear the references
      mint = null;
      treasury = null;
      bondingCurve = null;
      userTokenAccount = null;
    } catch (error) {
      console.warn("Cleanup warning:", error.message);
    }
  });

  describe("🔧 Token Creation", () => {
    it("Should create a new token with metadata", async () => {
      console.log("Creating token:", testTokenName);
      
      // Derive metadata account
      const [metadataPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("metadata"),
          new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s").toBuffer(),
          mint.publicKey.toBuffer(),
        ],
        new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s")
      );

      const tx = await program.methods
        .createToken(
          testTokenName,
          testTokenSymbol,
          testTokenUri,
          testDecimals,
          initialSupply
        )
        .accounts({
          mint: mint.publicKey,
          metadata: metadataPda,
          tokenAccount: userTokenAccount,
          mintAuthority: provider.wallet.publicKey,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          metadataProgram: new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"),
        })
        .signers([mint])
        .rpc();

      console.log("✅ Token created successfully");
      console.log("   Transaction:", tx);
      console.log("   Mint address:", mint.publicKey.toString());
      
      expect(tx).to.be.a("string");
    });
  });

  describe("💰 Bonding Curve", () => {
    beforeEach(async () => {
      // First create the token
      const [metadataPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("metadata"),
          new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s").toBuffer(),
          mint.publicKey.toBuffer(),
        ],
        new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s")
      );

      await program.methods
        .createToken(
          testTokenName,
          testTokenSymbol,
          testTokenUri,
          testDecimals,
          0 // No initial supply for bonding curve
        )
        .accounts({
          mint: mint.publicKey,
          metadata: metadataPda,
          tokenAccount: userTokenAccount,
          mintAuthority: provider.wallet.publicKey,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          metadataProgram: new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"),
        })
        .signers([mint])
        .rpc();
    });

    it("Should initialize bonding curve", async () => {
      console.log("Initializing bonding curve...");
      
      const initialPrice = new anchor.BN(1000); // 0.001 SOL per token
      const priceIncrement = new anchor.BN(100); // 0.0001 SOL increment
      const maxSupply = new anchor.BN(1000000); // 1M tokens max

      const tx = await program.methods
        .initializeBondingCurve(initialPrice, priceIncrement, maxSupply)
        .accounts({
          bondingCurve,
          mint: mint.publicKey,
          authority: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log("✅ Bonding curve initialized");
      console.log("   Transaction:", tx);
      console.log("   Bonding curve PDA:", bondingCurve.toString());
      
      expect(tx).to.be.a("string");
    });

    it("Should buy tokens through bonding curve", async () => {
      console.log("Testing token purchase...");
      
      // First initialize bonding curve
      await program.methods
        .initializeBondingCurve(
          new anchor.BN(1000),
          new anchor.BN(100),
          new anchor.BN(1000000)
        )
        .accounts({
          bondingCurve,
          mint: mint.publicKey,
          authority: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      // Buy tokens
      const solAmount = new anchor.BN(0.1 * LAMPORTS_PER_SOL); // 0.1 SOL

      const tx = await program.methods
        .buyTokens(solAmount)
        .accounts({
          bondingCurve,
          mint: mint.publicKey,
          buyer: provider.wallet.publicKey,
          buyerTokenAccount: userTokenAccount,
          treasury: treasury.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log("✅ Tokens purchased successfully");
      console.log("   Transaction:", tx);
      console.log("   Amount: 0.1 SOL");
      
      expect(tx).to.be.a("string");
    });
  });

  describe("🧪 Contract Validation", () => {
    it("Should validate token parameters", async () => {
      console.log("Testing parameter validation...");
      
      // Test invalid token name (too long)
      const longName = "A".repeat(33);
      
      try {
        await program.methods
          .createToken(
            longName,
            testTokenSymbol,
            testTokenUri,
            testDecimals,
            initialSupply
          )
          .accounts({
            mint: mint.publicKey,
            // ... other accounts
          })
          .signers([mint])
          .rpc();
        
        expect.fail("Should have thrown error for long token name");
      } catch (error) {
        console.log("✅ Correctly rejected long token name");
        expect(error.message).to.include("TokenNameTooLong");
      }
    });

    it("Should validate decimals", async () => {
      console.log("Testing decimals validation...");
      
      // Test invalid decimals (> 9)
      const invalidDecimals = 10;
      
      try {
        await program.methods
          .createToken(
            testTokenName,
            testTokenSymbol,
            testTokenUri,
            invalidDecimals,
            initialSupply
          )
          .accounts({
            mint: mint.publicKey,
            // ... other accounts
          })
          .signers([mint])
          .rpc();
        
        expect.fail("Should have thrown error for invalid decimals");
      } catch (error) {
        console.log("✅ Correctly rejected invalid decimals");
        expect(error.message).to.include("InvalidAmount");
      }
    });
  });

  describe("📊 Performance Tests", () => {
    it("Should handle multiple token creations", async () => {
      console.log("Testing multiple token creation performance...");
      
      const startTime = Date.now();
      const numTokens = 5;
      const promises = [];

      for (let i = 0; i < numTokens; i++) {
        const testMint = Keypair.generate();
        const [metadataPda] = PublicKey.findProgramAddressSync(
          [
            Buffer.from("metadata"),
            new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s").toBuffer(),
            testMint.publicKey.toBuffer(),
          ],
          new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s")
        );

        const userTokenAcc = await getAssociatedTokenAddress(
          testMint.publicKey,
          provider.wallet.publicKey
        );

        promises.push(
          program.methods
            .createToken(
              `Test Token ${i}`,
              `TT${i}`,
              `https://degenie.ai/metadata/test-${i}`,
              6,
              1000
            )
            .accounts({
              mint: testMint.publicKey,
              metadata: metadataPda,
              tokenAccount: userTokenAcc,
              mintAuthority: provider.wallet.publicKey,
              rent: anchor.web3.SYSVAR_RENT_PUBKEY,
              systemProgram: SystemProgram.programId,
              tokenProgram: TOKEN_PROGRAM_ID,
              associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
              metadataProgram: new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"),
            })
            .signers([testMint])
            .rpc()
        );
      }

      try {
        const results = await Promise.allSettled(promises);
        const endTime = Date.now();
        const duration = endTime - startTime;

        // Count successful vs failed operations
        const successful = results.filter(r => r.status === 'fulfilled');
        const failed = results.filter(r => r.status === 'rejected');

        console.log(`✅ Created ${successful.length}/${numTokens} tokens in ${duration}ms`);
        console.log(`   Average: ${duration / numTokens}ms per token`);
        
        if (failed.length > 0) {
          console.log(`⚠️  Failed operations: ${failed.length}`);
          failed.forEach((failure, index) => {
            if (failure.status === 'rejected') {
              console.log(`   Token ${index}: ${failure.reason}`);
            }
          });
        }
        
        expect(successful.length).to.be.greaterThan(0); // At least some should succeed
        expect(successful.length).to.be.at.least(numTokens * 0.8); // 80% success rate minimum
        expect(duration).to.be.lessThan(30000); // Should complete within 30 seconds
      } catch (error) {
        console.error(`❌ Performance test failed: ${error.message}`);
        throw error;
      }
    });
  });
});