export declare class BlockchainIndexer {
    private connection;
    private prisma;
    private program;
    private isRunning;
    private processedSignatures;
    constructor();
    start(): Promise<void>;
    private subscribeToLogs;
    private pollHistoricalTrades;
    private processTransaction;
    private processTokenCreation;
    private processTrade;
    private processCandlesPeriodically;
    stop(): Promise<void>;
}
export declare const blockchainIndexer: BlockchainIndexer;
//# sourceMappingURL=BlockchainIndexer.d.ts.map