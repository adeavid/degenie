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

    /// Initialize bonding curve for token
    pub fn initialize_bonding_curve(
        ctx: Context<InitializeBondingCurve>,
        initial_price: u64,
        price_increment: u64,
        max_supply: u64,
    ) -> Result<()> {
        let bonding_curve = &mut ctx.accounts.bonding_curve;
        
        bonding_curve.mint = ctx.accounts.mint.key();
        bonding_curve.current_price = initial_price;
        bonding_curve.price_increment = price_increment;
        bonding_curve.total_supply = 0;
        bonding_curve.max_supply = max_supply;
        bonding_curve.authority = ctx.accounts.authority.key();
        bonding_curve.bump = ctx.bumps.bonding_curve;

        msg!("Bonding curve initialized with initial price: {}", initial_price);
        Ok(())
    }

    /// Buy tokens through bonding curve
    pub fn buy_tokens(
        ctx: Context<BuyTokens>,
        sol_amount: u64,
    ) -> Result<()> {
        require!(sol_amount > 0, TokenCreatorError::InvalidAmount);
        
        let bonding_curve = &mut ctx.accounts.bonding_curve;
        
        // Calculate tokens to mint based on bonding curve
        let tokens_to_mint = calculate_tokens_for_sol(
            sol_amount,
            bonding_curve.current_price,
            bonding_curve.price_increment,
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
        bonding_curve.current_price += bonding_curve.price_increment * tokens_to_mint / 1000; // Adjust price

        msg!("Bought {} tokens for {} SOL", tokens_to_mint, sol_amount);
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
        constraint = destination.mint == mint.key() @ TokenCreatorError::InvalidAmount
    )]
    pub destination: Account<'info, TokenAccount>,
    
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
}

// Utility functions for bonding curve calculations
pub fn calculate_tokens_for_sol(
    sol_amount: u64,
    current_price: u64,
    _price_increment: u64,
) -> Result<u64> {
    // Simple linear bonding curve: tokens = sol_amount / current_price
    // In production, this would be more sophisticated
    let tokens = sol_amount
        .checked_div(current_price)
        .ok_or(TokenCreatorError::InvalidAmount)?;
    
    Ok(tokens)
}

pub fn calculate_sol_for_tokens(
    token_amount: u64,
    current_price: u64,
    _price_increment: u64,
) -> Result<u64> {
    // Simple linear bonding curve: sol = token_amount * current_price
    // In production, this would account for price curve more accurately
    let sol = token_amount
        .checked_mul(current_price)
        .ok_or(TokenCreatorError::InvalidAmount)?;
    
    Ok(sol)
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
}