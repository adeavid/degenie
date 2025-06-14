#!/usr/bin/env node

/**
 * Health check script for DeGenie database
 */

require('dotenv').config();
const { graduationService } = require('../graduation-service');

async function healthCheck() {
    console.log('🔌 DeGenie Database Health Check');
    console.log('================================\n');

    try {
        // Test database connection
        console.log('Testing database connection...');
        const health = await graduationService.getHealthStatus();
        
        console.log('✅ Database connection: HEALTHY');
        console.log(`   Pool stats: ${health.pool_stats.total} total, ${health.pool_stats.idle} idle`);
        console.log(`   Active tokens: ${health.queries.active_tokens.count}`);
        console.log(`   Total tokens: ${health.queries.total_tokens.count}`);
        console.log(`   Graduated tokens: ${health.queries.graduated_tokens.count}`);
        
        console.log('\n🎉 All systems operational!');
        
        // Gracefully close the database pool before exiting
        const { db } = require('../config');
        await db.close();
        
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Health check failed:', error.message);
        console.error('   Check your database connection and credentials');
        
        // Try to close the database pool gracefully even on error
        try {
            const { db } = require('../config');
            await db.close();
        } catch (closeError) {
            console.error('   Failed to close database pool:', closeError.message);
        }
        
        process.exit(1);
    }
}

healthCheck();