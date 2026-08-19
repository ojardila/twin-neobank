// M1 — transfer ARGt to another address (Arbitrum). Shows a confirmation step
// before signing. Can be prefilled from a payment-request link (?to=&amount=&note=).
import { useEffect, useState } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { isAddress, parseUnits, type Address } from "viem";
import { ARGT } from "../lib/contracts";
import { ERC20_ABI } from "../lib/abis/erc20";
import { friendlyError } from "../lib/errors";
import { useToast } from "./Toast";

interface Props {
  initialTo?: string;
  initialAmount?: string;
  initialNote?: string;
}

function shortAddr(a: string) {
  return a.length > 12 ? `${a.slice(0, 6)}…${a.slice(-4)}` : a;
}

export function TransferCard({ initialTo, initialAmount, initialNote }: Props) {
  const [to, setTo] = useState(initialTo ?? "");
  const [amount, setAmount] = useState(initialAmount ?? "");
  const [confirming, setConfirming] = useState(false);
  const toast = useToast();
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const { isLoading: mining, isSuccess } = useWaitForTransactionReceipt({ hash });

  const valid = isAddress(to) && Number(amount) > 0;
  const busy = isPending || mining;

  useEffect(() => {
    if (isSuccess) {
      toast.push("success", "Transfer confirmed", `${amount} ARGt sent to ${shortAddr(to)}`);
      setConfirming(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess]);

  useEffect(() => {
    if (error) {
      toast.push("error", "Transfer failed", friendlyError(error));
      setConfirming(false);
    }
  }, [error, toast]);

  function send() {
    reset();
    writeContract({
      address: ARGT.address,
      abi: ERC20_ABI,
      functionName: "transfer",
      args: [to as Address, parseUnits(amount, ARGT.decimals)],
      chainId: ARGT.chainId,
    });
  }

  // Confirmation step.
  if (confirming) {
    return (
      <div className="card">
        <h2>↑ Confirm transfer</h2>
        <div className="confirm-box">
          <div className="confirm-amount">{Number(amount).toLocaleString()} ARGt</div>
          <div className="stat">
            <span className="muted">To</span>
            <span className="v" style={{ fontSize: 14 }}>{shortAddr(to)}</span>
          </div>
          <div className="stat">
            <span className="muted">Network</span>
            <span className="v" style={{ fontSize: 14 }}>Arbitrum</span>
          </div>
          {initialNote && (
            <div className="stat">
              <span className="muted">Note</span>
              <span className="v" style={{ fontSize: 14 }}>{initialNote}</span>
            </div>
          )}
        </div>
        <button className="btn wide" disabled={busy} onClick={send}>
          {busy ? "Confirming…" : "Confirm & send"}
        </button>
        <button className="btn ghost wide" disabled={busy} onClick={() => setConfirming(false)}>
          Cancel
        </button>
      </div>
    );
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
      <button className="btn wide" disabled={!valid} onClick={() => setConfirming(true)}>
        Review transfer
      </button>
    </div>
  );
}
