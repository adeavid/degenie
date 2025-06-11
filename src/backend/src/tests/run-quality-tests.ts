import { AssetQualityTester } from './AssetQualityTester';

async function main() {
  console.log('🚀 DeGenie Asset Quality Testing Suite\n');
  console.log('This will test all asset types across all tiers');
  console.log('and generate a comprehensive quality report.\n');
  
  const tester = new AssetQualityTester(process.env['DEGENIE_BASE_URL']);
  const testUserId = `quality-tester-${Date.now()}`;
  
  try {
    // Run the full test suite
    const report = await tester.runFullTestSuite(testUserId);
    
    // Save the report
    await tester.saveReport(report);
    
    // Print summary to console
    console.log('\n' + '='.repeat(50));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(50) + '\n');
    
    console.log(`Total Tests: ${report.totalTests}`);
    console.log(`\nAverage Scores by Type:`);
    Object.entries(report.summary.byType).forEach(([type, data]) => {
      console.log(`  ${type}: ${data.avgScore}/100 (${data.tests} tests)`);
    });
    
    console.log(`\nAverage Scores by Tier:`);
    Object.entries(report.summary.byTier).forEach(([tier, data]) => {
      console.log(`  ${tier}: ${data.avgScore}/100 (${data.tests} tests)`);
    });
    
    console.log(`\nRecommendations:`);
    report.summary.recommendations.forEach(rec => {
      console.log(`  ${rec}`);
    });
    
    console.log('\n✅ Quality testing complete!');
    
  } catch (error: any) {
    console.error('\n❌ Testing failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export { main as runQualityTests };