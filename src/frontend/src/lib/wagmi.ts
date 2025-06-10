import { createConfig, http } from 'wagmi';
import { mainnet, base, arbitrum, polygon } from 'wagmi/chains';
import { injected, walletConnect } from 'wagmi/connectors';

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

// Create connectors array based on whether we have a WalletConnect project ID
const connectors = [
  injected(), // MetaMask and other injected wallets
];

// Only add WalletConnect if we have a valid project ID
if (projectId && projectId !== 'your_project_id_here' && projectId !== '') {
  connectors.push(
    walletConnect({
      projectId,
      showQrModal: true,
    })
  );
}

export const wagmiConfig = createConfig({
  chains: [mainnet, base, arbitrum, polygon],
  connectors,
  transports: {
    [mainnet.id]: http(),
    [base.id]: http(),
    [arbitrum.id]: http(),
    [polygon.id]: http(),
  },
});

declare module 'wagmi' {
  interface Register {
    config: typeof wagmiConfig;
  }
}