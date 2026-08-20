package config

import "testing"

func TestLoadDefaults(t *testing.T) {
	c := Load()

	if c.ARGtToken != "0x59863989d080B22476DB95656d0C3CC18be92214" {
		t.Errorf("unexpected ARGt token: %s", c.ARGtToken)
	}
	if c.ARGtDecimals != 18 {
		t.Errorf("ARGt decimals = %d, want 18", c.ARGtDecimals)
	}
	if c.VaultChain != "arbitrum" {
		t.Errorf("vault chain = %s, want arbitrum", c.VaultChain)
	}

	want := map[string]struct {
		chainID int64
		eid     uint32
	}{
		"arbitrum": {42161, 30110},
		"base":     {8453, 30184},
		"polygon":  {137, 30109},
	}
	for key, w := range want {
		ch, ok := c.Chains[key]
		if !ok {
			t.Fatalf("missing chain %s", key)
		}
		if ch.ChainID != w.chainID {
			t.Errorf("%s chainID = %d, want %d", key, ch.ChainID, w.chainID)
		}
		if ch.LzEid != w.eid {
			t.Errorf("%s LzEid = %d, want %d", key, ch.LzEid, w.eid)
		}
		if ch.BridgeAdapter == "" {
			t.Errorf("%s missing bridge adapter", key)
		}
	}
}

func TestLoadEnvOverride(t *testing.T) {
	t.Setenv("ARGT_TOKEN", "0xDEADBEEF")
	t.Setenv("ARGT_DECIMALS", "6")
	t.Setenv("LZ_EID_BASE", "40184")
	t.Setenv("BRIDGE_ADAPTER_POLYGON", "0xABC")

	c := Load()
	if c.ARGtToken != "0xDEADBEEF" {
		t.Errorf("ARGT_TOKEN override = %s", c.ARGtToken)
	}
	if c.ARGtDecimals != 6 {
		t.Errorf("ARGT_DECIMALS override = %d", c.ARGtDecimals)
	}
	if c.Chains["base"].LzEid != 40184 {
		t.Errorf("LZ_EID_BASE override = %d", c.Chains["base"].LzEid)
	}
	if c.Chains["polygon"].BridgeAdapter != "0xABC" {
		t.Errorf("BRIDGE_ADAPTER_POLYGON override = %s", c.Chains["polygon"].BridgeAdapter)
	}
}
