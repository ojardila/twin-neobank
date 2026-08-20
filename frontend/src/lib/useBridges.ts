// Fetches the user's real bridge history + delivery status from the backend
// (which proxies LayerZeroScan). Polls so newly-sent bridges appear as they
// get indexed.
import { useCallback, useEffect, useState } from "react";
import { API_BASE, BRIDGE_CHAINS } from "./contracts";

export interface BridgeItem {
  srcTxHash: string;
  srcEid: number;
  dstEid: number;
  status: string;
  created: string;
}

export function eidName(eid: number): string {
  return BRIDGE_CHAINS.find((c) => c.lzEid === eid)?.name ?? `eid ${eid}`;
}

export function useBridges(address?: string) {
  const [bridges, setBridges] = useState<BridgeItem[]>([]);

  const load = useCallback(() => {
    if (!address) {
      setBridges([]);
      return;
    }
    fetch(`${API_BASE}/api/bridges?address=${address}`)
      .then((r) => (r.ok ? r.json() : { bridges: [] }))
      .then((d) => setBridges(d.bridges ?? []))
      .catch(() => {
        /* keep last known */
      });
  }, [address]);

  useEffect(() => {
    load();
    const t = setInterval(load, 30_000);
    return () => clearInterval(t);
  }, [load]);

  return { bridges, refetch: load };
}
