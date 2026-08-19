# Twin Neobank — ARGt Wallet

Wallet no custodial para las stablecoins de **Twin** (ARGt), construida para el challenge
[*Twin your Neobank*](./docs/challenge.md) (LATAM Digital Assets Conference).

## Features (milestones)

- **M1 — Balance & Transfers** de ARGt (Arbitrum).
- **M2 — Vault Morpho** (ERC-4626): depositar/retirar ARGt.
- **M3 — Bridge** cross-chain vía OFT de LayerZero V2 (Arbitrum ↔ Base ↔ Polygon).

Las transacciones se firman **en la wallet del usuario** (MetaMask/WalletConnect). El backend
es de solo lectura y nunca maneja claves.

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | React + Vite + TypeScript, wagmi/viem, RainbowKit |
| Backend | Go (`net/http`, go-ethereum para lecturas RPC) |
| Contenedores | Docker (multi-stage), nginx para el SPA |
| Orquestación | Kubernetes (Kustomize base + overlay prod) |
| Infra | Terraform → DigitalOcean (DOKS + DOCR) |
| CI/CD | GitHub Actions (CI: build/test · CD: build→push DOCR→rollout) |

## Correr local (docker-compose)

```bash
docker compose up --build
# Frontend: http://localhost:3000
# API:      http://localhost:8080/api/config
```

O por separado en dev:

```bash
# backend
cd backend && go run ./cmd/server        # :8080

# frontend
cd frontend && npm install && npm run dev # :5173
```

## Deploy (DigitalOcean)

Ver [`infra/README.md`](./infra/README.md). Resumen:

1. `terraform apply` en `infra/terraform` → crea DOKS + DOCR.
2. Instalar ingress-nginx.
3. Push a `main` → GitHub Actions buildea y despliega.

## Estructura

```
backend/         API Go de solo lectura (balances, vault, config)
frontend/        SPA React (conexión wallet + 3 milestones)
deploy/          Dockerfiles, nginx, manifiestos K8s (Kustomize)
infra/terraform/ IaC DigitalOcean (cluster + registry)
docs/            Consigna del challenge + ABI del bridge
```

## Direcciones

Ver [`docs/challenge.md`](./docs/challenge.md) para token, vault y adapters del bridge por chain.

---

> Twin Stablecoins son instrumentos de pago digital respaldados por reservas. No son valores
> negociables ni productos de inversión.
