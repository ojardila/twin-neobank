import { describe, it, expect } from "vitest";
import { friendlyError } from "./errors";

describe("friendlyError", () => {
  it("maps insufficient funds to a gas message", () => {
    const e = { message: "insufficient funds for transfer" };
    expect(friendlyError(e)).toMatch(/ETH on Arbitrum to cover gas/);
  });

  it("maps user rejection", () => {
    expect(friendlyError({ message: "User rejected the request" })).toMatch(
      /rejected the transaction/i,
    );
  });

  it("maps ERC20 balance revert", () => {
    expect(
      friendlyError({ message: "execution reverted: transfer amount exceeds balance" }),
    ).toMatch(/enough ARGt/);
  });

  it("prefers shortMessage when present", () => {
    const e = { shortMessage: "insufficient funds", message: "very long viem trace..." };
    expect(friendlyError(e)).toMatch(/gas/);
  });

  it("falls back to the first line, trimmed", () => {
    const e = { message: "Boom happened\nstack line 1\nstack line 2" };
    expect(friendlyError(e)).toBe("Boom happened");
  });
});
