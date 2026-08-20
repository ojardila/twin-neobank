import { describe, it, expect } from "vitest";
import { ARGT, VAULT, BRIDGE_CHAINS, bridgeChainById } from "./contracts";

describe("challenge constants", () => {
  it("ARGt token is correct", () => {
    expect(ARGT.address).toBe("0x59863989d080B22476DB95656d0C3CC18be92214");
    expect(ARGT.decimals).toBe(18);
    expect(ARGT.chainId).toBe(42161);
  });

  it("vault is correct", () => {
    expect(VAULT.address).toBe("0x9Dd3F844747AB78d616BF76DB92756E17A064aDD");
    expect(VAULT.chainId).toBe(42161);
  });

  it("bridge adapters + LayerZero EIDs match the challenge", () => {
    const byKey = Object.fromEntries(BRIDGE_CHAINS.map((c) => [c.key, c]));
    expect(byKey.arbitrum).toMatchObject({
      chainId: 42161,
      lzEid: 30110,
      adapter: "0x4821FBf47B261F0D52Ba0F941CF67b8648f82691",
    });
    expect(byKey.base).toMatchObject({
      chainId: 8453,
      lzEid: 30184,
      adapter: "0xe80Af1d12426dB4394b147e04f179a38e7C5Dfe7",
    });
    expect(byKey.polygon).toMatchObject({
      chainId: 137,
      lzEid: 30109,
      adapter: "0xD70ad085684b2A9f4B5d54D7BDB2ecA37a273216",
    });
  });

  it("bridgeChainById resolves and returns undefined for unknown", () => {
    expect(bridgeChainById(8453)?.key).toBe("base");
    expect(bridgeChainById(1)).toBeUndefined();
  });
});
