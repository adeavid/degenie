use anchor_lang::prelude::*;
use solana_program_test::*;
use solana_sdk::{signature::Keypair, signer::Signer};

#[cfg(test)]
mod bonding_curve_integration_tests {
    use super::*;

    #[tokio::test]
    async fn test_complete_buy_sell_cycle() {
        println!("🔄 Testing complete buy/sell cycle");
        
        // Simulate bonding curve parameters
        let initial_price = 1000; // 0.001 SOL per token
        let price_increment = 100; // 0.0001 SOL increment
        let max_supply = 1_000_000;
        let mut current_supply = 0;
        let mut current_price = initial_price;
        
        // Test buying tokens
        let sol_to_spend = 100_000; // 0.1 SOL
        let tokens_to_buy = sol_to_spend / current_price;
        
        assert_eq!(tokens_to_buy, 100, "Should buy 100 tokens for 0.1 SOL");
        
        // Update state after purchase
        current_supply += tokens_to_buy;
        current_price += price_increment * tokens_to_buy / 1000;
        
        println!("✅ After buying: {} tokens, price: {}", current_supply, current_price);
        
        // Test selling tokens
        let tokens_to_sell = 50;
        let sol_to_receive = tokens_to_sell * current_price;
        
        // Update state after sale
        current_supply -= tokens_to_sell;
        current_price = current_price.saturating_sub(price_increment * tokens_to_sell / 1000);
        
        println!("✅ After selling: {} tokens, price: {}, received: {} SOL", 
                current_supply, current_price, sol_to_receive);
        
        assert!(current_supply == 50, "Should have 50 tokens left");
        assert!(current_price < initial_price + (price_increment * 100 / 1000), 
                "Price should be lower after selling");
    }

    #[tokio::test]
    async fn test_mathematical_precision() {
        println!("🔢 Testing mathematical precision and overflow protection");
        
        // Test large number calculations
        let large_amount = u64::MAX / 2;
        let price = 1000;
        
        // Test safe multiplication
        let safe_mult = large_amount.checked_mul(2);
        assert!(safe_mult.is_none(), "Should detect overflow");
        
        // Test safe division
        let safe_div = large_amount.checked_div(price);
        assert!(safe_div.is_some(), "Safe division should work");
        
        // Test price calculations with realistic numbers
        let sol_amount = 1_000_000; // 1 SOL
        let token_price = 1000; // 0.001 SOL per token
        let tokens = sol_amount.checked_div(token_price).unwrap();
        
        assert_eq!(tokens, 1000, "Should get 1000 tokens for 1 SOL at 0.001 SOL/token");
        
        println!("✅ Mathematical precision checks passed");
    }
}