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

    /// Initialize bonding curve for token with enhanced features
    pub fn initialize_bonding_curve(
        ctx: Context<InitializeBondingCurve>,
        initial_price: u64,
        price_increment: u64,
        max_supply: u64,
        curve_type: CurveType,
        growth_rate: u64,
        graduation_threshold: u64,
    ) -> Result<()> {
        require!(initial_price > 0, TokenCreatorError::InvalidAmount);
        require!(max_supply > 0, TokenCreatorError::InvalidAmount);
        require!(growth_rate > 0 && growth_rate <= 10000, TokenCreatorError::InvalidAmount);
        
        let bonding_curve = &mut ctx.accounts.bonding_curve;
        
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
        bonding_curve.graduation_threshold = graduation_threshold;
        bonding_curve.is_graduated = false;
        bonding_curve.creation_fee = 20_000_000; // 0.02 SOL
        bonding_curve.transaction_fee_bps = 100; // 1%
        bonding_curve.creator_fee_bps = 50; // 0.5%
        bonding_curve.platform_fee_bps = 50; // 0.5%

        // Charge creation fee
        let cpi_context = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            anchor_lang::system_program::Transfer {
                from: ctx.accounts.authority.to_account_info(),
                to: ctx.accounts.treasury.to_account_info(),
            },
        );
        anchor_lang::system_program::transfer(cpi_context, bonding_curve.creation_fee)?;

        msg!("Enhanced bonding curve initialized");
        msg!("Type: {:?}, Growth: {}%, Initial Price: {}", 
             curve_type, growth_rate as f64 / 100.0, initial_price);
        Ok(())
    }

    /// Buy tokens through enhanced bonding curve with fees
    pub fn buy_tokens(
        ctx: Context<BuyTokens>,
        sol_amount: u64,
    ) -> Result<()> {
        require!(sol_amount > 0, TokenCreatorError::InvalidAmount);
        require!(!ctx.accounts.bonding_curve.is_graduated, TokenCreatorError::AlreadyGraduated);
        
        let bonding_curve = &mut ctx.accounts.bonding_curve;
        
        // Calculate transaction fee
        let transaction_fee = sol_amount
            .checked_mul(bonding_curve.transaction_fee_bps as u64)?
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

        // Split fees between creator and platform
        if transaction_fee > 0 {
            let creator_fee = transaction_fee
                .checked_mul(bonding_curve.creator_fee_bps as u64)?
                .checked_div(bonding_curve.transaction_fee_bps as u64)
                .ok_or(TokenCreatorError::InvalidAmount)?;
            
            // Transfer creator fee
            let creator_cpi = CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                anchor_lang::system_program::Transfer {
                    from: ctx.accounts.treasury.to_account_info(),
                    to: ctx.accounts.creator.to_account_info(),
                },
            );
            anchor_lang::system_program::transfer(creator_cpi, creator_fee)?;
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
        bonding_curve.treasury_balance += sol_after_fee;
        bonding_curve.total_volume += sol_amount;
        
        // Update price based on curve type
        match bonding_curve.curve_type {
            CurveType::Linear => {
                bonding_curve.current_price += bonding_curve.price_increment * tokens_to_mint / 1000;
            },
            CurveType::Exponential => {
                bonding_curve.current_price = calculate_price_exponential(
                    bonding_curve.initial_price,
                    bonding_curve.total_supply,
                    bonding_curve.growth_rate,
                )?;
            },
            CurveType::Logarithmic => {
                // Future implementation
                bonding_curve.current_price += bonding_curve.price_increment * tokens_to_mint / 1000;
            }
        }
        
        // Check for graduation
        let market_cap = bonding_curve.total_supply
            .checked_mul(bonding_curve.current_price)?;
        
        if market_cap >= bonding_curve.graduation_threshold {
            bonding_curve.is_graduated = true;
            msg!("🎓 Token graduated! Market cap: {} lamports", market_cap);
            // TODO: Trigger DEX migration
        }

        msg!("Bought {} tokens for {} SOL (fee: {} SOL)", 
             tokens_to_mint, 
             sol_amount as f64 / 1_000_000_000.0,
             transaction_fee as f64 / 1_000_000_000.0);
        Ok(())
    }

    /// Sell tokens through bonding curve
    pub fn sell_tokens(
        ctx: Context<SellTokens>,
        token_amount: u64,
    ) -> Result<()> {
        require!(token_amount > 0, TokenCreatorError::InvalidAmount);
        
        let bonding_curve = &mut ctx.accounts.bonding_curve;
        
        // Calculate SOL to return based on bonding curve
        let sol_to_return = calculate_sol_for_tokens(
            token_amount,
            bonding_curve.current_price,
            bonding_curve.price_increment,
        )?;

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

        // Transfer SOL back to seller using system program (safe)
        let seeds = &[
            b"bonding_curve",
            bonding_curve.mint.as_ref(),
            &[bonding_curve.bump],
        ];
        let signer = &[&seeds[..]];

        // Safe SOL transfer using system program
        let transfer_ctx = CpiContext::new_with_signer(
            ctx.accounts.system_program.to_account_info(),
            anchor_lang::system_program::Transfer {
                from: ctx.accounts.treasury.to_account_info(),
                to: ctx.accounts.seller.to_account_info(),
            },
            signer,
        );
        anchor_lang::system_program::transfer(transfer_ctx, sol_to_return)?;

        // Update bonding curve state
        bonding_curve.total_supply -= token_amount;
        bonding_curve.current_price = bonding_curve.current_price.saturating_sub(
            bonding_curve.price_increment * token_amount / 1000
        );

        msg!("Sold {} tokens for {} SOL", token_amount, sol_to_return);
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
    
    /// CHECK: Treasury account for collecting fees
    #[account(mut)]
    pub treasury: UncheckedAccount<'info>,
    
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
    
    /// CHECK: Treasury account for collecting SOL
    #[account(mut)]
    pub treasury: UncheckedAccount<'info>,
    
    /// CHECK: Creator account for receiving fees
    #[account(mut)]
    pub creator: UncheckedAccount<'info>,
    
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
    
    /// CHECK: Treasury account for SOL storage
    #[account(mut)]
    pub treasury: UncheckedAccount<'info>,
    
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
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
    pub graduation_threshold: u64, // Market cap in lamports for DEX migration
    pub is_graduated: bool,
    pub creation_fee: u64,
    pub transaction_fee_bps: u16, // Basis points (100 = 1%)
    pub creator_fee_bps: u16,
    pub platform_fee_bps: u16,
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
    
    // Calculate (1 + growth_rate/10000)^supply_scaled using fixed-point math
    let mut price = initial_price;
    let growth_multiplier = 10000 + growth_rate; // e.g., 10100 for 1% growth
    
    // Apply exponential growth
    for _ in 0..supply_scaled {
        price = price
            .checked_mul(growth_multiplier)?
            .checked_div(10000)
            .ok_or(TokenCreatorError::InvalidAmount)?;
    }
    
    Ok(price)
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
            let avg_price = (bonding_curve.current_price + new_price) / 2;
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
}