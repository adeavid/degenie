// Mock Redis for development when Redis is not available
export class MockRedis {
  private store: Map<string, string> = new Map();
  private expiry: Map<string, number> = new Map();

  async get(key: string): Promise<string | null> {
    this.checkExpiry(key);
    return this.store.get(key) || null;
  }

  async set(key: string, value: string): Promise<void> {
    this.store.set(key, value);
  }

  async setex(key: string, seconds: number, value: string): Promise<void> {
    this.store.set(key, value);
    this.expiry.set(key, Date.now() + seconds * 1000);
  }

  async incr(key: string): Promise<number> {
    const currentValue = await this.get(key);
    const current = parseInt(currentValue || '0');
    const newValue = current + 1;
    await this.set(key, newValue.toString());
    return newValue;
  }

  async incrbyfloat(key: string, increment: number): Promise<number> {
    const currentValue = await this.get(key);
    const current = parseFloat(currentValue || '0');
    const newValue = current + increment;
    await this.set(key, newValue.toString());
    return newValue;
  }

  async expire(key: string, seconds: number): Promise<void> {
    this.expiry.set(key, Date.now() + seconds * 1000);
  }

  async hincrby(key: string, field: string, increment: number): Promise<number> {
    const currentValue = await this.get(key);
    const hash = JSON.parse(currentValue || '{}');
    hash[field] = (hash[field] || 0) + increment;
    await this.set(key, JSON.stringify(hash));
    return hash[field];
  }

  async keys(pattern: string): Promise<string[]> {
    const regex = new RegExp(pattern.replace('*', '.*'));
    return Array.from(this.store.keys()).filter(key => regex.test(key));
  }

  async ping(): Promise<string> {
    return 'PONG';
  }

  async quit(): Promise<void> {
    // MockRedis doesn't need explicit cleanup
    this.store.clear();
    this.expiry.clear();
  }

  async zadd(key: string, score: number, member: string): Promise<void> {
    const currentValue = await this.get(key);
    const sortedSet = JSON.parse(currentValue || '[]');
    sortedSet.push({ score, member });
    await this.set(key, JSON.stringify(sortedSet));
  }

  async zcount(key: string, min: number, max: number): Promise<number> {
    const currentValue = await this.get(key);
    const sortedSet = JSON.parse(currentValue || '[]');
    return sortedSet.filter((item: any) => item.score >= min && item.score <= max).length;
  }

  async zrange(key: string, start: number, stop: number, ...args: string[]): Promise<string[]> {
    const currentValue = await this.get(key);
    const sortedSet = JSON.parse(currentValue || '[]');
    const sorted = sortedSet.sort((a: any, b: any) => a.score - b.score);
    const slice = sorted.slice(start, stop + 1);
    
    if (args.includes('WITHSCORES')) {
      const result: string[] = [];
      slice.forEach((item: any) => {
        result.push(item.member, item.score.toString());
      });
      return result;
    }
    
    return slice.map((item: any) => item.member);
  }

  async zremrangebyscore(key: string, min: string | number, max: string | number): Promise<void> {
    const currentValue = await this.get(key);
    const sortedSet = JSON.parse(currentValue || '[]');
    const filtered = sortedSet.filter((item: any) => {
      const score = item.score;
      const minScore = min === '-inf' ? -Infinity : Number(min);
      const maxScore = max === '+inf' ? Infinity : Number(max);
      return !(score >= minScore && score <= maxScore);
    });
    await this.set(key, JSON.stringify(filtered));
  }

  async lpush(key: string, value: string): Promise<void> {
    const currentValue = await this.get(key);
    const list = JSON.parse(currentValue || '[]');
    list.unshift(value);
    await this.set(key, JSON.stringify(list));
  }

  async ltrim(key: string, start: number, stop: number): Promise<void> {
    const currentValue = await this.get(key);
    const list = JSON.parse(currentValue || '[]');
    const trimmed = list.slice(start, stop + 1);
    await this.set(key, JSON.stringify(trimmed));
  }

  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    const currentValue = await this.get(key);
    const list = JSON.parse(currentValue || '[]');
    return list.slice(start, stop + 1);
  }

  async sismember(key: string, member: string): Promise<boolean> {
    const currentValue = await this.get(key);
    const set = JSON.parse(currentValue || '[]');
    return set.includes(member);
  }

  async sadd(key: string, member: string): Promise<void> {
    const currentValue = await this.get(key);
    const set = JSON.parse(currentValue || '[]');
    if (!set.includes(member)) {
      set.push(member);
      await this.set(key, JSON.stringify(set));
    }
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
    this.expiry.delete(key);
  }

  // Atomic check and deduct operation (simulates Redis Lua script)
  async atomicCheckAndDeduct(key: string, amount: number): Promise<number> {
    this.checkExpiry(key);
    const current = parseFloat(this.store.get(key) || '0');
    
    if (current >= amount) {
      const newBalance = current - amount;
      this.store.set(key, newBalance.toString());
      return newBalance;
    } else {
      return -1; // Insufficient funds
    }
  }

  private checkExpiry(key: string): void {
    const expiryTime = this.expiry.get(key);
    if (expiryTime && Date.now() > expiryTime) {
      this.store.delete(key);
      this.expiry.delete(key);
    }
  }
}