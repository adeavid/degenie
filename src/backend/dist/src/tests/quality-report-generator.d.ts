interface QualityReportData {
    timestamp: string;
    results: Array<{
        type: string;
        tier: string;
        prompt: string;
        score: number;
        metrics: {
            resolution: string;
            steps: number;
            cost: number;
            time: number;
        };
    }>;
    summary: {
        totalTests: number;
        avgScore: number;
        avgTime: number;
        totalCost: number;
        recommendations: string[];
    };
}
export declare class QualityReportGenerator {
    static generateHTMLReport(data: QualityReportData): Promise<string>;
    static saveHTMLReport(data: QualityReportData, filename?: string): Promise<string>;
}
export {};
//# sourceMappingURL=quality-report-generator.d.ts.map