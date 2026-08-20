// Small inline loading spinner for busy buttons.
export function Spinner({ label }: { label?: string }) {
  return (
    <span className="spin-wrap">
      <span className="spinner" aria-hidden />
      {label}
    </span>
  );
}
