import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { arbitrum, base, polygon } from "wagmi/chains";

// WalletConnect projectId — set VITE_WC_PROJECT_ID for prod. A dev fallback is
// fine for injected wallets (MetaMask) but WalletConnect needs a real id.
const projectId = import.meta.env.VITE_WC_PROJECT_ID ?? "twin-neobank-dev";

export const wagmiConfig = getDefaultConfig({
  appName: "Twin Neobank",
  projectId,
  chains: [arbitrum, base, polygon],
  ssr: false,
});
