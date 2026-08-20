// Small display formatters.

// Shorten a 0x address to 0x1234…abcd.
export function shortAddr(addr: string): string {
  if (!addr.startsWith("0x") || addr.length <= 12) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

// Format a numeric-ish value with grouping and up to `maxFrac` decimals.
export function formatAmount(value: number | string, maxFrac = 2): string {
  const n = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(n)) return "0";
  return n.toLocaleString(undefined, { maximumFractionDigits: maxFrac });
}
