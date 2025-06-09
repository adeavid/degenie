/**
 * DeGenie Logo Generator - Basic Usage Examples
 */

import { LogoGenerator, LogoStyle, ImageSize, AIProvider } from '../src';

/**
 * Demonstrates basic usage scenarios of the DeGenie Logo Generator.
 *
 * Runs a series of asynchronous examples showcasing logo generation with various options, generating multiple logo variations, retrieving theme suggestions, and fetching usage statistics. Logs the outcome and relevant details for each example.
 *
 * @remark Intended for demonstration and testing purposes.
 */
async function examples() {
  console.log('🧞‍♂️ DeGenie Logo Generator Examples\n');

  const generator = new LogoGenerator();

  try {
    // Example 1: Simple logo generation
    console.log('📝 Example 1: Simple logo generation');
    const result1 = await generator.generateLogo({
      tokenName: 'CryptoGenie',
      theme: 'crypto',
      style: LogoStyle.MODERN,
    });

    if (result1.success) {
      console.log('✅ Success!');
      console.log(`   Logo URL: ${result1.logoUrl?.substring(0, 100)}...`);
      console.log(`   Generation time: ${result1.generationTime}ms`);
      console.log(`   Provider: ${result1.metadata.provider}`);
    } else {
      console.log('❌ Failed:', result1.error);
    }

    console.log('\n---\n');

    // Example 2: Logo with specific colors and size
    console.log('📝 Example 2: Logo with custom colors and size');
    const result2 = await generator.generateLogo({
      tokenName: 'GoldenCoin',
      theme: 'finance',
      style: LogoStyle.GRADIENT,
      colors: ['#FFD700', '#FFA500', '#FF8C00'],
      size: ImageSize.LARGE,
    });

    if (result2.success) {
      console.log('✅ Success!');
      console.log(`   Local path: ${result2.localPath}`);
      console.log(`   Prompt used: ${result2.metadata.prompt}`);
    } else {
      console.log('❌ Failed:', result2.error);
    }

    console.log('\n---\n');

    // Example 3: Generate multiple variations
    console.log('📝 Example 3: Generate multiple variations');
    const variations = await generator.generateVariations({
      tokenName: 'GameToken',
      theme: 'gaming',
      style: LogoStyle.FUTURISTIC,
    }, 3);

    console.log(`Generated ${variations.length} variations:`);
    variations.forEach((variation, index) => {
      if (variation.success) {
        console.log(`   Variation ${index + 1}: ✅ Success (${variation.generationTime}ms)`);
      } else {
        console.log(`   Variation ${index + 1}: ❌ Failed - ${variation.error}`);
      }
    });

    console.log('\n---\n');

    // Example 4: Get theme suggestions
    console.log('📝 Example 4: Get theme suggestions');
    const suggestions = generator.suggestThemes('ArtisticNFT');
    console.log('Suggested themes:', suggestions);

    console.log('\n---\n');

    // Example 5: Usage statistics
    console.log('📝 Example 5: Usage statistics');
    const stats = generator.getUsageStats();
    console.log('Usage stats:', JSON.stringify(stats, null, 2));

  } catch (error) {
    console.error('❌ Example execution failed:', error);
  }
}

// Run examples if this file is executed directly
if (require.main === module) {
  examples().catch(console.error);
}

export { examples };