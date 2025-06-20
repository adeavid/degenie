"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockRedis = void 0;
// Mock Redis for development when Redis is not available
class MockRedis {
    store = new Map();
    expiry = new Map();
    async get(key) {
        this.checkExpiry(key);
        return this.store.get(key) || null;
    }
    async set(key, value) {
        this.store.set(key, value);
    }
    async setex(key, seconds, value) {
        this.store.set(key, value);
        this.expiry.set(key, Date.now() + seconds * 1000);
    }
    async incr(key) {
        const currentValue = await this.get(key);
        const current = parseInt(currentValue || '0');
        const newValue = current + 1;
        await this.set(key, newValue.toString());
        return newValue;
    }
    async incrbyfloat(key, increment) {
        const currentValue = await this.get(key);
        const current = parseFloat(currentValue || '0');
        const newValue = current + increment;
        await this.set(key, newValue.toString());
        return newValue;
    }
    async expire(key, seconds) {
        this.expiry.set(key, Date.now() + seconds * 1000);
    }
    async hincrby(key, field, increment) {
        const currentValue = await this.get(key);
        const hash = JSON.parse(currentValue || '{}');
        hash[field] = (hash[field] || 0) + increment;
        await this.set(key, JSON.stringify(hash));
        return hash[field];
    }
    async keys(pattern) {
        const regex = new RegExp(pattern.replace('*', '.*'));
        return Array.from(this.store.keys()).filter(key => regex.test(key));
    }
    async ping() {
        return 'PONG';
    }
    async quit() {
        // MockRedis doesn't need explicit cleanup
        this.store.clear();
        this.expiry.clear();
    }
    async zadd(key, score, member) {
        const currentValue = await this.get(key);
        const sortedSet = JSON.parse(currentValue || '[]');
        sortedSet.push({ score, member });
        await this.set(key, JSON.stringify(sortedSet));
    }
    async zcount(key, min, max) {
        const currentValue = await this.get(key);
        const sortedSet = JSON.parse(currentValue || '[]');
        return sortedSet.filter((item) => item.score >= min && item.score <= max).length;
    }
    async zrange(key, start, stop, ...args) {
        const currentValue = await this.get(key);
        const sortedSet = JSON.parse(currentValue || '[]');
        const sorted = sortedSet.sort((a, b) => a.score - b.score);
        const slice = sorted.slice(start, stop + 1);
        if (args.includes('WITHSCORES')) {
            const result = [];
            slice.forEach((item) => {
                result.push(item.member, item.score.toString());
            });
            return result;
        }
        return slice.map((item) => item.member);
    }
    async zremrangebyscore(key, min, max) {
        const currentValue = await this.get(key);
        const sortedSet = JSON.parse(currentValue || '[]');
        const filtered = sortedSet.filter((item) => {
            const score = item.score;
            const minScore = min === '-inf' ? -Infinity : Number(min);
            const maxScore = max === '+inf' ? Infinity : Number(max);
            return !(score >= minScore && score <= maxScore);
        });
        await this.set(key, JSON.stringify(filtered));
    }
    async lpush(key, value) {
        const currentValue = await this.get(key);
        const list = JSON.parse(currentValue || '[]');
        list.unshift(value);
        await this.set(key, JSON.stringify(list));
    }
    async ltrim(key, start, stop) {
        const currentValue = await this.get(key);
        const list = JSON.parse(currentValue || '[]');
        const trimmed = list.slice(start, stop + 1);
        await this.set(key, JSON.stringify(trimmed));
    }
    async lrange(key, start, stop) {
        const currentValue = await this.get(key);
        const list = JSON.parse(currentValue || '[]');
        return list.slice(start, stop + 1);
    }
    async sismember(key, member) {
        const currentValue = await this.get(key);
        const set = JSON.parse(currentValue || '[]');
        return set.includes(member);
    }
    async sadd(key, member) {
        const currentValue = await this.get(key);
        const set = JSON.parse(currentValue || '[]');
        if (!set.includes(member)) {
            set.push(member);
            await this.set(key, JSON.stringify(set));
        }
    }
    async del(key) {
        this.store.delete(key);
        this.expiry.delete(key);
    }
    // Atomic check and deduct operation (simulates Redis Lua script)
    async atomicCheckAndDeduct(key, amount) {
        this.checkExpiry(key);
        const current = parseFloat(this.store.get(key) || '0');
        if (current >= amount) {
            const newBalance = current - amount;
            this.store.set(key, newBalance.toString());
            return newBalance;
        }
        else {
            return -1; // Insufficient funds
        }
    }
    checkExpiry(key) {
        const expiryTime = this.expiry.get(key);
        if (expiryTime && Date.now() > expiryTime) {
            this.store.delete(key);
            this.expiry.delete(key);
        }
    }
}
exports.MockRedis = MockRedis;
//# sourceMappingURL=MockRedis.js.map