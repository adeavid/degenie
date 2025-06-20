// Type definitions for wallet objects

interface Window {
  ethereum?: {
    isMetaMask?: boolean;
    selectedAddress?: string;
    on: (event: string, handler: (...args: any[]) => void) => void;
    removeListener: (event: string, handler: (...args: any[]) => void) => void;
    removeAllListeners?: (event?: string) => void;
    request: (args: { method: string; params?: any[] }) => Promise<any>;
  };

  solana?: {
    isPhantom?: boolean;
    isConnected?: boolean;
    publicKey?: {
      toString: () => string;
    };
    on: (event: string, handler: (...args: any[]) => void) => void;
    removeAllListeners?: (event?: string) => void;
    connect: () => Promise<{ publicKey: any }>;
    disconnect: () => Promise<void>;
  };
}