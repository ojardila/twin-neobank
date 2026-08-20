# Twin Neobank — ARGt Wallet

Wallet no custodial para las stablecoins de **Twin** (ARGt), construida para el challenge
[*Twin your Neobank*](./docs/challenge.md) (LATAM Digital Assets Conference).

🌐 **Live:** https://argt.space

## Features

**Milestones**
- **M1 — Balance & Transfers** de ARGt (Arbitrum), con confirmación previa y guard de saldo.
- **M2 — Vault Morpho** (ERC-4626): depositar/retirar ARGt, con vista de inversión y shares.
- **M3 — Bridge** cross-chain vía OFT de LayerZero V2 (Arbitrum ↔ Base ↔ Polygon), con
  tracking en LayerZeroScan.

**Extras de UX**
- Links de **cobro/request** con QR.
- **Temas** claro/oscuro + 4 colores de acento (persistidos).
- Botones de **% (10/25/50/Max)**, spinners, errores amigables, banner de red incorrecta.
- Accesibilidad (`prefers-reduced-motion`) y PWA (favicon + manifest, add-to-home-screen).

Las transacciones se firman **en la wallet del usuario** (MetaMask/WalletConnect). El backend
es de solo lectura y nunca maneja claves.

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | React + Vite + TypeScript, wagmi/viem, RainbowKit |
| Backend | Go (stdlib `net/http`, JSON-RPC `eth_call` — sin dependencias externas) |
| Contenedores | Docker (multi-stage), nginx para el SPA |
| Orquestación | Kubernetes vía **Helm** (`deploy/helm/twin-neobank`) |
| Infra | Terraform → DigitalOcean (DOKS + DOCR + DNS), cert-manager/Let's Encrypt |
| CI/CD | GitHub Actions — App CI (build/test) + Release pipeline (infra→deploy→smoke) |
| Tests | Go (`go test`) + frontend (`vitest`) |

## Correr local (docker-compose)

```bash
docker compose up --build
# Frontend: http://localhost:3000
# API:      http://localhost:8080/api/config
```

Dev con hot reload:

```bash
cd backend && go run ./cmd/server         # :8080
cd frontend && npm install && npm run dev  # :5173
```

Tests:

```bash
cd backend && go test ./...
cd frontend && npm test
```

Ver [`docs/local-development.md`](./docs/local-development.md) para más detalle.

## Deploy (DigitalOcean)

Ver [`infra/README.md`](./infra/README.md). Resumen:

1. `terraform apply` en `infra/terraform` → crea **DOKS + DOCR + zona DNS**.
2. Publicar un **GitHub Release** (`vX.Y.Z`) → dispara el pipeline `🚀 Release`:
   `infra` (converge ingress-nginx estándar + cert-manager + sync DNS) →
   `deploy` (build/push a DOCR + `helm upgrade`) → `smoke` test.

El deploy a K8s se hace con **Helm** (`helm upgrade --install twin-neobank deploy/helm/twin-neobank`).

## Estructura

```
backend/            API Go de solo lectura (balances, vault, config) + tests
frontend/           SPA React (wallet + milestones + temas) + tests (vitest)
deploy/helm/        Helm chart (deployments, services, ingress + TLS)
deploy/scripts/     sync-dns.sh (reconcilia DNS a la IP del LB)
deploy/cert-manager/ ClusterIssuer Let's Encrypt
infra/terraform/    IaC DigitalOcean (cluster, registry, zona DNS)
docs/               Challenge, arquitectura, flujos, deployment, local dev
```

---

> Twin Stablecoins son instrumentos de pago digital respaldados por reservas. No son valores
> negociables ni productos de inversión.
