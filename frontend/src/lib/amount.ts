import { formatUnits } from "viem";

// Trim trailing zeros from a decimal string for a cleaner input value.
export function trimDecimals(s: string): string {
  return s.includes(".") ? s.replace(/\.?0+$/, "") : s;
}

// A percentage (1-100) of a raw balance, formatted as a decimal string.
export function pctAmount(
  balance: bigint,
  pct: bigint,
  decimals: number,
): string {
  const v = (balance * pct) / 100n;
  return trimDecimals(formatUnits(v, decimals));
}
