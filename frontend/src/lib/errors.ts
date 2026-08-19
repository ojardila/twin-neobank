// Turn raw wallet/RPC errors into short, human-friendly messages.
export function friendlyError(err: unknown): string {
  const msg = (
    (err as { shortMessage?: string; message?: string })?.shortMessage ||
    (err as { message?: string })?.message ||
    String(err)
  ).toLowerCase();

  if (msg.includes("insufficient funds")) {
    return "Not enough ETH on Arbitrum to cover gas. Add a little ETH and try again.";
  }
  if (
    msg.includes("user rejected") ||
    msg.includes("user denied") ||
    msg.includes("rejected the request")
  ) {
    return "You rejected the transaction in your wallet.";
  }
  if (msg.includes("transfer amount exceeds balance")) {
    return "You don't have enough ARGt for this transfer.";
  }
  if (msg.includes("chain") && msg.includes("mismatch")) {
    return "Wrong network — switch your wallet to Arbitrum.";
  }
  if (msg.includes("nonce")) {
    return "Transaction sequencing issue — try again in a moment.";
  }
  // Fallback: first sentence, trimmed.
  const first =
    (err as { shortMessage?: string })?.shortMessage ||
    (err as { message?: string })?.message ||
    "Something went wrong.";
  return first.split("\n")[0].slice(0, 120);
}
