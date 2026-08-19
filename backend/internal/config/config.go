// Package config holds the on-chain constants for the Twin "your neobank"
// challenge (contract addresses, chain ids, LayerZero endpoint ids) and reads
// per-chain RPC endpoints from the environment.
package config

import (
	"os"
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
	// ARGtToken is the ERC-20 ARGt address (Arbitrum).
	ARGtToken string `json:"argtToken"`
	// ARGtDecimals for ARGt.
	ARGtDecimals int `json:"argtDecimals"`
	// Vault is the ERC-4626 "ARGt Prime" vault (Arbitrum, Morpho-operated).
	Vault string `json:"vault"`
	// VaultChain is the chain key where the vault lives.
	VaultChain string `json:"vaultChain"`
	// Chains keyed by Chain.Key.
	Chains map[string]*Chain `json:"chains"`
}

// Load builds the config from challenge constants + environment RPC overrides.
func Load() *Config {
	chains := map[string]*Chain{
		"arbitrum": {
			Key:           "arbitrum",
			Name:          "Arbitrum",
			ChainID:       42161,
			LzEid:         30110,
			BridgeAdapter: "0x4821FBf47B261F0D52Ba0F941CF67b8648f82691",
			RPCURL:        env("RPC_ARBITRUM", "https://arb1.arbitrum.io/rpc"),
		},
		"base": {
			Key:           "base",
			Name:          "Base",
			ChainID:       8453,
			LzEid:         30184,
			BridgeAdapter: "0xe80Af1d12426dB4394b147e04f179a38e7C5Dfe7",
			RPCURL:        env("RPC_BASE", "https://mainnet.base.org"),
		},
		"polygon": {
			Key:           "polygon",
			Name:          "Polygon",
			ChainID:       137,
			LzEid:         30109,
			BridgeAdapter: "0xD70ad085684b2A9f4B5d54D7BDB2ecA37a273216",
			RPCURL:        env("RPC_POLYGON", "https://polygon-rpc.com"),
		},
	}

	return &Config{
		ARGtToken:    "0x59863989d080B22476DB95656d0C3CC18be92214",
		ARGtDecimals: 18,
		Vault:        "0x9Dd3F844747AB78d616BF76DB92756E17A064aDD",
		VaultChain:   "arbitrum",
		Chains:       chains,
	}
}

func env(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}
