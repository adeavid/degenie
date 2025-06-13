#!/usr/bin/env node

/**
 * Database Initialization Script
 * Sets up the DeGenie PostgreSQL database with schema, migrations, and initial data
 */

require('dotenv').config();
const { db } = require('../config');

async function initializeDatabase() {
    console.log('🚀 DeGenie Database Initialization');
    console.log('==================================\n');

    try {
        // Test connection
        console.log('1️⃣ Testing database connection...');
        const connectionSuccess = await db.testConnection();
        if (!connectionSuccess) {
            throw new Error('Database connection failed');
        }

        // Initialize schema
        console.log('\n2️⃣ Initializing database schema...');
        await db.initializeDatabase();

        // Run migrations
        console.log('\n3️⃣ Running migrations...');
        await db.runMigrations();

        // Seed initial data if requested
        if (process.argv.includes('--seed') || process.env.SEED_DATA === 'true') {
            console.log('\n4️⃣ Seeding initial data...');
            await seedInitialData();
        }

        // Health check
        console.log('\n5️⃣ Running health check...');
        const health = await db.getHealthStatus();
        console.log('🩺 Database health:', health.status);

        console.log('\n✅ Database initialization completed successfully!');
        console.log('🔧 Database is ready for DeGenie platform operations.');

        // Show next steps
        console.log('\n📋 Next Steps:');
        console.log('1. Set up environment variables in .env file');
        console.log('2. Start the graduation service: npm start');
        console.log('3. Configure webhook endpoints for transaction monitoring');
        console.log('4. Set up monitoring and alerting');

        process.exit(0);
    } catch (error) {
        console.error('\n❌ Database initialization failed:', error.message);
        console.error('\n🔧 Troubleshooting:');
        console.error('1. Check PostgreSQL is running and accessible');
        console.error('2. Verify database credentials in environment variables');
        console.error('3. Ensure database user has CREATE privileges');
        console.error('4. Check network connectivity to database host');
        process.exit(1);
    }
}

async function seedInitialData() {
    try {
        // Example token data for testing
        const exampleTokens = [
            {
                mint_address: 'DGN1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1',
                name: 'DeGenie Test Token',
                symbol: 'DGNT',
                metadata_uri: 'https://degenie.ai/metadata/test-token.json',
                creator_address: 'CREATORa1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9',
                initial_price: 1000, // 0.001 SOL
                max_supply: 1000000000, // 1B tokens
                curve_type: 'Exponential',
                growth_rate: 100, // 1%
                graduation_threshold: 69000000000000 // 69k SOL market cap
            }
        ];

        for (const token of exampleTokens) {
            try {
                await db.query(`
                    INSERT INTO tokens (
                        mint_address, name, symbol, metadata_uri, creator_address,
                        initial_price, max_supply, curve_type, growth_rate, graduation_threshold
                    )
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                    ON CONFLICT (mint_address) DO NOTHING
                `, [
                    token.mint_address, token.name, token.symbol, token.metadata_uri,
                    token.creator_address, token.initial_price, token.max_supply,
                    token.curve_type, token.growth_rate, token.graduation_threshold
                ]);

                console.log(`📝 Seeded example token: ${token.name} (${token.symbol})`);
            } catch (error) {
                console.log(`⚠️ Skipped existing token: ${token.symbol}`);
            }
        }

        // Seed platform metrics for the current date
        await db.query(`
            INSERT INTO platform_metrics (metric_date, metric_hour)
            VALUES (CURRENT_DATE, EXTRACT(HOUR FROM NOW()))
            ON CONFLICT (metric_date, metric_hour) DO NOTHING
        `);

        console.log('🌱 Initial data seeded successfully');
    } catch (error) {
        console.error('❌ Failed to seed initial data:', error.message);
        throw error;
    }
}

// Command line arguments
function showHelp() {
    console.log('DeGenie Database Initialization');
    console.log('Usage: node init-database.js [options]');
    console.log('');
    console.log('Options:');
    console.log('  --seed     Seed initial test data');
    console.log('  --help     Show this help message');
    console.log('');
    console.log('Environment Variables:');
    console.log('  DB_HOST           Database host (default: localhost)');
    console.log('  DB_PORT           Database port (default: 5432)');
    console.log('  DB_NAME           Database name (default: degenie_platform)');
    console.log('  DB_USER           Database user (default: degenie_user)');
    console.log('  DB_PASSWORD       Database password (required)');
    console.log('  SEED_DATA         Auto-seed data (default: false)');
    console.log('');
    console.log('Examples:');
    console.log('  node init-database.js --seed');
    console.log('  SEED_DATA=true node init-database.js');
}

if (process.argv.includes('--help')) {
    showHelp();
    process.exit(0);
}

// Run initialization
initializeDatabase();