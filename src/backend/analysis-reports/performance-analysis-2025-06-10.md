# ⚡ Performance Analysis Report

**Generated**: 10/6/2025, 23:38:23

## 📊 Single Request Performance

| Endpoint | Tier | Response Time | Throughput | Cost Efficiency |
|----------|------|---------------|------------|------------------|
| /api/generate/logo | free | 71ms | 14.1 req/s | 150.0 |
| /api/generate/logo | starter | 6ms | 171.0 req/s | 90.0 |
| /api/generate/logo | viral | 4ms | 279.2 req/s | 66.7 |
| /api/generate/meme | free | 4ms | 284.8 req/s | 750.0 |
| /api/generate/meme | starter | 3ms | 334.6 req/s | 450.0 |
| /api/generate/gif | starter | 3ms | 317.8 req/s | 180.0 |
| /api/generate/gif | viral | 2ms | 404.1 req/s | 100.0 |

## 🚀 Load Test Results

| Scenario | Users | Total Req | Success Rate | Avg Response | Throughput |
|----------|-------|-----------|--------------|--------------|------------|
| Light Load | 2 | 6 | 100.0% | 13ms | 330.2 req/s |
| Medium Load | 5 | 10 | 40.0% | 48ms | 188.6 req/s |
| Heavy Load | 10 | 10 | 0.0% | 0ms | 595.1 req/s |

## 🏥 System Health

- **Status**: healthy
- **Health Check Response**: 11ms
- **Services**: replicate: configured, creditSystem: active

## 🎯 Performance Recommendations

- ⚡ Excellent response times - system well optimized
- 🚨 High error rate under load - implement better error handling
- 🚀 Good throughput under load - system handles concurrency well
- 💎 Excellent cost efficiency - good value proposition
