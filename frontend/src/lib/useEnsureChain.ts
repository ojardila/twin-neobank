// Returns a function that switches the wallet to `target` chain if it isn't
// already there — call it before a writeContract whose chainId is fixed
// (e.g. the Arbitrum-only ARGt transfer and vault), so users on another network
// get an automatic switch prompt instead of a chain-mismatch error.
import { useChainId, useSwitchChain } from "wagmi";

export function useEnsureChain() {
  const chainId = useChainId();
  const { switchChainAsync } = useSwitchChain();
  return async (target: number) => {
    if (chainId !== target) {
      await switchChainAsync({ chainId: target });
    }
  };
}
