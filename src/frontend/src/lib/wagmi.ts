import { createConfig, http } from 'wagmi';
import { mainnet, base, arbitrum, polygon } from 'wagmi/chains';
import { injected } from 'wagmi/connectors';

// Por ahora no usamos WalletConnect para evitar el error del projectId
export const wagmiConfig = createConfig({
  chains: [mainnet, base, arbitrum, polygon],
  connectors: [
    injected(), // MetaMask y otros wallets inyectados
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