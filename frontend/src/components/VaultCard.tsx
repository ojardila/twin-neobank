// M2 — ERC-4626 vault (Morpho). Deposit ARGt (approve -> deposit) and withdraw.
import { useEffect, useState } from "react";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { formatUnits, parseUnits, type Address } from "viem";
import { ARGT, VAULT } from "../lib/contracts";
import { ERC20_ABI } from "../lib/abis/erc20";
import { ERC4626_ABI } from "../lib/abis/erc4626";
import { friendlyError } from "../lib/errors";
import { useArgtRaw } from "../lib/useArgtRaw";
import { PercentButtons } from "./PercentButtons";
import { useToast } from "./Toast";

export function VaultCard() {
  const { address } = useAccount();
  const [amount, setAmount] = useState("");
  const [lastAction, setLastAction] = useState<
    "approve" | "deposit" | "withdraw" | null
  >(null);
  const { balance, refetch: refetchBalance } = useArgtRaw();
  const toast = useToast();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: confirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const { data: shares, refetch: refetchShares } = useReadContract({
    address: VAULT.address,
    abi: ERC4626_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    chainId: VAULT.chainId,
    query: { enabled: !!address, refetchInterval: 15_000 },
  });
  const { data: assets, refetch: refetchAssets } = useReadContract({
    address: VAULT.address,
    abi: ERC4626_ABI,
    functionName: "convertToAssets",
    args: shares !== undefined ? [shares as bigint] : undefined,
    chainId: VAULT.chainId,
    query: { enabled: shares !== undefined },
  });
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: ARGT.address,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: address ? [address, VAULT.address] : undefined,
    chainId: ARGT.chainId,
    query: { enabled: !!address },
  });

  useEffect(() => {
    if (!isSuccess) return;
    if (lastAction === "approve")
      toast.push("success", "Approved", "Now confirm the deposit to invest");
    else if (lastAction === "deposit")
      toast.push("success", "Deposited", "Your ARGt is now earning in the vault");
    else if (lastAction === "withdraw")
      toast.push("success", "Withdrawn", "Funds returned to your wallet");
    // Refresh position/allowance immediately instead of waiting for the poll.
    refetchShares();
    refetchAssets();
    refetchAllowance();
    refetchBalance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess]);
  useEffect(() => {
    if (error) toast.push("error", "Vault tx failed", friendlyError(error));
  }, [error, toast]);

  const amountWei =
    amount && Number(amount) > 0 ? parseUnits(amount, ARGT.decimals) : 0n;
  const needsApprove =
    (allowance as bigint | undefined) !== undefined && (allowance as bigint) < amountWei;

  function approve() {
    setLastAction("approve");
    writeContract({
      address: ARGT.address,
      abi: ERC20_ABI,
      functionName: "approve",
      // Approve only the exact deposit amount (not unlimited) — safer and avoids
      // wallet "unlimited spending cap" scam warnings.
      args: [VAULT.address, amountWei],
      chainId: ARGT.chainId,
    });
  }
  function deposit() {
    if (!address) return;
    setLastAction("deposit");
    writeContract({
      address: VAULT.address,
      abi: ERC4626_ABI,
      functionName: "deposit",
      args: [amountWei, address as Address],
      chainId: VAULT.chainId,
    });
  }
  function withdrawAll() {
    if (!address || shares === undefined) return;
    setLastAction("withdraw");
    writeContract({
      address: VAULT.address,
      abi: ERC4626_ABI,
      functionName: "redeem",
      args: [shares as bigint, address as Address, address as Address],
      chainId: VAULT.chainId,
    });
  }

  const sharesBig = (shares as bigint | undefined) ?? 0n;
  const positionValue =
    assets !== undefined ? Number(formatUnits(assets as bigint, ARGT.decimals)) : 0;
  const sharesNum = Number(formatUnits(sharesBig, ARGT.decimals));
  const hasPosition = sharesBig > 0n;
  const busy = isPending || confirming;

  return (
    <div className="card">
      <h2>✦ Earn · ARGt Prime Vault</h2>

      <div className="position-box">
        <div className="muted" style={{ fontSize: 12 }}>Your investment</div>
        <div className="position-value">
          {positionValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          <span className="ticker"> ARGt</span>
        </div>
        {hasPosition ? (
          <>
            <div className="stat">
              <span className="muted">Vault shares</span>
              <span className="v" style={{ fontSize: 14 }}>
                {sharesNum.toLocaleString(undefined, { maximumFractionDigits: 4 })} sARGt
              </span>
            </div>
            <div className="stat">
              <span className="muted">Strategy</span>
              <span className="v" style={{ fontSize: 13 }}>Morpho · ERC-4626</span>
            </div>
            <p className="muted" style={{ fontSize: 12, margin: "8px 0 0" }}>
              This value grows automatically as the vault earns yield. Withdraw anytime.
            </p>
          </>
        ) : (
          <p className="muted" style={{ fontSize: 13, margin: "6px 0 0" }}>
            You haven't deposited yet. Deposit ARGt below to start earning yield
            (Morpho · ERC-4626). Approving alone does not invest — you must also Deposit.
          </p>
        )}
      </div>

      <label className="field">Amount to deposit</label>
      <input
        placeholder="0.00"
        inputMode="decimal"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
      <PercentButtons balance={balance} onPick={setAmount} />
      {needsApprove ? (
        <button className="btn wide" disabled={busy} onClick={approve}>
          {busy ? "…" : "Approve ARGt"}
        </button>
      ) : (
        <button
          className="btn wide"
          disabled={amountWei === 0n || busy}
          onClick={deposit}
        >
          {busy ? "…" : "Deposit"}
        </button>
      )}
      <button
        className="btn ghost wide"
        disabled={shares === undefined || (shares as bigint) === 0n || busy}
        onClick={withdrawAll}
      >
        Withdraw all
      </button>
    </div>
  );
}
