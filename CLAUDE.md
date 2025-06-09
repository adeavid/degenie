# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**DeGenie** is an AI-powered cryptocurrency token creation platform that revolutionizes meme coin and community token launches. The platform automates design, marketing, and technical aspects using AI, allowing users to go "from idea to viral token in 60 seconds."

### Key Features
- AI-generated logos, memes, GIFs, and marketing content
- Multi-chain token deployment (Solana primary, EVM-compatible)
- Automated community building and social media management
- Virality prediction algorithms and analytics dashboard
- Gamification and creator rewards system

## Development Commands

### Core Development
```bash
# Project initialization (when implemented)
npm install                    # Install dependencies
npm run dev                   # Start development server
npm run build                 # Build for production
npm run start                 # Start production server

# Code Quality
npm run lint                  # Run ESLint
npm run lint:fix             # Fix auto-fixable lint issues
npm run typecheck            # Run TypeScript type checking
npm run format               # Format code with Prettier

# Testing
npm run test                 # Run all tests
npm run test:watch           # Run tests in watch mode
npm run test:coverage        # Run tests with coverage
npm run test:e2e             # Run end-to-end tests
```

### TaskMaster AI Integration
```bash
# Task Management (using MCP tools)
mcp__taskmaster-ai__next_task                    # Get next task to work on
mcp__taskmaster-ai__get_tasks                    # List all tasks
mcp__taskmaster-ai__set_task_status             # Update task/subtask status
mcp__taskmaster-ai__update_subtask              # Update subtask with progress
mcp__taskmaster-ai__add_subtask                 # Add new subtask
mcp__taskmaster-ai__expand_task                 # Expand task into subtasks
mcp__taskmaster-ai__complexity_report           # View complexity analysis
```

## Architecture Overview

### Project Structure
```
degenie/
├── .taskmaster/                 # TaskMaster AI configuration
│   ├── tasks/                  # Individual task files
│   ├── config.json            # TaskMaster configuration
│   └── docs/prd.txt           # Product Requirements Document
├── scripts/                   # Build and deployment scripts
├── src/                      # Source code (to be created)
│   ├── frontend/             # Next.js frontend application
│   ├── backend/              # Node.js/Express API server
│   ├── contracts/            # Blockchain smart contracts
│   └── ai-services/          # AI integration services
├── docs/                     # Project documentation
├── tests/                    # Test files
└── .env.example             # Environment variables template
```

### Tech Stack
- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, Web3 wallets
- **Backend**: Node.js/Express, PostgreSQL, Redis, WebSocket
- **Blockchain**: Solana (primary), Base, Arbitrum smart contracts
- **AI Services**: OpenAI/Anthropic APIs, Stable Diffusion, Custom ML models
- **Infrastructure**: AWS/GCP, IPFS, CDN, Docker

### Key Dependencies (when implemented)
- **Web3**: @solana/web3.js, ethers.js, wagmi
- **AI**: openai, anthropic, replicate APIs
- **Database**: pg (PostgreSQL), redis
- **Testing**: jest, cypress, playwright
- **Blockchain**: anchor (Solana), hardhat (EVM)

## TaskMaster Subtask Workflow

### Automated Development Process
1. **Get Next Subtask**: Use `mcp__taskmaster-ai__next_task` to get the next available subtask
2. **Set Status to In-Progress**: `mcp__taskmaster-ai__set_task_status --id {task_id} --status in-progress`
3. **Implement Feature**: Develop the functionality following the subtask specifications
4. **Update Subtask Progress**: `mcp__taskmaster-ai__update_subtask --id {task_id.subtask_id} --prompt "Implementation details and progress"`
5. **Run Quality Checks**: Execute `npm run lint`, `npm run typecheck`, and `npm run test`
6. **Commit Changes**: Use descriptive commit messages with Claude Code signature
7. **Create Pull Request**: `gh pr create --title "feat: {feature_name}" --body "{description}"`
8. **Monitor CI/CD**: Check `gh pr status` for build and test results
9. **Review CodeRabbit**: Use `gh pr view --comments` to see automated code review
10. **Complete Subtask**: `mcp__taskmaster-ai__set_task_status --id {task_id.subtask_id} --status done`

### Commit Message Format
```
{type}: {description}

{optional body}

```

### GitHub CLI Commands
```bash
# Pull Request Management
gh pr create --title "feat: implement feature" --body "Description"
gh pr status                    # Check CI status
gh pr view --comments          # View CodeRabbit comments
gh pr merge                    # Merge approved PR

# Issue Management
gh issue list                  # List open issues
gh issue create               # Create new issue
gh issue close               # Close resolved issue

# Automated Workflow
./scripts/automated_pr_workflow.sh    # Complete automated PR workflow
./scripts/poll_ci.sh <PR_NUMBER>      # Monitor CI status
```

### Automated PR Workflow
```bash
# Complete automation: PR creation → CI monitoring → CodeRabbit review → Merge
./scripts/automated_pr_workflow.sh

# The script will:
# 1. Create PR with proper title and description
# 2. Monitor CI status until completion
# 3. Check for CodeRabbit feedback
# 4. Offer to auto-fix CodeRabbit suggestions
# 5. Auto-merge if all checks pass
# 6. Clean up branches and return to main
```

### Definition of Done
For each subtask completion:
1. **Code Implementation**: Feature fully implemented and tested
2. **Quality Checks**: `npm run lint` and `npm run typecheck` passing
3. **Commit Changes**: Descriptive commit with Claude Code signature
4. **Create PR**: `./scripts/automated_pr_workflow.sh` or manual PR creation
5. **Monitor CI**: `./scripts/poll_ci.sh <PR_NUMBER>` until all checks pass
6. **CodeRabbit Review**: Address any automated feedback provided
7. **Merge**: Auto-merge when all checks pass and feedback addressed
8. **Update TaskMaster**: Mark subtask as completed
9. **Continue**: Move to next task in dependency chain

## Development Guidelines

### Code Standards
- Use TypeScript for all new code
- Follow ESLint configuration for code style
- Write comprehensive tests for all features
- Document APIs using JSDoc comments
- Follow security best practices for crypto/Web3 code

### Task Management
- Always work on one subtask at a time
- Update TaskMaster with progress regularly
- Break down complex tasks into smaller subtasks
- Use complexity analysis to prioritize work
- Follow dependency chains for optimal workflow

### Testing Strategy
- Unit tests for business logic
- Integration tests for API endpoints
- E2E tests for critical user flows
- Smart contract tests for blockchain code
- AI service mocking for consistent testing

### Security Considerations
- Never commit API keys or secrets
- Use environment variables for sensitive data
- Audit smart contracts before deployment
- Implement rate limiting for AI services
- Follow Web3 security best practices

## Project Status

### Current Phase: Foundation/Planning
- **25 tasks defined** with complexity analysis completed
- **PRD documented** with comprehensive technical requirements
- **TaskMaster AI configured** for systematic development
- **Development workflow established** via automation tools
- **No code implementation yet** - ready to begin development

### Next Steps
1. Initialize Node.js project with package.json
2. Set up TypeScript and development tooling
3. Begin Task 1: Setup Project Repository
4. Follow TaskMaster workflow for systematic implementation
5. Use complexity scores to prioritize development efforts

### Task Complexity Overview
- **High Complexity (8-9)**: Multi-chain support, DAO governance, advanced security
- **Medium Complexity (5-7)**: AI integration, Web3 wallets, analytics dashboard  
- **Low Complexity (3-4)**: Basic setup, simple UI components, documentation

### Performance Optimization Roadmap
Based on competitive analysis (pump.fun and similar platforms), the following optimizations will be implemented in Phase 3 (Tasks 20-26):

#### **Phase 3: Performance & Scalability Optimizations**
- **Task 20+**: Infrastructure improvements for production-scale traffic
- **Priority**: Implement after MVP validation and user acquisition
- **Rationale**: Avoid premature optimization, focus on product-market fit first

#### **Planned Optimization Tasks**:
1. **Redis Caching Layer** (Task 20)
   - Cache frequent logo generation requests
   - Store user session data and preferences
   - Cache blockchain data and token prices
   - **Impact**: 60-80% reduction in response times for repeat requests

2. **Structured Logging System** (Task 21)
   - Implement Winston/Pino for production logging
   - Structured JSON logs for better monitoring
   - Log levels and rotation policies
   - **Impact**: Better debugging and performance monitoring

3. **Queue System Implementation** (Task 22)
   - Bull/BullMQ for heavy AI generation tasks
   - Priority queues for different user tiers
   - Job retry and failure handling
   - **Impact**: Handle 100+ concurrent logo generations

4. **Environment Schema Validation** (Task 23)
   - Zod for runtime config validation
   - Type-safe environment variables
   - Startup validation checks
   - **Impact**: Reduced production config errors

5. **Performance Monitoring** (Task 24)
   - Prometheus metrics collection
   - Custom business metrics (generations/hour)
   - Error rate and latency tracking
   - **Impact**: Proactive performance issue detection

6. **Observability Stack** (Task 25)
   - OpenTelemetry distributed tracing
   - Performance dashboards
   - Real-time alerting
   - **Impact**: Complete system visibility

#### **Competitive Analysis Notes**:
- **Pump.fun tech stack**: Solana + Anchor + Redis + Real-time subscriptions
- **Revenue**: $32.8M in 9 months (validates market before optimizing)
- **Approach**: They optimized AFTER achieving product-market fit
- **Our strategy**: Follow similar pattern - function first, optimize later

## Environment Variables

Required environment variables (see .env.example):
```bash
# AI Services
ANTHROPIC_API_KEY=                    # Required for TaskMaster and AI features
OPENAI_API_KEY=                      # Optional, for OpenAI models
PERPLEXITY_API_KEY=                  # Optional, for research features

# Database
DATABASE_URL=                        # PostgreSQL connection string
REDIS_URL=                          # Redis connection string

# Blockchain
SOLANA_RPC_URL=                     # Solana RPC endpoint
PRIVATE_KEY=                        # Deployment wallet private key

# External Services
NEXTAUTH_SECRET=                    # NextAuth.js secret
NEXTAUTH_URL=                       # Application URL
```

## Integration Points

### TaskMaster AI
- Fully configured with optimized models
- Task complexity analysis completed
- 25 tasks with subtasks ready for development
- Research capabilities enabled for informed development

### CodeRabbit Integration
- Automatic code review on PR creation
- Comments and suggestions via GitHub CLI
- Integration with CI/CD pipeline
- Quality gate enforcement

### Development Tools
- Roo Code workflow automation
- Windsurf development rules
- Cursor IDE optimization
- Claude Code MCP integration

## Support and Resources

- **TaskMaster Documentation**: Use MCP tools for task management
- **Project Requirements**: See `.taskmaster/docs/prd.txt`
- **Complexity Analysis**: Check `.taskmaster/reports/task-complexity-report.json`
- **GitHub Repository**: All code and issues tracked via GitHub CLI
- **Code Review**: Automated via CodeRabbit integration