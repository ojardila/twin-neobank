import { parseUnits } from "viem";

// True if the entered amount is greater than the available raw balance.
// Empty/invalid/zero amounts are not "exceeding" (they're just not ready yet).
export function exceedsBalance(
  amount: string,
  balance: bigint | undefined,
  decimals: number,
): boolean {
  if (balance === undefined) return false;
  if (!amount || Number(amount) <= 0) return false;
  let wei: bigint;
  try {
    wei = parseUnits(amount, decimals);
  } catch {
    return false;
  }
  return wei > balance;
}
