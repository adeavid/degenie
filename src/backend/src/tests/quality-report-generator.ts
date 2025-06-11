import fs from 'fs/promises';
import path from 'path';

// HTML escaping function to prevent XSS
function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

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

export class QualityReportGenerator {
  static async generateHTMLReport(data: QualityReportData): Promise<string> {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DeGenie AI Asset Quality Report</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #0a0a0a;
            color: #ffffff;
            margin: 0;
            padding: 20px;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        h1 {
            background: linear-gradient(90deg, #FF6B6B 0%, #4ECDC4 50%, #45B7D1 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            text-align: center;
            font-size: 2.5em;
            margin-bottom: 30px;
        }
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 40px;
        }
        .stat-card {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            padding: 20px;
            text-align: center;
        }
        .stat-value {
            font-size: 2em;
            font-weight: bold;
            margin: 10px 0;
        }
        .stat-label {
            color: #888;
            font-size: 0.9em;
        }
        .results-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        .results-table th,
        .results-table td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        .results-table th {
            background: rgba(255, 255, 255, 0.05);
            font-weight: 600;
        }
        .score {
            font-weight: bold;
            padding: 4px 12px;
            border-radius: 20px;
            display: inline-block;
        }
        .score-high { background: #4ECDC4; color: #000; }
        .score-medium { background: #FFD93D; color: #000; }
        .score-low { background: #FF6B6B; color: #fff; }
        .tier-badge {
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.85em;
            display: inline-block;
        }
        .tier-free { background: #666; }
        .tier-starter { background: #4ECDC4; color: #000; }
        .tier-viral { background: #FFD93D; color: #000; }
        .recommendations {
            background: rgba(78, 205, 196, 0.1);
            border: 1px solid rgba(78, 205, 196, 0.3);
            border-radius: 12px;
            padding: 20px;
            margin: 20px 0;
        }
        .recommendations h3 {
            margin-top: 0;
            color: #4ECDC4;
        }
        .recommendations ul {
            margin: 0;
            padding-left: 20px;
        }
        .recommendations li {
            margin: 8px 0;
        }
        .chart-container {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 12px;
            padding: 20px;
            margin: 20px 0;
        }
        .progress-bar {
            width: 100%;
            height: 20px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 10px;
            overflow: hidden;
        }
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #4ECDC4 0%, #45B7D1 100%);
            transition: width 0.3s ease;
        }
        .timestamp {
            text-align: center;
            color: #666;
            margin-top: 40px;
            font-size: 0.9em;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 DeGenie AI Asset Quality Report</h1>
        
        <div class="summary-grid">
            <div class="stat-card">
                <div class="stat-label">Total Tests</div>
                <div class="stat-value">${data.summary.totalTests}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Average Score</div>
                <div class="stat-value">${data.summary.avgScore}/100</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Avg Generation Time</div>
                <div class="stat-value">${data.summary.avgTime}ms</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Total Credits Used</div>
                <div class="stat-value">${data.summary.totalCost.toFixed(1)}</div>
            </div>
        </div>

        <h2>Test Results</h2>
        <table class="results-table">
            <thead>
                <tr>
                    <th>Asset Type</th>
                    <th>Tier</th>
                    <th>Prompt</th>
                    <th>Quality</th>
                    <th>Time</th>
                    <th>Cost</th>
                    <th>Score</th>
                </tr>
            </thead>
            <tbody>
                ${data.results.map(result => `
                    <tr>
                        <td>${escapeHtml(result.type.toUpperCase())}</td>
                        <td><span class="tier-badge tier-${escapeHtml(result.tier)}">${escapeHtml(result.tier)}</span></td>
                        <td>${escapeHtml(result.prompt)}</td>
                        <td>${result.metrics.resolution}, ${result.metrics.steps} steps</td>
                        <td>${result.metrics.time}ms</td>
                        <td>${result.metrics.cost} credits</td>
                        <td><span class="score ${getScoreClass(result.score)}">${result.score}/100</span></td>
                    </tr>
                `).join('')}
            </tbody>
        </table>

        ${data.summary.recommendations.length > 0 ? `
        <div class="recommendations">
            <h3>📋 Recommendations</h3>
            <ul>
                ${data.summary.recommendations.map(rec => `<li>${escapeHtml(rec)}</li>`).join('')}
            </ul>
        </div>
        ` : ''}

        <div class="chart-container">
            <h3>Quality Distribution by Tier</h3>
            ${generateTierChart(data.results)}
        </div>

        <div class="timestamp">
            Generated on ${new Date(data.timestamp).toLocaleString()}
        </div>
    </div>
</body>
</html>
    `;

    return html;
  }

  static async saveHTMLReport(data: QualityReportData, filename?: string): Promise<string> {
    try {
      const reportsDir = path.join(process.cwd(), 'test-reports');
      await fs.mkdir(reportsDir, { recursive: true });
      
      const reportFilename = filename || `quality-report-${Date.now()}.html`;
      const filepath = path.join(reportsDir, reportFilename);
      
      const html = await QualityReportGenerator.generateHTMLReport(data);
      await fs.writeFile(filepath, html);
      
      console.log(`\n📄 HTML Report saved to: ${filepath}`);
      return filepath;
    } catch (error) {
      console.error('Failed to save HTML report:', error);
      throw new Error(`Failed to save report: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

function getScoreClass(score: number): string {
  if (score >= 80) return 'score-high';
  if (score >= 60) return 'score-medium';
  return 'score-low';
}

function generateTierChart(results: any[]): string {
  const tierScores: Record<string, number[]> = {
    free: [],
    starter: [],
    viral: []
  };
  
  results.forEach(r => {
    if (tierScores[r.tier]) {
      tierScores[r.tier]!.push(r.score);
    }
  });
  
  let chartHTML = '';
  Object.entries(tierScores).forEach(([tier, scores]) => {
    if (scores.length > 0) {
      const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
      chartHTML += `
        <div style="margin: 15px 0;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
            <span>${tier.charAt(0).toUpperCase() + tier.slice(1)} Tier</span>
            <span>${Math.round(avgScore)}/100</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${avgScore}%"></div>
          </div>
        </div>
      `;
    }
  });
  
  return chartHTML;
}