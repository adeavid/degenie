interface QualityMetrics {
    promptAdherence: number;
    technicalQuality: number;
    cryptoRelevance: number;
    uniqueness: number;
    overall: number;
}
interface TestResult {
    assetType: string;
    tier: string;
    prompt: string;
    generationTime: number;
    cost: number;
    url: string;
    metrics: QualityMetrics;
    notes: string[];
}
interface TestReport {
    timestamp: string;
    totalTests: number;
    results: TestResult[];
    summary: {
        byType: Record<string, {
            avgScore: number;
            tests: number;
        }>;
        byTier: Record<string, {
            avgScore: number;
            tests: number;
        }>;
        recommendations: string[];
    };
}
export declare class AssetQualityTester {
    private baseUrl;
    private results;
    constructor(baseUrl?: string);
    /**
     * Test prompts designed to evaluate different aspects
     */
    private getTestPrompts;
    /**
     * Run quality tests for all asset types and tiers
     */
    runFullTestSuite(userId: string): Promise<TestReport>;
    /**
     * Test a single asset generation
     */
    private testSingleAsset;
    /**
     * Evaluate quality metrics for generated asset
     */
    private evaluateQuality;
    /**
     * Generate evaluation notes
     */
    private generateNotes;
    /**
     * Generate comprehensive test report
     */
    private generateReport;
    /**
     * Generate actionable recommendations
     */
    private generateRecommendations;
    /**
     * Save report to file
     */
    saveReport(report: TestReport, filename?: string): Promise<string>;
    /**
     * Generate markdown summary
     */
    private generateMarkdownSummary;
    /**
     * Create test user
     */
    private createTestUser;
    private delay;
}
export {};
//# sourceMappingURL=AssetQualityTester.d.ts.map