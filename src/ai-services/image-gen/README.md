# 🧞‍♂️ DeGenie AI Logo Generator

AI-powered logo generation service for the DeGenie token creation platform. Creates professional logos for crypto tokens using OpenAI DALL-E and Stability AI.

## Features

- **Multiple AI Providers**: OpenAI DALL-E 3 + Stability AI fallback
- **Smart Theme Detection**: Auto-suggests themes based on token names
- **Style Customization**: 8+ logo styles (Modern, Minimalist, Futuristic, etc.)
- **Color Control**: Custom color palettes for brand consistency
- **Multiple Formats**: Support for various image sizes and formats
- **REST API**: Complete API server with web interface
- **TypeScript Client**: Easy-to-use API client library
- **Rate Limiting**: Built-in rate limiting and error handling
- **Generation History**: Track and review previous generations

## Quick Start

### 1. Installation

<<<<<<< HEAD
```bash
cd src/ai-services/image-gen
npm install
```
=======
```textbash
cd src/ai-services/image-gen
npm install
```text
>>>>>>> origin/main

### 2. Configuration

Copy the environment template and add your API keys:

<<<<<<< HEAD
```bash
cp .env.example .env
```

Edit `.env` with your API keys:

```env
OPENAI_API_KEY=your_openai_api_key_here
STABILITY_API_KEY=your_stability_api_key_here
```

### 3. Start the Server

```bash
npm run dev:server
```
=======
```textbash
cp .env.example .env
```text

Edit `.env` with your API keys:

```textenv
OPENAI_API_KEY=your_openai_api_key_here
STABILITY_API_KEY=your_stability_api_key_here
```text

### 3. Start the Server

```textbash
npm run dev:server
```text
>>>>>>> origin/main

The API server will start on `http://localhost:3001`

### 4. Test the Service

<<<<<<< HEAD
```bash
=======
```textbash
>>>>>>> origin/main
# Run mock tests (no API keys required)
npm run test:mock

# Run comprehensive integration tests
npm run test:scenarios

# Test specific scenarios
npm run test:scenarios basic
npm run test:scenarios connection
<<<<<<< HEAD
```
=======
```text
>>>>>>> origin/main

## Usage

### Web Interface

Visit `http://localhost:3001` for the interactive web interface.

### API Client

<<<<<<< HEAD
```typescript
=======
```texttypescript
>>>>>>> origin/main
import { createApiClient } from './src/client/api-client';

const client = createApiClient();

// Generate a simple logo
const logo = await client.generateSimpleLogo('CryptoToken', 'crypto', 'modern');

// Generate with auto-theme detection
const autoLogo = await client.generateWithAutoTheme('GameFi');

// Generate multiple variations
const variations = await client.generateVariations('DeFiToken', 3);
<<<<<<< HEAD
```

### REST API

```bash
=======
```text

### REST API

```textbash
>>>>>>> origin/main
# Generate a logo
curl -X POST http://localhost:3001/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "tokenName": "CryptoGenie",
    "theme": "crypto",
    "style": "modern",
    "colors": ["#667eea", "#764ba2"],
    "size": "1024x1024"
  }'

# Get theme suggestions
curl -X POST http://localhost:3001/api/suggest-themes \
  -H "Content-Type: application/json" \
  -d '{"tokenName": "GameToken"}'
<<<<<<< HEAD
```
=======
```text
>>>>>>> origin/main

## API Endpoints

- `POST /api/generate` - Generate logo(s)
- `POST /api/suggest-themes` - Get theme suggestions
- `GET /api/info` - Service information
- `GET /api/history` - Generation history
- `GET /api/stats` - Usage statistics
- `GET /health` - Health check

## Testing

### Mock Tests (No API Keys)
Tests core functionality without making API calls:

<<<<<<< HEAD
```bash
npm run test:mock
```
=======
```textbash
npm run test:mock
```text
>>>>>>> origin/main

### Integration Tests
Comprehensive testing with various input scenarios:

<<<<<<< HEAD
```bash
=======
```textbash
>>>>>>> origin/main
# Run all tests
npm run test:scenarios

# Run specific test categories
npm run test:scenarios basic
npm run test:scenarios validation
npm run test:scenarios edge-case
npm run test:scenarios stress

# Test single scenario
npm run test:scenarios single "crypto token"

# Test connection only
npm run test:scenarios connection
<<<<<<< HEAD
```
=======
```text
>>>>>>> origin/main

### API Integration Examples
Run real API integration examples:

<<<<<<< HEAD
```bash
npm run test:integration
```
=======
```textbash
npm run test:integration
```text
>>>>>>> origin/main

## Available Themes

- `crypto` - Cryptocurrency and blockchain
- `gaming` - Gaming and GameFi
- `defi` - Decentralized Finance
- `nft` - Non-Fungible Tokens
- `meme` - Meme coins and community tokens
- `utility` - Utility and infrastructure tokens
- `community` - Community-driven projects
- `innovation` - Innovation and technology
- `finance` - Traditional finance
- `art` - Art and creative tokens
- `tech` - Technology and development

## Available Styles

- `modern` - Clean, contemporary design
- `minimalist` - Simple, minimal approach
- `gradient` - Gradient-based designs
- `crypto` - Cryptocurrency-themed
- `professional` - Business and corporate
- `playful` - Fun and engaging
- `retro` - Vintage and retro styling
- `futuristic` - Sci-fi and future tech

## Project Structure

```text
src/ai-services/image-gen/
├── src/
│   ├── types/           # TypeScript type definitions
│   ├── config/          # Configuration and validation
│   ├── services/        # Core business logic
│   │   ├── logo-generator.ts    # Main orchestration service
│   │   └── prompt-generator.ts  # AI prompt generation
│   ├── providers/       # AI provider integrations
│   │   ├── openai-client.ts     # OpenAI DALL-E integration
│   │   └── stability-client.ts  # Stability AI integration
│   ├── api/            # REST API server
│   │   └── server.ts   # Express.js server
│   └── client/         # API client library
│       └── api-client.ts
├── tests/              # Test suites
│   ├── test-scenarios.ts      # Comprehensive test scenarios
│   ├── run-tests.ts          # Test runner
│   └── mock-tests.ts         # Mock tests (no API keys)
├── examples/           # Usage examples
│   └── api-integration.ts    # API integration examples
├── public/             # Web interface
│   └── index.html      # Interactive web UI
└── package.json        # Dependencies and scripts
```text

## Error Handling

The service includes comprehensive error handling:

- **Provider Fallback**: Automatically switches between OpenAI and Stability AI
- **Rate Limiting**: Respects API rate limits with exponential backoff
- **Validation**: Input validation with helpful error messages
- **Retry Logic**: Automatic retries for transient failures
- **Graceful Degradation**: Continues operating even if one provider fails

## Development

### Build

<<<<<<< HEAD
```bash
npm run build
```

### Linting

```bash
npm run lint
npm run lint:fix
```

### Development Server

```bash
npm run dev:server
```
=======
```textbash
npm run build
```text

### Linting

```textbash
npm run lint
npm run lint:fix
```text

### Development Server

```textbash
npm run dev:server
```text
>>>>>>> origin/main

## Environment Variables

See `.env.example` for all available configuration options.

## Contributing

1. Follow the existing code style and patterns
2. Add tests for new functionality
3. Update documentation as needed
4. Ensure all tests pass before submitting

## License

MIT License - see LICENSE file for details