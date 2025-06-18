'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

export function BackendStatus() {
  const [status, setStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  useEffect(() => {
    const checkBackend = async () => {
      try {
        const controller = new AbortController();
        setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch('http://localhost:4000/health', {
          method: 'GET',
          signal: controller.signal
        });
        
        if (response.ok) {
          setStatus('online');
        } else {
          setStatus('offline');
        }
      } catch (error) {
        console.log('Backend not reachable:', error);
        setStatus('offline');
      }
    };

    checkBackend();
    
    // Check every 30 seconds
    const interval = setInterval(checkBackend, 30000);
    
    return () => clearInterval(interval);
  }, []);

  if (status === 'checking') {
    return (
      <div className="flex items-center space-x-2 text-yellow-400 text-sm">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Checking backend status...</span>
      </div>
    );
  }

  if (status === 'online') {
    return (
      <div className="flex items-center space-x-2 text-green-400 text-sm">
        <CheckCircle className="w-4 h-4" />
        <span>Backend connected</span>
      </div>
    );
  }

  return (
    <div className="bg-red-900/20 border border-red-500/20 rounded-lg p-4 mb-4">
      <div className="flex items-start space-x-2">
        <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-red-400 font-medium">Backend Server Required</h3>
          <p className="text-red-300 text-sm mt-1">
            The backend server is not running. Please start it to use the application:
          </p>
          <div className="mt-2 bg-gray-900 rounded p-2 text-green-400 text-sm font-mono">
            cd /Users/cash/Desktop/degenie/src/backend<br/>
            npm run dev:complete
          </div>
          <p className="text-red-300 text-xs mt-2">
            Server should start on http://localhost:4000
          </p>
        </div>
      </div>
    </div>
  );
}