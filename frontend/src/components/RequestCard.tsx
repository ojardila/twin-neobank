// Payment request links — generate a shareable URL that prefills the sender's
// Send form with your address, an amount and an optional note. Opening the link
// drops the payer straight into a ready-to-sign transfer.
import { useMemo, useState } from "react";
import { useAccount } from "wagmi";
import { useToast } from "./Toast";

export function RequestCard() {
  const { address } = useAccount();
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const toast = useToast();

  const link = useMemo(() => {
    if (!address) return "";
    const p = new URLSearchParams();
    p.set("to", address);
    if (Number(amount) > 0) p.set("amount", amount);
    if (note.trim()) p.set("note", note.trim());
    return `${window.location.origin}/?${p.toString()}`;
  }, [address, amount, note]);

  // QR via a lightweight external image service (no bundle dependency).
  const qr = link
    ? `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(link)}`
    : "";

  async function copy() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      toast.push("success", "Link copied", "Share it to get paid in ARGt");
    } catch {
      toast.push("error", "Could not copy", "Copy the link manually");
    }
  }

  async function share() {
    if (!link) return;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Pay me in ARGt", url: link });
      } catch {
        /* user dismissed */
      }
    } else {
      copy();
    }
  }

  return (
    <div className="card">
      <h2>↓ Request money</h2>
      <p className="muted" style={{ marginTop: 0 }}>
        Create a link anyone can open to pay you in ARGt — the amount and note come
        pre-filled.
      </p>

      <label className="field">Amount (optional)</label>
      <input
        placeholder="0.00"
        inputMode="decimal"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
      <label className="field">Note (optional)</label>
      <input
        placeholder="Dinner, rent, invoice #123…"
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />

      {qr && (
        <div className="qr">
          <img src={qr} width={180} height={180} alt="Payment request QR" />
        </div>
      )}

      <div className="copywrap">
        <input readOnly value={link} onFocus={(e) => e.target.select()} />
        <button className="btn" onClick={copy}>
          Copy
        </button>
      </div>
      <button className="btn ghost wide" onClick={share}>
        Share request
      </button>
    </div>
  );
}
