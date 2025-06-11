# DeGenie Backend

AI-powered cryptocurrency token creation platform backend.

## Features

- **AI Asset Generation**: Logos, memes, and GIFs using Together.ai and Replicate
- **Smart Credit System**: Earn and spend credits with gamification
- **Tier-based Access**: Free, Starter, and Viral tiers with different features
- **Multi-chain Support**: Solana, Base, Arbitrum integration
- **Real-time Analytics**: Track token performance and virality

## Setup

### Prerequisites

- Node.js 18+
- PostgreSQL
- Redis
- Together.ai API key
- Replicate API token

### Installation

```bash
cd src/backend
npm install
```

### Environment Variables

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Required variables:
- `TOGETHER_API_KEY`: Your Together.ai API key
- `REPLICATE_API_TOKEN`: Your Replicate API token
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `JWT_SECRET`: Secret for JWT tokens

### Database Setup

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# (Optional) Open Prisma Studio
npm run prisma:studio
```

### Running the Server

```bash
# Development mode
npm run dev

# Production mode
npm run build
npm start
```

## API Endpoints

### AI Generation

#### Generate Asset
```http
POST /api/ai/generate
Authorization: Bearer <token>

{
  "prompt": "A rocket going to the moon",
  "assetType": "logo", // logo, meme, gif
  "tokenSymbol": "ROCKET",
  "tokenName": "RocketCoin"
}
```

#### Batch Generation (Starter/Viral only)
```http
POST /api/ai/generate/batch
Authorization: Bearer <token>

{
  "requests": [
    { "prompt": "...", "assetType": "logo" },
    { "prompt": "...", "assetType": "meme" }
  ]
}
```

#### Get History
```http
GET /api/ai/history?limit=20
Authorization: Bearer <token>
```

### Credits System

#### Check Balance
```http
GET /api/ai/credits/balance
Authorization: Bearer <token>
```

#### Earn Credits
```http
POST /api/ai/credits/earn
Authorization: Bearer <token>

{
  "action": "dailyLogin", // dailyLogin, shareOnTwitter, etc
  "metadata": {}
}
```

## Credit System

### Costs
- Basic Logo: 0.5 credits
- Pro Logo: 1.0 credits
- Premium Logo: 1.5 credits
- Meme Generation: 0.1 credits
- GIF Creation: 0.3 credits

### Earning Credits
- Daily Login: 0.1 credits
- Share on Twitter: 0.5 credits
- Token reaches 10k mcap: 2 credits
- Token reaches 100k mcap: 5 credits
- Token reaches 1M mcap: 20 credits
- Referral signup: 1 credit
- Hold DeGenie tokens: 0.01/day per 1000 tokens

## Tier Benefits

### Free Tier
- 3 free credits on signup
- 10 generations per hour
- Basic AI models
- Solana chain only

### Starter Tier ($19/month)
- 10 tokens per month
- 60 generations per hour
- Pro AI models (FLUX.1)
- Multi-chain support
- Batch generation (5 max)

### Viral Tier ($49/month)
- Unlimited tokens
- 300 generations per hour
- Premium AI models
- All features unlocked
- Batch generation (10 max)
- API access

## Development

### Testing
```bash
npm test
npm run test:watch
```

### Code Quality
```bash
npm run lint
npm run typecheck
```

## Architecture

- **Express.js**: REST API framework
- **Prisma**: Database ORM
- **Redis**: Caching and rate limiting
- **Together.ai**: Fast AI generation
- **Replicate**: Premium AI models
- **IPFS**: Decentralized storage