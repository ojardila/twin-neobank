// Raw ARGt balance (bigint) for a chain, plus a refetch to refresh right after a
// transaction. (useArgtBalance is the toast-firing hero variant.)
import { useAccount, useReadContract } from "wagmi";
import { ARGT } from "./contracts";
import { ERC20_ABI } from "./abis/erc20";

export function useArgtRaw(chainId: number = ARGT.chainId): {
  balance: bigint | undefined;
  refetch: () => void;
} {
  const { address } = useAccount();
  const { data, refetch } = useReadContract({
    address: ARGT.address,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    chainId,
    query: { enabled: !!address, refetchInterval: 15_000 },
  });
  return { balance: data as bigint | undefined, refetch };
}
