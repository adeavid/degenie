export declare class MockRedis {
    private store;
    private expiry;
    get(key: string): Promise<string | null>;
    set(key: string, value: string): Promise<void>;
    setex(key: string, seconds: number, value: string): Promise<void>;
    incr(key: string): Promise<number>;
    incrbyfloat(key: string, increment: number): Promise<number>;
    expire(key: string, seconds: number): Promise<void>;
    hincrby(key: string, field: string, increment: number): Promise<number>;
    keys(pattern: string): Promise<string[]>;
    ping(): Promise<string>;
    quit(): Promise<void>;
    zadd(key: string, score: number, member: string): Promise<void>;
    zcount(key: string, min: number, max: number): Promise<number>;
    zrange(key: string, start: number, stop: number, ...args: string[]): Promise<string[]>;
    zremrangebyscore(key: string, min: string | number, max: string | number): Promise<void>;
    lpush(key: string, value: string): Promise<void>;
    ltrim(key: string, start: number, stop: number): Promise<void>;
    lrange(key: string, start: number, stop: number): Promise<string[]>;
    sismember(key: string, member: string): Promise<boolean>;
    sadd(key: string, member: string): Promise<void>;
    del(key: string): Promise<void>;
    atomicCheckAndDeduct(key: string, amount: number): Promise<number>;
    private checkExpiry;
}
//# sourceMappingURL=MockRedis.d.ts.map