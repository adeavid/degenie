'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';

export function PhantomWalletButton() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const connectPhantom = async () => {
    try {
      setIsConnecting(true);
      
      // Check if Phantom is installed
      if (!window.solana || !window.solana.isPhantom) {
        alert('Phantom wallet is not installed. Please install it from https://phantom.app/');
        return;
      }

      console.log('[PhantomWalletButton] Connecting to Phantom...');
      
      // Connect to Phantom
      const response = await window.solana.connect();
      
      if (response.publicKey) {
        setIsConnected(true);
        console.log('[PhantomWalletButton] Connected to Phantom:', response.publicKey.toString());
        
        // Store connection state
        localStorage.setItem('walletName', 'Phantom');
        localStorage.setItem('phantomPublicKey', response.publicKey.toString());
        
        // Trigger a storage event to update other components
        window.dispatchEvent(new Event('storage'));
      }
      
    } catch (error) {
      console.error('[PhantomWalletButton] Failed to connect to Phantom:', error);
      
      if (error.message?.includes('User rejected')) {
        console.log('User cancelled the connection');
      } else {
        alert('Failed to connect to Phantom wallet. Please try again.');
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectPhantom = async () => {
    try {
      if (window.solana) {
        await window.solana.disconnect();
      }
      
      setIsConnected(false);
      localStorage.removeItem('walletName');
      localStorage.removeItem('phantomPublicKey');
      
      // Trigger a storage event to update other components
      window.dispatchEvent(new Event('storage'));
      
      console.log('[PhantomWalletButton] Disconnected from Phantom');
    } catch (error) {
      console.error('[PhantomWalletButton] Failed to disconnect:', error);
    }
  };

  // Check initial connection state
  useState(() => {
    const checkConnection = () => {
      if (window.solana && window.solana.isPhantom && window.solana.isConnected) {
        setIsConnected(true);
      }
    };
    
    // Check after a brief delay to ensure window.solana is ready
    setTimeout(checkConnection, 100);
  });

  if (!window.solana || !window.solana.isPhantom) {
    return (
      <Button 
        onClick={() => window.open('https://phantom.app/', '_blank')}
        variant="outline"
        className="border-purple-500 text-purple-400 hover:bg-purple-500 hover:text-white"
      >
        Install Phantom
      </Button>
    );
  }

  if (isConnected) {
    return (
      <Button 
        onClick={disconnectPhantom}
        variant="outline"
        className="border-red-500 text-red-400 hover:bg-red-500 hover:text-white"
      >
        Disconnect Phantom
      </Button>
    );
  }

  return (
    <Button 
      onClick={connectPhantom}
      disabled={isConnecting}
      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
    >
      {isConnecting ? 'Connecting...' : 'Connect Phantom'}
    </Button>
  );
}