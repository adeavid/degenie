import fs from 'fs/promises';
import path from 'path';

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
    complexityScore: number; // 1-10
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

export class ComplexityAnalyzer {
  private srcPath: string;
  private components: ComponentComplexity[] = [];

  constructor(srcPath = '/Users/cash/Desktop/degenie/src/backend/src') {
    this.srcPath = srcPath;
  }

  async analyzeSystem(): Promise<SystemComplexity> {
    console.log('🔍 Starting AI Pipeline Complexity Analysis...\n');

    // Analyze core components
    await this.analyzeComponent('final-server.ts', 'Main Server');
    await this.analyzeComponent('services/StorageLiteService.ts', 'Storage Service');
    await this.analyzeComponent('services/MockIPFS.ts', 'IPFS Service');
    await this.analyzeComponent('tests/AssetQualityTester.ts', 'Quality Testing');
    await this.analyzeComponent('tests/QualityReportGenerator.ts', 'Report Generator');

    // Calculate overall metrics
    const overall = this.calculateOverallMetrics();
    
    // Analyze integrations
    const integrations = this.analyzeIntegrations();
    
    // Perform risk assessment
    const riskAssessment = this.performRiskAssessment();

    return {
      overall,
      components: this.components,
      integrations,
      riskAssessment
    };
  }

  private async analyzeComponent(filePath: string, name: string): Promise<void> {
    try {
      const fullPath = path.join(this.srcPath, filePath);
      const content = await fs.readFile(fullPath, 'utf-8');
      
      const complexity = this.calculateComponentComplexity(content, name);
      this.components.push(complexity);
      
      console.log(`📊 ${name}: ${complexity.linesOfCode} LOC, Complexity: ${complexity.cyclomaticComplexity}`);
    } catch (error) {
      console.log(`⚠️  Could not analyze ${name}: File not found`);
      
      // Add placeholder for missing components
      this.components.push({
        name,
        linesOfCode: 0,
        functions: 0,
        dependencies: [],
        cyclomaticComplexity: 0,
        maintainabilityIndex: 0,
        riskLevel: 'low'
      });
    }
  }

  private calculateComponentComplexity(content: string, name: string): ComponentComplexity {
    const lines = content.split('\n');
    const linesOfCode = lines.filter(line => 
      line.trim() && 
      !line.trim().startsWith('//') && 
      !line.trim().startsWith('/*') &&
      !line.trim().startsWith('*')
    ).length;

    // Count functions (async function, function, arrow functions)
    const functionMatches = content.match(/(async\s+function|function|\w+\s*=\s*\([^)]*\)\s*=>|\w+\s*:\s*\([^)]*\)\s*=>)/g) || [];
    const functions = functionMatches.length;

    // Extract dependencies (imports)
    const importMatches = content.match(/import.*from\s+['"`]([^'"`]+)['"`]/g) || [];
    const dependencies: string[] = [];
    importMatches.forEach(imp => {
      const match = imp.match(/from\s+['"`]([^'"`]+)['"`]/);
      if (match && match[1] && !match[1].startsWith('.')) {
        dependencies.push(match[1]);
      }
    });

    // Calculate cyclomatic complexity (simplified)
    const complexityKeywords = ['if', 'else', 'while', 'for', 'switch', 'case', 'catch', 'throw', '&&', '||', '?'];
    const cyclomaticComplexity = complexityKeywords.reduce((count, keyword) => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'g');
      const matches = content.match(regex) || [];
      return count + matches.length;
    }, 1); // Base complexity is 1

    // Calculate maintainability index (simplified)
    const avgLineLength = linesOfCode > 0 ? content.length / linesOfCode : 0;
    const maintainabilityIndex = Math.max(0, 100 - (cyclomaticComplexity * 2) - (avgLineLength * 0.1));

    // Determine risk level
    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    if (cyclomaticComplexity > 20 || linesOfCode > 500) riskLevel = 'high';
    else if (cyclomaticComplexity > 10 || linesOfCode > 200) riskLevel = 'medium';

    return {
      name,
      linesOfCode,
      functions,
      dependencies,
      cyclomaticComplexity,
      maintainabilityIndex: Math.round(maintainabilityIndex),
      riskLevel
    };
  }

  private calculateOverallMetrics() {
    const totalFiles = this.components.length;
    const totalLinesOfCode = this.components.reduce((sum, comp) => sum + comp.linesOfCode, 0);
    const totalFunctions = this.components.reduce((sum, comp) => sum + comp.functions, 0);
    const averageComplexity = this.components.length > 0 
      ? this.components.reduce((sum, comp) => sum + comp.cyclomaticComplexity, 0) / this.components.length
      : 0;

    // Calculate overall complexity score (1-10)
    let complexityScore = 5; // Base score
    
    // Adjust based on metrics
    if (totalLinesOfCode > 2000) complexityScore += 1;
    if (totalLinesOfCode > 5000) complexityScore += 1;
    if (averageComplexity > 15) complexityScore += 2;
    if (averageComplexity > 25) complexityScore += 1;
    
    // Reduce for good practices
    const avgMaintainability = this.components.reduce((sum, comp) => sum + comp.maintainabilityIndex, 0) / this.components.length;
    if (avgMaintainability > 70) complexityScore -= 1;
    if (avgMaintainability > 85) complexityScore -= 1;

    complexityScore = Math.max(1, Math.min(10, complexityScore));

    return {
      totalFiles,
      totalLinesOfCode,
      totalFunctions,
      averageComplexity: Math.round(averageComplexity * 10) / 10,
      complexityScore
    };
  }

  private analyzeIntegrations() {
    // Identify external integrations from our components
    const externalAPIs = [
      'Replicate API',
      'Together.ai API', 
      'IPFS (Infura)',
      'Mock IPFS (Development)'
    ];

    const databases = [
      'SQLite (Development)',
      'PostgreSQL (Production)',
      'Prisma ORM'
    ];

    const storageSystems = [
      'IPFS Distributed Storage',
      'Local File System',
      'In-Memory Credit Store'
    ];

    return {
      externalAPIs,
      databases,
      storageSystems,
      totalIntegrationPoints: externalAPIs.length + databases.length + storageSystems.length
    };
  }

  private performRiskAssessment() {
    const highRiskComponents = this.components
      .filter(comp => comp.riskLevel === 'high')
      .map(comp => comp.name);

    const criticalDependencies = [
      'Replicate API (Single point of failure)',
      'Database connection (Data persistence)',
      'IPFS service (Storage reliability)',
      'Credit system (Business logic)'
    ];

    const singlePointsOfFailure = [
      'Main server process',
      'Database connection',
      'External API availability',
      'IPFS gateway access'
    ];

    return {
      highRiskComponents,
      criticalDependencies,
      singlePointsOfFailure
    };
  }

  async generateReport(): Promise<string> {
    const analysis = await this.analyzeSystem();
    
    let report = `# 🔍 AI Pipeline Complexity Analysis Report\n\n`;
    report += `**Generated**: ${new Date().toLocaleString()}\n\n`;

    // Overall Metrics
    report += `## 📊 Overall System Metrics\n\n`;
    report += `| Metric | Value |\n`;
    report += `|--------|-------|\n`;
    report += `| Total Files | ${analysis.overall.totalFiles} |\n`;
    report += `| Lines of Code | ${analysis.overall.totalLinesOfCode} |\n`;
    report += `| Functions | ${analysis.overall.totalFunctions} |\n`;
    report += `| Avg Complexity | ${analysis.overall.averageComplexity} |\n`;
    report += `| **Complexity Score** | **${analysis.overall.complexityScore}/10** |\n\n`;

    // Component Analysis
    report += `## 🧩 Component Breakdown\n\n`;
    report += `| Component | LOC | Functions | Complexity | Risk | Maintainability |\n`;
    report += `|-----------|-----|-----------|------------|------|----------------|\n`;
    
    analysis.components.forEach(comp => {
      const riskIcon = comp.riskLevel === 'high' ? '🔴' : comp.riskLevel === 'medium' ? '🟡' : '🟢';
      report += `| ${comp.name} | ${comp.linesOfCode} | ${comp.functions} | ${comp.cyclomaticComplexity} | ${riskIcon} ${comp.riskLevel} | ${comp.maintainabilityIndex}% |\n`;
    });

    // Integration Analysis
    report += `\n## 🔗 Integration Complexity\n\n`;
    report += `**Total Integration Points**: ${analysis.integrations.totalIntegrationPoints}\n\n`;
    
    report += `### External APIs:\n`;
    analysis.integrations.externalAPIs.forEach(api => {
      report += `- ${api}\n`;
    });
    
    report += `\n### Storage Systems:\n`;
    analysis.integrations.storageSystems.forEach((storage: string) => {
      report += `- ${storage}\n`;
    });

    // Risk Assessment
    report += `\n## ⚠️ Risk Assessment\n\n`;
    
    if (analysis.riskAssessment.highRiskComponents.length > 0) {
      report += `### High Risk Components:\n`;
      analysis.riskAssessment.highRiskComponents.forEach(comp => {
        report += `- 🔴 ${comp}\n`;
      });
      report += `\n`;
    }

    report += `### Critical Dependencies:\n`;
    analysis.riskAssessment.criticalDependencies.forEach(dep => {
      report += `- ⚠️ ${dep}\n`;
    });

    report += `\n### Single Points of Failure:\n`;
    analysis.riskAssessment.singlePointsOfFailure.forEach(spof => {
      report += `- 🚨 ${spof}\n`;
    });

    // Recommendations
    report += `\n## 🎯 Recommendations\n\n`;
    report += this.generateRecommendations(analysis);

    return report;
  }

  private generateRecommendations(analysis: SystemComplexity): string {
    let recommendations = '';

    // Complexity-based recommendations
    if (analysis.overall.complexityScore > 7) {
      recommendations += `### 🔧 Complexity Reduction\n`;
      recommendations += `- Consider breaking down large components\n`;
      recommendations += `- Implement more modular architecture\n`;
      recommendations += `- Add more abstraction layers\n\n`;
    }

    // Risk-based recommendations
    if (analysis.riskAssessment.highRiskComponents.length > 0) {
      recommendations += `### 🛡️ Risk Mitigation\n`;
      recommendations += `- Refactor high-risk components\n`;
      recommendations += `- Add comprehensive error handling\n`;
      recommendations += `- Implement circuit breakers for external APIs\n\n`;
    }

    // Integration recommendations
    if (analysis.integrations.totalIntegrationPoints > 8) {
      recommendations += `### 🔗 Integration Optimization\n`;
      recommendations += `- Implement API abstraction layer\n`;
      recommendations += `- Add retry mechanisms and fallbacks\n`;
      recommendations += `- Consider API gateway pattern\n\n`;
    }

    // Performance recommendations
    recommendations += `### ⚡ Performance Optimization\n`;
    recommendations += `- Implement caching for frequent requests\n`;
    recommendations += `- Add request queuing for rate limiting\n`;
    recommendations += `- Consider async processing for heavy operations\n\n`;

    // Maintenance recommendations
    recommendations += `### 🔧 Maintainability\n`;
    recommendations += `- Add comprehensive unit tests\n`;
    recommendations += `- Implement monitoring and alerting\n`;
    recommendations += `- Document API contracts and dependencies\n\n`;

    return recommendations;
  }
}