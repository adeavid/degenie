import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { WalletConnectButton } from '@/components/wallet/WalletConnectButton';
import { WalletProvider } from '@/providers/WalletProvider';

// Mock the wallet adapters
vi.mock('@solana/wallet-adapter-react', () => ({
  useWallet: () => ({
    publicKey: null,
    connected: false,
    disconnect: vi.fn(),
    wallet: null,
  }),
  useConnection: () => ({
    connection: {},
  }),
}));

vi.mock('@solana/wallet-adapter-react-ui', () => ({
  useWalletModal: () => ({
    setVisible: vi.fn(),
  }),
  WalletModalProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('wagmi', () => ({
  useAccount: () => ({
    address: undefined,
    isConnected: false,
    chain: null,
  }),
  useConnect: () => ({
    connect: vi.fn(),
    connectors: [
      { id: 'injected', name: 'MetaMask' },
      { id: 'walletConnect', name: 'WalletConnect' },
    ],
  }),
  useDisconnect: () => ({
    disconnect: vi.fn(),
  }),
  useBalance: () => ({
    data: null,
    isLoading: false,
    error: null,
  }),
  WagmiProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  createConfig: () => ({}),
}));

describe('WalletConnectButton', () => {
  it('renders wallet selection buttons when no wallet is selected', () => {
    render(
      <WalletProvider>
        <WalletConnectButton />
      </WalletProvider>
    );

    expect(screen.getByText('🔷 Connect Ethereum')).toBeInTheDocument();
    expect(screen.getByText('☀️ Connect Solana')).toBeInTheDocument();
  });

  it('shows connect wallet button when wallet type is specified', () => {
    render(
      <WalletProvider>
        <WalletConnectButton walletType="ethereum" />
      </WalletProvider>
    );

    expect(screen.getByText('Connect Wallet')).toBeInTheDocument();
  });

  it('handles wallet selection', () => {
    render(
      <WalletProvider>
        <WalletConnectButton />
      </WalletProvider>
    );

    const ethereumButton = screen.getByText('🔷 Connect Ethereum');
    fireEvent.click(ethereumButton);

    // After selection, should show Connect Wallet button
    expect(screen.getByText('Connect Wallet')).toBeInTheDocument();
  });
});