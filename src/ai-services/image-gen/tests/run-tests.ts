#!/usr/bin/env tsx

/**
 * DeGenie Logo Generation Test Runner
 * Executable script to run comprehensive tests
 */

import { TestRunner, testScenarios } from './test-scenarios';

async function main() {
  const args = process.argv.slice(2);
  const mode = args[0] || 'all';
  const baseUrl = args[1] || 'http://localhost:3001';

  console.log('🧞‍♂️ DeGenie Logo Generation Test Suite');
  console.log('='.repeat(50));
  console.log(`Test mode: ${mode}`);
  console.log(`API URL: ${baseUrl}`);
  console.log(`Total scenarios: ${testScenarios.length}\n`);

  try {
    const runner = new TestRunner(baseUrl);

    switch (mode) {
      case 'all':
        await runner.runAllTests();
        break;
        
      case 'basic':
        await runCategoryTests(runner, 'basic');
        break;
        
      case 'validation':
        await runCategoryTests(runner, 'validation');
        break;
        
      case 'edge-case':
        await runCategoryTests(runner, 'edge-case');
        break;
        
      case 'stress':
        await runCategoryTests(runner, 'stress');
        break;
        
      case 'quick':
        await runQuickTests(runner);
        break;
        
      case 'connection':
        await testConnection(baseUrl);
        break;
        
      case 'single': {
        const scenarioName = args[2];
        if (!scenarioName) {
          console.error('❌ Please specify scenario name for single test');
          listScenarios();
          process.exit(1);
        }
        await runSingleScenario(runner, scenarioName);
        break;
      }
        
      case 'list':
        listScenarios();
        break;
        
      case 'help':
        showHelp();
        break;
        
      default:
        console.error(`❌ Unknown mode: ${mode}`);
        showHelp();
        process.exit(1);
    }

  } catch (error) {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  }
}

async function runCategoryTests(runner: TestRunner, category: string) {
  console.log(`📋 Running ${category.toUpperCase()} tests only...\n`);
  
  const categoryScenarios = testScenarios.filter(s => s.category === category);
  
  if (categoryScenarios.length === 0) {
    console.log(`No scenarios found for category: ${category}`);
    return;
  }

  // Test connection first
  const isConnected = await runner['client'].testConnection();
  if (!isConnected) {
    console.error('❌ Cannot connect to API server');
    return;
  }

  console.log('✅ Connected to API server\n');

  for (const scenario of categoryScenarios) {
    await runner['runSingleTest'](scenario);
  }

  runner['generateReport']();
}

async function runQuickTests(runner: TestRunner) {
  console.log('⚡ Running quick test suite (basic scenarios only)...\n');
  
  const quickScenarios = testScenarios.filter(s => 
    s.category === 'basic' || s.category === 'validation'
  ).slice(0, 5);

  // Test connection first
  const isConnected = await runner['client'].testConnection();
  if (!isConnected) {
    console.error('❌ Cannot connect to API server');
    return;
  }

  console.log('✅ Connected to API server\n');

  for (const scenario of quickScenarios) {
    await runner['runSingleTest'](scenario);
  }

  const results = runner.getResults();
  const passed = results.filter(r => r.success).length;
  const total = results.length;

  console.log(`\n⚡ Quick test completed: ${passed}/${total} passed\n`);
}

async function runSingleScenario(runner: TestRunner, scenarioName: string) {
  const scenario = testScenarios.find(s => 
    s.name.toLowerCase().includes(scenarioName.toLowerCase())
  );

  if (!scenario) {
    console.error(`❌ Scenario not found: ${scenarioName}`);
    console.log('\nAvailable scenarios:');
    listScenarios();
    return;
  }

  console.log(`🎯 Running single scenario: ${scenario.name}\n`);

  // Test connection first
  const isConnected = await runner['client'].testConnection();
  if (!isConnected) {
    console.error('❌ Cannot connect to API server');
    return;
  }

  await runner['runSingleTest'](scenario);
  
  const results = runner.getResults();
  if (results.length > 0) {
    const result = results[0];
    console.log(`\nResult: ${result.success ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Duration: ${result.duration}ms`);
    if (result.error) {
      console.log(`Error: ${result.error}`);
    }
  }
}

async function testConnection(baseUrl: string) {
  console.log('🔌 Testing API connection...\n');
  
  const client = createApiClient({ baseUrl });
  
  try {
    // Test health endpoint
    const health = await client.healthCheck();
    console.log('✅ Health check passed');
    console.log(`   Status: ${health.status}`);
    console.log(`   Service: ${health.service}`);
    console.log(`   Version: ${health.version}\n`);

    // Test service info
    const info = await client.getServiceInfo();
    console.log('✅ Service info retrieved');
    console.log(`   Service: ${info.service}`);
    console.log(`   Providers: ${info.providers.join(', ')}`);
    console.log(`   Styles: ${info.styles.join(', ')}\n`);

    // Test theme suggestions
    const suggestions = await client.suggestThemes('TestToken');
    console.log('✅ Theme suggestions working');
    console.log(`   Suggestions: ${suggestions.suggestions.join(', ')}\n`);

    console.log('🎉 All connection tests passed!');

  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    console.log('\nTroubleshooting:');
    console.log('1. Make sure the API server is running: npm run dev:server');
    console.log('2. Check the server URL is correct');
    console.log('3. Verify no firewall is blocking the connection');
  }
}

function listScenarios() {
  console.log('\n📋 Available test scenarios:\n');
  
  const categories = ['validation', 'basic', 'edge-case', 'stress'];
  
  for (const category of categories) {
    const categoryScenarios = testScenarios.filter(s => s.category === category);
    console.log(`${category.toUpperCase()}:`);
    categoryScenarios.forEach(scenario => {
      console.log(`   • ${scenario.name} - ${scenario.description}`);
    });
    console.log('');
  }
}

function showHelp() {
  console.log(`
🧞‍♂️ DeGenie Logo Generation Test Suite

Usage: npm run test:scenarios [mode] [url] [scenario]

Modes:
  all           Run all test scenarios (default)
  basic         Run basic functionality tests only
  validation    Run input validation tests only
  edge-case     Run edge case tests only
  stress        Run stress/performance tests only
  quick         Run a quick subset of tests
  connection    Test API connection only
  single        Run a single scenario by name
  list          List all available scenarios
  help          Show this help message

Examples:
  npm run test:scenarios
  npm run test:scenarios basic
  npm run test:scenarios connection http://localhost:3001
  npm run test:scenarios single "crypto token"
  npm run test:scenarios list

The API server must be running for tests to work:
  npm run dev:server
`);
}

// Run if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}