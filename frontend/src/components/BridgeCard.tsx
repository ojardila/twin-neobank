// M3 — bridge ARGt across chains via the OFT (LayerZero V2) adapter.
// Flow: approve ARGt -> adapter, quoteSend() for the native fee, then send().
import { useEffect, useMemo, useState } from "react";
import {
  useAccount,
  useChainId,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { formatEther, maxUint256, pad, parseUnits, type Address } from "viem";
import { ARGT, BRIDGE_CHAINS, bridgeChainById } from "../lib/contracts";
import { BRIDGE_ADAPTER_ABI } from "../lib/abis/bridgeAdapter";
import { ERC20_ABI } from "../lib/abis/erc20";
import { friendlyError } from "../lib/errors";
import { useToast } from "./Toast";

export function BridgeCard() {
  const { address } = useAccount();
  const chainId = useChainId();
  const toast = useToast();
  const source = bridgeChainById(chainId);
  const dests = BRIDGE_CHAINS.filter((c) => c.chainId !== chainId);

  const [destKey, setDestKey] = useState(dests[0]?.key ?? "");
  const [amount, setAmount] = useState("");
  const dest = BRIDGE_CHAINS.find((c) => c.key === destKey) ?? dests[0];

  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: confirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (isSuccess)
      toast.push("success", "Bridge initiated", `Funds arrive on ${dest?.name} soon`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess]);
  useEffect(() => {
    if (error) toast.push("error", "Bridge failed", friendlyError(error));
  }, [error, toast]);

  const amountLD =
    amount && Number(amount) > 0 ? parseUnits(amount, ARGT.decimals) : 0n;

  const sendParam = useMemo(() => {
    if (!address || !dest) return undefined;
    return {
      dstEid: dest.lzEid,
      to: pad(address as Address, { size: 32 }),
      amountLD,
      minAmountLD: amountLD,
      extraOptions: "0x" as const,
      composeMsg: "0x" as const,
      oftCmd: "0x" as const,
    };
  }, [address, dest, amountLD]);

  const { data: allowance } = useReadContract({
    address: ARGT.address,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: address && source ? [address, source.adapter] : undefined,
    chainId,
    query: { enabled: !!address && !!source },
  });
  const needsApprove =
    (allowance as bigint | undefined) !== undefined && (allowance as bigint) < amountLD;

  const { data: fee } = useReadContract({
    address: source?.adapter,
    abi: BRIDGE_ADAPTER_ABI,
    functionName: "quoteSend",
    args: sendParam ? [sendParam, false] : undefined,
    chainId,
    query: { enabled: !!source && !!sendParam && amountLD > 0n },
  });
  const nativeFee = (fee as { nativeFee: bigint } | undefined)?.nativeFee;

  function approve() {
    if (!source) return;
    writeContract({
      address: ARGT.address,
      abi: ERC20_ABI,
      functionName: "approve",
      args: [source.adapter, maxUint256],
      chainId,
    });
  }
  function send() {
    if (!source || !sendParam || nativeFee === undefined || !address) return;
    writeContract({
      address: source.adapter,
      abi: BRIDGE_ADAPTER_ABI,
      functionName: "send",
      args: [sendParam, { nativeFee, lzTokenFee: 0n }, address as Address],
      value: nativeFee,
      chainId,
    });
  }

  if (!source) {
    return (
      <div className="card">
        <h2>⇄ Bridge ARGt</h2>
        <p className="muted">
          Switch your wallet to Arbitrum, Base or Polygon to use the bridge.
        </p>
      </div>
    );
  }

  const busy = isPending || confirming;

  return (
    <div className="card">
      <h2>⇄ Bridge ARGt · from {source.name}</h2>
      <label className="field">Destination chain</label>
      <select value={destKey} onChange={(e) => setDestKey(e.target.value)}>
        {dests.map((c) => (
          <option key={c.key} value={c.key}>
            {c.name}
          </option>
        ))}
      </select>
      <label className="field">Amount</label>
      <input
        placeholder="0.00"
        inputMode="decimal"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
      {nativeFee !== undefined && (
        <div className="stat" style={{ marginTop: 10 }}>
          <span className="muted">Messaging fee</span>
          <span className="v" style={{ fontSize: 14 }}>{formatEther(nativeFee)}</span>
        </div>
      )}
      {needsApprove ? (
        <button className="btn wide" disabled={busy} onClick={approve}>
          {busy ? "…" : "Approve ARGt"}
        </button>
      ) : (
        <button
          className="btn wide"
          disabled={amountLD === 0n || nativeFee === undefined || busy}
          onClick={send}
        >
          {busy ? "Sending…" : `Bridge to ${dest?.name}`}
        </button>
      )}
    </div>
  );
}
