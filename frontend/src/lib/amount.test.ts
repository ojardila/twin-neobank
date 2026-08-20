import { describe, it, expect } from "vitest";
import { pctAmount, trimDecimals } from "./amount";

const ONE = 1_000_000_000_000_000_000n; // 1e18

describe("pctAmount", () => {
  it("computes Max (100%) as the whole balance", () => {
    expect(pctAmount(10n * ONE, 100n, 18)).toBe("10");
  });

  it("computes 25%", () => {
    expect(pctAmount(10n * ONE, 25n, 18)).toBe("2.5");
  });

  it("computes 10%", () => {
    expect(pctAmount(10n * ONE, 10n, 18)).toBe("1");
  });

  it("handles zero balance", () => {
    expect(pctAmount(0n, 50n, 18)).toBe("0");
  });
});

describe("trimDecimals", () => {
  it("strips trailing zeros", () => {
    expect(trimDecimals("2.5000")).toBe("2.5");
    expect(trimDecimals("10.0")).toBe("10");
    expect(trimDecimals("7")).toBe("7");
  });
});
