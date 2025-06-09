# DeGenie 🧞‍♂️

**From idea to viral token in 60 seconds - AI does everything else**

DeGenie is an AI-powered cryptocurrency token creation platform that revolutionizes how meme coins and community tokens are launched. Unlike existing platforms, DeGenie eliminates the need for creators to handle any design, marketing, or technical aspects by automatically generating all necessary assets using artificial intelligence.

## 🚀 Features

### AI Asset Generation Suite
- **Smart Logo Creator**: Unique, meme-worthy logos generated from your token concept
- **Viral Meme Library**: 100+ customizable memes tailored to your token's personality
- **Animated Content**: GIFs and animations for social media engagement
- **Complete Brand Kit**: Banners, headers, and assets for all platforms

### Marketing Automation
- **30-Day Content Calendar**: Pre-generated social media content
- **Viral Tweet Templates**: 500+ proven viral formats adapted to your token
- **Community Bots**: Intelligent Discord/Telegram engagement automation
- **Influencer Matching**: AI-powered connections with relevant micro-influencers

### Multi-Chain Launch Platform
- **60-Second Deployment**: Fastest token creation in the market
- **Multi-Chain Support**: Solana, Base, Arbitrum, and more
- **Enhanced Bonding Curves**: Anti-dump protection built-in
- **Auto-Liquidity**: Seamless liquidity provision and management

### Analytics & Intelligence
- **Virality Predictor**: AI-powered success probability analysis
- **Real-Time Sentiment**: Community health monitoring across platforms
- **Whale Alerts**: Large transaction notifications and analysis
- **Trend Surfing**: Optimal launch timing recommendations

## 🏗️ Architecture

DeGenie is built as a comprehensive multi-service platform:

```
DeGenie Platform
├── Frontend (Next.js 14 + TypeScript)
├── Backend API (Node.js + Express)
├── AI Services (OpenAI/Anthropic Integration)
├── Smart Contracts (Solana + EVM)
└── Analytics Engine (Real-time Monitoring)
```

## 🛠️ Development Setup

### Prerequisites

- Node.js 18+ and npm
- Git for version control
- API keys for AI services (see Environment Variables)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/degenie.git
   cd degenie
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment setup**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys and configuration
   ```

4. **Start development**
   ```bash
   npm run dev
   ```

### Development Commands

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server

# Code Quality
npm run lint         # Run ESLint
npm run lint:fix     # Fix auto-fixable lint issues
npm run typecheck    # Run TypeScript type checking
npm run format       # Format code with Prettier

# Testing
npm run test         # Run all tests
npm run test:watch   # Run tests in watch mode
npm run test:e2e     # Run end-to-end tests
```

## 📁 Project Structure

```
degenie/
├── src/
│   ├── frontend/         # Next.js frontend application
│   │   ├── components/   # React components
│   │   ├── pages/        # Next.js pages
│   │   ├── hooks/        # Custom React hooks
│   │   └── utils/        # Frontend utilities
│   ├── backend/          # Node.js API server
│   │   ├── routes/       # Express routes
│   │   ├── services/     # Business logic
│   │   └── models/       # Data models
│   ├── ai-services/      # AI integration services
│   │   ├── image-gen/    # Image generation (logos, memes)
│   │   ├── text-gen/     # Content generation
│   │   └── prediction/   # Virality prediction
│   └── contracts/        # Blockchain smart contracts
│       ├── solana/       # Solana programs
│       └── evm/          # EVM-compatible contracts
├── tests/                # Test files
├── docs/                 # Documentation
└── .taskmaster/          # Task management system
```

## 🔧 Environment Variables

Create a `.env` file with the following variables:

```bash
# AI Services
ANTHROPIC_API_KEY=your_anthropic_key_here
OPENAI_API_KEY=your_openai_key_here
PERPLEXITY_API_KEY=your_perplexity_key_here

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/degenie
REDIS_URL=redis://localhost:6379

# Blockchain
SOLANA_RPC_URL=https://api.devnet.solana.com
PRIVATE_KEY=your_wallet_private_key

# Application
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
```

## 🎯 Development Workflow

This project uses **TaskMaster AI** for systematic development. The workflow includes:

1. **Task Management**: Automated task tracking and priority management
2. **AI-Assisted Development**: Intelligent code generation and review
3. **Quality Assurance**: Automated testing and code quality checks
4. **Continuous Integration**: GitHub integration with CodeRabbit review

### TaskMaster Commands

```bash
# Get next task to work on
npm run task:next

# Update task status
npm run task:update <task-id> <status>

# View project complexity
npm run task:complexity
```

## 🚦 Getting Started

### For Developers

1. Follow the installation steps above
2. Check the current development status in `.taskmaster/`
3. Use `npm run task:next` to get your next assignment
4. Follow the development workflow in `CLAUDE.md`

### For Contributors

1. Read the contribution guidelines in `docs/guides/`
2. Check open issues and current development tasks
3. Follow the code style and testing requirements
4. Submit PRs following the established workflow

## 🎨 Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, React
- **Backend**: Node.js, Express, PostgreSQL, Redis
- **Blockchain**: Solana Web3.js, Anchor, Ethers.js
- **AI Services**: OpenAI GPT-4, Anthropic Claude, Stability AI
- **Infrastructure**: AWS/GCP, Docker, GitHub Actions
- **Development**: TaskMaster AI, CodeRabbit, ESLint, Jest

## 📈 Roadmap

### Phase 1: Foundation (Current)
- [x] Project setup and architecture
- [ ] Basic token creation on Solana
- [ ] Simple AI logo generation
- [ ] Frontend foundation

### Phase 2: Core Features
- [ ] Advanced AI asset generation
- [ ] Social media automation
- [ ] Community bot deployment
- [ ] Analytics dashboard

### Phase 3: Multi-Chain & Scale
- [ ] EVM chain support
- [ ] Mobile application
- [ ] Advanced trading features
- [ ] Marketplace implementation

### Phase 4: Ecosystem
- [ ] DAO governance
- [ ] Creator rewards program
- [ ] White-label solutions
- [ ] Enterprise features

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](docs/guides/CONTRIBUTING.md) for details.

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🌟 Why DeGenie?

Traditional token creation requires:
- Design skills for logos and marketing materials
- Marketing expertise for viral content
- Technical knowledge for blockchain deployment
- Community management experience

**DeGenie automates everything**, letting creators focus on their ideas while AI handles the execution.

## 📞 Support

- Documentation: Check the `docs/` directory
- Issues: GitHub Issues
- Development: See `CLAUDE.md` for development guidance

---

**Built with ❤️ and AI** | Making crypto creation accessible to everyone