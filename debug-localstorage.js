// Debug localStorage tokens
console.log('=== DEBUGGING LOCALSTORAGE ===');

// Check what's in localStorage
const userTokens = localStorage.getItem('userTokens');
console.log('Raw localStorage data:', userTokens);

if (userTokens) {
  try {
    const parsed = JSON.parse(userTokens);
    console.log('Parsed tokens:', parsed);
    console.log('Number of tokens:', parsed.length);
    
    parsed.forEach((token, index) => {
      console.log(`Token ${index + 1}:`, {
        name: token.name,
        symbol: token.symbol,
        tokenAddress: token.tokenAddress,
        hasTokenAddress: !!token.tokenAddress
      });
    });
  } catch (e) {
    console.error('Error parsing localStorage:', e);
  }
} else {
  console.log('No userTokens in localStorage');
}

console.log('=== END DEBUG ===');