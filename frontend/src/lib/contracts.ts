// Challenge constants — see docs/challenge.md. Single source of truth for the UI.
import type { Address } from "viem";
import { arbitrum, base, polygon } from "wagmi/chains";

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

// M2 — ERC-4626 vault (Arbitrum).
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

// Backend read-API base (empty = call same origin / behind ingress).
export const API_BASE = import.meta.env.VITE_API_BASE ?? "";
