# Local Development

How to run the Twin Neobank ARGt wallet locally. Twin Neobank is a
**non-custodial** wallet: all transactions are signed in the user's own wallet
(MetaMask / WalletConnect) and the Go backend is a **read-only** API that never
handles keys.

## 1. Overview

There are two ways to run the project locally:

- **Option A — Full stack with Docker Compose (recommended).** Builds the Go
  backend and the nginx-served frontend the same way they run in production. The
  frontend is served as a static SPA and nginx proxies `/api` to the backend.
- **Option B — Backend and frontend separately, in dev mode.** Runs the Vite dev
  server (hot reload) against your local Go backend. Best for active development.

## 2. Prerequisites

| For | You need |
|---|---|
| Option A | Docker + Docker Compose |
| Option B | Go 1.22+ and Node 20+ |

A **WalletConnect / Reown `projectId` is optional.** It is only needed for
mobile / QR-code wallet connection. The MetaMask browser extension (an injected
wallet) works **without** it. When you do have one, pass it via the
`VITE_WC_PROJECT_ID` environment variable. Without a real id the app falls back
to the placeholder `twin-neobank-dev`, which is fine for MetaMask.

## 3. Option A — Docker Compose (recommended)

From the repo root:

```bash
docker compose up --build
```

On some Docker setups the BuildKit frontend causes build issues. If the build
fails, disable BuildKit:

```bash
DOCKER_BUILDKIT=0 docker compose up --build
```

Once it is up:

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8080

### Passing a WalletConnect projectId

Compose reads `VITE_WC_PROJECT_ID` as a **build arg** and bakes it into the
bundle, so pass it on the same command that builds:

```bash
VITE_WC_PROJECT_ID=<your-project-id> docker compose up --build
```

### Verify

```bash
curl http://localhost:8080/healthz
curl "http://localhost:8080/api/config"
```

Then open the frontend at http://localhost:3000.

### Logs and stopping

```bash
docker compose logs -f     # follow logs
docker compose down        # stop and remove containers
```

## 4. Option B — Run services separately (dev, hot reload)

### Backend

```bash
cd backend
go run ./cmd/server
```

The API listens on `:8080`. All of the following environment variables are
**optional**:

| Var | Default | Purpose |
|---|---|---|
| `PORT` | `8080` | Port the API listens on |
| `RPC_ARBITRUM` | `https://arb1.arbitrum.io/rpc` | Arbitrum RPC endpoint |
| `RPC_BASE` | `https://mainnet.base.org` | Base RPC endpoint |
| `RPC_POLYGON` | `https://polygon-rpc.com` | Polygon RPC endpoint |

The RPC defaults are public endpoints. They work out of the box but can be rate
limited or flaky; override them with your own provider URLs for reliability, for
example:

```bash
RPC_ARBITRUM="https://your-arbitrum-rpc" go run ./cmd/server
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The Vite dev server runs on **http://localhost:5173**. Optional environment
variables:

| Var | Default | Purpose |
|---|---|---|
| `VITE_WC_PROJECT_ID` | `twin-neobank-dev` | WalletConnect / Reown projectId (only for QR / mobile wallets) |
| `VITE_API_BASE` | `""` (same origin) | Base URL of the Go read API |

Example with both set:

```bash
VITE_WC_PROJECT_ID=<your-project-id> VITE_API_BASE=http://localhost:8080 npm run dev
```

> Note: in dev the frontend talks to the chains **directly** via wagmi/viem, so
> it works even if the Go backend is not running. The backend is an **optional**
> read API used for server-side balance/vault reads.

Other frontend scripts (from `package.json`): `npm run build` produces the
production bundle, and `npm run preview` serves that built bundle locally.

## 5. Connecting a wallet & testing

1. Install the **MetaMask** browser extension.
2. Open the app (http://localhost:3000 for Option A, or
   http://localhost:5173 for Option B) and connect MetaMask.
3. Switch MetaMask to the **Arbitrum** network.

**Reading balances requires nothing** beyond a connected address. To test the
write flows — **transfer**, vault **deposit/withdraw**, or **bridge** — you need:

- Some **ARGt** on Arbitrum, and
- A little **ETH** on Arbitrum for gas.

ARGt is a **real mainnet token** (Arbitrum), not a testnet asset. There is no
faucet — request ARGt for testing from the Twin organizers' Discord.

## 6. The backend read API

All endpoints are `GET` and return JSON.

| Endpoint | Description |
|---|---|
| `GET /healthz` | Liveness check; returns `{"status":"ok"}`. |
| `GET /readyz` | Readiness check; same handler as `/healthz`. |
| `GET /api/config` | Chain + contract metadata (ARGt token, vault, bridge adapters). Single source of truth for the UI. |
| `GET /api/balance?address=0x..&chain=arbitrum` | ARGt balance for `address` on `chain` (defaults to `arbitrum`). |
| `GET /api/vault?address=0x..` | The address's ERC-4626 vault position: shares and underlying assets. |

Examples:

```bash
curl "http://localhost:8080/api/config"
curl "http://localhost:8080/api/balance?address=0xYourAddress&chain=arbitrum"
curl "http://localhost:8080/api/vault?address=0xYourAddress"
```

## 7. Troubleshooting

### WalletConnect 403 from api.web3modal.org / pulse.walletconnect.org

If the browser console shows 403 errors against `api.web3modal.org` or
`pulse.walletconnect.org`, the `projectId` is the placeholder
(`twin-neobank-dev`). This is **harmless** — MetaMask still works. To fix it, set
a real `VITE_WC_PROJECT_ID` (see options above) and rebuild.

### Native module build error for `utf-8-validate`

`npm install` may try to build the native `utf-8-validate` / `bufferutil`
modules (pulled in by WalletConnect). If you hit a build error, you need the
toolchain **python3**, **make**, and **g++** installed locally. The frontend
Dockerfile already installs these, so this only affects **local** `npm install`
(Option B). On Alpine, for reference: `apk add --no-cache python3 make g++`.

### Port already in use

The project uses ports **3000** (Compose frontend), **8080** (backend), and
**5173** (Vite dev server). If one is taken:

```bash
lsof -i :3000    # or :8080, :5173 — find the process holding the port
```

Then stop that process, or change the port:

- Backend: `PORT=8081 go run ./cmd/server`
- Compose: edit the `ports` mappings in `docker-compose.yml`.
