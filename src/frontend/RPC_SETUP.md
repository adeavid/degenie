# Solana RPC Configuration Guide

## What is RPC?

RPC (Remote Procedure Call) is the connection point your app uses to communicate with the blockchain. To read wallet balances and interact with Solana, you need an RPC endpoint.

## Why "RPC Limited"?

When you see "RPC Limited" instead of your SOL balance, it means:
- Your wallet IS connected successfully ✅
- But the app can't fetch your balance because public RPC endpoints block browser requests
- This is a security measure to prevent abuse of free public endpoints

## Solutions

### For Development/Testing

You have several options for free RPC endpoints:

1. **QuickNode** (Recommended)
   - Go to https://www.quicknode.com/
   - Sign up for free account
   - Create a new endpoint → Select Solana → Mainnet
   - Copy your HTTP endpoint URL
   - Update `.env.local`:
     ```
     NEXT_PUBLIC_SOLANA_RPC_URL=https://your-endpoint.quiknode.pro/YOUR_KEY/
     ```

2. **Alchemy**
   - Go to https://www.alchemy.com/
   - Create free account
   - Create new app → Select Solana
   - Copy your RPC URL
   - Update `.env.local`

3. **Helius**
   - Go to https://helius.xyz/
   - Sign up and get your API key
   - Update `.env.local`:
     ```
     NEXT_PUBLIC_SOLANA_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
     ```

### For Production

For production apps, you should use a paid RPC service for better reliability:
- QuickNode Pro
- Alchemy Growth plan
- Helius paid tiers
- Your own dedicated Solana node

## After Updating RPC

1. Update your `.env.local` file with the new RPC URL
2. Restart the development server:
   ```bash
   # Stop the server (Ctrl+C)
   # Start again
   npm run dev
   ```
3. Try connecting your wallet again

## Testing Your RPC

Once configured, you should see:
- Your actual SOL balance instead of "RPC Limited"
- Faster balance updates
- No CORS errors in the browser console

## Note on Devnet

The app currently uses devnet RPC by default (`https://api.devnet.solana.com`), which sometimes works but is not reliable. For testing with real wallets on mainnet, you need a mainnet RPC endpoint.