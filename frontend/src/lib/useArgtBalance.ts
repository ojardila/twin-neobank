// Real-time ARGt balance hook: polls every 8s, and when the balance goes up it
// fires a "funds received" toast and returns a `received` pulse flag (used to
// animate the hero). This is what makes incoming money feel live.
import { useEffect, useRef, useState } from "react";
import { useAccount, useReadContract } from "wagmi";
import { formatUnits } from "viem";
import { ARGT } from "./contracts";
import { ERC20_ABI } from "./abis/erc20";
import { useToast } from "../components/Toast";

export function useArgtBalance() {
  const { address } = useAccount();
  const toast = useToast();
  const prev = useRef<bigint | undefined>(undefined);
  const [received, setReceived] = useState(false);

  const { data, isLoading, refetch } = useReadContract({
    address: ARGT.address,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    chainId: ARGT.chainId,
    query: { enabled: !!address, refetchInterval: 8000 },
  });

  useEffect(() => {
    if (data === undefined) return;
    const cur = data as bigint;
    if (prev.current !== undefined && cur > prev.current) {
      const delta = cur - prev.current;
      const amount = Number(formatUnits(delta, ARGT.decimals)).toLocaleString();
      toast.push("success", `Received +${amount} ARGt`, "Funds just arrived in your wallet");
      setReceived(true);
      const t = setTimeout(() => setReceived(false), 1200);
      prev.current = cur;
      return () => clearTimeout(t);
    }
    prev.current = cur;
  }, [data, toast]);

  const raw = data as bigint | undefined;
  const formatted = raw !== undefined ? formatUnits(raw, ARGT.decimals) : undefined;
  return { raw, formatted, isLoading, refetch, received };
}
