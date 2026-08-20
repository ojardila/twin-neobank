<div align="center">

# 🏦 Twin Neobank — ARGt Wallet

**Non-custodial wallet for Twin's ARGt stablecoin — send, earn and bridge across chains.**

Built for the [*Twin your Neobank*](./docs/challenge.md) challenge · LATAM Digital Assets Conference.

[![Live](https://img.shields.io/badge/live-argt.space-5b8cff)](https://argt.space)
[![License: MIT](https://img.shields.io/badge/license-MIT-34d399.svg)](./LICENSE)
[![Made with React](https://img.shields.io/badge/React-wagmi%2Fviem-61dafb)](https://wagmi.sh)
[![Backend: Go](https://img.shields.io/badge/backend-Go-00add8)](https://go.dev)
[![K8s: Helm](https://img.shields.io/badge/deploy-Helm%20on%20DOKS-326ce5)](./deploy/helm)

🌐 **[argt.space](https://argt.space)**

</div>

---

## Overview

Twin Neobank is a production-deployed, non-custodial wallet for **ARGt** (a peso-backed
stablecoin by Twin). It covers the challenge's three milestones and adds a polished,
mobile-first UX. **Keys never leave the user's wallet** — every state-changing transaction
is signed client-side (MetaMask/WalletConnect); the Go backend is strictly read-only.

## Highlights

| | |
|---|---|
| 💸 **Send** | Transfer ARGt on Arbitrum with a review/confirm step, balance guard, and Arbiscan link |
| ✦ **Earn** | Deposit/withdraw in the Morpho ERC-4626 vault, with a live investment view (value + shares) |
| ⇄ **Bridge** | Move ARGt across Arbitrum/Base/Polygon via LayerZero V2 OFT, with **history + delivery status** |
| 🔗 **Request** | Shareable payment-request links with QR |
| 🎨 **Personalize** | Light/dark themes + 4 accent colors (persisted) |
| 🛡️ **Robust** | Auto-switch to Arbitrum, error boundary, friendly errors, reduced-motion, PWA |

## Architecture

```
 Browser (React SPA + wallet)
   │  reads: wagmi/viem ─────────────► RPC (Arbitrum / Base / Polygon)
   │  reads: /api/* ──► Go backend ──► RPC + LayerZeroScan
   │  writes: signed in the user's wallet ─► smart contracts
   ▼
 nginx (SPA)  ──ingress──►  DOKS (Kubernetes) on DigitalOcean
```

Full diagrams (system, per-flow sequences, deployment/CI-CD) live in
[`docs/architecture.md`](./docs/architecture.md), [`docs/flows.md`](./docs/flows.md) and
[`docs/deployment.md`](./docs/deployment.md).

## Milestones & contracts

| Milestone | What | Contracts |
|---|---|---|
| **M1** | ARGt balance + transfers | ARGt `0x5986…2214` (Arbitrum, 18 dec) |
| **M2** | Morpho ERC-4626 vault | Vault `0x9Dd3…4aDD` (Arbitrum) |
| **M3** | LayerZero V2 OFT bridge | Adapters — Arbitrum `0x4821…2691` · Base `0xe80A…Dfe7` · Polygon `0xD70a…3216` |

See [`docs/challenge.md`](./docs/challenge.md) for full addresses and LayerZero EIDs.

## Tech stack

| Layer | Tech |
|---|---|
| Frontend | React + Vite + TypeScript · wagmi/viem · RainbowKit |
| Backend | Go (stdlib `net/http`, JSON-RPC `eth_call`, LayerZeroScan proxy — no external deps) |
| Containers | Docker (multi-stage) · nginx |
| Orchestration | Kubernetes via Helm |
| Infra | Terraform → DigitalOcean (DOKS + DOCR + DNS) · cert-manager/Let's Encrypt |
| CI/CD | GitHub Actions — App CI + Release pipeline (infra → deploy → smoke) |
| Tests | Go `go test` + frontend `vitest` |

## Getting started

```bash
# Full stack (mirrors prod)
docker compose up --build
#   Frontend → http://localhost:3000
#   API      → http://localhost:8080/api/config
```

Dev with hot reload:

```bash
cd backend && go run ./cmd/server          # :8080
cd frontend && npm install && npm run dev   # :5173
```

Run the tests:

```bash
cd backend && go test ./...
cd frontend && npm test
```

More detail in [`docs/local-development.md`](./docs/local-development.md).

## Backend API (read-only)

| Endpoint | Description |
|---|---|
| `GET /healthz`, `/readyz` | Liveness/readiness |
| `GET /api/config` | Chain + contract metadata (single source of truth for the UI) |
| `GET /api/balance?address=&chain=` | ARGt balance |
| `GET /api/vault?address=` | Vault shares + underlying value |
| `GET /api/bridges?address=` | Bridge history + delivery status (via LayerZeroScan) |

## Deploy

1. `terraform apply` in [`infra/terraform`](./infra/terraform) → DOKS + DOCR + DNS zone.
2. Publish a GitHub Release (`vX.Y.Z`) → the `🚀 Release` pipeline converges infra
   (ingress-nginx + cert-manager + DNS sync), builds/pushes images to DOCR,
   `helm upgrade`s, and smoke-tests.

See [`infra/README.md`](./infra/README.md).

## Project structure

```
backend/             Read-only Go API + tests
frontend/            React SPA (wallet + themes) + vitest tests
deploy/helm/         Helm chart (deployments, services, ingress + TLS)
deploy/scripts/      sync-dns.sh (DNS → LB IP)
deploy/cert-manager/ Let's Encrypt ClusterIssuer
infra/terraform/     IaC for DigitalOcean
docs/                Challenge, architecture, flows, deployment, local dev
```

## Security

- **Non-custodial:** the app never has access to private keys; all writes are signed in the
  user's wallet.
- **Read-only backend:** the Go service only performs `eth_call` reads and proxies public data.
- **Exact approvals:** vault/bridge approvals request the exact amount, not an unlimited cap.

## License

[MIT](./LICENSE) — open source. Contributions welcome.

---

> Twin Stablecoins are digital payment instruments backed by reserves. They are not
> securities or investment products.
