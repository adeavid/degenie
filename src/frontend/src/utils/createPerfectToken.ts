// Utility to create a perfect token for testing
export function createPerfectToken() {
  const perfectToken = {
    name: 'Perfect Token',
    symbol: 'PERFECT',
    description: 'The most perfect token ever created with DeGenie AI platform. This token demonstrates all features including real Solana deployment, beautiful UI, and trading capabilities.',
    tokenAddress: 'J7KfLJP2LTG3KKr4Qh2V8Kn3xY4zB9mN5wR6pA1sD8fH', // Realistic Solana address
    mintKey: 'J7KfLJP2LTG3KKr4Qh2V8Kn3xY4zB9mN5wR6pA1sD8fH',
    signature: 'tx_' + Date.now().toString(36),
    totalSupply: '1000000000',
    logoUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiByeD0iMzIiIGZpbGw9IiMxMGI5ODEiLz4KPHR4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0id2hpdGUiIGZvbnQtc2l6ZT0iMjQiIGZvbnQtZmFtaWx5PSJBcmlhbCI+UEVSRkVDVDwvdHh0Pgo8L3N2Zz4=',
    website: 'https://perfect-token.com',
    twitter: 'https://twitter.com/perfect_token',
    telegram: 'https://t.me/perfect_token',
    createdAt: Date.now(),
    isDeployed: true,
  };

  try {
    const existingTokens = JSON.parse(localStorage.getItem('userTokens') || '[]');
    
    // Check if perfect token already exists
    const exists = existingTokens.some((token: any) => token.symbol === 'PERFECT');
    if (exists) {
      console.log('Perfect token already exists!');
      return;
    }

    existingTokens.push(perfectToken);
    localStorage.setItem('userTokens', JSON.stringify(existingTokens));
    
    console.log('✨ Perfect token created!', perfectToken);
    console.log('💎 Visit: http://localhost:3003/token/' + perfectToken.tokenAddress);
    
    return perfectToken;
  } catch (error) {
    console.error('Failed to create perfect token:', error);
  }
}

// Auto-create perfect token if none exists
if (typeof window !== 'undefined') {
  const tokens = JSON.parse(localStorage.getItem('userTokens') || '[]');
  if (tokens.length === 0) {
    console.log('🚀 Creating perfect token for demo...');
    setTimeout(() => createPerfectToken(), 1000);
  }
}