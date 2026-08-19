// M1 — transfer ARGt to another address (Arbitrum). Can be prefilled from a
// payment-request link (?to=&amount=&note=).
import { useEffect, useState } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { isAddress, parseUnits, type Address } from "viem";
import { ARGT } from "../lib/contracts";
import { ERC20_ABI } from "../lib/abis/erc20";
import { useToast } from "./Toast";

interface Props {
  initialTo?: string;
  initialAmount?: string;
  initialNote?: string;
}

export function TransferCard({ initialTo, initialAmount, initialNote }: Props) {
  const [to, setTo] = useState(initialTo ?? "");
  const [amount, setAmount] = useState(initialAmount ?? "");
  const toast = useToast();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: confirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const valid = isAddress(to) && Number(amount) > 0;

  useEffect(() => {
    if (isSuccess) toast.push("success", "Transfer confirmed", `${amount} ARGt sent`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess]);

  useEffect(() => {
    if (error) toast.push("error", "Transfer failed", error.message.slice(0, 90));
  }, [error, toast]);

  function send() {
    writeContract({
      address: ARGT.address,
      abi: ERC20_ABI,
      functionName: "transfer",
      args: [to as Address, parseUnits(amount, ARGT.decimals)],
      chainId: ARGT.chainId,
    });
  }

  return (
    <div className="card">
      <h2>↑ Send ARGt</h2>
      {initialNote && (
        <p className="muted" style={{ marginTop: 0 }}>
          Payment request: <b>{initialNote}</b>
        </p>
      )}
      <label className="field">Recipient address</label>
      <input placeholder="0x…" value={to} onChange={(e) => setTo(e.target.value)} />
      <label className="field">Amount</label>
      <input
        placeholder="0.00"
        inputMode="decimal"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
      <button
        className="btn wide"
        disabled={!valid || isPending || confirming}
        onClick={send}
      >
        {isPending || confirming ? "Sending…" : "Send"}
      </button>
    </div>
  );
}
