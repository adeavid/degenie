/**
 * PostgreSQL Database Configuration for DeGenie Platform
 * Handles database connections, migrations, and environment-specific settings
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

class DatabaseConfig {
    constructor() {
        this.connectionConfig = {
            user: process.env.DB_USER || 'degenie_user',
            host: process.env.DB_HOST || 'localhost',
            database: process.env.DB_NAME || 'degenie_platform',
            password: process.env.DB_PASSWORD || 'secure_password_123',
            port: parseInt(process.env.DB_PORT) || 5432,
            max: parseInt(process.env.DB_POOL_MAX) || 20, // Maximum number of clients in pool
            idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT) || 30000,
            connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 2000,
        };

        // SSL configuration for production
        if (process.env.NODE_ENV === 'production') {
            this.connectionConfig.ssl = {
                rejectUnauthorized: false, // For cloud databases like AWS RDS
                ca: process.env.DB_SSL_CA,
                key: process.env.DB_SSL_KEY,
                cert: process.env.DB_SSL_CERT,
            };
        }

        this.pool = new Pool(this.connectionConfig);
        this.setupPoolEventHandlers();
    }

    setupPoolEventHandlers() {
        this.pool.on('connect', (client) => {
            console.log('✅ Database client connected');
        });

        this.pool.on('error', (err, client) => {
            console.error('🚨 Unexpected error on database client:', err);
            process.exit(-1);
        });

        this.pool.on('acquire', (client) => {
            console.log('📦 Database client acquired from pool');
        });

        this.pool.on('release', (client) => {
            console.log('🔄 Database client released back to pool');
        });
    }

    async testConnection() {
        try {
            const client = await this.pool.connect();
            const result = await client.query('SELECT NOW() as current_time, version() as pg_version');
            client.release();
            
            console.log('🎯 Database connection successful!');
            console.log(`📅 Current time: ${result.rows[0].current_time}`);
            console.log(`🗄️ PostgreSQL version: ${result.rows[0].pg_version.split(' ')[0]}`);
            
            return true;
        } catch (error) {
            console.error('❌ Database connection failed:', error.message);
            return false;
        }
    }

    async initializeDatabase() {
        try {
            console.log('🔧 Initializing DeGenie database schema...');
            
            const schemaPath = path.join(__dirname, 'schema.sql');
            const schemaSql = fs.readFileSync(schemaPath, 'utf8');
            
            const client = await this.pool.connect();
            
            // Execute schema creation
            await client.query(schemaSql);
            
            client.release();
            
            console.log('✅ Database schema initialized successfully!');
            return true;
        } catch (error) {
            console.error('❌ Database initialization failed:', error.message);
            throw error;
        }
    }

    async runMigrations() {
        try {
            console.log('🚀 Running database migrations...');
            
            // Create migrations table if it doesn't exist
            await this.pool.query(`
                CREATE TABLE IF NOT EXISTS migrations (
                    id SERIAL PRIMARY KEY,
                    filename VARCHAR(255) NOT NULL UNIQUE,
                    executed_at TIMESTAMPTZ DEFAULT NOW()
                )
            `);

            // Get list of migration files
            const migrationsDir = path.join(__dirname, 'migrations');
            if (!fs.existsSync(migrationsDir)) {
                fs.mkdirSync(migrationsDir, { recursive: true });
                console.log('📁 Created migrations directory');
                return;
            }

            const migrationFiles = fs.readdirSync(migrationsDir)
                .filter(file => file.endsWith('.sql'))
                .sort();

            // Get executed migrations
            const executedResult = await this.pool.query(
                'SELECT filename FROM migrations ORDER BY executed_at'
            );
            const executedMigrations = executedResult.rows.map(row => row.filename);

            // Run pending migrations
            for (const file of migrationFiles) {
                if (!executedMigrations.includes(file)) {
                    console.log(`📄 Running migration: ${file}`);
                    
                    const migrationSql = fs.readFileSync(
                        path.join(migrationsDir, file),
                        'utf8'
                    );
                    
                    const client = await this.pool.connect();
                    
                    try {
                        await client.query('BEGIN');
                        await client.query(migrationSql);
                        await client.query(
                            'INSERT INTO migrations (filename) VALUES ($1)',
                            [file]
                        );
                        await client.query('COMMIT');
                        
                        console.log(`✅ Migration ${file} completed`);
                    } catch (error) {
                        await client.query('ROLLBACK');
                        throw error;
                    } finally {
                        client.release();
                    }
                }
            }
            
            console.log('✅ All migrations completed!');
        } catch (error) {
            console.error('❌ Migration failed:', error.message);
            throw error;
        }
    }

    async getHealthStatus() {
        try {
            const client = await this.pool.connect();
            
            const queries = [
                { name: 'connection_test', query: 'SELECT 1 as test' },
                { name: 'total_tokens', query: 'SELECT COUNT(*) as count FROM tokens' },
                { name: 'active_tokens', query: 'SELECT COUNT(*) as count FROM tokens WHERE is_graduated = false' },
                { name: 'graduated_tokens', query: 'SELECT COUNT(*) as count FROM tokens WHERE is_graduated = true' },
                { name: 'total_transactions', query: 'SELECT COUNT(*) as count FROM transactions' },
                { name: 'pool_stats', query: 'SELECT waiting_count, idle_count, total_count FROM pg_stat_activity WHERE application_name LIKE \'%degenie%\'' }
            ];

            const results = {};
            
            for (const { name, query } of queries) {
                try {
                    const result = await client.query(query);
                    results[name] = result.rows[0] || { status: 'no_data' };
                } catch (error) {
                    results[name] = { error: error.message };
                }
            }
            
            client.release();
            
            return {
                status: 'healthy',
                timestamp: new Date().toISOString(),
                pool_stats: {
                    total_connections: this.pool.totalCount,
                    idle_connections: this.pool.idleCount,
                    waiting_connections: this.pool.waitingCount
                },
                queries: results
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                timestamp: new Date().toISOString(),
                error: error.message
            };
        }
    }

    // Graceful shutdown
    async close() {
        try {
            await this.pool.end();
            console.log('🔌 Database connections closed gracefully');
        } catch (error) {
            console.error('❌ Error closing database connections:', error.message);
        }
    }

    // Getter for the pool (for direct access if needed)
    getPool() {
        return this.pool;
    }

    // Query wrapper with error handling and logging
    async query(text, params = []) {
        const start = Date.now();
        
        try {
            const result = await this.pool.query(text, params);
            const duration = Date.now() - start;
            
            console.log('📊 Query executed:', {
                query: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
                duration: `${duration}ms`,
                rows: result.rowCount
            });
            
            return result;
        } catch (error) {
            const duration = Date.now() - start;
            console.error('❌ Query failed:', {
                query: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
                duration: `${duration}ms`,
                error: error.message
            });
            throw error;
        }
    }

    // Transaction wrapper
    async transaction(callback) {
        const client = await this.pool.connect();
        
        try {
            await client.query('BEGIN');
            const result = await callback(client);
            await client.query('COMMIT');
            return result;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }
}

// Export singleton instance
const databaseConfig = new DatabaseConfig();

module.exports = {
    DatabaseConfig,
    db: databaseConfig,
    // Convenience methods
    query: (text, params) => databaseConfig.query(text, params),
    transaction: (callback) => databaseConfig.transaction(callback),
    getPool: () => databaseConfig.getPool()
};

// Environment validation
function validateEnvironment() {
    const required = ['DB_USER', 'DB_PASSWORD', 'DB_NAME'];
    const missing = required.filter(env => !process.env[env]);
    
    if (missing.length > 0) {
        console.warn('⚠️ Missing database environment variables:', missing);
        console.warn('💡 Using default values for development');
    }
}

validateEnvironment();

// Auto-initialize in development
if (process.env.NODE_ENV !== 'production' && process.env.AUTO_INIT_DB === 'true') {
    databaseConfig.testConnection()
        .then(success => {
            if (success) {
                return databaseConfig.initializeDatabase();
            }
        })
        .catch(error => {
            console.error('🚨 Auto-initialization failed:', error.message);
        });
}