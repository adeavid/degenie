# 🗄️ DeGenie Database Layer

PostgreSQL database configuration and services for tracking token graduation metrics, anti-bot protection events, and platform analytics.

## 🚀 Quick Start

### Prerequisites
- PostgreSQL 13+ installed and running
- Node.js 18+ and npm
- Environment variables configured

### Installation

1. **Install dependencies:**
```bash
npm install
```

2. **Set up environment:**
```bash
cp .env.example .env
# Edit .env with your database credentials
```

3. **Initialize database:**
```bash
npm run init-db --seed
```

4. **Start demo server:**
```bash
npm run dev
```

5. **Verify installation:**
```bash
curl http://localhost:3001/health
```

## 📋 Database Schema

### Core Tables

#### `tokens`
Master table for all created tokens with metadata and curve parameters.
- **Primary Key:** `id` (UUID)
- **Unique Key:** `mint_address` (Solana mint address)
- **Indexes:** Creator, graduation status, creation time

#### `bonding_curve_states`
Time-series snapshots of bonding curve state changes.
- **Tracks:** Price, supply, treasury balance, market cap
- **Generated Columns:** Market cap, graduation progress
- **Partitioned by:** Timestamp (monthly)

#### `transactions`
All buy/sell transactions with detailed metrics.
- **Tracks:** SOL amount, token amount, fees, price impact
- **Links to:** Solana transaction signatures
- **Indexes:** Token, wallet, transaction type, time

#### `graduations`
Records of tokens that graduated to DEX.
- **Tracks:** Final metrics, liquidity migration, LP burn
- **Links to:** DEX pool addresses
- **Analytics:** Graduation time, success metrics

#### `user_activity`
Per-user activity tracking for anti-bot detection.
- **Tracks:** Transaction patterns, rate limiting data
- **Flags:** Bot detection markers
- **Updated:** Real-time on each transaction

#### `anti_bot_events`
Log of anti-bot protection activations.
- **Event Types:** Cooldown violations, protection limits, price impact blocks
- **Analytics:** Bot effectiveness metrics
- **Alerting:** Pattern detection for security

### Analytics Tables

#### `platform_metrics`
Aggregated daily/hourly platform statistics.
- **Metrics:** Volume, transactions, unique traders
- **Bot Protection:** Blocked transactions count
- **Performance:** Average graduation times

#### `social_metrics` (Migration)
Social media metrics and community tracking.
- **Platforms:** Twitter, Discord, Telegram, Reddit
- **Metrics:** Followers, engagement, sentiment
- **Scoring:** Automated social score calculation

## 🛠️ Database Services

### GraduationService

Main service class providing high-level database operations:

```javascript
const { graduationService } = require('./graduation-service');

// Create token
await graduationService.createToken({
    mintAddress: 'DGN...',
    name: 'My Token',
    symbol: 'MTK',
    // ... other fields
});

// Record transaction
await graduationService.recordTransaction({
    mintAddress: 'DGN...',
    walletAddress: 'USER...',
    transactionType: 'buy',
    solAmount: 100000000, // 0.1 SOL
    // ... other fields
});

// Get analytics
const analytics = await graduationService.getTokenAnalytics('DGN...');
const platformStats = await graduationService.getPlatformAnalytics(30);
```

### Database Configuration

Connection pooling and environment-specific settings:

```javascript
const { db } = require('./config');

// Direct query
const result = await db.query('SELECT * FROM tokens WHERE is_graduated = $1', [false]);

// Transaction
await db.transaction(async (client) => {
    await client.query('UPDATE tokens SET ...');
    await client.query('INSERT INTO graduations ...');
});
```

## 📊 API Endpoints

The demo server provides REST endpoints for testing:

### Health & Status
```bash
GET /health                    # Database health check
```

### Token Management
```bash
POST /demo/create-token        # Create demo token
POST /demo/buy-tokens         # Simulate purchase
POST /demo/graduate-token     # Graduate to DEX
```

### Analytics
```bash
GET /analytics/token/:mint     # Token-specific analytics
GET /analytics/platform        # Platform-wide metrics
GET /analytics/top-tokens      # Top performing tokens
GET /analytics/graduations     # Graduation history
```

### Security
```bash
GET /bot-check/:wallet         # Check bot status
```

## 🔧 Scripts

### Database Management
```bash
npm run init-db               # Initialize schema
npm run migrate              # Run migrations
npm run seed                # Seed test data
npm run test-db             # Test connection
```

### Development
```bash
npm run dev                 # Start with auto-reload
npm start                   # Production start
npm run health              # Health check
```

### Maintenance
```bash
npm run backup              # Backup database
npm run restore             # Restore from backup
```

## 📈 Performance Optimization

### Indexing Strategy
- **Primary indexes:** On all foreign keys and query columns
- **Composite indexes:** For multi-column queries
- **Partial indexes:** For filtered queries (e.g., graduated tokens)

### Query Optimization
- **Views:** Pre-computed aggregations for common queries
- **Functions:** Server-side processing for complex calculations
- **Triggers:** Automatic metric updates on data changes

### Scaling Considerations
- **Connection pooling:** Configurable pool size and timeouts
- **Read replicas:** Separate analytics queries from transactional load
- **Partitioning:** Time-based partitioning for large tables

## 🛡️ Security Features

### Data Protection
- **Parameterized queries:** Protection against SQL injection
- **Input validation:** Server-side validation for all inputs
- **Rate limiting:** API endpoint protection

### Access Control
- **Database users:** Separate roles for different access levels
- **SSL connections:** Encrypted database connections in production
- **Audit logging:** Track all database modifications

### Bot Detection Integration
- **Real-time analysis:** Immediate bot flagging on suspicious patterns
- **Historical patterns:** Long-term behavior analysis
- **Confidence scoring:** Probabilistic bot detection

## 📊 Monitoring & Alerting

### Health Checks
```javascript
// Database health status
const health = await graduationService.getHealthStatus();
/*
{
  status: 'healthy',
  pool_stats: { total: 5, idle: 3, waiting: 0 },
  queries: {
    total_tokens: { count: 1234 },
    active_tokens: { count: 456 },
    graduated_tokens: { count: 789 }
  }
}
*/
```

### Metrics Collection
- **Connection pool:** Monitor active/idle connections
- **Query performance:** Track slow queries and execution times
- **Business metrics:** Token creation rates, graduation rates
- **Error rates:** Database errors and connection failures

### Alerting
- **High connection usage:** When pool utilization > 80%
- **Slow queries:** Queries taking > 1 second
- **Failed graduations:** When graduation rate drops significantly
- **Bot activity spikes:** When anti-bot events increase

## 🔄 Migration System

### Running Migrations
```bash
npm run migrate
```

### Creating Migrations
1. Create file: `migrations/XXX_description.sql`
2. Use sequential numbering: `001_`, `002_`, etc.
3. Include rollback instructions in comments
4. Test on development environment first

### Migration Example
```sql
-- Migration: 002_add_social_features.sql
-- Description: Add social media integration

-- Add columns
ALTER TABLE tokens ADD COLUMN twitter_handle VARCHAR(100);

-- Create new table
CREATE TABLE social_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token_id UUID REFERENCES tokens(id),
    platform VARCHAR(20),
    followers_count INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_social_metrics_token ON social_metrics(token_id);

-- Rollback:
-- DROP TABLE social_metrics;
-- ALTER TABLE tokens DROP COLUMN twitter_handle;
```

## 🚨 Troubleshooting

### Common Issues

#### Connection Failures
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check connection from Node.js
npm run test-db

# Verify credentials
psql -h localhost -U degenie_user -d degenie_platform
```

#### Migration Errors
```bash
# Check migration status
SELECT * FROM migrations ORDER BY executed_at;

# Manual rollback (if needed)
DELETE FROM migrations WHERE filename = 'problematic_migration.sql';
```

#### Performance Issues
```sql
-- Check slow queries
SELECT query, calls, total_time, mean_time 
FROM pg_stat_statements 
ORDER BY total_time DESC 
LIMIT 10;

-- Check index usage
SELECT indexrelname, idx_scan, idx_tup_read, idx_tup_fetch 
FROM pg_stat_user_indexes 
ORDER BY idx_scan DESC;
```

### Environment Variables

Required variables for production:
```bash
DB_HOST=your-db-host
DB_PORT=5432
DB_NAME=degenie_platform
DB_USER=degenie_user
DB_PASSWORD=secure_password
NODE_ENV=production
```

Optional performance tuning:
```bash
DB_POOL_MAX=20                # Maximum connections
DB_IDLE_TIMEOUT=30000         # Idle connection timeout
DB_CONNECTION_TIMEOUT=2000    # Connection attempt timeout
```

## 📚 Additional Resources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Node.js pg Driver](https://node-postgres.com/)
- [Database Design Best Practices](https://postgresqlco.nf/doc/en/param/)
- [Performance Tuning Guide](https://wiki.postgresql.org/wiki/Performance_Optimization)

## 🤝 Contributing

1. **Fork the repository**
2. **Create feature branch:** `git checkout -b feature/database-enhancement`
3. **Test changes:** `npm test` (when tests are implemented)
4. **Run migrations:** `npm run migrate`
5. **Submit pull request**

## 📞 Support

For database-related issues:
- Check the troubleshooting section above
- Review PostgreSQL logs: `/var/log/postgresql/`
- Monitor application logs for database errors
- Use health check endpoint: `/health`