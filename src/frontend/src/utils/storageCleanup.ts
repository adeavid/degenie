// Utility to clean up localStorage when it gets full
export function cleanupLocalStorage() {
  try {
    // List of keys that might be taking up space
    const keysToClean = ['userTokens', 'walletConnectionState', 'generatedAssets'];
    
    keysToClean.forEach(key => {
      const data = localStorage.getItem(key);
      if (data) {
        try {
          const parsed = JSON.parse(data);
          if (Array.isArray(parsed) && parsed.length > 5) {
            // Keep only the 5 most recent items
            const cleaned = parsed.slice(-5);
            localStorage.setItem(key, JSON.stringify(cleaned));
            console.log(`Cleaned ${key}: kept ${cleaned.length} items`);
          }
        } catch (e) {
          // If it's not JSON, remove it if it's too large
          if (data.length > 50000) {
            localStorage.removeItem(key);
            console.log(`Removed large non-JSON item: ${key}`);
          }
        }
      }
    });
    
    console.log('localStorage cleanup completed');
  } catch (error) {
    console.error('Error during localStorage cleanup:', error);
  }
}

// Function to check localStorage usage
export function checkStorageUsage() {
  let total = 0;
  for (const key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      total += localStorage[key].length + key.length;
    }
  }
  console.log(`localStorage usage: ${total} characters`);
  return total;
}