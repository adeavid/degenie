"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const ComplexityAnalyzer_1 = require("./ComplexityAnalyzer");
const PerformanceProfiler_1 = require("./PerformanceProfiler");
const CostAnalyzer_1 = require("./CostAnalyzer");
async function runComprehensiveAnalysis() {
    console.log('🔍 Starting Comprehensive AI Pipeline Analysis...\n');
    console.log('='.repeat(60) + '\n');
    const results = {
        complexity: null,
        performance: null,
        cost: null,
        timestamp: new Date().toISOString(),
        summary: {
            overallScore: 0,
            riskLevel: 'medium',
            keyFindings: [],
            priorityActions: []
        }
    };
    try {
        // 1. Complexity Analysis
        console.log('📊 PHASE 1: Complexity Analysis');
        console.log('-'.repeat(40));
        const complexityAnalyzer = new ComplexityAnalyzer_1.ComplexityAnalyzer();
        results.complexity = await complexityAnalyzer.analyzeSystem();
        console.log(`✅ Complexity Score: ${results.complexity.overall.complexityScore}/10\n`);
        // 2. Performance Analysis
        console.log('⚡ PHASE 2: Performance Analysis');
        console.log('-'.repeat(40));
        const performanceProfiler = new PerformanceProfiler_1.PerformanceProfiler();
        results.performance = await performanceProfiler.profileSystem();
        console.log(`✅ Performance Analysis Complete\n`);
        // 3. Cost Analysis
        console.log('💰 PHASE 3: Cost Analysis');
        console.log('-'.repeat(40));
        const costAnalyzer = new CostAnalyzer_1.CostAnalyzer();
        results.cost = await costAnalyzer.analyzeCosts();
        console.log(`✅ Monthly Cost: $${results.cost.operational.total.monthly}\n`);
        // 4. Generate Summary
        console.log('📋 PHASE 4: Summary Generation');
        console.log('-'.repeat(40));
        results.summary = generateExecutiveSummary(results);
        console.log('✅ Executive Summary Generated\n');
        // 5. Save Reports
        console.log('💾 PHASE 5: Saving Reports');
        console.log('-'.repeat(40));
        await saveAnalysisReports(results);
        console.log('✅ All reports saved\n');
        // 6. Display Summary
        displayExecutiveSummary(results.summary);
    }
    catch (error) {
        console.error('❌ Analysis failed:', error.message);
        console.error('Stack trace:', error.stack);
    }
}
function generateExecutiveSummary(results) {
    const keyFindings = [];
    const priorityActions = [];
    // Complexity findings
    const complexity = results.complexity;
    if (complexity.overall.complexityScore > 7) {
        keyFindings.push(`High system complexity (${complexity.overall.complexityScore}/10) - ${complexity.overall.totalLinesOfCode} LOC`);
        priorityActions.push('Refactor high-complexity components');
    }
    else if (complexity.overall.complexityScore < 4) {
        keyFindings.push(`Low complexity system (${complexity.overall.complexityScore}/10) - good maintainability`);
    }
    else {
        keyFindings.push(`Moderate complexity (${complexity.overall.complexityScore}/10) - manageable scale`);
    }
    // High-risk components
    if (complexity.riskAssessment.highRiskComponents.length > 0) {
        keyFindings.push(`${complexity.riskAssessment.highRiskComponents.length} high-risk components identified`);
        priorityActions.push(`Address high-risk components: ${complexity.riskAssessment.highRiskComponents.join(', ')}`);
    }
    // Performance findings
    const performance = results.performance;
    if (performance.singleRequest && performance.singleRequest.length > 0) {
        const avgResponseTime = performance.singleRequest.reduce((sum, m) => sum + m.responseTime, 0) / performance.singleRequest.length;
        if (avgResponseTime > 500) {
            keyFindings.push(`Slow response times (avg: ${Math.round(avgResponseTime)}ms)`);
            priorityActions.push('Optimize API response times');
        }
        else if (avgResponseTime < 100) {
            keyFindings.push(`Excellent response times (avg: ${Math.round(avgResponseTime)}ms)`);
        }
    }
    // Load test findings
    if (performance.loadTest && performance.loadTest.length > 0) {
        const heavyLoad = performance.loadTest.find((t) => t.scenario === 'Heavy Load');
        if (heavyLoad && heavyLoad.errorRate > 10) {
            keyFindings.push(`High error rate under load (${heavyLoad.errorRate}%)`);
            priorityActions.push('Improve error handling and resilience');
        }
    }
    // Cost findings
    const cost = results.cost;
    if (cost.efficiency.profitMargin < 20) {
        keyFindings.push(`Low profit margin (${cost.efficiency.profitMargin}%)`);
        priorityActions.push('Review pricing strategy and cost optimization');
    }
    else if (cost.efficiency.profitMargin > 60) {
        keyFindings.push(`High profit margin (${cost.efficiency.profitMargin}%) - good economics`);
    }
    if (cost.operational.total.monthly > 2000) {
        keyFindings.push(`High operational costs ($${cost.operational.total.monthly}/month)`);
        priorityActions.push('Negotiate volume discounts with AI providers');
    }
    // Calculate overall score
    let overallScore = 70; // Base score
    // Adjust based on complexity
    overallScore -= (complexity.overall.complexityScore - 5) * 5;
    // Adjust based on performance
    if (performance.recommendations) {
        const perfIssues = performance.recommendations.filter((r) => r.includes('🐌') || r.includes('🚨')).length;
        overallScore -= perfIssues * 10;
        const perfPositives = performance.recommendations.filter((r) => r.includes('⚡') || r.includes('🚀')).length;
        overallScore += perfPositives * 5;
    }
    // Adjust based on cost efficiency
    if (cost.efficiency.profitMargin < 20)
        overallScore -= 15;
    else if (cost.efficiency.profitMargin > 40)
        overallScore += 10;
    overallScore = Math.max(0, Math.min(100, overallScore));
    // Determine risk level
    let riskLevel = 'medium';
    if (overallScore >= 80)
        riskLevel = 'low';
    else if (overallScore < 50)
        riskLevel = 'high';
    return {
        overallScore: Math.round(overallScore),
        riskLevel,
        keyFindings,
        priorityActions
    };
}
async function saveAnalysisReports(results) {
    const reportsDir = path_1.default.join(process.cwd(), 'analysis-reports');
    await promises_1.default.mkdir(reportsDir, { recursive: true });
    const timestamp = new Date().toISOString().split('T')[0];
    // Save individual reports
    const complexityAnalyzer = new ComplexityAnalyzer_1.ComplexityAnalyzer();
    const complexityReport = await complexityAnalyzer.generateReport();
    await promises_1.default.writeFile(path_1.default.join(reportsDir, `complexity-analysis-${timestamp}.md`), complexityReport);
    const performanceProfiler = new PerformanceProfiler_1.PerformanceProfiler();
    const performanceReport = await performanceProfiler.generateReport(results.performance);
    await promises_1.default.writeFile(path_1.default.join(reportsDir, `performance-analysis-${timestamp}.md`), performanceReport);
    const costAnalyzer = new CostAnalyzer_1.CostAnalyzer();
    const costReport = await costAnalyzer.generateReport(results.cost);
    await promises_1.default.writeFile(path_1.default.join(reportsDir, `cost-analysis-${timestamp}.md`), costReport);
    // Save comprehensive report
    const comprehensiveReport = await generateComprehensiveReport(results);
    await promises_1.default.writeFile(path_1.default.join(reportsDir, `comprehensive-analysis-${timestamp}.md`), comprehensiveReport);
    // Save JSON data
    await promises_1.default.writeFile(path_1.default.join(reportsDir, `analysis-data-${timestamp}.json`), JSON.stringify(results, null, 2));
    console.log(`📁 Reports saved to: ${reportsDir}`);
}
async function generateComprehensiveReport(results) {
    let report = `# 🚀 DeGenie AI Pipeline - Comprehensive Analysis Report\n\n`;
    report += `**Generated**: ${new Date(results.timestamp).toLocaleString()}\n`;
    report += `**Overall Score**: ${results.summary.overallScore}/100\n`;
    report += `**Risk Level**: ${getRiskEmoji(results.summary.riskLevel)} ${results.summary.riskLevel.toUpperCase()}\n\n`;
    // Executive Summary
    report += `## 📊 Executive Summary\n\n`;
    report += `| Metric | Value | Status |\n`;
    report += `|--------|-------|--------|\n`;
    report += `| Overall Score | ${results.summary.overallScore}/100 | ${getScoreStatus(results.summary.overallScore)} |\n`;
    report += `| System Complexity | ${results.complexity.overall.complexityScore}/10 | ${getComplexityStatus(results.complexity.overall.complexityScore)} |\n`;
    report += `| Monthly Costs | $${results.cost.operational.total.monthly} | ${getCostStatus(results.cost.operational.total.monthly)} |\n`;
    report += `| Profit Margin | ${results.cost.efficiency.profitMargin}% | ${getProfitStatus(results.cost.efficiency.profitMargin)} |\n`;
    if (results.performance.singleRequest && results.performance.singleRequest.length > 0) {
        const avgResponseTime = results.performance.singleRequest.reduce((sum, m) => sum + m.responseTime, 0) / results.performance.singleRequest.length;
        report += `| Avg Response Time | ${Math.round(avgResponseTime)}ms | ${getPerformanceStatus(avgResponseTime)} |\n`;
    }
    // Key Findings
    report += `\n## 🔍 Key Findings\n\n`;
    results.summary.keyFindings.forEach(finding => {
        report += `- ${finding}\n`;
    });
    // Priority Actions
    report += `\n## 🎯 Priority Actions\n\n`;
    results.summary.priorityActions.forEach((action, index) => {
        report += `${index + 1}. ${action}\n`;
    });
    // Quick Stats
    report += `\n## 📈 Quick Stats\n\n`;
    report += `### Code Metrics\n`;
    report += `- **Total Files**: ${results.complexity.overall.totalFiles}\n`;
    report += `- **Lines of Code**: ${results.complexity.overall.totalLinesOfCode.toLocaleString()}\n`;
    report += `- **Functions**: ${results.complexity.overall.totalFunctions}\n`;
    report += `- **Integration Points**: ${results.complexity.integrations.totalIntegrationPoints}\n\n`;
    report += `### Performance Metrics\n`;
    if (results.performance.singleRequest && results.performance.singleRequest.length > 0) {
        const metrics = results.performance.singleRequest;
        const avgTime = metrics.reduce((sum, m) => sum + m.responseTime, 0) / metrics.length;
        const avgThroughput = metrics.reduce((sum, m) => sum + m.throughput, 0) / metrics.length;
        report += `- **Average Response Time**: ${Math.round(avgTime)}ms\n`;
        report += `- **Average Throughput**: ${avgThroughput.toFixed(1)} req/s\n`;
    }
    if (results.performance.loadTest && results.performance.loadTest.length > 0) {
        const heavyLoad = results.performance.loadTest.find((t) => t.scenario === 'Heavy Load');
        if (heavyLoad) {
            report += `- **Load Test Success Rate**: ${((heavyLoad.successfulRequests / heavyLoad.totalRequests) * 100).toFixed(1)}%\n`;
            report += `- **Concurrent User Capacity**: ${heavyLoad.concurrentUsers} users\n`;
        }
    }
    report += `\n### Cost Metrics\n`;
    report += `- **Daily Operational Cost**: $${results.cost.operational.total.daily}\n`;
    report += `- **Monthly Projection**: $${results.cost.operational.total.monthly}\n`;
    report += `- **Cost per Credit**: $${results.cost.efficiency.costPerCredit}\n`;
    report += `- **Break-even Point**: ${results.cost.efficiency.breakEvenPoint.toLocaleString()} credits/month\n\n`;
    // Recommendations Summary
    report += `## 💡 Key Recommendations\n\n`;
    // Combine all recommendations
    const allRecommendations = [
        ...results.summary.priorityActions,
        ...results.cost.recommendations.slice(0, 3), // Top 3 cost recommendations
        ...results.performance.recommendations.slice(0, 3) // Top 3 performance recommendations
    ];
    allRecommendations.slice(0, 8).forEach((rec, index) => {
        report += `${index + 1}. ${rec}\n`;
    });
    report += `\n---\n\n`;
    report += `📋 **For detailed analysis, see individual reports:**\n`;
    report += `- Complexity Analysis: \`complexity-analysis-${new Date().toISOString().split('T')[0]}.md\`\n`;
    report += `- Performance Analysis: \`performance-analysis-${new Date().toISOString().split('T')[0]}.md\`\n`;
    report += `- Cost Analysis: \`cost-analysis-${new Date().toISOString().split('T')[0]}.md\`\n`;
    return report;
}
function getRiskEmoji(risk) {
    switch (risk) {
        case 'low': return '🟢';
        case 'medium': return '🟡';
        case 'high': return '🔴';
        default: return '⚪';
    }
}
function getScoreStatus(score) {
    if (score >= 80)
        return '🟢 Excellent';
    if (score >= 60)
        return '🟡 Good';
    if (score >= 40)
        return '🟠 Needs Improvement';
    return '🔴 Critical';
}
function getComplexityStatus(complexity) {
    if (complexity <= 4)
        return '🟢 Low';
    if (complexity <= 6)
        return '🟡 Moderate';
    if (complexity <= 8)
        return '🟠 High';
    return '🔴 Very High';
}
function getCostStatus(cost) {
    if (cost <= 500)
        return '🟢 Low';
    if (cost <= 1500)
        return '🟡 Moderate';
    if (cost <= 3000)
        return '🟠 High';
    return '🔴 Very High';
}
function getProfitStatus(profit) {
    if (profit >= 50)
        return '🟢 Excellent';
    if (profit >= 30)
        return '🟡 Good';
    if (profit >= 15)
        return '🟠 Fair';
    return '🔴 Poor';
}
function getPerformanceStatus(responseTime) {
    if (responseTime <= 100)
        return '🟢 Excellent';
    if (responseTime <= 300)
        return '🟡 Good';
    if (responseTime <= 800)
        return '🟠 Fair';
    return '🔴 Poor';
}
function displayExecutiveSummary(summary) {
    console.log('='.repeat(60));
    console.log('📊 EXECUTIVE SUMMARY');
    console.log('='.repeat(60) + '\n');
    console.log(`🎯 Overall Score: ${summary.overallScore}/100`);
    console.log(`⚠️  Risk Level: ${getRiskEmoji(summary.riskLevel)} ${summary.riskLevel.toUpperCase()}\n`);
    console.log('🔍 Key Findings:');
    summary.keyFindings.forEach((finding, index) => {
        console.log(`   ${index + 1}. ${finding}`);
    });
    console.log('\n🎯 Priority Actions:');
    summary.priorityActions.forEach((action, index) => {
        console.log(`   ${index + 1}. ${action}`);
    });
    console.log('\n' + '='.repeat(60));
    console.log('✅ Comprehensive Analysis Complete!');
    console.log('📁 Check analysis-reports/ directory for detailed reports');
    console.log('='.repeat(60));
}
// Run the analysis
runComprehensiveAnalysis().catch(console.error);
//# sourceMappingURL=run-complexity-analysis.js.map