'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { WalletConnectButtonWrapper } from '@/components/wallet/WalletConnectButtonWrapper';

export const Header: React.FC = () => {
  return (
    <header className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-4">
            <div className="text-2xl font-bold text-blue-600">
              DeGenie
            </div>
            <span className="text-sm text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
              Beta
            </span>
          </div>
          
          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/create" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 transition-colors">
              Create Token
            </Link>
            <Link href="/dashboard" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 transition-colors">
              Dashboard
            </Link>
            <Link href="/marketplace" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 transition-colors">
              Marketplace
            </Link>
          </nav>
          
          {/* Actions */}
          <div className="flex items-center space-x-4">
            <WalletConnectButtonWrapper />
            <Button size="sm">
              Launch Token
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};