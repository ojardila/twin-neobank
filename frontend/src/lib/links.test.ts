import { describe, it, expect } from "vitest";
import { arbiscanTx, layerZeroTx } from "./links";

const HASH = "0xabc123";

describe("explorer links", () => {
  it("builds an Arbiscan tx URL", () => {
    expect(arbiscanTx(HASH)).toBe("https://arbiscan.io/tx/0xabc123");
  });
  it("builds a LayerZeroScan tx URL", () => {
    expect(layerZeroTx(HASH)).toBe("https://layerzeroscan.com/tx/0xabc123");
  });
});
