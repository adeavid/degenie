-- DeGenie Token Graduation Database Schema
-- PostgreSQL database for tracking token launches, graduations, and analytics

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Tokens table - tracks all created tokens
CREATE TABLE tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mint_address VARCHAR(64) UNIQUE NOT NULL,
    name VARCHAR(32) NOT NULL,
    symbol VARCHAR(10) NOT NULL,
    metadata_uri TEXT NOT NULL,
    creator_address VARCHAR(64) NOT NULL,
    creation_timestamp TIMESTAMPTZ DEFAULT NOW(),
    initial_price BIGINT NOT NULL, -- in lamports
    max_supply BIGINT NOT NULL,
    curve_type VARCHAR(20) NOT NULL CHECK (curve_type IN ('Linear', 'Exponential', 'Logarithmic')),
    growth_rate INTEGER NOT NULL, -- basis points
    graduation_threshold BIGINT NOT NULL, -- market cap in lamports
    is_graduated BOOLEAN DEFAULT FALSE,
    graduation_timestamp TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bonding curve states - tracks current state of each token's bonding curve
CREATE TABLE bonding_curve_states (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token_id UUID REFERENCES tokens(id) ON DELETE CASCADE,
    mint_address VARCHAR(64) NOT NULL,
    current_price BIGINT NOT NULL, -- in lamports
    total_supply BIGINT NOT NULL,
    treasury_balance BIGINT NOT NULL, -- SOL in lamports
    total_volume BIGINT NOT NULL, -- total SOL traded
    market_cap BIGINT GENERATED ALWAYS AS (total_supply * current_price) STORED,
    graduation_progress DECIMAL(5,2) GENERATED ALWAYS AS (
        CASE 
            WHEN graduation_threshold > 0 
            THEN LEAST(100.0, (total_supply * current_price * 100.0) / graduation_threshold)
            ELSE 0.0 
        END
    ) STORED,
    snapshot_timestamp TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(mint_address, snapshot_timestamp)
);

-- Transactions table - tracks all buy/sell transactions
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token_id UUID REFERENCES tokens(id) ON DELETE CASCADE,
    mint_address VARCHAR(64) NOT NULL,
    wallet_address VARCHAR(64) NOT NULL,
    transaction_type VARCHAR(10) NOT NULL CHECK (transaction_type IN ('buy', 'sell')),
    sol_amount BIGINT NOT NULL, -- in lamports
    token_amount BIGINT NOT NULL,
    price_per_token BIGINT NOT NULL, -- in lamports
    transaction_fee BIGINT NOT NULL, -- in lamports
    price_impact_bps INTEGER NOT NULL, -- basis points
    signature VARCHAR(88) UNIQUE NOT NULL, -- Solana transaction signature
    slot_number BIGINT,
    block_time TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User activity tracking - for anti-bot metrics
CREATE TABLE user_activity (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_address VARCHAR(64) NOT NULL,
    mint_address VARCHAR(64) NOT NULL,
    last_transaction_time TIMESTAMPTZ NOT NULL,
    total_bought_sol BIGINT NOT NULL DEFAULT 0,
    total_sold_sol BIGINT NOT NULL DEFAULT 0,
    transaction_count INTEGER NOT NULL DEFAULT 0,
    is_flagged_bot BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(wallet_address, mint_address)
);

-- Graduations table - tracks token graduations to DEX
CREATE TABLE graduations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token_id UUID REFERENCES tokens(id) ON DELETE CASCADE,
    mint_address VARCHAR(64) NOT NULL,
    graduation_timestamp TIMESTAMPTZ DEFAULT NOW(),
    final_market_cap BIGINT NOT NULL,
    final_price BIGINT NOT NULL,
    final_supply BIGINT NOT NULL,
    liquidity_migrated BIGINT NOT NULL, -- SOL sent to DEX
    dex_platform VARCHAR(20) DEFAULT 'Raydium',
    pool_address VARCHAR(64),
    lp_tokens_burned BIGINT,
    graduation_signature VARCHAR(88) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Platform metrics - daily/hourly aggregated stats
CREATE TABLE platform_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_date DATE NOT NULL,
    metric_hour INTEGER CHECK (metric_hour >= 0 AND metric_hour <= 23),
    total_tokens_created INTEGER NOT NULL DEFAULT 0,
    total_tokens_graduated INTEGER NOT NULL DEFAULT 0,
    total_volume_sol BIGINT NOT NULL DEFAULT 0, -- in lamports
    total_transactions INTEGER NOT NULL DEFAULT 0,
    unique_traders INTEGER NOT NULL DEFAULT 0,
    average_graduation_time_hours DECIMAL(10,2),
    total_fees_collected BIGINT NOT NULL DEFAULT 0, -- in lamports
    bot_transactions_blocked INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(metric_date, metric_hour)
);

-- Anti-bot protection events
CREATE TABLE anti_bot_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_address VARCHAR(64) NOT NULL,
    mint_address VARCHAR(64) NOT NULL,
    event_type VARCHAR(30) NOT NULL CHECK (event_type IN ('cooldown_violation', 'protection_limit_exceeded', 'price_impact_blocked', 'rapid_fire_detected')),
    attempted_sol_amount BIGINT NOT NULL,
    attempted_price_impact_bps INTEGER,
    time_since_last_tx INTEGER, -- seconds
    protection_period_active BOOLEAN NOT NULL,
    event_timestamp TIMESTAMPTZ DEFAULT NOW(),
    transaction_signature VARCHAR(88) -- failed transaction signature
);

-- Indexes for performance
CREATE INDEX idx_tokens_creator ON tokens(creator_address);
CREATE INDEX idx_tokens_graduated ON tokens(is_graduated);
CREATE INDEX idx_tokens_creation_time ON tokens(creation_timestamp);

CREATE INDEX idx_bonding_curve_states_token ON bonding_curve_states(token_id);
CREATE INDEX idx_bonding_curve_states_mint ON bonding_curve_states(mint_address);
CREATE INDEX idx_bonding_curve_states_timestamp ON bonding_curve_states(snapshot_timestamp);

CREATE INDEX idx_transactions_token ON transactions(token_id);
CREATE INDEX idx_transactions_wallet ON transactions(wallet_address);
CREATE INDEX idx_transactions_type ON transactions(transaction_type);
CREATE INDEX idx_transactions_time ON transactions(block_time);
CREATE INDEX idx_transactions_signature ON transactions(signature);

CREATE INDEX idx_user_activity_wallet ON user_activity(wallet_address);
CREATE INDEX idx_user_activity_mint ON user_activity(mint_address);
CREATE INDEX idx_user_activity_flagged ON user_activity(is_flagged_bot);

CREATE INDEX idx_graduations_token ON graduations(token_id);
CREATE INDEX idx_graduations_timestamp ON graduations(graduation_timestamp);

CREATE INDEX idx_platform_metrics_date ON platform_metrics(metric_date, metric_hour);

CREATE INDEX idx_anti_bot_events_wallet ON anti_bot_events(wallet_address);
CREATE INDEX idx_anti_bot_events_type ON anti_bot_events(event_type);
CREATE INDEX idx_anti_bot_events_timestamp ON anti_bot_events(event_timestamp);

-- Views for common queries
CREATE VIEW active_tokens AS
SELECT 
    t.*,
    bcs.current_price,
    bcs.total_supply,
    bcs.treasury_balance,
    bcs.total_volume,
    bcs.market_cap,
    bcs.graduation_progress
FROM tokens t
JOIN bonding_curve_states bcs ON t.mint_address = bcs.mint_address
WHERE NOT t.is_graduated
    AND bcs.snapshot_timestamp = (
        SELECT MAX(snapshot_timestamp) 
        FROM bonding_curve_states 
        WHERE mint_address = t.mint_address
    );

CREATE VIEW graduation_analytics AS
SELECT 
    t.mint_address,
    t.name,
    t.symbol,
    t.creator_address,
    t.creation_timestamp,
    g.graduation_timestamp,
    EXTRACT(EPOCH FROM (g.graduation_timestamp - t.creation_timestamp))/3600 as hours_to_graduation,
    g.final_market_cap,
    g.final_price,
    g.liquidity_migrated,
    (SELECT COUNT(*) FROM transactions WHERE token_id = t.id) as total_transactions,
    (SELECT COUNT(DISTINCT wallet_address) FROM transactions WHERE token_id = t.id) as unique_traders
FROM tokens t
JOIN graduations g ON t.id = g.token_id
WHERE t.is_graduated = true;

CREATE VIEW daily_platform_stats AS
SELECT 
    metric_date,
    SUM(total_tokens_created) as daily_tokens_created,
    SUM(total_tokens_graduated) as daily_tokens_graduated,
    SUM(total_volume_sol) as daily_volume_sol,
    SUM(total_transactions) as daily_transactions,
    MAX(unique_traders) as daily_unique_traders,
    SUM(total_fees_collected) as daily_fees_collected,
    SUM(bot_transactions_blocked) as daily_bot_blocks,
    AVG(average_graduation_time_hours) as avg_graduation_time_hours
FROM platform_metrics
GROUP BY metric_date
ORDER BY metric_date DESC;

-- Functions for updating metrics
CREATE OR REPLACE FUNCTION update_platform_metrics()
RETURNS TRIGGER AS $$
BEGIN
    -- Update hourly metrics when transactions occur
    INSERT INTO platform_metrics (metric_date, metric_hour, total_transactions)
    VALUES (
        CURRENT_DATE,
        EXTRACT(HOUR FROM NOW()),
        1
    )
    ON CONFLICT (metric_date, metric_hour)
    DO UPDATE SET
        total_transactions = platform_metrics.total_transactions + 1,
        total_volume_sol = platform_metrics.total_volume_sol + NEW.sol_amount;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update metrics
CREATE TRIGGER trigger_update_platform_metrics
    AFTER INSERT ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_platform_metrics();

-- Function to update bonding curve state
CREATE OR REPLACE FUNCTION update_bonding_curve_state(
    p_mint_address VARCHAR(64),
    p_current_price BIGINT,
    p_total_supply BIGINT,
    p_treasury_balance BIGINT,
    p_total_volume BIGINT
)
RETURNS VOID AS $$
DECLARE
    v_token_id UUID;
BEGIN
    -- Get token ID
    SELECT id INTO v_token_id FROM tokens WHERE mint_address = p_mint_address;
    
    IF v_token_id IS NULL THEN
        RAISE EXCEPTION 'Token not found: %', p_mint_address;
    END IF;
    
    -- Insert new state snapshot
    INSERT INTO bonding_curve_states (
        token_id,
        mint_address,
        current_price,
        total_supply,
        treasury_balance,
        total_volume
    ) VALUES (
        v_token_id,
        p_mint_address,
        p_current_price,
        p_total_supply,
        p_treasury_balance,
        p_total_volume
    );
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE tokens IS 'Master table for all created tokens with basic metadata';
COMMENT ON TABLE bonding_curve_states IS 'Time-series data for bonding curve state changes';
COMMENT ON TABLE transactions IS 'All buy/sell transactions with detailed metrics';
COMMENT ON TABLE user_activity IS 'Per-user activity tracking for anti-bot detection';
COMMENT ON TABLE graduations IS 'Records of tokens that graduated to DEX';
COMMENT ON TABLE platform_metrics IS 'Aggregated platform performance metrics';
COMMENT ON TABLE anti_bot_events IS 'Log of anti-bot protection activations';