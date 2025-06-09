/**
 * DeGenie Logo Generation API Integration Examples
 * Shows how to use the API client for various scenarios
 */

<<<<<<< HEAD
import dotenv from 'dotenv';
import { LogoGenerationApiClient, createApiClient } from '../src/client/api-client';
import { LogoStyle, ImageSize } from '../src/types';

// Load environment variables
dotenv.config();

=======
import { LogoGenerationApiClient, createApiClient } from '../src/client/api-client';
import { LogoStyle, ImageSize } from '../src/types';

>>>>>>> origin/main
async function apiIntegrationExamples() {
  console.log('🧞‍♂️ DeGenie Logo Generation API Integration Examples\n');

  // Create API client
  const client = createApiClient({
<<<<<<< HEAD
    baseUrl: process.env.DEGENIE_API_URL || 'http://localhost:3001',
    timeout: parseInt(process.env.DEGENIE_API_TIMEOUT || '120000'), // 2 minutes for AI generation
=======
    baseUrl: 'http://localhost:3001',
    timeout: 120000, // 2 minutes for AI generation
>>>>>>> origin/main
  });

  try {
    // Test connection
    console.log('🔌 Testing API connection...');
    const isConnected = await client.testConnection();
    if (!isConnected) {
      console.error('❌ Failed to connect to API. Make sure the server is running on port 3001');
      return;
    }
    console.log('✅ API connection successful\n');

    // Get service info
    console.log('📋 Getting service information...');
    const serviceInfo = await client.getServiceInfo();
    console.log('Service:', serviceInfo.service);
    console.log('Available providers:', serviceInfo.providers);
    console.log('Available styles:', serviceInfo.styles);
    console.log('Available sizes:', serviceInfo.sizes);
    console.log('\n---\n');

    // Example 1: Simple logo generation
    console.log('📝 Example 1: Simple logo generation');
    try {
      const simpleLogo = await client.generateSimpleLogo(
        'CryptoGenie',
        'crypto',
        LogoStyle.MODERN
      );

      if (simpleLogo.success) {
        console.log('✅ Simple logo generated successfully');
        console.log(`   URL: ${simpleLogo.logoUrl?.substring(0, 80)}...`);
        console.log(`   Provider: ${simpleLogo.metadata.provider}`);
        console.log(`   Generation time: ${simpleLogo.generationTime}ms`);
      } else {
        console.log('❌ Simple logo generation failed:', simpleLogo.error);
      }
    } catch (error) {
      console.log('❌ Simple logo generation error:', error.message);
    }

    console.log('\n---\n');

    // Example 2: Logo with auto-theme detection
    console.log('📝 Example 2: Logo with auto-theme detection');
    try {
      // First get theme suggestions
      const suggestions = await client.suggestThemes('GameToken');
      console.log('Theme suggestions:', suggestions.suggestions);

      // Generate with auto-detected theme
      const autoThemeLogo = await client.generateWithAutoTheme('GameToken', {
        style: LogoStyle.FUTURISTIC,
        size: ImageSize.LARGE,
      });

      if (autoThemeLogo.success) {
        console.log('✅ Auto-theme logo generated successfully');
        console.log(`   Theme used: ${autoThemeLogo.metadata.theme}`);
        console.log(`   Style: ${autoThemeLogo.metadata.style}`);
      } else {
        console.log('❌ Auto-theme logo generation failed:', autoThemeLogo.error);
      }
    } catch (error) {
      console.log('❌ Auto-theme logo generation error:', error.message);
    }

    console.log('\n---\n');

    // Example 3: Multiple variations
    console.log('📝 Example 3: Generate multiple variations');
    try {
      const variations = await client.generateVariations('ArtToken', 3, {
        theme: 'art',
        style: LogoStyle.GRADIENT,
        colors: ['#FF6B6B', '#4ECDC4', '#45B7D1'],
      });

      console.log(`Generated ${variations.length} variations:`);
      variations.forEach((variation, index) => {
        if (variation.success) {
          console.log(`   Variation ${index + 1}: ✅ Success (${variation.generationTime}ms)`);
        } else {
          console.log(`   Variation ${index + 1}: ❌ Failed - ${variation.error}`);
        }
      });
    } catch (error) {
      console.log('❌ Variations generation error:', error.message);
    }

    console.log('\n---\n');

    // Example 4: Custom generation with full options
    console.log('📝 Example 4: Custom generation with full options');
    try {
      const customLogo = await client.generateLogo({
        tokenName: 'DeFiMaster',
        theme: 'defi',
        style: LogoStyle.PROFESSIONAL,
        colors: ['#2E7D32', '#388E3C', '#43A047'],
        size: ImageSize.XLARGE,
        variations: 2,
      });

      if ('variations' in customLogo) {
        console.log(`✅ Generated ${customLogo.successCount}/${customLogo.count} custom variations`);
        customLogo.variations.forEach((variation, index) => {
          if (variation.success) {
            console.log(`   Variation ${index + 1}: Provider ${variation.metadata.provider}`);
          }
        });
      } else if (customLogo.success) {
        console.log('✅ Custom logo generated successfully');
        console.log(`   Provider: ${customLogo.metadata.provider}`);
      } else {
        console.log('❌ Custom logo generation failed:', customLogo.error);
      }
    } catch (error) {
      console.log('❌ Custom logo generation error:', error.message);
    }

    console.log('\n---\n');

    // Example 5: Get usage statistics
    console.log('📝 Example 5: Usage statistics');
    try {
      const stats = await client.getStats();
      console.log('Total generations:', stats.totalGenerations);
      console.log('Successful generations:', stats.successfulGenerations);
      console.log('Average generation time:', Math.round(stats.averageGenerationTime), 'ms');
      
      if (stats.providers) {
        Object.entries(stats.providers).forEach(([provider, providerStats]) => {
          console.log(`${provider} requests: ${providerStats.requestCount}`);
        });
      }
    } catch (error) {
      console.log('❌ Stats retrieval error:', error.message);
    }

    console.log('\n---\n');

    // Example 6: Get generation history
    console.log('📝 Example 6: Generation history');
    try {
      const history = await client.getHistory(5); // Last 5 generations
      console.log(`Last ${history.history.length} generations:`);
      
      history.history.forEach((generation, index) => {
        const status = generation.success ? '✅' : '❌';
        const time = new Date(generation.metadata.generatedAt).toLocaleTimeString();
        console.log(`   ${index + 1}. ${status} ${generation.metadata.tokenName} (${time})`);
      });
    } catch (error) {
      console.log('❌ History retrieval error:', error.message);
    }

  } catch (error) {
    console.error('❌ API integration examples failed:', error);
  }
}

// Integration test function
async function integrationTest() {
  console.log('\n🧪 Running integration test...\n');

  const client = createApiClient();

  try {
    // Test 1: Health check
    console.log('Test 1: Health check');
    const health = await client.healthCheck();
    console.log(`✅ Status: ${health.status}\n`);

    // Test 2: Service info
    console.log('Test 2: Service info');
    const info = await client.getServiceInfo();
    console.log(`✅ Service: ${info.service} v${info.version}\n`);

    // Test 3: Theme suggestions
    console.log('Test 3: Theme suggestions');
    const suggestions = await client.suggestThemes('TestToken');
    console.log(`✅ Suggestions: ${suggestions.suggestions.join(', ')}\n`);

    // Test 4: Simple generation (if API keys are configured)
    console.log('Test 4: Simple generation');
    try {
      const result = await client.generateSimpleLogo('TestToken', 'crypto');
      if (result.success) {
        console.log(`✅ Generation successful with ${result.metadata.provider}\n`);
      } else {
        console.log(`⚠️ Generation failed: ${result.error}\n`);
      }
    } catch (error) {
      console.log(`⚠️ Generation test skipped: ${error.message}\n`);
    }

    console.log('🎉 Integration test completed successfully!');

  } catch (error) {
    console.error('❌ Integration test failed:', error);
  }
}

// Export functions for use in other modules
export { apiIntegrationExamples, integrationTest };

// Run examples if this file is executed directly
if (require.main === module) {
  const runMode = process.argv[2];
  
  if (runMode === 'test') {
    integrationTest().catch(console.error);
  } else {
    apiIntegrationExamples().catch(console.error);
  }
}