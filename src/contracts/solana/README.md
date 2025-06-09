# DeGenie Solana Smart Contracts

This directory contains the Solana smart contracts for the DeGenie platform.

## Token Creator Contract

The main contract for creating AI-powered tokens on the Solana blockchain.

### Features

- **SPL Token Standard Compliance**: Full compatibility with SPL Token standard
- **Metadata Integration**: Automatic metadata creation with AI-generated assets
- **Bonding Curve Support**: Built-in minting functionality for price curves
- **Anchor Framework**: Modern Solana development with Anchor
- **Anti-Dump Protection**: Safeguards against large-scale token sell-offs
- **Maximum Supply Enforcement**: Enforces a hard cap on total token supply

### Development Setup

1. **Install Rust and Solana CLI**:
   ```bash
   # Install Rust
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   
   # Install Solana CLI
   sh -c "$(curl -sSfL https://release.solana.com/v1.18.0/install)"
   
   # Install Anchor
   npm install -g @coral-xyz/anchor-cli
   ```

2. **Configure Solana**:
   ```bash
   solana config set --url devnet
   solana-keygen new --outfile ~/.config/solana/id.json
   solana airdrop 2
   ```

3. **Build Contract**:
   ```bash
   cd src/contracts/solana
   anchor build
   ```

4. **Deploy to Devnet**:
   ```bash
   anchor deploy
   ```

5. **Run Tests**:
   ```bash
   anchor test
   ```

### Contract Structure

- `lib.rs`: Main contract logic with token creation and minting
- `Cargo.toml`: Rust dependencies and configuration
- `Anchor.toml`: Anchor framework configuration

### Key Functions

- `create_token()`: Creates a new SPL token with metadata
- `mint_tokens()`: Mints additional tokens for bonding curve mechanics

### Integration with DeGenie

This contract integrates with:
- AI Services (for metadata generation)
- Frontend (for user interaction)
- Backend API (for automation)

### Security Features

- Authority-based access control
- SPL Token standard compliance
- Metadata validation
- Error handling with custom error codes