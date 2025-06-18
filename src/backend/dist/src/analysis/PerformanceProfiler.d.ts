interface PerformanceMetrics {
    endpoint: string;
    tier: string;
    assetType: string;
    responseTime: number;
    throughput: number;
    errorRate: number;
    memoryUsage?: NodeJS.MemoryUsage;
    costEfficiency: number;
}
interface LoadTestResult {
    scenario: string;
    concurrentUsers: number;
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
    maxResponseTime: number;
    minResponseTime: number;
    requestsPerSecond: number;
    errorRate: number;
}
export declare class PerformanceProfiler {
    private baseUrl;
    constructor(baseUrl?: string);
    profileSystem(): Promise<{
        singleRequest: PerformanceMetrics[];
        loadTest: LoadTestResult[];
        systemHealth: any;
        recommendations: string[];
    }>;
    private profileSingleRequests;
    private measureSingleRequest;
    private calculateCostEfficiency;
    private estimateQualityScore;
    private performLoadTests;
    private runLoadTestScenario;
    private makeLoadTestRequest;
    private checkSystemHealth;
    private generatePerformanceRecommendations;
    private createTestUser;
    private delay;
    generateReport(data: any): Promise<string>;
}
export {};
//# sourceMappingURL=PerformanceProfiler.d.ts.map