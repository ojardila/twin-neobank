// Block-explorer / cross-chain tracking URLs.

export function arbiscanTx(hash: string): string {
  return `https://arbiscan.io/tx/${hash}`;
}

export function layerZeroTx(hash: string): string {
  return `https://layerzeroscan.com/tx/${hash}`;
}
