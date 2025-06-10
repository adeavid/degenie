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

export class CostAnalyzer {
  private baseOperationalCosts = {
    database: 15, // Monthly
    storage: 25,  // Monthly
    bandwidth: 35, // Monthly
    hosting: 50   // Monthly
  };

  private aiServiceRates = {
    replicate: {
      'stable-diffusion': 0.00115, // Per prediction
      'flux-dev': 0.003,
      'flux-pro': 0.055
    },
    together: {
      'flux-schnell': 0.0003, // Per image
      'stable-diffusion-xl': 0.0012
    },
    development: {
      'mock-api': 0 // Free in development
    }
  };

  async analyzeCosts(): Promise<{
    operational: OperationalCosts;
    efficiency: CostEfficiencyAnalysis;
    recommendations: string[];
    projections: any;
  }> {
    console.log('💰 Starting Cost Analysis...\n');

    // Analyze operational costs
    const operational = this.calculateOperationalCosts();
    
    // Calculate efficiency metrics
    const efficiency = this.calculateCostEfficiency(operational);
    
    // Generate projections
    const projections = this.generateCostProjections(operational);
    
    // Create recommendations
    const recommendations = this.generateCostRecommendations(operational, efficiency);

    return {
      operational,
      efficiency,
      recommendations,
      projections
    };
  }

  private calculateOperationalCosts(): OperationalCosts {
    console.log('📊 Calculating operational costs...');

    // Estimate daily usage by tier
    const dailyUsage = {
      free: { logos: 100, memes: 150, gifs: 20 },
      starter: { logos: 50, memes: 75, gifs: 30 },
      viral: { logos: 25, memes: 40, gifs: 15 }
    };

    const aiServices: CostMetrics[] = [];

    // Calculate AI service costs
    Object.entries(dailyUsage).forEach(([tier, usage]) => {
      // Logo generation (Replicate - Stable Diffusion)
      aiServices.push({
        api: 'Replicate',
        callsPerDay: usage.logos,
        costPerCall: this.aiServiceRates.replicate['stable-diffusion'],
        dailyCost: usage.logos * this.aiServiceRates.replicate['stable-diffusion'],
        monthlyProjection: usage.logos * this.aiServiceRates.replicate['stable-diffusion'] * 30,
        tier,
        model: 'stable-diffusion'
      });

      // Meme generation (Together.ai - Flux Schnell)
      aiServices.push({
        api: 'Together.ai',
        callsPerDay: usage.memes,
        costPerCall: this.aiServiceRates.together['flux-schnell'],
        dailyCost: usage.memes * this.aiServiceRates.together['flux-schnell'],
        monthlyProjection: usage.memes * this.aiServiceRates.together['flux-schnell'] * 30,
        tier,
        model: 'flux-schnell'
      });

      // GIF generation (Replicate - Flux Dev for higher tiers)
      const gifCost = tier === 'viral' 
        ? this.aiServiceRates.replicate['flux-dev']
        : this.aiServiceRates.together['flux-schnell'];
      
      aiServices.push({
        api: tier === 'viral' ? 'Replicate' : 'Together.ai',
        callsPerDay: usage.gifs,
        costPerCall: gifCost,
        dailyCost: usage.gifs * gifCost,
        monthlyProjection: usage.gifs * gifCost * 30,
        tier,
        model: tier === 'viral' ? 'flux-dev' : 'flux-schnell'
      });
    });

    const totalAIDailyCost = aiServices.reduce((sum, service) => sum + service.dailyCost, 0);
    const totalAIMonthlyCost = aiServices.reduce((sum, service) => sum + service.monthlyProjection, 0);

    // Calculate development complexity costs (one-time + maintenance)
    const developmentCosts = {
      complexity: 2000, // Initial development investment
      maintenance: 500,  // Monthly maintenance
      scaling: 1500     // Scaling infrastructure costs
    };

    const totalDaily = totalAIDailyCost + (this.baseOperationalCosts.database / 30) + 
                      (this.baseOperationalCosts.storage / 30) + 
                      (this.baseOperationalCosts.bandwidth / 30) + 
                      (this.baseOperationalCosts.hosting / 30);

    const totalMonthly = totalAIMonthlyCost + Object.values(this.baseOperationalCosts).reduce((a, b) => a + b, 0) + 
                        developmentCosts.maintenance;

    return {
      aiServices,
      infrastructure: this.baseOperationalCosts,
      development: developmentCosts,
      total: {
        daily: Math.round(totalDaily * 100) / 100,
        monthly: Math.round(totalMonthly * 100) / 100,
        yearly: Math.round(totalMonthly * 12 * 100) / 100
      }
    };
  }

  private calculateCostEfficiency(operational: OperationalCosts): CostEfficiencyAnalysis {
    console.log('⚡ Calculating cost efficiency...');

    // Credit pricing model (for reference)
    // const creditPricing = {
    //   free: 0,      // Free tier gets credits
    //   starter: 0.10, // $0.10 per credit
    //   viral: 0.25   // $0.25 per credit
    // };

    // Average revenue per credit (weighted by usage)
    const avgRevenuePerCredit = 0.15; // Estimated weighted average

    // Calculate cost per credit based on operational costs
    const totalDailyCreditsUsed = 1000; // Estimated daily credit consumption
    const costPerCredit = operational.total.daily / totalDailyCreditsUsed;

    const profitMargin = ((avgRevenuePerCredit - costPerCredit) / avgRevenuePerCredit) * 100;
    const breakEvenPoint = Math.ceil(operational.total.monthly / avgRevenuePerCredit);

    const scalingRecommendations = [];
    
    if (profitMargin < 30) {
      scalingRecommendations.push('Increase credit prices or reduce operational costs');
    }
    
    if (costPerCredit > 0.05) {
      scalingRecommendations.push('Optimize AI service usage to reduce per-credit costs');
    }

    if (operational.total.monthly > 2000) {
      scalingRecommendations.push('Consider volume discounts with AI providers');
    }

    return {
      revenuePerCredit: Math.round(avgRevenuePerCredit * 1000) / 1000,
      costPerCredit: Math.round(costPerCredit * 1000) / 1000,
      profitMargin: Math.round(profitMargin * 10) / 10,
      breakEvenPoint,
      scalingRecommendations
    };
  }

  private generateCostProjections(operational: OperationalCosts) {
    console.log('📈 Generating cost projections...');

    const growthScenarios = {
      conservative: { userGrowth: 1.5, usageGrowth: 1.3 },
      realistic: { userGrowth: 2.5, usageGrowth: 2.0 },
      aggressive: { userGrowth: 5.0, usageGrowth: 3.5 }
    };

    const projections: any = {};

    Object.entries(growthScenarios).forEach(([scenario, growth]) => {
      const months = [3, 6, 12];
      projections[scenario] = {};

      months.forEach(month => {
        const userMultiplier = Math.pow(growth.userGrowth, month / 12);
        const usageMultiplier = Math.pow(growth.usageGrowth, month / 12);
        
        const projectedMonthlyCost = operational?.total?.monthly ? operational.total.monthly * userMultiplier * usageMultiplier : 0;
        
        projections[scenario][`month${month}`] = {
          users: Math.round(1000 * userMultiplier), // Starting with 1000 users
          monthlyCost: Math.round(projectedMonthlyCost),
          dailyCost: Math.round(projectedMonthlyCost / 30 * 100) / 100,
          aiCostPercentage: 70 // AI costs typically 70% of total
        };
      });
    });

    return projections;
  }

  private generateCostRecommendations(
    operational: OperationalCosts, 
    efficiency: CostEfficiencyAnalysis
  ): string[] {
    const recommendations: string[] = [];

    // AI cost optimization
    const totalAICost = operational.aiServices.reduce((sum, service) => sum + service.monthlyProjection, 0);
    const aiCostPercentage = (totalAICost / operational.total.monthly) * 100;

    if (aiCostPercentage > 70) {
      recommendations.push(`🤖 AI costs are ${aiCostPercentage.toFixed(1)}% of total - consider model optimization`);
    }

    // High-cost services
    const expensiveServices = operational.aiServices
      .filter(service => service.monthlyProjection > 200)
      .sort((a, b) => b.monthlyProjection - a.monthlyProjection);

    if (expensiveServices.length > 0) {
      const highestCost = expensiveServices[0];
      recommendations.push(`💸 Highest cost: ${highestCost?.api || 'Unknown'} ${highestCost?.model || 'Unknown'} ($${highestCost?.monthlyProjection?.toFixed(2) || '0'}/month)`);
    }

    // Profit margin recommendations
    if (efficiency.profitMargin < 20) {
      recommendations.push('📉 Low profit margin - review pricing strategy');
    } else if (efficiency.profitMargin > 60) {
      recommendations.push('💰 High profit margin - consider competitive pricing');
    }

    // Scaling recommendations
    if (operational.total.monthly > 1000) {
      recommendations.push('📈 Consider enterprise AI service plans for better rates');
      recommendations.push('🔄 Implement intelligent caching to reduce API calls');
    }

    // Infrastructure optimization
    if (operational.infrastructure.storage > 50) {
      recommendations.push('💾 High storage costs - implement IPFS pinning strategy');
    }

    // Development efficiency
    if (operational.development.maintenance > 600) {
      recommendations.push('🛠️ High maintenance costs - invest in automation');
    }

    // Tier-specific optimizations
    const freeServices = operational.aiServices.filter(s => s.tier === 'free');
    const freeCost = freeServices.reduce((sum, s) => sum + s.monthlyProjection, 0);
    
    if (freeCost > operational.total.monthly * 0.3) {
      recommendations.push('🆓 Free tier costs too high - implement stricter limits');
    }

    return recommendations;
  }

  async generateReport(data: any): Promise<string> {
    let report = `# 💰 Cost Analysis Report\n\n`;
    report += `**Generated**: ${new Date().toLocaleString()}\n\n`;

    // Executive Summary
    report += `## 📊 Executive Summary\n\n`;
    report += `| Metric | Value |\n`;
    report += `|--------|-------|\n`;
    report += `| Daily Operational Cost | $${data.operational.total.daily} |\n`;
    report += `| Monthly Operational Cost | $${data.operational.total.monthly} |\n`;
    report += `| Annual Projection | $${data.operational.total.yearly} |\n`;
    report += `| Profit Margin | ${data.efficiency.profitMargin}% |\n`;
    report += `| Cost per Credit | $${data.efficiency.costPerCredit} |\n`;
    report += `| Break-even Point | ${data.efficiency.breakEvenPoint} credits/month |\n\n`;

    // AI Services Breakdown
    report += `## 🤖 AI Services Cost Breakdown\n\n`;
    report += `| Service | Model | Tier | Daily Calls | Cost/Call | Monthly Cost |\n`;
    report += `|---------|-------|------|-------------|-----------|-------------|\n`;
    
    data.operational.aiServices.forEach((service: CostMetrics) => {
      report += `| ${service.api} | ${service.model} | ${service.tier} | ${service.callsPerDay} | $${service.costPerCall.toFixed(4)} | $${service.monthlyProjection.toFixed(2)} |\n`;
    });

    // Infrastructure Costs
    report += `\n## 🏗️ Infrastructure Costs\n\n`;
    report += `| Component | Monthly Cost |\n`;
    report += `|-----------|-------------|\n`;
    Object.entries(data.operational.infrastructure).forEach(([key, value]) => {
      report += `| ${key.charAt(0).toUpperCase() + key.slice(1)} | $${value} |\n`;
    });

    // Growth Projections
    report += `\n## 📈 Growth Projections\n\n`;
    Object.entries(data.projections).forEach(([scenario, projData]: [string, any]) => {
      report += `### ${scenario.charAt(0).toUpperCase() + scenario.slice(1)} Growth\n\n`;
      report += `| Timeline | Users | Monthly Cost | Daily Cost |\n`;
      report += `|----------|-------|--------------|------------|\n`;
      
      Object.entries(projData).forEach(([period, data]: [string, any]) => {
        const months = period.replace('month', '');
        report += `| ${months} months | ${data.users.toLocaleString()} | $${data.monthlyCost.toLocaleString()} | $${data.dailyCost} |\n`;
      });
      report += `\n`;
    });

    // Cost Optimization Recommendations
    report += `## 🎯 Cost Optimization Recommendations\n\n`;
    data.recommendations.forEach((rec: string) => {
      report += `- ${rec}\n`;
    });

    // Efficiency Analysis
    report += `\n## ⚡ Efficiency Analysis\n\n`;
    report += `**Revenue Model Performance:**\n`;
    report += `- Revenue per credit: $${data.efficiency.revenuePerCredit}\n`;
    report += `- Cost per credit: $${data.efficiency.costPerCredit}\n`;
    report += `- Profit margin: ${data.efficiency.profitMargin}%\n\n`;

    if (data.efficiency.scalingRecommendations.length > 0) {
      report += `**Scaling Recommendations:**\n`;
      data.efficiency.scalingRecommendations.forEach((rec: string) => {
        report += `- ${rec}\n`;
      });
    }

    return report;
  }
}