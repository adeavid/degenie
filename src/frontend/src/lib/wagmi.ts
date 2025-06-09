import { createConfig, http } from 'wagmi';
import { mainnet, base, arbitrum, polygon } from 'wagmi/chains';
import { injected, walletConnect } from 'wagmi/connectors';

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '';

export const wagmiConfig = createConfig({
  chains: [mainnet, base, arbitrum, polygon],
  connectors: [
    injected(),
    walletConnect({ 
      projectId,
      showQrModal: true,
    }),
  ],
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