// Quick amount picker: 10% / 25% / 50% / Max of a balance.
import { ARGT } from "../lib/contracts";
import { pctAmount } from "../lib/amount";

const STEPS: { label: string; pct: bigint }[] = [
  { label: "10%", pct: 10n },
  { label: "25%", pct: 25n },
  { label: "50%", pct: 50n },
  { label: "Max", pct: 100n },
];

export function PercentButtons({
  balance,
  onPick,
}: {
  balance: bigint | undefined;
  onPick: (value: string) => void;
}) {
  const disabled = balance === undefined || balance === 0n;
  return (
    <div className="pct-row">
      {STEPS.map((s) => (
        <button
          key={s.label}
          type="button"
          className="pct-btn"
          disabled={disabled}
          onClick={() => {
            if (balance === undefined) return;
            onPick(pctAmount(balance, s.pct, ARGT.decimals));
          }}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}
