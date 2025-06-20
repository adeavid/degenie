interface ComponentComplexity {
    name: string;
    linesOfCode: number;
    functions: number;
    dependencies: string[];
    cyclomaticComplexity: number;
    maintainabilityIndex: number;
    riskLevel: 'low' | 'medium' | 'high';
}
interface SystemComplexity {
    overall: {
        totalFiles: number;
        totalLinesOfCode: number;
        totalFunctions: number;
        averageComplexity: number;
        complexityScore: number;
    };
    components: ComponentComplexity[];
    integrations: {
        externalAPIs: string[];
        databases: string[];
        storageSystems: string[];
        totalIntegrationPoints: number;
    };
    riskAssessment: {
        highRiskComponents: string[];
        criticalDependencies: string[];
        singlePointsOfFailure: string[];
    };
}
export declare class ComplexityAnalyzer {
    private srcPath;
    private components;
    constructor(srcPath?: string);
    analyzeSystem(): Promise<SystemComplexity>;
    private analyzeComponent;
    private calculateComponentComplexity;
    private calculateOverallMetrics;
    private analyzeIntegrations;
    private performRiskAssessment;
    generateReport(): Promise<string>;
    private generateRecommendations;
}
export {};
//# sourceMappingURL=ComplexityAnalyzer.d.ts.map