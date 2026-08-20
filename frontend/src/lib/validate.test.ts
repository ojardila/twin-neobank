import { describe, it, expect } from "vitest";
import { exceedsBalance } from "./validate";

const ONE = 1_000_000_000_000_000_000n; // 1e18

describe("exceedsBalance", () => {
  it("is false when amount is within balance", () => {
    expect(exceedsBalance("5", 10n * ONE, 18)).toBe(false);
  });
  it("is false when amount equals balance", () => {
    expect(exceedsBalance("10", 10n * ONE, 18)).toBe(false);
  });
  it("is true when amount exceeds balance", () => {
    expect(exceedsBalance("15", 10n * ONE, 18)).toBe(true);
  });
  it("is false for empty / zero / invalid input", () => {
    expect(exceedsBalance("", 10n * ONE, 18)).toBe(false);
    expect(exceedsBalance("0", 10n * ONE, 18)).toBe(false);
    expect(exceedsBalance("abc", 10n * ONE, 18)).toBe(false);
  });
  it("is false when balance is unknown", () => {
    expect(exceedsBalance("5", undefined, 18)).toBe(false);
  });
});
