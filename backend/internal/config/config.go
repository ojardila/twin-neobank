// Package config holds the on-chain configuration for the Twin neobank
// (contract addresses, chain ids, LayerZero endpoint ids, RPC endpoints).
// Everything is read from the environment with sensible defaults, so nothing is
// hardcoded at the call sites — set env vars (e.g. via a k8s ConfigMap) to
// point at different contracts/chains without rebuilding.
package config

import (
	"os"
	"strconv"
)

// Chain describes one supported network.
type Chain struct {
	Key     string `json:"key"`
	Name    string `json:"name"`
	ChainID int64  `json:"chainId"`
	// LzEid is the LayerZero V2 endpoint id, used as dstEid when bridging.
	LzEid uint32 `json:"lzEid"`
	// BridgeAdapter is the OFT adapter for ARGt on this chain.
	BridgeAdapter string `json:"bridgeAdapter"`
	// RPCURL is filled from the environment (RPC_<KEY>), never committed.
	RPCURL string `json:"-"`
}

// Config is the single source of truth shared with the frontend via /api/config.
type Config struct {
	ARGtToken    string            `json:"argtToken"`
	ARGtDecimals int               `json:"argtDecimals"`
	Vault        string            `json:"vault"`
	VaultChain   string            `json:"vaultChain"`
	Chains       map[string]*Chain `json:"chains"`
}

// Load builds the config from environment variables (with defaults).
func Load() *Config {
	chains := map[string]*Chain{
		"arbitrum": {
			Key:           "arbitrum",
			Name:          env("CHAIN_ARBITRUM_NAME", "Arbitrum"),
			ChainID:       envInt64("CHAIN_ARBITRUM_ID", 42161),
			LzEid:         envUint32("LZ_EID_ARBITRUM", 30110),
			BridgeAdapter: env("BRIDGE_ADAPTER_ARBITRUM", "0x4821FBf47B261F0D52Ba0F941CF67b8648f82691"),
			RPCURL:        env("RPC_ARBITRUM", "https://arb1.arbitrum.io/rpc"),
		},
		"base": {
			Key:           "base",
			Name:          env("CHAIN_BASE_NAME", "Base"),
			ChainID:       envInt64("CHAIN_BASE_ID", 8453),
			LzEid:         envUint32("LZ_EID_BASE", 30184),
			BridgeAdapter: env("BRIDGE_ADAPTER_BASE", "0xe80Af1d12426dB4394b147e04f179a38e7C5Dfe7"),
			RPCURL:        env("RPC_BASE", "https://mainnet.base.org"),
		},
		"polygon": {
			Key:           "polygon",
			Name:          env("CHAIN_POLYGON_NAME", "Polygon"),
			ChainID:       envInt64("CHAIN_POLYGON_ID", 137),
			LzEid:         envUint32("LZ_EID_POLYGON", 30109),
			BridgeAdapter: env("BRIDGE_ADAPTER_POLYGON", "0xD70ad085684b2A9f4B5d54D7BDB2ecA37a273216"),
			RPCURL:        env("RPC_POLYGON", "https://polygon-rpc.com"),
		},
	}

	return &Config{
		ARGtToken:    env("ARGT_TOKEN", "0x59863989d080B22476DB95656d0C3CC18be92214"),
		ARGtDecimals: int(envInt64("ARGT_DECIMALS", 18)),
		Vault:        env("VAULT_ADDRESS", "0x9Dd3F844747AB78d616BF76DB92756E17A064aDD"),
		VaultChain:   env("VAULT_CHAIN", "arbitrum"),
		Chains:       chains,
	}
}

func env(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}

func envInt64(key string, def int64) int64 {
	if v := os.Getenv(key); v != "" {
		if n, err := strconv.ParseInt(v, 10, 64); err == nil {
			return n
		}
	}
	return def
}

func envUint32(key string, def uint32) uint32 {
	if v := os.Getenv(key); v != "" {
		if n, err := strconv.ParseUint(v, 10, 32); err == nil {
			return uint32(n)
		}
	}
	return def
}
