# User and Transaction Flows

Every flow that changes on-chain state is **signed in the user's wallet**. The Go
backend only participates in read paths. Amounts are handled in the token's
smallest unit (ARGt has 18 decimals); the UI converts with viem's `parseUnits` /
`formatUnits`.

---

## Wallet connection

The user opens the SPA and clicks the RainbowKit **Connect** button. RainbowKit
presents installed/injected wallets (MetaMask) and WalletConnect. Once connected,
wagmi exposes the account address and the active chain. The app renders the
feature cards only when `isConnected` is true (`App.tsx`). The active chain
matters for M3: the Bridge card reads the current chain (`useChainId`) to pick
the source adapter and the list of destinations.

```mermaid
sequenceDiagram
  actor User
  participant SPA as React SPA
  participant RK as RainbowKit
  participant Wallet as Wallet MetaMask
  User->>SPA: Open app
  SPA->>RK: Render ConnectButton
  User->>RK: Click Connect
  RK->>Wallet: Request accounts and chain
  Wallet-->>User: Prompt approve connection
  User->>Wallet: Approve
  Wallet-->>RK: Account address and chainId
  RK-->>SPA: isConnected true
  SPA-->>User: Render Balance Transfer Vault Bridge cards
```

---

## M1 — Reading balance

The balance is read **two independent ways**, which both hit an RPC endpoint but
via different paths. The `BalanceCard` reads directly from Arbitrum using wagmi's
`useReadContract` (`balanceOf`, refetching every 15s). The backend offers the
same data at `/api/balance`, which performs a raw `eth_call` server-side. The
client-side read keeps the wallet functional even if the backend is down.

```mermaid
sequenceDiagram
  actor User
  participant SPA as React SPA
  participant NGINX as nginx frontend
  participant API as Go backend
  participant RPC as Arbitrum RPC
  Note over SPA,RPC: Path A - direct client read
  SPA->>RPC: eth_call balanceOf address
  RPC-->>SPA: raw uint256 balance
  SPA-->>User: formatUnits balance ARGt
  Note over SPA,RPC: Path B - via read-only backend
  SPA->>NGINX: GET /api/balance address chain
  NGINX->>API: proxy /api/balance
  API->>RPC: eth_call balanceOf address
  RPC-->>API: raw uint256 balance
  API-->>SPA: json raw decimals
```

---

## M1 — Transfer ARGt

A plain ERC-20 `transfer`. No approval is needed because the user moves their own
tokens directly. The UI validates the recipient and amount, calls
`writeContract` (which prompts the wallet to sign), then watches for the receipt
with `useWaitForTransactionReceipt` to show confirmation.

```mermaid
sequenceDiagram
  actor User
  participant SPA as TransferCard
  participant Wallet as Wallet
  participant RPC as Arbitrum RPC
  participant ARGt as ARGt ERC-20
  User->>SPA: Enter recipient and amount
  SPA->>Wallet: writeContract transfer to amount
  Wallet-->>User: Prompt sign transfer
  User->>Wallet: Sign
  Wallet->>RPC: Broadcast signed tx
  RPC->>ARGt: transfer to amount
  ARGt-->>RPC: Transfer event
  RPC-->>SPA: Receipt via waitForTransactionReceipt
  SPA-->>User: Transfer confirmed
```

---

## M2 — Vault deposit (two-step approve then deposit)

Depositing into the ERC-4626 vault requires the vault to move ARGt on the user's
behalf, so it is a **two-step** flow. The card reads the current ARGt->vault
`allowance`; if it is below the amount, it shows **Approve** (approves
`maxUint256` once). Once allowance is sufficient, it shows **Deposit**, which
calls `deposit(assets, receiver)` and mints vault shares to the user. Position is
displayed by reading `balanceOf` (shares) and `convertToAssets`.

```mermaid
sequenceDiagram
  actor User
  participant SPA as VaultCard
  participant Wallet as Wallet
  participant ARGt as ARGt ERC-20
  participant Vault as ERC-4626 Vault
  SPA->>ARGt: read allowance owner vault
  ARGt-->>SPA: current allowance
  alt allowance below amount
    User->>SPA: Click Approve
    SPA->>Wallet: writeContract approve vault maxUint256
    Wallet-->>User: Prompt sign approve
    User->>Wallet: Sign
    Wallet->>ARGt: approve vault maxUint256
    ARGt-->>SPA: Approval confirmed
  end
  User->>SPA: Click Deposit
  SPA->>Wallet: writeContract deposit assets receiver
  Wallet-->>User: Prompt sign deposit
  User->>Wallet: Sign
  Wallet->>Vault: deposit assets receiver
  Vault->>ARGt: transferFrom user vault
  Vault-->>SPA: shares minted receipt
  SPA-->>User: Operation confirmed
```

---

## M2 — Withdraw / redeem

The "Withdraw all" action calls `redeem(shares, receiver, owner)` with the user's
full share balance, burning shares and returning the underlying ARGt. No approval
is needed since the owner redeems their own shares.

```mermaid
sequenceDiagram
  actor User
  participant SPA as VaultCard
  participant Wallet as Wallet
  participant Vault as ERC-4626 Vault
  participant ARGt as ARGt ERC-20
  SPA->>Vault: read balanceOf shares
  Vault-->>SPA: shares
  User->>SPA: Click Withdraw all
  SPA->>Wallet: writeContract redeem shares receiver owner
  Wallet-->>User: Prompt sign redeem
  User->>Wallet: Sign
  Wallet->>Vault: redeem shares receiver owner
  Vault->>ARGt: transfer assets to user
  Vault-->>SPA: assets returned receipt
  SPA-->>User: Operation confirmed
```

---

## M3 — Bridge (OFT LayerZero V2)

Bridging burns ARGt on the source chain and mints it on the destination. The
source adapter is chosen from the active wallet chain; the destination selector
sets `dstEid` = that chain's LayerZero EID (Arbitrum 30110, Base 30184, Polygon
30109). The flow is:

1. **Approve** ARGt to the source adapter (only if allowance is insufficient).
2. **quoteSend(sendParam, false)** (a read) returns the `nativeFee` — the
   LayerZero messaging fee to pay in the chain's native gas token.
3. **send(sendParam, fee, refundAddress)** with `msg.value = nativeFee`. The
   adapter burns on the source and the LayerZero network delivers a message that
   mints on the destination a few minutes later.

`sendParam = { dstEid, to (bytes32 of receiver), amountLD, minAmountLD,
extraOptions, composeMsg, oftCmd }`. The UI pads the receiver address to 32 bytes
and sets `minAmountLD = amountLD` (1:1 OFT transfer, no slippage).

```mermaid
sequenceDiagram
  actor User
  participant SPA as BridgeCard
  participant Wallet as Wallet
  participant SrcRPC as Source chain RPC
  participant Adapter as Source OFT Adapter
  participant LZ as LayerZero Network
  participant DstAdapter as Destination OFT Adapter
  SPA->>SrcRPC: read allowance owner adapter
  SrcRPC-->>SPA: current allowance
  alt allowance below amount
    User->>SPA: Click Approve
    SPA->>Wallet: writeContract approve adapter maxUint256
    Wallet->>Adapter: approve
  end
  SPA->>Adapter: quoteSend sendParam false
  Adapter-->>SPA: nativeFee
  SPA-->>User: Show messaging fee
  User->>SPA: Click Bridge
  SPA->>Wallet: writeContract send sendParam fee refund value nativeFee
  Wallet-->>User: Prompt sign send
  User->>Wallet: Sign
  Wallet->>Adapter: send with msg.value nativeFee
  Adapter->>Adapter: burn amountLD on source
  Adapter->>LZ: emit cross-chain message dstEid
  LZ->>DstAdapter: deliver message
  DstAdapter->>DstAdapter: mint amountLD to receiver
  DstAdapter-->>User: Funds arrive on destination
```
