// Contract/chain config. Defaults live here, but everything is hydrated at
// startup from the backend's /api/config (see loadConfig, called before the app
// renders), so addresses/EIDs can change without rebuilding the frontend.
import type { Address } from "viem";
import { arbitrum, base, polygon } from "wagmi/chains";

// Backend read-API base (empty = same origin; nginx proxies /api → backend).
export const API_BASE = import.meta.env.VITE_API_BASE ?? "";

export const ARGT: {
  address: Address;
  decimals: number;
  symbol: string;
  chainId: number;
} = {
  address: "0x59863989d080B22476DB95656d0C3CC18be92214",
  decimals: 18,
  symbol: "ARGt",
  chainId: arbitrum.id,
};

// M2 — ERC-4626 vault.
export const VAULT: { address: Address; chainId: number } = {
  address: "0x9Dd3F844747AB78d616BF76DB92756E17A064aDD",
  chainId: arbitrum.id,
};

// M3 — OFT LayerZero V2 bridge adapters, one per chain.
export interface BridgeChain {
  key: string;
  name: string;
  chainId: number;
  lzEid: number; // dstEid when bridging TO this chain
  adapter: Address;
}

export const BRIDGE_CHAINS: BridgeChain[] = [
  {
    key: "arbitrum",
    name: "Arbitrum",
    chainId: arbitrum.id,
    lzEid: 30110,
    adapter: "0x4821FBf47B261F0D52Ba0F941CF67b8648f82691",
  },
  {
    key: "base",
    name: "Base",
    chainId: base.id,
    lzEid: 30184,
    adapter: "0xe80Af1d12426dB4394b147e04f179a38e7C5Dfe7",
  },
  {
    key: "polygon",
    name: "Polygon",
    chainId: polygon.id,
    lzEid: 30109,
    adapter: "0xD70ad085684b2A9f4B5d54D7BDB2ecA37a273216",
  },
];

export function bridgeChainById(chainId: number): BridgeChain | undefined {
  return BRIDGE_CHAINS.find((c) => c.chainId === chainId);
}

interface ApiChain {
  key: string;
  name: string;
  chainId: number;
  lzEid: number;
  bridgeAdapter: Address;
}
interface ApiConfig {
  argtToken?: Address;
  argtDecimals?: number;
  vault?: Address;
  vaultChain?: string;
  chains?: Record<string, ApiChain>;
}

// Hydrate the config in place from the backend. Falls back to the defaults
// above if the backend is unreachable, so the app still works.
export async function loadConfig(): Promise<void> {
  try {
    const res = await fetch(`${API_BASE}/api/config`, {
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return;
    const c = (await res.json()) as ApiConfig;

    if (c.argtToken) ARGT.address = c.argtToken;
    if (typeof c.argtDecimals === "number") ARGT.decimals = c.argtDecimals;
    if (c.vault) VAULT.address = c.vault;

    if (c.chains) {
      const next = Object.values(c.chains).map((ch) => ({
        key: ch.key,
        name: ch.name,
        chainId: ch.chainId,
        lzEid: ch.lzEid,
        adapter: ch.bridgeAdapter,
      }));
      if (next.length) {
        BRIDGE_CHAINS.length = 0;
        BRIDGE_CHAINS.push(...next);
      }
      const vc = c.vaultChain ? c.chains[c.vaultChain] : undefined;
      if (vc) VAULT.chainId = vc.chainId;
    }
  } catch {
    /* keep bundled defaults */
  }
}
