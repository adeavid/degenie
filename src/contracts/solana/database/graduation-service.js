/**
 * Graduation Service - Handles all database operations for token graduation tracking
 * Provides methods to track token launches, transactions, graduations, and analytics
 */

const { db } = require('./config');

class GraduationService {
    constructor() {
        this.db = db;
    }

    /**
     * Create a new token record in the database
     */
    async createToken({
        mintAddress,
        name,
        symbol,
        metadataUri,
        creatorAddress,
        initialPrice,
        maxSupply,
        curveType,
        growthRate,
        graduationThreshold
    }) {
        try {
            const query = `
                INSERT INTO tokens (
                    mint_address, name, symbol, metadata_uri, creator_address,
                    initial_price, max_supply, curve_type, growth_rate, graduation_threshold
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                RETURNING id, created_at
            `;
            
            const values = [
                mintAddress, name, symbol, metadataUri, creatorAddress,
                initialPrice, maxSupply, curveType, growthRate, graduationThreshold
            ];
            
            const result = await this.db.query(query, values);
            
            // Initialize bonding curve state
            await this.updateBondingCurveState(mintAddress, {
                currentPrice: initialPrice,
                totalSupply: 0,
                treasuryBalance: 0,
                totalVolume: 0
            });
            
            console.log(`✅ Token created in database: ${name} (${symbol})`);
            return result.rows[0];
        } catch (error) {
            console.error('❌ Failed to create token:', error.message);
            throw error;
        }
    }

    /**
     * Update bonding curve state
     */
    async updateBondingCurveState(mintAddress, state) {
        try {
            const { currentPrice, totalSupply, treasuryBalance, totalVolume } = state;
            
            const query = `
                SELECT update_bonding_curve_state($1, $2, $3, $4, $5)
            `;
            
            await this.db.query(query, [
                mintAddress,
                currentPrice,
                totalSupply,
                treasuryBalance,
                totalVolume
            ]);
            
            return true;
        } catch (error) {
            console.error('❌ Failed to update bonding curve state:', error.message);
            throw error;
        }
    }

    /**
     * Record a transaction (buy/sell)
     */
    async recordTransaction({
        mintAddress,
        walletAddress,
        transactionType, // 'buy' or 'sell'
        solAmount,
        tokenAmount,
        pricePerToken,
        transactionFee,
        priceImpactBps,
        signature,
        slotNumber,
        blockTime
    }) {
        try {
            // Get token ID
            const tokenResult = await this.db.query(
                'SELECT id FROM tokens WHERE mint_address = $1',
                [mintAddress]
            );
            
            if (tokenResult.rows.length === 0) {
                throw new Error(`Token not found: ${mintAddress}`);
            }
            
            const tokenId = tokenResult.rows[0].id;
            
            const query = `
                INSERT INTO transactions (
                    token_id, mint_address, wallet_address, transaction_type,
                    sol_amount, token_amount, price_per_token, transaction_fee,
                    price_impact_bps, signature, slot_number, block_time
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                RETURNING id, created_at
            `;
            
            const values = [
                tokenId, mintAddress, walletAddress, transactionType,
                solAmount, tokenAmount, pricePerToken, transactionFee,
                priceImpactBps, signature, slotNumber, blockTime
            ];
            
            const result = await this.db.query(query, values);
            
            // Update user activity
            await this.updateUserActivity(walletAddress, mintAddress, {
                lastTransactionTime: blockTime || new Date(),
                solAmount,
                transactionType
            });
            
            console.log(`📝 Transaction recorded: ${transactionType} ${solAmount} lamports for ${tokenAmount} tokens`);
            return result.rows[0];
        } catch (error) {
            console.error('❌ Failed to record transaction:', error.message);
            throw error;
        }
    }

    /**
     * Update user activity for anti-bot tracking
     */
    async updateUserActivity(walletAddress, mintAddress, activity) {
        try {
            const { lastTransactionTime, solAmount, transactionType } = activity;
            
            const query = `
                INSERT INTO user_activity (
                    wallet_address, mint_address, last_transaction_time,
                    total_bought_sol, total_sold_sol, transaction_count
                )
                VALUES ($1, $2, $3, $4, $5, 1)
                ON CONFLICT (wallet_address, mint_address)
                DO UPDATE SET
                    last_transaction_time = $3,
                    total_bought_sol = user_activity.total_bought_sol + CASE WHEN $6 = 'buy' THEN $4 ELSE 0 END,
                    total_sold_sol = user_activity.total_sold_sol + CASE WHEN $6 = 'sell' THEN $4 ELSE 0 END,
                    transaction_count = user_activity.transaction_count + 1,
                    updated_at = NOW()
            `;
            
            await this.db.query(query, [
                walletAddress, mintAddress, lastTransactionTime,
                solAmount, solAmount, transactionType
            ]);
            
            return true;
        } catch (error) {
            console.error('❌ Failed to update user activity:', error.message);
            throw error;
        }
    }

    /**
     * Record token graduation
     */
    async recordGraduation({
        mintAddress,
        finalMarketCap,
        finalPrice,
        finalSupply,
        liquidityMigrated,
        dexPlatform = 'Raydium',
        poolAddress,
        lpTokensBurned,
        graduationSignature
    }) {
        try {
            return await this.db.transaction(async (client) => {
                // Get token ID
                const tokenResult = await client.query(
                    'SELECT id FROM tokens WHERE mint_address = $1',
                    [mintAddress]
                );
                
                if (tokenResult.rows.length === 0) {
                    throw new Error(`Token not found: ${mintAddress}`);
                }
                
                const tokenId = tokenResult.rows[0].id;
                
                // Mark token as graduated
                await client.query(
                    'UPDATE tokens SET is_graduated = true, graduation_timestamp = NOW() WHERE id = $1',
                    [tokenId]
                );
                
                // Record graduation details
                const graduationQuery = `
                    INSERT INTO graduations (
                        token_id, mint_address, final_market_cap, final_price,
                        final_supply, liquidity_migrated, dex_platform,
                        pool_address, lp_tokens_burned, graduation_signature
                    )
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                    RETURNING id, graduation_timestamp
                `;
                
                const values = [
                    tokenId, mintAddress, finalMarketCap, finalPrice,
                    finalSupply, liquidityMigrated, dexPlatform,
                    poolAddress, lpTokensBurned, graduationSignature
                ];
                
                const result = await client.query(graduationQuery, values);
                
                console.log(`🎓 Token graduated: ${mintAddress} with ${finalMarketCap} lamports market cap`);
                return result.rows[0];
            });
        } catch (error) {
            console.error('❌ Failed to record graduation:', error.message);
            throw error;
        }
    }

    /**
     * Record anti-bot protection event
     */
    async recordAntiBotEvent({
        walletAddress,
        mintAddress,
        eventType,
        attemptedSolAmount,
        attemptedPriceImpactBps,
        timeSinceLastTx,
        protectionPeriodActive,
        transactionSignature
    }) {
        try {
            const query = `
                INSERT INTO anti_bot_events (
                    wallet_address, mint_address, event_type, attempted_sol_amount,
                    attempted_price_impact_bps, time_since_last_tx,
                    protection_period_active, transaction_signature
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING id, event_timestamp
            `;
            
            const values = [
                walletAddress, mintAddress, eventType, attemptedSolAmount,
                attemptedPriceImpactBps, timeSinceLastTx,
                protectionPeriodActive, transactionSignature
            ];
            
            const result = await this.db.query(query, values);
            
            console.log(`🛡️ Anti-bot event recorded: ${eventType} for ${walletAddress}`);
            return result.rows[0];
        } catch (error) {
            console.error('❌ Failed to record anti-bot event:', error.message);
            throw error;
        }
    }

    /**
     * Get token analytics
     */
    async getTokenAnalytics(mintAddress) {
        try {
            const query = `
                SELECT 
                    t.*,
                    g.graduation_timestamp,
                    g.final_market_cap,
                    g.liquidity_migrated,
                    (SELECT COUNT(*) FROM transactions WHERE mint_address = t.mint_address) as total_transactions,
                    (SELECT COUNT(DISTINCT wallet_address) FROM transactions WHERE mint_address = t.mint_address) as unique_traders,
                    (SELECT SUM(sol_amount) FROM transactions WHERE mint_address = t.mint_address AND transaction_type = 'buy') as total_volume_bought,
                    (SELECT SUM(sol_amount) FROM transactions WHERE mint_address = t.mint_address AND transaction_type = 'sell') as total_volume_sold,
                    bcs.current_price,
                    bcs.total_supply,
                    bcs.treasury_balance,
                    bcs.market_cap,
                    bcs.graduation_progress
                FROM tokens t
                LEFT JOIN graduations g ON t.id = g.token_id
                LEFT JOIN bonding_curve_states bcs ON t.mint_address = bcs.mint_address
                WHERE t.mint_address = $1
                    AND (bcs.snapshot_timestamp IS NULL OR bcs.snapshot_timestamp = (
                        SELECT MAX(snapshot_timestamp) 
                        FROM bonding_curve_states 
                        WHERE mint_address = t.mint_address
                    ))
            `;
            
            const result = await this.db.query(query, [mintAddress]);
            
            if (result.rows.length === 0) {
                return null;
            }
            
            return result.rows[0];
        } catch (error) {
            console.error('❌ Failed to get token analytics:', error.message);
            throw error;
        }
    }

    /**
     * Get platform-wide analytics
     */
    async getPlatformAnalytics(days = 30) {
        try {
            const query = `
                SELECT 
                    COUNT(*) as total_tokens,
                    COUNT(*) FILTER (WHERE is_graduated = true) as graduated_tokens,
                    COUNT(*) FILTER (WHERE is_graduated = false) as active_tokens,
                    (
                        SELECT COUNT(*) 
                        FROM transactions 
                        WHERE created_at > NOW() - INTERVAL '${days} days'
                    ) as recent_transactions,
                    (
                        SELECT SUM(sol_amount) 
                        FROM transactions 
                        WHERE created_at > NOW() - INTERVAL '${days} days'
                    ) as recent_volume,
                    (
                        SELECT AVG(EXTRACT(EPOCH FROM (graduation_timestamp - creation_timestamp))/3600)
                        FROM tokens t
                        JOIN graduations g ON t.id = g.token_id
                        WHERE g.graduation_timestamp > NOW() - INTERVAL '${days} days'
                    ) as avg_graduation_time_hours,
                    (
                        SELECT COUNT(*)
                        FROM anti_bot_events
                        WHERE event_timestamp > NOW() - INTERVAL '${days} days'
                    ) as anti_bot_blocks
                FROM tokens
                WHERE creation_timestamp > NOW() - INTERVAL '${days} days'
            `;
            
            const result = await this.db.query(query);
            return result.rows[0];
        } catch (error) {
            console.error('❌ Failed to get platform analytics:', error.message);
            throw error;
        }
    }

    /**
     * Get top performing tokens
     */
    async getTopTokens(limit = 10, sortBy = 'market_cap') {
        try {
            const validSortFields = ['market_cap', 'total_volume', 'graduation_progress', 'creation_timestamp'];
            if (!validSortFields.includes(sortBy)) {
                sortBy = 'market_cap';
            }
            
            const query = `
                SELECT * FROM active_tokens
                ORDER BY ${sortBy} DESC
                LIMIT $1
            `;
            
            const result = await this.db.query(query, [limit]);
            return result.rows;
        } catch (error) {
            console.error('❌ Failed to get top tokens:', error.message);
            throw error;
        }
    }

    /**
     * Get graduation history
     */
    async getGraduationHistory(limit = 50) {
        try {
            const query = `
                SELECT * FROM graduation_analytics
                ORDER BY graduation_timestamp DESC
                LIMIT $1
            `;
            
            const result = await this.db.query(query, [limit]);
            return result.rows;
        } catch (error) {
            console.error('❌ Failed to get graduation history:', error.message);
            throw error;
        }
    }

    /**
     * Check if user is flagged as bot
     */
    async checkBotStatus(walletAddress) {
        try {
            const query = `
                SELECT 
                    wallet_address,
                    COUNT(*) as total_interactions,
                    SUM(transaction_count) as total_transactions,
                    AVG(CASE WHEN is_flagged_bot THEN 1 ELSE 0 END) as bot_flag_ratio,
                    (
                        SELECT COUNT(*)
                        FROM anti_bot_events
                        WHERE wallet_address = $1
                            AND event_timestamp > NOW() - INTERVAL '24 hours'
                    ) as recent_bot_events
                FROM user_activity
                WHERE wallet_address = $1
                GROUP BY wallet_address
            `;
            
            const result = await this.db.query(query, [walletAddress]);
            
            if (result.rows.length === 0) {
                return { isBot: false, confidence: 0 };
            }
            
            const data = result.rows[0];
            const botConfidence = (data.bot_flag_ratio * 0.6) + (data.recent_bot_events * 0.1);
            
            return {
                isBot: botConfidence > 0.3,
                confidence: Math.min(botConfidence, 1.0),
                details: data
            };
        } catch (error) {
            console.error('❌ Failed to check bot status:', error.message);
            throw error;
        }
    }

    /**
     * Get database health status
     */
    async getHealthStatus() {
        return await this.db.getHealthStatus();
    }
}

module.exports = {
    GraduationService,
    graduationService: new GraduationService()
};