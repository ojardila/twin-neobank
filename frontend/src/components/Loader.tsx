// Playful loading indicator: a rocket taking off with Argentine-flag colored dots.
export function Loader({ label = "Loading" }: { label?: string }) {
  return (
    <span className="rocket-loader" role="status" aria-label={label}>
      <span className="rocket">🚀</span>
      <span className="rocket-dots">
        <i />
        <i />
        <i />
      </span>
    </span>
  );
}
