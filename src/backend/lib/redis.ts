import { MockRedis } from '../src/services/MockRedis';

// Singleton pattern to ensure MockRedis data persists across calls
let redisInstance: MockRedis | null = null;

export function getRedisInstance(): MockRedis {
  if (!redisInstance) {
    redisInstance = new MockRedis();
  }
  return redisInstance;
}