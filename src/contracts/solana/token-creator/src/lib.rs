use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    metadata::{
        create_metadata_accounts_v3, mpl_token_metadata::types::DataV2, CreateMetadataAccountsV3,
        Metadata, mpl_token_metadata::types::Creator,
    },
    token::{mint_to, burn, transfer, Mint, MintTo, Burn, Transfer, Token, TokenAccount, freeze_account, thaw_account, FreezeAccount, ThawAccount},
};
use solana_program::program_option::COption;

declare_id!("DeGenieTokenCreator11111111111111111111111");

// DeGenie Platform Treasury - Replace with your actual wallet
pub const DEGENIE_PLATFORM_TREASURY: &str = "3yqm9NMVuZckjMpWwVZ4Vjig1spjYfLVP9jgDWybrcCF";

// Fixed graduation threshold - 500 SOL for all tokens
// Why fixed SOL instead of USD?
// 1. No oracle dependency = simpler, cheaper, more reliable
// 2. Traders think in SOL, not USD when trading on Solana
// 3. Predictable for everyone: "500 SOL = graduation"
// 4. At SOL=$145, this is ~$72,500 (similar to pump.fun's $69k)
pub const GRADUATION_THRESHOLD_SOL: u64 = 500;
pub const LAMPORTS_PER_SOL: u64 = 1_000_000_000;

#[program]
pub mod degenie_token_creator {
    use super::*;

    /// Initialize a new token with AI-generated metadata
    pub fn create_token(
        ctx: Context<CreateToken>,
        name: String,
        symbol: String,
        uri: String,
        decimals: u8,
        initial_supply: u64,
    ) -> Result<()> {
        // SPL Token Standard validations
        require!(!name.is_empty() && name.len() <= 32, TokenCreatorError::TokenNameTooLong);
        require!(!symbol.is_empty() && symbol.len() <= 10, TokenCreatorError::TokenSymbolTooLong);
        require!(!uri.is_empty(), TokenCreatorError::InvalidMetadataUri);
        require!(decimals <= 9, TokenCreatorError::InvalidAmount); // SPL Token max decimals
        let mint = &ctx.accounts.mint;
        let metadata = &ctx.accounts.metadata;
        let mint_authority = &ctx.accounts.mint_authority;
        let token_program = &ctx.accounts.token_program;
        let metadata_program = &ctx.accounts.metadata_program;
        let system_program = &ctx.accounts.system_program;
        let rent = &ctx.accounts.rent;

        // Create metadata for the token
        let metadata_data = DataV2 {
            name: name.clone(),
            symbol: symbol.clone(),
            uri: uri.clone(),
            seller_fee_basis_points: 0,
            creators: None,
            collection: None,
            uses: None,
        };

        let metadata_ctx = CpiContext::new(
            metadata_program.to_account_info(),
            CreateMetadataAccountsV3 {
                metadata: metadata.to_account_info(),
                mint: mint.to_account_info(),
                mint_authority: mint_authority.to_account_info(),
                update_authority: mint_authority.to_account_info(),
                payer: mint_authority.to_account_info(),
                system_program: system_program.to_account_info(),
                rent: rent.to_account_info(),
            },
        );

        create_metadata_accounts_v3(metadata_ctx, metadata_data, false, true, None)?;

        // Mint initial supply if specified
        if initial_supply > 0 {
            let mint_ctx = CpiContext::new(
                token_program.to_account_info(),
                MintTo {
                    mint: mint.to_account_info(),
                    to: ctx.accounts.token_account.to_account_info(),
                    authority: mint_authority.to_account_info(),
                },
            );
            mint_to(mint_ctx, initial_supply)?;
        }

        msg!("Token created successfully: {} ({})", name, symbol);
        msg!("Mint address: {}", mint.key());
        msg!("Initial supply: {}", initial_supply);

        Ok(())
    }

    /// Mint additional tokens (for bonding curve mechanics)
    pub fn mint_tokens(
        ctx: Context<MintTokens>,
        amount: u64,
    ) -> Result<()> {
        // Validate amount is not zero
        require!(amount > 0, TokenCreatorError::InvalidAmount);

        let mint_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            MintTo {
                mint: ctx.accounts.mint.to_account_info(),
                to: ctx.accounts.destination.to_account_info(),
                authority: ctx.accounts.authority.to_account_info(),
            },
        );
        mint_to(mint_ctx, amount)?;

        msg!("Minted {} tokens", amount);
        Ok(())
    }

    /// Burn tokens (SPL Token Standard compliance)
    pub fn burn_tokens(
        ctx: Context<BurnTokens>,
        amount: u64,
    ) -> Result<()> {
        require!(amount > 0, TokenCreatorError::InvalidAmount);

        let burn_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Burn {
                mint: ctx.accounts.mint.to_account_info(),
                from: ctx.accounts.from.to_account_info(),
                authority: ctx.accounts.authority.to_account_info(),
            },
        );
        burn(burn_ctx, amount)?;

        msg!("Burned {} tokens", amount);
        Ok(())
    }

    /// Transfer tokens (SPL Token Standard compliance)
    pub fn transfer_tokens(
        ctx: Context<TransferTokens>,
        amount: u64,
    ) -> Result<()> {
        require!(amount > 0, TokenCreatorError::InvalidAmount);

        let transfer_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.from.to_account_info(),
                to: ctx.accounts.to.to_account_info(),
                authority: ctx.accounts.authority.to_account_info(),
            },
        );
        transfer(transfer_ctx, amount)?;

        msg!("Transferred {} tokens", amount);
        Ok(())
    }

    /// Freeze account (SPL Token Standard compliance)
    pub fn freeze_token_account(ctx: Context<FreezeTokenAccount>) -> Result<()> {
        let freeze_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            FreezeAccount {
                account: ctx.accounts.account.to_account_info(),
                mint: ctx.accounts.mint.to_account_info(),
                authority: ctx.accounts.authority.to_account_info(),
            },
        );
        freeze_account(freeze_ctx)?;

        msg!("Account frozen");
        Ok(())
    }

    /// Thaw account (SPL Token Standard compliance)
    pub fn thaw_token_account(ctx: Context<ThawTokenAccount>) -> Result<()> {
        let thaw_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            ThawAccount {
                account: ctx.accounts.account.to_account_info(),
                mint: ctx.accounts.mint.to_account_info(),
                authority: ctx.accounts.authority.to_account_info(),
            },
        );
        thaw_account(thaw_ctx)?;

        msg!("Account thawed");
        Ok(())
    }

    /// Initialize bonding curve for token with enhanced features and anti-bot protection
    pub fn initialize_bonding_curve(
        ctx: Context<InitializeBondingCurve>,
        initial_price: u64,
        price_increment: u64,
        max_supply: u64,
        curve_type: CurveType,
        growth_rate: u64,
        // graduation_threshold removed - now using fixed 500 SOL
    ) -> Result<()> {
        require!(initial_price > 0, TokenCreatorError::InvalidAmount);
        require!(max_supply > 0, TokenCreatorError::InvalidAmount);
        require!(price_increment > 0, TokenCreatorError::InvalidAmount);
        
        // Validate growth_rate based on curve type
        match curve_type {
            CurveType::Linear => {
                require!(growth_rate == 0, TokenCreatorError::InvalidAmount);
            },
            CurveType::Exponential => {
                require!(growth_rate > 0 && growth_rate <= 10000, TokenCreatorError::InvalidAmount);
            },
            CurveType::Logarithmic => {
                // Future implementation - allow any value for now
            }
        }
        
        let bonding_curve = &mut ctx.accounts.bonding_curve;
        let clock = Clock::get()?;
        
        bonding_curve.mint = ctx.accounts.mint.key();
        bonding_curve.current_price = initial_price;
        bonding_curve.initial_price = initial_price;
        bonding_curve.price_increment = price_increment;
        bonding_curve.total_supply = 0;
        bonding_curve.max_supply = max_supply;
        bonding_curve.authority = ctx.accounts.authority.key();
        bonding_curve.bump = ctx.bumps.bonding_curve;
        bonding_curve.curve_type = curve_type;
        bonding_curve.growth_rate = growth_rate;
        bonding_curve.treasury_balance = 0;
        bonding_curve.total_volume = 0;
        bonding_curve.graduation_threshold = GRADUATION_THRESHOLD_SOL * LAMPORTS_PER_SOL; // Fixed 500 SOL
        bonding_curve.is_graduated = false;
        bonding_curve.creation_fee = 20_000_000; // 0.02 SOL
        bonding_curve.transaction_fee_bps = 100; // 1%
        bonding_curve.creator_fee_bps = 50; // 0.5%
        bonding_curve.platform_fee_bps = 50; // 0.5%
        
        // Anti-bot protection settings
        bonding_curve.creation_timestamp = clock.unix_timestamp;
        bonding_curve.launch_protection_period = 3600; // 1 hour protection
        bonding_curve.max_buy_during_protection = 1_000_000_000; // 1 SOL max during protection
        bonding_curve.transaction_cooldown = 30; // 30 seconds between transactions
        bonding_curve.max_price_impact_bps = 500; // 5% max price impact

        // Initialize treasury if needed
        let treasury = &mut ctx.accounts.treasury;
        if treasury.authority == Pubkey::default() {
            treasury.authority = ctx.accounts.authority.key();
            treasury.bump = ctx.bumps.treasury;
        }

        // Charge creation fee
        let cpi_context = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            anchor_lang::system_program::Transfer {
                from: ctx.accounts.authority.to_account_info(),
                to: ctx.accounts.treasury.to_account_info(),
            },
        );
        anchor_lang::system_program::transfer(cpi_context, bonding_curve.creation_fee)?;

        // Update the on-chain treasury_balance to include the creation fee
        bonding_curve.treasury_balance = bonding_curve
            .treasury_balance
            .saturating_add(bonding_curve.creation_fee);
        
        // Update treasury total collected
        treasury.total_collected = treasury
            .total_collected
            .saturating_add(bonding_curve.creation_fee);

        msg!("Enhanced bonding curve initialized with anti-bot protection");
        msg!("Type: {:?}, Growth: {}%, Initial Price: {}", 
             curve_type, growth_rate as f64 / 100.0, initial_price);
        msg!("Protection: {}h, Max buy: {} SOL, Cooldown: {}s", 
             bonding_curve.launch_protection_period / 3600,
             bonding_curve.max_buy_during_protection as f64 / 1_000_000_000.0,
             bonding_curve.transaction_cooldown);
        Ok(())
    }

    /// Buy tokens through enhanced bonding curve with anti-bot protection
    pub fn buy_tokens(
        ctx: Context<BuyTokens>,
        sol_amount: u64,
    ) -> Result<()> {
        require!(sol_amount > 0, TokenCreatorError::InvalidAmount);
        require!(!ctx.accounts.bonding_curve.is_graduated, TokenCreatorError::AlreadyGraduated);
        
        let bonding_curve = &mut ctx.accounts.bonding_curve;
        let user_tracker = &mut ctx.accounts.user_tracker;
        let clock = Clock::get()?;
        
        // Anti-bot protections
        let token_age = clock.unix_timestamp - bonding_curve.creation_timestamp;
        let is_protection_period = token_age < bonding_curve.launch_protection_period;
        
        // 1. Rate limiting: Check cooldown between transactions
        if user_tracker.last_transaction_time > 0 {
            let time_since_last = clock.unix_timestamp - user_tracker.last_transaction_time;
            require!(
                time_since_last >= bonding_curve.transaction_cooldown as i64,
                TokenCreatorError::TransactionCooldown
            );
        }
        
        // 2. Protection period limits: Max buy amount during first hour
        if is_protection_period {
            require!(
                sol_amount <= bonding_curve.max_buy_during_protection,
                TokenCreatorError::ExceedsProtectionLimit
            );
        }
        
        // 3. Price impact protection: Calculate and validate price impact
        let price_impact = calculate_price_impact(sol_amount, bonding_curve)?;
        require!(
            price_impact <= bonding_curve.max_price_impact_bps,
            TokenCreatorError::ExceedsPriceImpactLimit
        );
        
        // Calculate transaction fee
        let transaction_fee = sol_amount
            .checked_mul(bonding_curve.transaction_fee_bps as u64)
            .ok_or(TokenCreatorError::InvalidAmount)?
            .checked_div(10000)
            .ok_or(TokenCreatorError::InvalidAmount)?;
        
        let sol_after_fee = sol_amount
            .checked_sub(transaction_fee)
            .ok_or(TokenCreatorError::InvalidAmount)?;
        
        // Calculate tokens to mint based on curve type
        let tokens_to_mint = calculate_tokens_for_sol_with_curve(
            sol_after_fee,
            bonding_curve,
        )?;

        // Reject zero-token purchases to prevent silent SOL burns
        require!(tokens_to_mint > 0, TokenCreatorError::InvalidAmount);

        // Check max supply
        require!(
            bonding_curve.total_supply + tokens_to_mint <= bonding_curve.max_supply,
            TokenCreatorError::ExceedsMaxSupply
        );

        // Transfer SOL to treasury
        let cpi_context = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            anchor_lang::system_program::Transfer {
                from: ctx.accounts.buyer.to_account_info(),
                to: ctx.accounts.treasury.to_account_info(),
            },
        );
        anchor_lang::system_program::transfer(cpi_context, sol_amount)?;
        
        // Update treasury balance immediately after receiving funds
        bonding_curve.treasury_balance = bonding_curve
            .treasury_balance
            .saturating_add(sol_amount);

        // Split fees between creator and platform
        if transaction_fee > 0 {
            let creator_fee = transaction_fee
                .checked_mul(bonding_curve.creator_fee_bps as u64)
                .ok_or(TokenCreatorError::InvalidAmount)?
                .checked_div(bonding_curve.transaction_fee_bps as u64)
                .ok_or(TokenCreatorError::InvalidAmount)?;
            
            let platform_fee = transaction_fee
                .checked_mul(bonding_curve.platform_fee_bps as u64)
                .ok_or(TokenCreatorError::InvalidAmount)?
                .checked_div(bonding_curve.transaction_fee_bps as u64)
                .ok_or(TokenCreatorError::InvalidAmount)?;
            
            // Transfer creator fee with treasury as signer
            let treasury_seeds = &[
                b"treasury",
                ctx.accounts.mint.key().as_ref(),
                &[ctx.accounts.treasury.bump],
            ];
            let signer_seeds = &[&treasury_seeds[..]];
            
            let creator_cpi = CpiContext::new_with_signer(
                ctx.accounts.system_program.to_account_info(),
                anchor_lang::system_program::Transfer {
                    from: ctx.accounts.treasury.to_account_info(),
                    to: ctx.accounts.creator.to_account_info(),
                },
                signer_seeds,
            );
            anchor_lang::system_program::transfer(creator_cpi, creator_fee)?;
            
            // Validate platform treasury address
            let expected_platform_treasury = DEGENIE_PLATFORM_TREASURY.parse::<Pubkey>()
                .map_err(|_| TokenCreatorError::InvalidAmount)?;
            require!(
                ctx.accounts.platform_treasury.key() == expected_platform_treasury,
                TokenCreatorError::InvalidAmount
            );
            
            // Transfer platform fee to DeGenie treasury with treasury as signer
            let platform_cpi = CpiContext::new_with_signer(
                ctx.accounts.system_program.to_account_info(),
                anchor_lang::system_program::Transfer {
                    from: ctx.accounts.treasury.to_account_info(),
                    to: ctx.accounts.platform_treasury.to_account_info(),
                },
                signer_seeds,
            );
            anchor_lang::system_program::transfer(platform_cpi, platform_fee)?;
            
            // Update treasury balance correctly (subtract fees paid out)
            bonding_curve.treasury_balance = bonding_curve.treasury_balance
                .saturating_sub(creator_fee)
                .saturating_sub(platform_fee);
        }

        // Mint tokens to buyer
        let seeds = &[
            b"bonding_curve",
            bonding_curve.mint.as_ref(),
            &[bonding_curve.bump],
        ];
        let signer = &[&seeds[..]];

        let mint_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            MintTo {
                mint: ctx.accounts.mint.to_account_info(),
                to: ctx.accounts.buyer_token_account.to_account_info(),
                authority: bonding_curve.to_account_info(),
            },
            signer,
        );
        mint_to(mint_ctx, tokens_to_mint)?;

        // Update bonding curve state
        bonding_curve.total_supply += tokens_to_mint;
        bonding_curve.total_volume += sol_amount;
        
        // Update price based on curve type
        match bonding_curve.curve_type {
            CurveType::Linear => {
                let price_increase = bonding_curve.price_increment
                    .checked_mul(tokens_to_mint)
                    .ok_or(TokenCreatorError::InvalidAmount)?
                    .checked_div(1000)
                    .ok_or(TokenCreatorError::InvalidAmount)?;
                bonding_curve.current_price = bonding_curve.current_price
                    .checked_add(price_increase)
                    .ok_or(TokenCreatorError::InvalidAmount)?;
            },
            CurveType::Exponential => {
                bonding_curve.current_price = calculate_price_exponential(
                    bonding_curve.initial_price,
                    bonding_curve.total_supply,
                    bonding_curve.growth_rate,
                )?;
            },
            CurveType::Logarithmic => {
                // Future implementation - use same safe arithmetic as Linear for now
                let price_increase = bonding_curve.price_increment
                    .checked_mul(tokens_to_mint)
                    .ok_or(TokenCreatorError::InvalidAmount)?
                    .checked_div(1000)
                    .ok_or(TokenCreatorError::InvalidAmount)?;
                bonding_curve.current_price = bonding_curve.current_price
                    .checked_add(price_increase)
                    .ok_or(TokenCreatorError::InvalidAmount)?;
            }
        }
        
        // Check for graduation
        let market_cap = bonding_curve.total_supply
            .checked_mul(bonding_curve.current_price)
            .ok_or(TokenCreatorError::InvalidAmount)?;
        
        if market_cap >= bonding_curve.graduation_threshold {
            bonding_curve.is_graduated = true;
            msg!("🎓 Token graduated! Market cap: {} lamports", market_cap);
            // TODO: Trigger DEX migration
        }
        
        // Update user tracker
        user_tracker.wallet = ctx.accounts.buyer.key();
        user_tracker.mint = bonding_curve.mint;
        user_tracker.last_transaction_time = clock.unix_timestamp;
        user_tracker.total_bought_sol = user_tracker.total_bought_sol.saturating_add(sol_amount);
        user_tracker.transaction_count = user_tracker.transaction_count.saturating_add(1);
        user_tracker.bump = ctx.bumps.user_tracker;

        msg!("Bought {} tokens for {} SOL (fee: {} SOL) - Anti-bot protections active", 
             tokens_to_mint, 
             sol_amount as f64 / 1_000_000_000.0,
             transaction_fee as f64 / 1_000_000_000.0);
        
        if is_protection_period {
            msg!("🛡️ Protection period active: {} minutes remaining", 
                 (bonding_curve.launch_protection_period - token_age) / 60);
        }
        
        Ok(())
    }

    /// Sell tokens through enhanced bonding curve
    pub fn sell_tokens(
        ctx: Context<SellTokens>,
        token_amount: u64,
    ) -> Result<()> {
        require!(token_amount > 0, TokenCreatorError::InvalidAmount);
        require!(!ctx.accounts.bonding_curve.is_graduated, TokenCreatorError::AlreadyGraduated);
        
        let bonding_curve = &mut ctx.accounts.bonding_curve;
        
        // Calculate transaction fee
        let sol_to_return_gross = calculate_sol_for_tokens_with_curve(
            token_amount,
            bonding_curve,
        )?;
        
        let transaction_fee = sol_to_return_gross
            .checked_mul(bonding_curve.transaction_fee_bps as u64)
            .ok_or(TokenCreatorError::InvalidAmount)?
            .checked_div(10000)
            .ok_or(TokenCreatorError::InvalidAmount)?;
        
        let sol_to_return_net = sol_to_return_gross
            .checked_sub(transaction_fee)
            .ok_or(TokenCreatorError::InvalidAmount)?;

        // Burn tokens from seller
        let burn_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Burn {
                mint: ctx.accounts.mint.to_account_info(),
                from: ctx.accounts.seller_token_account.to_account_info(),
                authority: ctx.accounts.seller.to_account_info(),
            },
        );
        burn(burn_ctx, token_amount)?;

        // Transfer SOL back to seller with treasury as signer
        let treasury_seeds = &[
            b"treasury",
            ctx.accounts.mint.key().as_ref(),
            &[ctx.accounts.treasury.bump],
        ];
        let signer_seeds = &[&treasury_seeds[..]];

        let transfer_ctx = CpiContext::new_with_signer(
            ctx.accounts.system_program.to_account_info(),
            anchor_lang::system_program::Transfer {
                from: ctx.accounts.treasury.to_account_info(),
                to: ctx.accounts.seller.to_account_info(),
            },
            signer_seeds,
        );
        anchor_lang::system_program::transfer(transfer_ctx, sol_to_return_net)?;

        // Update fees
        if transaction_fee > 0 {
            let creator_fee = transaction_fee
                .checked_mul(bonding_curve.creator_fee_bps as u64)
                .ok_or(TokenCreatorError::InvalidAmount)?
                .checked_div(bonding_curve.transaction_fee_bps as u64)
                .ok_or(TokenCreatorError::InvalidAmount)?;
            
            let platform_fee = transaction_fee
                .checked_mul(bonding_curve.platform_fee_bps as u64)
                .ok_or(TokenCreatorError::InvalidAmount)?
                .checked_div(bonding_curve.transaction_fee_bps as u64)
                .ok_or(TokenCreatorError::InvalidAmount)?;
            
            // Transfer creator fee with treasury as signer
            let creator_cpi = CpiContext::new_with_signer(
                ctx.accounts.system_program.to_account_info(),
                anchor_lang::system_program::Transfer {
                    from: ctx.accounts.treasury.to_account_info(),
                    to: ctx.accounts.creator.to_account_info(),
                },
                signer_seeds,
            );
            anchor_lang::system_program::transfer(creator_cpi, creator_fee)?;
            
            // Validate and transfer platform fee
            let expected_platform_treasury = DEGENIE_PLATFORM_TREASURY.parse::<Pubkey>()
                .map_err(|_| TokenCreatorError::InvalidAmount)?;
            require!(
                ctx.accounts.platform_treasury.key() == expected_platform_treasury,
                TokenCreatorError::InvalidAmount
            );
            
            let platform_cpi = CpiContext::new_with_signer(
                ctx.accounts.system_program.to_account_info(),
                anchor_lang::system_program::Transfer {
                    from: ctx.accounts.treasury.to_account_info(),
                    to: ctx.accounts.platform_treasury.to_account_info(),
                },
                signer_seeds,
            );
            anchor_lang::system_program::transfer(platform_cpi, platform_fee)?;
            
            // Treasury balance will be updated below with the net payout amount
        }

        // Update bonding curve state
        bonding_curve.total_supply -= token_amount;
        bonding_curve.treasury_balance = bonding_curve.treasury_balance
            .saturating_sub(sol_to_return_gross); // Subtract gross amount since all fees are paid from treasury
        bonding_curve.total_volume += sol_to_return_gross;
        
        // Update price based on curve type
        match bonding_curve.curve_type {
            CurveType::Linear => {
                let price_decrease = bonding_curve.price_increment
                    .checked_mul(token_amount)
                    .ok_or(TokenCreatorError::InvalidAmount)?
                    .checked_div(1000)
                    .ok_or(TokenCreatorError::InvalidAmount)?;
                bonding_curve.current_price = bonding_curve.current_price
                    .saturating_sub(price_decrease);
            },
            CurveType::Exponential => {
                bonding_curve.current_price = calculate_price_exponential(
                    bonding_curve.initial_price,
                    bonding_curve.total_supply,
                    bonding_curve.growth_rate,
                )?;
            },
            CurveType::Logarithmic => {
                // Future implementation - use same safe arithmetic as Linear
                let price_decrease = bonding_curve.price_increment
                    .checked_mul(token_amount)
                    .ok_or(TokenCreatorError::InvalidAmount)?
                    .checked_div(1000)
                    .ok_or(TokenCreatorError::InvalidAmount)?;
                bonding_curve.current_price = bonding_curve.current_price
                    .saturating_sub(price_decrease);
            }
        }

        msg!("Sold {} tokens for {} SOL (fee: {} SOL)", 
             token_amount, 
             sol_to_return_gross as f64 / 1_000_000_000.0,
             transaction_fee as f64 / 1_000_000_000.0);
        Ok(())
    }
    
    /// Graduate token to Raydium when market cap threshold is reached
    pub fn graduate_to_raydium(
        ctx: Context<GraduateToRaydium>,
    ) -> Result<()> {
        let bonding_curve = &mut ctx.accounts.bonding_curve;
        
        // Check if already graduated
        require!(!bonding_curve.is_graduated, TokenCreatorError::AlreadyGraduated);
        
        // Calculate current market cap
        let market_cap = bonding_curve.total_supply
            .checked_mul(bonding_curve.current_price)
            .ok_or(TokenCreatorError::InvalidAmount)?;
        
        // Check if graduation threshold reached
        require!(
            market_cap >= bonding_curve.graduation_threshold,
            TokenCreatorError::GraduationThresholdNotMet
        );
        
        // Calculate liquidity to migrate (85% of treasury)
        let liquidity_amount = bonding_curve.treasury_balance
            .checked_mul(85)
            .ok_or(TokenCreatorError::InvalidAmount)?
            .checked_div(100)
            .ok_or(TokenCreatorError::InvalidAmount)?;
        
        // Mark as graduated
        bonding_curve.is_graduated = true;
        
        // Update treasury balance to reflect liquidity migration
        bonding_curve.treasury_balance = bonding_curve
            .treasury_balance
            .saturating_sub(liquidity_amount);
        
        msg!("🎓 TOKEN GRADUATED!");
        msg!("Market cap: {} SOL", market_cap as f64 / 1_000_000_000.0);
        msg!("Liquidity for Raydium: {} SOL", liquidity_amount as f64 / 1_000_000_000.0);
        msg!("Remaining treasury: {} SOL", 
             bonding_curve.treasury_balance as f64 / 1_000_000_000.0);
        
        // TODO: Actual Raydium pool creation will be handled by separate instruction
        // This requires Raydium SDK integration
        
        Ok(())
    }
    
    /// Create liquidity pool on Raydium (separate instruction after graduation)
    pub fn create_raydium_pool(
        ctx: Context<CreateRaydiumPool>,
        base_amount: u64,    // Token amount
        quote_amount: u64,   // SOL amount
    ) -> Result<()> {
        let bonding_curve = &ctx.accounts.bonding_curve;
        
        // Ensure token is graduated
        require!(bonding_curve.is_graduated, TokenCreatorError::NotGraduated);
        
        // Ensure pool hasn't been created yet
        require!(!ctx.accounts.pool_state.is_initialized, TokenCreatorError::PoolAlreadyCreated);
        
        msg!("Creating Raydium pool...");
        msg!("Base (token) amount: {}", base_amount);
        msg!("Quote (SOL) amount: {} SOL", quote_amount as f64 / 1_000_000_000.0);
        
        // TODO: Implement actual Raydium pool creation
        // This will involve:
        // 1. Creating pool account
        // 2. Transferring tokens and SOL
        // 3. Minting LP tokens
        // 4. Burning LP tokens for permanence
        
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(name: String, symbol: String)]
pub struct CreateToken<'info> {
    #[account(
        init,
        payer = mint_authority,
        mint::decimals = 6,
        mint::authority = mint_authority,
    )]
    pub mint: Account<'info, Mint>,

    /// CHECK: This is not dangerous because we don't read or write from this account
    #[account(mut)]
    pub metadata: UncheckedAccount<'info>,

    #[account(
        init,
        payer = mint_authority,
        associated_token::mint = mint,
        associated_token::authority = mint_authority,
    )]
    pub token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub mint_authority: Signer<'info>,

    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    /// CHECK: This is not dangerous because we don't read or write from this account
    pub metadata_program: UncheckedAccount<'info>,
}

#[derive(Accounts)]
pub struct MintTokens<'info> {
    #[account(
        mut,
        constraint = mint.mint_authority == COption::Some(authority.key()) @ TokenCreatorError::InsufficientAuthority
    )]
    pub mint: Account<'info, Mint>,
    
    #[account(
        mut,
        constraint = destination.mint == mint.key() @ TokenCreatorError::InvalidAmount,
        constraint = destination.owner == authority.key() @ TokenCreatorError::InsufficientAuthority
    )]
    pub destination: Account<'info, TokenAccount>,
    
    #[account(
        constraint = authority.key() == mint.mint_authority.unwrap() @ TokenCreatorError::InsufficientAuthority
    )]
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct BurnTokens<'info> {
    #[account(mut)]
    pub mint: Account<'info, Mint>,
    
    #[account(mut)]
    pub from: Account<'info, TokenAccount>,
    
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct TransferTokens<'info> {
    #[account(mut)]
    pub from: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub to: Account<'info, TokenAccount>,
    
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct FreezeTokenAccount<'info> {
    #[account(mut)]
    pub account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub mint: Account<'info, Mint>,
    
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct ThawTokenAccount<'info> {
    #[account(mut)]
    pub account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub mint: Account<'info, Mint>,
    
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct InitializeBondingCurve<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + BondingCurve::INIT_SPACE,
        seeds = [b"bonding_curve", mint.key().as_ref()],
        bump
    )]
    pub bonding_curve: Account<'info, BondingCurve>,
    
    pub mint: Account<'info, Mint>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        init_if_needed,
        payer = authority,
        space = 8 + Treasury::INIT_SPACE,
        seeds = [b"treasury", mint.key().as_ref()],
        bump
    )]
    pub treasury: Account<'info, Treasury>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct BuyTokens<'info> {
    #[account(
        mut,
        seeds = [b"bonding_curve", mint.key().as_ref()],
        bump = bonding_curve.bump
    )]
    pub bonding_curve: Account<'info, BondingCurve>,
    
    #[account(mut)]
    pub mint: Account<'info, Mint>,
    
    #[account(mut)]
    pub buyer: Signer<'info>,
    
    #[account(mut)]
    pub buyer_token_account: Account<'info, TokenAccount>,
    
    #[account(
        init_if_needed,
        payer = buyer,
        space = 8 + UserTracker::INIT_SPACE,
        seeds = [b"user_tracker", mint.key().as_ref(), buyer.key().as_ref()],
        bump
    )]
    pub user_tracker: Account<'info, UserTracker>,
    
    #[account(
        mut,
        seeds = [b"treasury", mint.key().as_ref()],
        bump = treasury.bump
    )]
    pub treasury: Account<'info, Treasury>,
    
    /// CHECK: Creator account for receiving fees
    #[account(mut)]
    pub creator: UncheckedAccount<'info>,
    
    /// CHECK: Platform treasury for receiving platform fees
    #[account(mut)]
    pub platform_treasury: UncheckedAccount<'info>,
    
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SellTokens<'info> {
    #[account(
        mut,
        seeds = [b"bonding_curve", mint.key().as_ref()],
        bump = bonding_curve.bump
    )]
    pub bonding_curve: Account<'info, BondingCurve>,
    
    #[account(mut)]
    pub mint: Account<'info, Mint>,
    
    #[account(mut)]
    pub seller: Signer<'info>,
    
    #[account(mut)]
    pub seller_token_account: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        seeds = [b"treasury", mint.key().as_ref()],
        bump = treasury.bump
    )]
    pub treasury: Account<'info, Treasury>,
    
    /// CHECK: Creator account for receiving fees
    #[account(mut)]
    pub creator: UncheckedAccount<'info>,
    
    /// CHECK: Platform treasury for receiving platform fees
    #[account(mut)]
    pub platform_treasury: UncheckedAccount<'info>,
    
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct GraduateToRaydium<'info> {
    #[account(
        mut,
        seeds = [b"bonding_curve", mint.key().as_ref()],
        bump = bonding_curve.bump
    )]
    pub bonding_curve: Account<'info, BondingCurve>,
    
    pub mint: Account<'info, Mint>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreateRaydiumPool<'info> {
    #[account(
        seeds = [b"bonding_curve", mint.key().as_ref()],
        bump = bonding_curve.bump
    )]
    pub bonding_curve: Account<'info, BondingCurve>,
    
    pub mint: Account<'info, Mint>,
    
    /// CHECK: Pool state account to be initialized
    #[account(mut)]
    pub pool_state: UncheckedAccount<'info>,
    
    #[account(
        mut,
        seeds = [b"treasury", mint.key().as_ref()],
        bump = treasury.bump
    )]
    pub treasury: Account<'info, Treasury>,
    
    /// CHECK: Token vault for the pool
    #[account(mut)]
    pub token_vault: UncheckedAccount<'info>,
    
    /// CHECK: SOL vault for the pool
    #[account(mut)]
    pub sol_vault: UncheckedAccount<'info>,
    
    /// CHECK: LP mint account
    #[account(mut)]
    pub lp_mint: UncheckedAccount<'info>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    
    /// CHECK: Raydium AMM program
    pub raydium_program: UncheckedAccount<'info>,
}

#[account]
#[derive(InitSpace)]
pub struct BondingCurve {
    pub mint: Pubkey,
    pub current_price: u64,
    pub price_increment: u64,
    pub total_supply: u64,
    pub max_supply: u64,
    pub authority: Pubkey,
    pub bump: u8,
    // New fields for enhanced bonding curve
    pub initial_price: u64,
    pub curve_type: CurveType,
    pub growth_rate: u64, // Basis points (10000 = 100%)
    pub treasury_balance: u64,
    pub total_volume: u64,
    pub graduation_threshold: u64, // Fixed at 500 SOL for all tokens
    pub is_graduated: bool,
    pub creation_fee: u64,
    pub transaction_fee_bps: u16, // Basis points (100 = 1%)
    pub creator_fee_bps: u16,
    pub platform_fee_bps: u16,
    // Anti-bot protection fields
    pub creation_timestamp: i64,
    pub launch_protection_period: i64, // Duration in seconds (e.g., 3600 for 1 hour)
    pub max_buy_during_protection: u64, // Max SOL per buy during protection period
    pub transaction_cooldown: u64, // Minimum seconds between transactions per wallet
    pub max_price_impact_bps: u16, // Maximum price impact in basis points (500 = 5%)
}

#[account]
#[derive(InitSpace)]
pub struct PoolState {
    pub is_initialized: bool,
    pub mint: Pubkey,
    pub lp_mint: Pubkey,
    pub token_vault: Pubkey,
    pub sol_vault: Pubkey,
    pub creation_timestamp: i64,
}

#[account]
#[derive(InitSpace)]
pub struct UserTracker {
    pub wallet: Pubkey,
    pub mint: Pubkey,
    pub last_transaction_time: i64,
    pub total_bought_sol: u64,
    pub transaction_count: u32,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct Treasury {
    pub authority: Pubkey,
    pub total_collected: u64,
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, InitSpace)]
pub enum CurveType {
    Linear,
    Exponential,
    Logarithmic,
}

// Enhanced bonding curve calculation functions
pub fn calculate_price_exponential(
    initial_price: u64,
    total_supply: u64,
    growth_rate: u64, // in basis points
) -> Result<u64> {
    // Exponential curve: price = initial_price * (1 + growth_rate/10000) ^ (supply / scale)
    // Using fixed-point arithmetic to avoid floating point
    
    if total_supply == 0 {
        return Ok(initial_price);
    }
    
    // Scale factor to control growth rate
    let scale_factor = 1000;
    let supply_scaled = total_supply / scale_factor;
    
    // Calculate (1 + growth_rate/10000)^supply_scaled using fast exponentiation
    let growth_multiplier = 10000u128 + growth_rate as u128; // e.g., 10100 for 1% growth
    
    // Use u128 for intermediate calculations to prevent overflow
    let mut result = 10000u128; // Start with 1.0 in fixed point
    let mut base = growth_multiplier;
    let mut exp = supply_scaled;
    
    // Fast exponentiation by squaring - O(log n) instead of O(n)
    while exp > 0 {
        if exp & 1 == 1 {
            // If exp is odd, multiply result by base
            result = result
                .checked_mul(base)
                .ok_or(TokenCreatorError::InvalidAmount)?
                .checked_div(10000)
                .ok_or(TokenCreatorError::InvalidAmount)?;
        }
        
        // Square the base
        base = base
            .checked_mul(base)
            .ok_or(TokenCreatorError::InvalidAmount)?
            .checked_div(10000)
            .ok_or(TokenCreatorError::InvalidAmount)?;
        
        exp >>= 1; // Divide exp by 2
    }
    
    // Apply result to initial price and convert back to u64
    let price_u128 = (initial_price as u128)
        .checked_mul(result)
        .ok_or(TokenCreatorError::InvalidAmount)?
        .checked_div(10000)
        .ok_or(TokenCreatorError::InvalidAmount)?;
    
    // Ensure result fits in u64
    if price_u128 > u64::MAX as u128 {
        return Err(TokenCreatorError::InvalidAmount);
    }
    
    Ok(price_u128 as u64)
}

pub fn calculate_tokens_for_sol_with_curve(
    sol_amount: u64,
    bonding_curve: &BondingCurve,
) -> Result<u64> {
    match bonding_curve.curve_type {
        CurveType::Linear => {
            // Linear: tokens = sol_amount / current_price
            sol_amount
                .checked_div(bonding_curve.current_price)
                .ok_or(TokenCreatorError::InvalidAmount)
        },
        CurveType::Exponential => {
            // For exponential curve, we need to integrate to find exact tokens
            // Simplified: estimate tokens based on average price
            let avg_price = bonding_curve.current_price;
            sol_amount
                .checked_div(avg_price)
                .ok_or(TokenCreatorError::InvalidAmount)
        },
        CurveType::Logarithmic => {
            // Logarithmic implementation (future)
            sol_amount
                .checked_div(bonding_curve.current_price)
                .ok_or(TokenCreatorError::InvalidAmount)
        }
    }
}

pub fn calculate_sol_for_tokens_with_curve(
    token_amount: u64,
    bonding_curve: &BondingCurve,
) -> Result<u64> {
    match bonding_curve.curve_type {
        CurveType::Linear => {
            // Linear: sol = token_amount * current_price
            token_amount
                .checked_mul(bonding_curve.current_price)
                .ok_or(TokenCreatorError::InvalidAmount)
        },
        CurveType::Exponential => {
            // For selling, calculate price after tokens are removed
            let new_supply = bonding_curve.total_supply.saturating_sub(token_amount);
            let new_price = calculate_price_exponential(
                bonding_curve.initial_price,
                new_supply,
                bonding_curve.growth_rate
            )?;
            
            // Average price for the transaction
            let avg_price = bonding_curve.current_price
                .checked_add(new_price)
                .ok_or(TokenCreatorError::InvalidAmount)?
                .checked_div(2)
                .ok_or(TokenCreatorError::InvalidAmount)?;
            token_amount
                .checked_mul(avg_price)
                .ok_or(TokenCreatorError::InvalidAmount)
        },
        CurveType::Logarithmic => {
            // Logarithmic implementation (future)
            token_amount
                .checked_mul(bonding_curve.current_price)
                .ok_or(TokenCreatorError::InvalidAmount)
        }
    }
}

/// Calculate price impact of a trade in basis points
pub fn calculate_price_impact(
    sol_amount: u64,
    bonding_curve: &BondingCurve,
) -> Result<u16> {
    let current_price = bonding_curve.current_price;
    
    // Calculate tokens that would be bought
    let tokens_to_buy = calculate_tokens_for_sol_with_curve(sol_amount, bonding_curve)?;
    
    // Calculate new price after the trade
    let new_supply = bonding_curve.total_supply + tokens_to_buy;
    let new_price = match bonding_curve.curve_type {
        CurveType::Linear => {
            let price_increase = bonding_curve.price_increment
                .checked_mul(tokens_to_buy)
                .ok_or(TokenCreatorError::InvalidAmount)?
                .checked_div(1000)
                .ok_or(TokenCreatorError::InvalidAmount)?;
            bonding_curve.current_price
                .checked_add(price_increase)
                .ok_or(TokenCreatorError::InvalidAmount)?
        },
        CurveType::Exponential => {
            calculate_price_exponential(
                bonding_curve.initial_price,
                new_supply,
                bonding_curve.growth_rate,
            )?
        },
        CurveType::Logarithmic => {
            let price_increase = bonding_curve.price_increment
                .checked_mul(tokens_to_buy)
                .ok_or(TokenCreatorError::InvalidAmount)?
                .checked_div(1000)
                .ok_or(TokenCreatorError::InvalidAmount)?;
            bonding_curve.current_price
                .checked_add(price_increase)
                .ok_or(TokenCreatorError::InvalidAmount)?
        }
    };
    
    // Calculate price impact as percentage in basis points
    if new_price <= current_price {
        return Ok(0); // No price impact or price decrease
    }
    
    let price_increase = new_price - current_price;
    let impact_bps = price_increase
        .checked_mul(10000)
        .ok_or(TokenCreatorError::InvalidAmount)?
        .checked_div(current_price)
        .ok_or(TokenCreatorError::InvalidAmount)?;
    
    // Cap at u16::MAX to prevent overflow
    Ok(std::cmp::min(impact_bps, u16::MAX as u64) as u16)
}

#[error_code]
pub enum TokenCreatorError {
    #[msg("Invalid token name")]
    InvalidTokenName,
    #[msg("Invalid token symbol")]
    InvalidTokenSymbol,
    #[msg("Invalid metadata URI")]
    InvalidMetadataUri,
    #[msg("Insufficient authority")]
    InsufficientAuthority,
    #[msg("Invalid amount - must be greater than 0")]
    InvalidAmount,
    #[msg("Account is frozen")]
    AccountFrozen,
    #[msg("Insufficient balance")]
    InsufficientBalance,
    #[msg("Token name too long")]
    TokenNameTooLong,
    #[msg("Token symbol too long")]
    TokenSymbolTooLong,
    #[msg("Exceeds maximum supply")]
    ExceedsMaxSupply,
    #[msg("Token has already graduated to DEX")]
    AlreadyGraduated,
    #[msg("Graduation threshold not met")]
    GraduationThresholdNotMet,
    #[msg("Token has not graduated yet")]
    NotGraduated,
    #[msg("Liquidity pool already created")]
    PoolAlreadyCreated,
    #[msg("Transaction cooldown period not elapsed")]
    TransactionCooldown,
    #[msg("Purchase exceeds protection period limit")]
    ExceedsProtectionLimit,
    #[msg("Price impact exceeds maximum allowed")]
    ExceedsPriceImpactLimit,
}