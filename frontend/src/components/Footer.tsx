const REPO = "https://github.com/ojardila/twin-neobank";

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer-links">
        <a href={REPO} target="_blank" rel="noreferrer">
          GitHub ↗
        </a>
        <span className="dot-sep">·</span>
        <a href={`${REPO}/blob/main/LICENSE`} target="_blank" rel="noreferrer">
          MIT License
        </a>
      </div>
      <div className="footer-note">
        Open source · Built for the LATAM Digital Assets Conference
      </div>
    </footer>
  );
}
