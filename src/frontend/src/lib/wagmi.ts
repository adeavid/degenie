import { createConfig, http } from 'wagmi';
import { mainnet, base, arbitrum, polygon, optimism } from 'wagmi/chains';
import { injected, walletConnect, coinbaseWallet } from 'wagmi/connectors';

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

// Create connectors array based on whether we have a WalletConnect project ID
const connectors = [
  injected(), // This will handle MetaMask, Brave, and other injected wallets
  coinbaseWallet({
    appName: 'DeGenie',
    appLogoUrl: 'https://degenie.ai/logo.png',
  }),
];

// Only add WalletConnect if we have a valid project ID
// Note: Temporarily commenting out WalletConnect due to type compatibility issues
// TODO: Fix WalletConnect integration with wagmi 2.x
/*
if (projectId && projectId !== 'your_project_id_here' && projectId !== '') {
  try {
    connectors.push(
      walletConnect({
        projectId,
        showQrModal: true,
        metadata: {
          name: 'DeGenie',
          description: 'AI-powered token creation platform',
          url: 'https://degenie.ai',
          icons: ['https://degenie.ai/logo.png']
        }
      })
    );
  } catch (error) {
    console.warn('Failed to initialize WalletConnect:', error);
  }
}
*/

export const wagmiConfig = createConfig({
  chains: [mainnet, base, arbitrum, polygon, optimism],
  connectors,
  transports: {
    [mainnet.id]: http(),
    [base.id]: http(),
    [arbitrum.id]: http(),
    [polygon.id]: http(),
    [optimism.id]: http(),
  },
});

declare module 'wagmi' {
  interface Register {
    config: typeof wagmiConfig;
  }
}