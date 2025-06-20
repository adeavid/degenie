'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';

export function PhantomDebugInfo() {
  const [phantomInfo, setPhantomInfo] = useState<any>({});

  useEffect(() => {
    const checkPhantom = () => {
      const info = {
        windowSolanaExists: !!window.solana,
        isPhantom: window.solana?.isPhantom,
        isConnected: window.solana?.isConnected,
        publicKey: window.solana?.publicKey?.toString(),
        phantomVersion: window.solana?._version,
        userAgent: navigator.userAgent,
        localStorage: {
          walletName: localStorage.getItem('walletName'),
          phantomPublicKey: localStorage.getItem('phantomPublicKey'),
        },
        timestamp: new Date().toISOString(),
      };
      
      setPhantomInfo(info);
      console.log('[PhantomDebugInfo] Phantom state:', info);
    };

    checkPhantom();
    
    // Check every 2 seconds
    const interval = setInterval(checkPhantom, 2000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="p-4 bg-gray-900 border-gray-700 max-w-2xl">
      <h3 className="text-lg font-semibold text-white mb-3">🐛 Phantom Debug Info</h3>
      <div className="space-y-2 text-sm">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className={`font-medium ${phantomInfo.windowSolanaExists ? 'text-green-400' : 'text-red-400'}`}>
              window.solana: {phantomInfo.windowSolanaExists ? '✅ EXISTS' : '❌ MISSING'}
            </div>
            <div className={`font-medium ${phantomInfo.isPhantom ? 'text-green-400' : 'text-red-400'}`}>
              isPhantom: {phantomInfo.isPhantom ? '✅ TRUE' : '❌ FALSE'}
            </div>
            <div className={`font-medium ${phantomInfo.isConnected ? 'text-green-400' : 'text-yellow-400'}`}>
              isConnected: {phantomInfo.isConnected ? '✅ TRUE' : '⚠️ FALSE'}
            </div>
          </div>
          <div>
            <div className="text-gray-300">
              <span className="text-gray-400">Public Key:</span><br/>
              <code className="text-xs">{phantomInfo.publicKey || 'None'}</code>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-700 pt-2">
          <div className="text-gray-400 text-xs">localStorage:</div>
          <div className="ml-2 text-xs">
            <div>walletName: {phantomInfo.localStorage?.walletName || 'None'}</div>
            <div>phantomPublicKey: {phantomInfo.localStorage?.phantomPublicKey || 'None'}</div>
          </div>
        </div>

        <div className="border-t border-gray-700 pt-2">
          <div className="text-gray-400 text-xs">Last checked: {phantomInfo.timestamp}</div>
        </div>
      </div>
    </Card>
  );
}