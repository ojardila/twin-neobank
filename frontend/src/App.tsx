import { useMemo, useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useChainId } from "wagmi";
import { arbitrum, base, polygon } from "wagmi/chains";
import { useArgtBalance } from "./lib/useArgtBalance";
import { TransferCard } from "./components/TransferCard";
import { VaultCard } from "./components/VaultCard";
import { BridgeCard } from "./components/BridgeCard";
import { RequestCard } from "./components/RequestCard";

type Tab = "home" | "send" | "earn" | "bridge" | "request";

const CHAIN_NAME: Record<number, string> = {
  [arbitrum.id]: "Arbitrum",
  [base.id]: "Base",
  [polygon.id]: "Polygon",
};

// A payment-request link lands here with ?to=&amount=&note= — jump to Send.
function prefillFromUrl() {
  const p = new URLSearchParams(window.location.search);
  const to = p.get("to") ?? "";
  const amount = p.get("amount") ?? "";
  const note = p.get("note") ?? "";
  return { to, amount, note, hasRequest: !!to };
}

export default function App() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const prefill = useMemo(prefillFromUrl, []);
  const [tab, setTab] = useState<Tab>(prefill.hasRequest ? "send" : "home");
  const { formatted, isLoading, received } = useArgtBalance();

  const balanceText =
    formatted !== undefined
      ? Number(formatted).toLocaleString(undefined, { maximumFractionDigits: 2 })
      : "0";

  return (
    <div className="shell">
      <div className="topbar">
        <div className="brand">
          <span className="logo">🏦</span>
          <span>Twin Wallet</span>
        </div>
        <ConnectButton showBalance={false} accountStatus="avatar" chainStatus="none" />
      </div>

      {!isConnected ? (
        <div className="card center-cta">
          <div style={{ fontSize: 46 }}>💸</div>
          <div className="big">Your ARGt, everywhere</div>
          <p className="muted">
            Hold, send and grow ARGt across Arbitrum, Base and Polygon. Non-custodial
            — only you control your funds.
          </p>
          <div style={{ display: "flex", justifyContent: "center", marginTop: 18 }}>
            <ConnectButton showBalance={false} />
          </div>
        </div>
      ) : (
        <>
          <div className={`card hero${received ? " received" : ""}`}>
            <div className="eyebrow">Total balance</div>
            <div className="amount">
              {isLoading ? (
                <span className="skeleton">0000.00</span>
              ) : (
                <>
                  {balanceText}
                  <span className="ticker">ARGt</span>
                </>
              )}
            </div>
            <div className="net">
              <span className="dot" />
              Live · {CHAIN_NAME[chainId] ?? "Unsupported network"}
            </div>

            <div className="quick">
              <button onClick={() => setTab("send")}>
                <span className="ic">↑</span>
                Send
              </button>
              <button onClick={() => setTab("request")}>
                <span className="ic">↓</span>
                Request
              </button>
              <button onClick={() => setTab("earn")}>
                <span className="ic">✦</span>
                Earn
              </button>
              <button onClick={() => setTab("bridge")}>
                <span className="ic">⇄</span>
                Bridge
              </button>
            </div>
          </div>

          <div className="tabs">
            {(["home", "send", "earn", "bridge", "request"] as Tab[]).map((t) => (
              <button
                key={t}
                className={tab === t ? "active" : ""}
                onClick={() => setTab(t)}
              >
                {t === "home"
                  ? "Home"
                  : t === "send"
                    ? "Send"
                    : t === "earn"
                      ? "Earn"
                      : t === "bridge"
                        ? "Bridge"
                        : "Request"}
              </button>
            ))}
          </div>

          {tab === "home" && <HomePanel onGo={setTab} />}
          {tab === "send" && (
            <TransferCard
              initialTo={prefill.to}
              initialAmount={prefill.amount}
              initialNote={prefill.note}
            />
          )}
          {tab === "earn" && <VaultCard />}
          {tab === "bridge" && <BridgeCard />}
          {tab === "request" && <RequestCard />}
        </>
      )}

      <p className="muted" style={{ marginTop: 20, textAlign: "center", fontSize: 12 }}>
        Twin Stablecoins are digital payment instruments backed by reserves. They are
        not securities or investment products.
      </p>
    </div>
  );
}

function HomePanel({ onGo }: { onGo: (t: Tab) => void }) {
  return (
    <div className="card">
      <h2>Your money</h2>
      <p className="muted" style={{ marginTop: 0 }}>
        ARGt is a peso-backed stablecoin by Twin. Move it instantly, earn yield in the
        Morpho vault, or bridge it across chains — all from one place.
      </p>
      <button className="btn wide" onClick={() => onGo("send")}>
        Send ARGt
      </button>
      <div className="row">
        <button className="btn ghost" style={{ flex: 1 }} onClick={() => onGo("earn")}>
          ✦ Earn yield
        </button>
        <button className="btn ghost" style={{ flex: 1 }} onClick={() => onGo("request")}>
          ↓ Request money
        </button>
      </div>
    </div>
  );
}
