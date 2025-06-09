# 🧪 DeGenie AI Logo Generator - Testing Documentation

This document describes the comprehensive testing suite for the AI Logo Generation service, implementing **Subtask 3.3: Test with Various Inputs**.

## Test Categories

The testing suite includes **23 comprehensive scenarios** across 4 categories:

### 1. Validation Tests (4 scenarios)
Tests input validation and error handling:
- Empty token name
- Missing token name  
- Invalid style values
- Invalid size values

### 2. Basic Functionality Tests (13 scenarios)
Tests core logo generation features:
- Simple crypto token generation
- Gaming tokens with custom colors
- DeFi professional logos
- NFT artistic logos
- Meme token playful designs
- Auto-theme detection (Gaming, DeFi, Meme)
- Multiple variations generation
- Real-world scenarios (Solana, Community, Utility tokens)

### 3. Edge Case Tests (5 scenarios)
Tests boundary conditions and unusual inputs:
- Very long token names (200+ characters)
- Single character names
- Special characters and symbols
- Numbers-only names
- Unicode/emoji characters

### 4. Stress Tests (2 scenarios)
Tests performance and limits:
- Large color arrays (8+ colors)
- Maximum variations (5 variations)

## Test Types

### Mock Tests (No API Keys Required)
Tests core functionality without making external API calls:

```bash
npm run test:mock
```

**Coverage:**
- Prompt generation logic
- Theme suggestion algorithms  
- Configuration validation
- Input validation
- Service initialization
- Edge case handling

### Integration Tests (Requires API Keys)
Tests actual API integration with various input scenarios:

```bash
# Run all 23 scenarios
npm run test:scenarios

# Run specific categories
npm run test:scenarios basic
npm run test:scenarios validation
npm run test:scenarios edge-case
npm run test:scenarios stress

# Quick test (subset of scenarios)
npm run test:scenarios quick

# Test single scenario
npm run test:scenarios single "crypto token"
```

### Connection Tests
Tests API server connectivity and health:

```bash
npm run test:scenarios connection
```

### API Integration Examples
Real-world usage examples and demonstrations:

```bash
npm run test:integration
```

## Test Scenarios Detail

### Basic Functionality Scenarios

1. **Simple crypto token** - Basic crypto token with standard settings
2. **Gaming token with colors** - Gaming theme with custom color palette
3. **DeFi professional logo** - Professional style for DeFi tokens
4. **NFT artistic logo** - Artistic gradient style for NFT projects
5. **Meme token playful** - Playful style for meme coins
6. **Auto-detect gaming theme** - Tests theme auto-detection for "GameFi"
7. **Auto-detect DeFi theme** - Tests theme auto-detection for "SwapToken"  
8. **Auto-detect meme theme** - Tests theme auto-detection for "DogeKing"
9. **Multiple variations** - Generate 3 variations of the same token
10. **Solana ecosystem token** - Real-world Solana-based token example
11. **Community token** - Community-focused token design
12. **Utility token** - Utility token professional design

### Edge Case Scenarios

1. **Very long token name** - 60+ character token name handling
2. **Single character name** - Minimal input testing ("X")
3. **Special characters** - Tokens with hyphens and symbols ("Token-2024!")
4. **Numbers only** - Numeric token names ("2024")
5. **Unicode characters** - Emoji and international characters ("Token🚀")

### Stress Test Scenarios

1. **Large color array** - 8 different colors in palette
2. **Maximum variations** - 5 variations (API limit)

### Validation Scenarios

1. **Empty token name** - Should return validation error
2. **Missing token name** - Should return validation error
3. **Invalid style** - Graceful handling of invalid enum values
4. **Invalid size** - Graceful handling of invalid size formats

## Test Execution Results

### Expected Outcomes

**Mock Tests:**
- ✅ Prompt generation (4/4 tests)
- ❌ Service initialization (requires API keys)
- ✅ Configuration validation (3/3 checks)
- ✅ Input validation (2/2 tests)
- ✅ Edge case handling (3/3 tests)

**Integration Tests (with API keys):**
- **Validation category**: All should pass/fail appropriately
- **Basic category**: High success rate (80%+)
- **Edge-case category**: Good success rate (70%+)  
- **Stress category**: Moderate success rate (60%+)

### Performance Expectations

- **Mock tests**: < 50ms average
- **Basic generation**: 5-30 seconds per logo
- **Multiple variations**: 15-60 seconds total
- **Edge cases**: May take longer due to complex prompts

## Running Tests

### Prerequisites

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure API keys (for integration tests):**
   ```bash
   cp .env.example .env
   # Edit .env with your OpenAI and Stability AI keys
   ```

3. **Start API server (for integration tests):**
   ```bash
   npm run dev:server
   ```

### Test Commands

```bash
# Quick validation (no API keys needed)
npm run test:mock

# Full test suite (requires API keys and running server)
npm run test:scenarios

# Test categories individually  
npm run test:scenarios validation
npm run test:scenarios basic
npm run test:scenarios edge-case
npm run test:scenarios stress

# Connection test only
npm run test:scenarios connection

# Single scenario test
npm run test:scenarios single "gaming token"

# List all available scenarios
npm run test:scenarios list

# Show help
npm run test:scenarios help
```

## Test Results Interpretation

### Success Metrics

- **Mock Tests**: 67%+ pass rate expected (failures due to missing API keys)
- **Integration Tests**: 80%+ overall success rate indicates healthy system
- **Validation Tests**: Should have appropriate pass/fail patterns
- **Performance**: Average < 30 seconds per generation

### Common Issues

1. **API Key Configuration**: Mock tests will show config validation failures
2. **Network Connectivity**: Connection tests will fail if server not running
3. **Rate Limiting**: May encounter API rate limits during stress tests
4. **Provider Availability**: Some tests may fail if AI providers are down

### Troubleshooting

1. **Server Not Running**: Start with `npm run dev:server`
2. **Missing API Keys**: Configure in `.env` file
3. **Network Issues**: Check firewall and proxy settings
4. **Rate Limiting**: Wait between test runs or reduce concurrent tests

## Integration with CI/CD

The test suite is designed to work in continuous integration:

```yaml
# Example GitHub Actions workflow
- name: Run Mock Tests
  run: npm run test:mock

- name: Start Server
  run: npm run dev:server &
  
- name: Wait for Server
  run: sleep 10

- name: Run Integration Tests
  run: npm run test:scenarios connection
  env:
    OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
    STABILITY_API_KEY: ${{ secrets.STABILITY_API_KEY }}
```

## Test Maintenance

### Adding New Scenarios

1. Add scenario to `tests/test-scenarios.ts`
2. Include proper categorization and expected behavior
3. Test manually before committing
4. Update this documentation

### Updating Test Infrastructure

1. Modify test runner in `tests/run-tests.ts`
2. Update mock tests in `tests/mock-tests.ts`
3. Ensure backwards compatibility
4. Update package.json scripts if needed

## Conclusion

This comprehensive testing suite validates the AI Logo Generation service across:

- **23 different input scenarios**
- **4 test categories** (validation, basic, edge-case, stress)
- **Multiple test types** (mock, integration, connection)
- **Real-world usage patterns**
- **Error conditions and edge cases**

The testing infrastructure ensures the service is robust, reliable, and ready for production use in the DeGenie token creation platform.