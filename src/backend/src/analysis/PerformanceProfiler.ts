import axios from 'axios';
import { performance } from 'perf_hooks';

interface PerformanceMetrics {
  endpoint: string;
  tier: string;
  assetType: string;
  responseTime: number;
  throughput: number;
  errorRate: number;
  memoryUsage?: NodeJS.MemoryUsage;
  costEfficiency: number; // Quality per credit
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

export class PerformanceProfiler {
  private baseUrl: string;

  constructor(baseUrl = 'http://localhost:4000') {
    this.baseUrl = baseUrl;
  }

  async profileSystem(): Promise<{
    singleRequest: PerformanceMetrics[];
    loadTest: LoadTestResult[];
    systemHealth: any;
    recommendations: string[];
  }> {
    console.log('⚡ Starting Performance Profiling...\n');

    // Test individual requests
    const singleRequestMetrics = await this.profileSingleRequests();
    
    // Perform load testing
    const loadTestResults = await this.performLoadTests();
    
    // Check system health
    const systemHealth = await this.checkSystemHealth();
    
    // Generate recommendations
    const recommendations = this.generatePerformanceRecommendations(
      singleRequestMetrics, 
      loadTestResults
    );

    return {
      singleRequest: singleRequestMetrics,
      loadTest: loadTestResults,
      systemHealth,
      recommendations
    };
  }

  private async profileSingleRequests(): Promise<PerformanceMetrics[]> {
    console.log('📊 Profiling individual requests...');
    
    const testCases = [
      { type: 'logo', tier: 'free' },
      { type: 'logo', tier: 'starter' },
      { type: 'logo', tier: 'viral' },
      { type: 'meme', tier: 'free' },
      { type: 'meme', tier: 'starter' },
      { type: 'gif', tier: 'starter' },
      { type: 'gif', tier: 'viral' }
    ];

    const metrics: PerformanceMetrics[] = [];
    const testUserId = `perf-test-${Date.now()}`;

    // Create test user
    await this.createTestUser(testUserId);

    for (const testCase of testCases) {
      try {
        const metric = await this.measureSingleRequest(
          testCase.type,
          testCase.tier,
          testUserId
        );
        metrics.push(metric);
        console.log(`  ✅ ${testCase.type}/${testCase.tier}: ${metric.responseTime}ms`);
      } catch (error: any) {
        console.log(`  ❌ ${testCase.type}/${testCase.tier}: Failed`);
      }
    }

    return metrics;
  }

  private async measureSingleRequest(
    assetType: string,
    tier: string,
    userId: string
  ): Promise<PerformanceMetrics> {
    const memoryBefore = process.memoryUsage();
    const startTime = performance.now();

    try {
      const response = await axios.post(
        `${this.baseUrl}/api/generate/${assetType}`,
        {
          prompt: `test ${assetType} for performance`,
          tier,
          userId
        }
      );

      const endTime = performance.now();
      const memoryAfter = process.memoryUsage();
      const responseTime = endTime - startTime;

      const data = response.data.data;
      const costEfficiency = this.calculateCostEfficiency(data);

      return {
        endpoint: `/api/generate/${assetType}`,
        tier,
        assetType,
        responseTime: Math.round(responseTime),
        throughput: 1000 / responseTime, // Requests per second potential
        errorRate: 0,
        memoryUsage: {
          rss: memoryAfter.rss - memoryBefore.rss,
          heapTotal: memoryAfter.heapTotal - memoryBefore.heapTotal,
          heapUsed: memoryAfter.heapUsed - memoryBefore.heapUsed,
          external: memoryAfter.external - memoryBefore.external,
          arrayBuffers: memoryAfter.arrayBuffers - memoryBefore.arrayBuffers
        },
        costEfficiency
      };
    } catch (error) {
      return {
        endpoint: `/api/generate/${assetType}`,
        tier,
        assetType,
        responseTime: -1,
        throughput: 0,
        errorRate: 1,
        costEfficiency: 0
      };
    }
  }

  private calculateCostEfficiency(data: any): number {
    // Simple efficiency: assume quality score based on tier/resolution
    const qualityScore = this.estimateQualityScore(data);
    return data.cost > 0 ? qualityScore / data.cost : 0;
  }

  private estimateQualityScore(data: any): number {
    let score = 50; // Base score
    
    // Resolution scoring
    if (data.quality?.width >= 1024) score += 25;
    else if (data.quality?.width >= 512) score += 15;
    
    // Steps scoring
    if (data.quality?.steps >= 50) score += 25;
    else if (data.quality?.steps >= 25) score += 15;
    else if (data.quality?.steps >= 4) score += 10;
    
    return Math.min(score, 100);
  }

  private async performLoadTests(): Promise<LoadTestResult[]> {
    console.log('\n🚀 Performing load tests...');
    
    const scenarios = [
      { name: 'Light Load', concurrentUsers: 2, requestsPerUser: 3 },
      { name: 'Medium Load', concurrentUsers: 5, requestsPerUser: 2 },
      { name: 'Heavy Load', concurrentUsers: 10, requestsPerUser: 1 }
    ];

    const results: LoadTestResult[] = [];
    const testUserId = `load-test-${Date.now()}`;
    await this.createTestUser(testUserId);

    for (const scenario of scenarios) {
      console.log(`  📈 Testing: ${scenario.name}`);
      
      const result = await this.runLoadTestScenario(
        scenario.name,
        scenario.concurrentUsers,
        scenario.requestsPerUser,
        testUserId
      );
      
      results.push(result);
      console.log(`    ✅ Completed: ${result.requestsPerSecond.toFixed(1)} req/s, ${result.errorRate}% errors`);
      
      // Wait between scenarios
      await this.delay(2000);
    }

    return results;
  }

  private async runLoadTestScenario(
    scenarioName: string,
    concurrentUsers: number,
    requestsPerUser: number,
    userId: string
  ): Promise<LoadTestResult> {
    const startTime = performance.now();
    const promises: Promise<{ success: boolean; responseTime: number }>[] = [];

    // Create concurrent requests
    for (let user = 0; user < concurrentUsers; user++) {
      for (let req = 0; req < requestsPerUser; req++) {
        promises.push(this.makeLoadTestRequest(userId));
      }
    }

    // Wait for all requests to complete
    const results = await Promise.allSettled(promises);
    const endTime = performance.now();
    const totalTime = endTime - startTime;

    // Analyze results
    const totalRequests = results.length;
    const successfulResults = results
      .filter(r => r.status === 'fulfilled' && r.value.success)
      .map(r => (r as PromiseFulfilledResult<{ success: boolean; responseTime: number }>).value);
    
    const failedRequests = totalRequests - successfulResults.length;
    const responseTimes = successfulResults.map(r => r.responseTime);
    
    const averageResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      : 0;
    
    const maxResponseTime = responseTimes.length > 0 ? Math.max(...responseTimes) : 0;
    const minResponseTime = responseTimes.length > 0 ? Math.min(...responseTimes) : 0;
    const requestsPerSecond = (totalRequests / totalTime) * 1000;
    const errorRate = (failedRequests / totalRequests) * 100;

    return {
      scenario: scenarioName,
      concurrentUsers,
      totalRequests,
      successfulRequests: successfulResults.length,
      failedRequests,
      averageResponseTime: Math.round(averageResponseTime),
      maxResponseTime: Math.round(maxResponseTime),
      minResponseTime: Math.round(minResponseTime),
      requestsPerSecond: Math.round(requestsPerSecond * 10) / 10,
      errorRate: Math.round(errorRate * 10) / 10
    };
  }

  private async makeLoadTestRequest(userId: string): Promise<{ success: boolean; responseTime: number }> {
    const startTime = performance.now();
    
    try {
      await axios.post(`${this.baseUrl}/api/generate/logo`, {
        prompt: 'load test logo',
        tier: 'free',
        userId
      });
      
      const endTime = performance.now();
      return {
        success: true,
        responseTime: endTime - startTime
      };
    } catch (error) {
      const endTime = performance.now();
      return {
        success: false,
        responseTime: endTime - startTime
      };
    }
  }

  private async checkSystemHealth(): Promise<any> {
    try {
      const startTime = performance.now();
      const response = await axios.get(`${this.baseUrl}/health`);
      const endTime = performance.now();

      return {
        status: 'healthy',
        responseTime: Math.round(endTime - startTime),
        services: response.data.services || {},
        timestamp: response.data.timestamp
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: 'Could not reach health endpoint',
        responseTime: -1
      };
    }
  }

  private generatePerformanceRecommendations(
    singleRequest: PerformanceMetrics[],
    loadTest: LoadTestResult[]
  ): string[] {
    const recommendations: string[] = [];

    // Analyze response times
    const avgResponseTime = singleRequest.reduce((sum, m) => sum + m.responseTime, 0) / singleRequest.length;
    
    if (avgResponseTime > 500) {
      recommendations.push('🐌 Response times are high - consider caching and optimization');
    } else if (avgResponseTime < 100) {
      recommendations.push('⚡ Excellent response times - system well optimized');
    }

    // Analyze load test results
    const heavyLoadResult = loadTest.find(t => t.scenario === 'Heavy Load');
    if (heavyLoadResult) {
      if (heavyLoadResult.errorRate > 10) {
        recommendations.push('🚨 High error rate under load - implement better error handling');
      }
      
      if (heavyLoadResult.requestsPerSecond < 1) {
        recommendations.push('📈 Low throughput under load - consider horizontal scaling');
      } else if (heavyLoadResult.requestsPerSecond > 5) {
        recommendations.push('🚀 Good throughput under load - system handles concurrency well');
      }
    }

    // Analyze cost efficiency
    const avgCostEfficiency = singleRequest
      .filter(m => m.costEfficiency > 0)
      .reduce((sum, m) => sum + m.costEfficiency, 0) / 
      singleRequest.filter(m => m.costEfficiency > 0).length;

    if (avgCostEfficiency < 50) {
      recommendations.push('💰 Poor cost efficiency - review pricing and quality balance');
    } else if (avgCostEfficiency > 80) {
      recommendations.push('💎 Excellent cost efficiency - good value proposition');
    }

    // Memory usage recommendations
    const memoryIntensiveRequests = singleRequest.filter(m => 
      m.memoryUsage && m.memoryUsage.heapUsed > 10 * 1024 * 1024 // 10MB
    );
    
    if (memoryIntensiveRequests.length > 0) {
      recommendations.push('🧠 High memory usage detected - consider memory optimization');
    }

    return recommendations;
  }

  private async createTestUser(userId: string): Promise<void> {
    try {
      await axios.post(`${this.baseUrl}/api/users`, {
        walletAddress: `perf-test-${userId}`
      });
    } catch (error) {
      // User might already exist, ignore error
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async generateReport(data: any): Promise<string> {
    let report = `# ⚡ Performance Analysis Report\n\n`;
    report += `**Generated**: ${new Date().toLocaleString()}\n\n`;

    // Single Request Performance
    report += `## 📊 Single Request Performance\n\n`;
    report += `| Endpoint | Tier | Response Time | Throughput | Cost Efficiency |\n`;
    report += `|----------|------|---------------|------------|------------------|\n`;
    
    data.singleRequest.forEach((metric: PerformanceMetrics) => {
      report += `| ${metric.endpoint} | ${metric.tier} | ${metric.responseTime}ms | ${metric.throughput.toFixed(1)} req/s | ${metric.costEfficiency.toFixed(1)} |\n`;
    });

    // Load Test Results
    report += `\n## 🚀 Load Test Results\n\n`;
    report += `| Scenario | Users | Total Req | Success Rate | Avg Response | Throughput |\n`;
    report += `|----------|-------|-----------|--------------|--------------|------------|\n`;
    
    data.loadTest.forEach((result: LoadTestResult) => {
      const successRate = ((result.successfulRequests / result.totalRequests) * 100).toFixed(1);
      report += `| ${result.scenario} | ${result.concurrentUsers} | ${result.totalRequests} | ${successRate}% | ${result.averageResponseTime}ms | ${result.requestsPerSecond} req/s |\n`;
    });

    // System Health
    report += `\n## 🏥 System Health\n\n`;
    report += `- **Status**: ${data.systemHealth.status}\n`;
    report += `- **Health Check Response**: ${data.systemHealth.responseTime}ms\n`;
    
    if (data.systemHealth.services) {
      report += `- **Services**: ${Object.entries(data.systemHealth.services).map(([k, v]) => `${k}: ${v}`).join(', ')}\n`;
    }

    // Recommendations
    report += `\n## 🎯 Performance Recommendations\n\n`;
    data.recommendations.forEach((rec: string) => {
      report += `- ${rec}\n`;
    });

    return report;
  }
}