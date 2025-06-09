#!/bin/bash

# DeGenie Solana Contract Deployment Script
echo "🧞‍♂️ DeGenie Token Creator - Deployment Script"
echo "============================================="

# Check if required tools are installed
if ! command -v solana &> /dev/null; then
    echo "❌ Solana CLI not found. Please install Solana CLI first."
    echo "   Run: sh -c \"\$(curl -sSfL https://release.solana.com/v1.18.0/install)\""
    exit 1
fi

if ! command -v bc &> /dev/null; then
    echo "❌ bc command not found. Please install bc for arithmetic operations."
    echo "   Run: brew install bc (macOS) or apt-get install bc (Ubuntu)"
    exit 1
fi

if ! command -v jq &> /dev/null; then
    echo "❌ jq command not found. Please install jq for JSON processing."
    echo "   Run: brew install jq (macOS) or apt-get install jq (Ubuntu)"
    exit 1
fi

# Check if Anchor is installed
if ! command -v anchor &> /dev/null; then
    echo "❌ Anchor CLI not found. Please install Anchor CLI first."
    echo "   Run: npm install -g @coral-xyz/anchor-cli"
    exit 1
fi

# Set cluster to devnet for testing
echo "🌐 Setting Solana cluster to devnet..."
solana config set --url devnet

# Check wallet exists (support custom wallet path)
WALLET_PATH="${SOLANA_WALLET_PATH:-~/.config/solana/id.json}"
if [ ! -f "$WALLET_PATH" ]; then
    echo "🔑 Creating new Solana keypair at $WALLET_PATH..."
    mkdir -p "$(dirname "$WALLET_PATH")"
    solana-keygen new --outfile "$WALLET_PATH" --no-bip39-passphrase
fi

# Check balance and airdrop if needed
echo "💰 Checking SOL balance..."
BALANCE=$(solana balance | cut -d' ' -f1)
if (( $(echo "$BALANCE < 2" | bc -l) )); then
    echo "💸 Requesting SOL airdrop..."
    solana airdrop 2
    sleep 5
fi

# Build the program
echo "🔨 Building Anchor program..."
DEPLOY_DIR="$(dirname "$0")/.."
if ! cd "$DEPLOY_DIR"; then
    echo "❌ Failed to change to directory: $DEPLOY_DIR"
    exit 1
fi
anchor build

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please check your code."
    exit 1
fi

# Deploy the program
echo "🚀 Deploying to Solana devnet..."
anchor deploy

if [ $? -eq 0 ]; then
    echo "✅ Deployment successful!"
    echo ""
    echo "📋 Deployment Information:"
    echo "   Network: Solana Devnet"
    echo "   Program ID: $(cat target/deploy/degenie_token_creator-keypair.json | jq -r '.pubkey' 2>/dev/null || echo 'Check target/deploy/ directory')"
    echo "   Wallet: $(solana address)"
    echo "   Balance: $(solana balance)"
    echo ""
    echo "🔗 View on Solana Explorer:"
    echo "   https://explorer.solana.com/address/$(cat target/deploy/degenie_token_creator-keypair.json | jq -r '.pubkey' 2>/dev/null)?cluster=devnet"
    echo ""
    echo "🧪 Ready for testing! Run: npm run test:devnet"
else
    echo "❌ Deployment failed. Check logs above."
    exit 1
fi