import { describe, it, expect } from "vitest";
import { shortAddr, formatAmount } from "./format";

describe("shortAddr", () => {
  it("shortens a full address", () => {
    expect(shortAddr("0x7BfB0225Bb163d0Ad8e68C0694f6F7dd16dDB206")).toBe(
      "0x7BfB…B206",
    );
  });
  it("leaves short / non-hex strings untouched", () => {
    expect(shortAddr("0x1234")).toBe("0x1234");
    expect(shortAddr("vitalik.eth")).toBe("vitalik.eth");
  });
});

describe("formatAmount", () => {
  it("groups and limits decimals", () => {
    expect(formatAmount(1234567.891, 2)).toBe("1,234,567.89");
  });
  it("accepts strings", () => {
    expect(formatAmount("2.5")).toBe("2.5");
  });
  it("handles non-finite input", () => {
    expect(formatAmount(NaN)).toBe("0");
    expect(formatAmount("abc")).toBe("0");
  });
});
