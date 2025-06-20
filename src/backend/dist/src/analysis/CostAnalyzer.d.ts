interface CostMetrics {
    api: string;
    callsPerDay: number;
    costPerCall: number;
    dailyCost: number;
    monthlyProjection: number;
    tier: string;
    model?: string;
}
interface OperationalCosts {
    aiServices: CostMetrics[];
    infrastructure: {
        database: number;
        storage: number;
        bandwidth: number;
        hosting: number;
    };
    development: {
        complexity: number;
        maintenance: number;
        scaling: number;
    };
    total: {
        daily: number;
        monthly: number;
        yearly: number;
    };
}
interface CostEfficiencyAnalysis {
    revenuePerCredit: number;
    costPerCredit: number;
    profitMargin: number;
    breakEvenPoint: number;
    scalingRecommendations: string[];
}
export declare class CostAnalyzer {
    private baseOperationalCosts;
    private aiServiceRates;
    analyzeCosts(): Promise<{
        operational: OperationalCosts;
        efficiency: CostEfficiencyAnalysis;
        recommendations: string[];
        projections: any;
    }>;
    private calculateOperationalCosts;
    private calculateCostEfficiency;
    private generateCostProjections;
    private generateCostRecommendations;
    generateReport(data: any): Promise<string>;
}
export {};
//# sourceMappingURL=CostAnalyzer.d.ts.map