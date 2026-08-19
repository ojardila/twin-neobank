// Raw ARGt balance (bigint) for a chain, with no side effects — used to power
// the percentage quick-pick buttons. (useArgtBalance is the toast-firing one.)
import { useAccount, useReadContract } from "wagmi";
import { ARGT } from "./contracts";
import { ERC20_ABI } from "./abis/erc20";

export function useArgtRaw(chainId: number = ARGT.chainId): bigint | undefined {
  const { address } = useAccount();
  const { data } = useReadContract({
    address: ARGT.address,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    chainId,
    query: { enabled: !!address, refetchInterval: 15_000 },
  });
  return data as bigint | undefined;
}
