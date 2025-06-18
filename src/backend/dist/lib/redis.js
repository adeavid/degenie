"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRedisInstance = getRedisInstance;
const MockRedis_1 = require("../src/services/MockRedis");
// Singleton pattern to ensure MockRedis data persists across calls
let redisInstance = null;
function getRedisInstance() {
    if (!redisInstance) {
        redisInstance = new MockRedis_1.MockRedis();
    }
    return redisInstance;
}
//# sourceMappingURL=redis.js.map