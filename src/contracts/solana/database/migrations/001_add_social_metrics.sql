-- Migration: Add social metrics tracking for tokens
-- Created: 2024-01-15
-- Description: Adds social media metrics and community tracking for tokens

-- Add social metrics columns to tokens table
ALTER TABLE tokens ADD COLUMN IF NOT EXISTS twitter_handle VARCHAR(100);
ALTER TABLE tokens ADD COLUMN IF NOT EXISTS discord_server VARCHAR(200);
ALTER TABLE tokens ADD COLUMN IF NOT EXISTS telegram_group VARCHAR(200);
ALTER TABLE tokens ADD COLUMN IF NOT EXISTS website_url VARCHAR(500);

-- Create social metrics table
CREATE TABLE IF NOT EXISTS social_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token_id UUID REFERENCES tokens(id) ON DELETE CASCADE,
    mint_address VARCHAR(64) NOT NULL,
    platform VARCHAR(20) NOT NULL CHECK (platform IN ('twitter', 'discord', 'telegram', 'reddit')),
    followers_count INTEGER DEFAULT 0,
    engagement_rate DECIMAL(5,2) DEFAULT 0, -- Percentage
    mention_count INTEGER DEFAULT 0,
    sentiment_score DECIMAL(3,2) DEFAULT 0, -- -1 to 1 scale
    data_timestamp TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(token_id, platform, data_timestamp)
);

-- Create community events table
CREATE TABLE IF NOT EXISTS community_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token_id UUID REFERENCES tokens(id) ON DELETE CASCADE,
    mint_address VARCHAR(64) NOT NULL,
    event_type VARCHAR(30) NOT NULL CHECK (event_type IN ('twitter_mention', 'discord_join', 'telegram_join', 'holder_milestone', 'volume_milestone')),
    event_data JSONB,
    event_timestamp TIMESTAMPTZ DEFAULT NOW(),
    impact_score INTEGER DEFAULT 0 CHECK (impact_score >= 0 AND impact_score <= 100)
);

-- Add indexes for social metrics
CREATE INDEX idx_social_metrics_token ON social_metrics(token_id);
CREATE INDEX idx_social_metrics_platform ON social_metrics(platform);
CREATE INDEX idx_social_metrics_timestamp ON social_metrics(data_timestamp);

CREATE INDEX idx_community_events_token ON community_events(token_id);
CREATE INDEX idx_community_events_type ON community_events(event_type);
CREATE INDEX idx_community_events_timestamp ON community_events(event_timestamp);

-- Create view for latest social metrics
CREATE OR REPLACE VIEW latest_social_metrics AS
SELECT DISTINCT ON (token_id, platform)
    sm.*
FROM social_metrics sm
ORDER BY token_id, platform, data_timestamp DESC;

-- Create aggregated social score view
CREATE OR REPLACE VIEW token_social_scores AS
SELECT 
    t.id as token_id,
    t.mint_address,
    t.name,
    t.symbol,
    COALESCE(SUM(sm.followers_count), 0) as total_followers,
    COALESCE(AVG(sm.engagement_rate), 0) as avg_engagement_rate,
    COALESCE(AVG(sm.sentiment_score), 0) as avg_sentiment,
    COUNT(DISTINCT sm.platform) as platforms_count,
    -- Calculate social score (0-100)
    LEAST(100, 
        (COALESCE(SUM(sm.followers_count), 0) / 1000) * 20 +  -- Followers weight: 20%
        COALESCE(AVG(sm.engagement_rate), 0) * 30 +           -- Engagement weight: 30%
        (COALESCE(AVG(sm.sentiment_score), 0) + 1) * 25 +     -- Sentiment weight: 25% 
        COUNT(DISTINCT sm.platform) * 25                      -- Platform diversity: 25%
    ) as social_score
FROM tokens t
LEFT JOIN latest_social_metrics sm ON t.id = sm.token_id
GROUP BY t.id, t.mint_address, t.name, t.symbol;

-- Function to update social metrics
CREATE OR REPLACE FUNCTION update_social_metrics(
    p_mint_address VARCHAR(64),
    p_platform VARCHAR(20),
    p_followers_count INTEGER,
    p_engagement_rate DECIMAL(5,2),
    p_mention_count INTEGER,
    p_sentiment_score DECIMAL(3,2)
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
    
    -- Insert social metrics
    INSERT INTO social_metrics (
        token_id,
        mint_address,
        platform,
        followers_count,
        engagement_rate,
        mention_count,
        sentiment_score
    ) VALUES (
        v_token_id,
        p_mint_address,
        p_platform,
        p_followers_count,
        p_engagement_rate,
        p_mention_count,
        p_sentiment_score
    );
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE social_metrics IS 'Time-series social media metrics for tokens';
COMMENT ON TABLE community_events IS 'Community engagement events and milestones';
COMMENT ON VIEW token_social_scores IS 'Aggregated social scores for tokens (0-100)';