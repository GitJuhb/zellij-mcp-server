export declare class Cache {
    private static instance;
    private cache;
    private defaultTTL;
    static getInstance(): Cache;
    set<T>(key: string, value: T, ttlMs?: number): void;
    get<T>(key: string): T | null;
    has(key: string): boolean;
    delete(key: string): void;
    clear(): void;
    cleanup(): void;
    getStats(): {
        size: number;
        keys: string[];
    };
}
export declare const cache: Cache;
//# sourceMappingURL=cache.d.ts.map