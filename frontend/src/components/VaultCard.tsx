// M2 — ERC-4626 vault (Morpho). Deposit ARGt (approve -> deposit) and withdraw.
import { useEffect, useState } from "react";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { formatUnits, parseUnits, maxUint256, type Address } from "viem";
import { ARGT, VAULT } from "../lib/contracts";
import { ERC20_ABI } from "../lib/abis/erc20";
import { ERC4626_ABI } from "../lib/abis/erc4626";
import { friendlyError } from "../lib/errors";
import { useToast } from "./Toast";

export function VaultCard() {
  const { address } = useAccount();
  const [amount, setAmount] = useState("");
  const toast = useToast();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: confirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const { data: shares } = useReadContract({
    address: VAULT.address,
    abi: ERC4626_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    chainId: VAULT.chainId,
    query: { enabled: !!address, refetchInterval: 15_000 },
  });
  const { data: assets } = useReadContract({
    address: VAULT.address,
    abi: ERC4626_ABI,
    functionName: "convertToAssets",
    args: shares !== undefined ? [shares as bigint] : undefined,
    chainId: VAULT.chainId,
    query: { enabled: shares !== undefined },
  });
  const { data: allowance } = useReadContract({
    address: ARGT.address,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: address ? [address, VAULT.address] : undefined,
    chainId: ARGT.chainId,
    query: { enabled: !!address },
  });

  useEffect(() => {
    if (isSuccess) toast.push("success", "Vault updated", "Your position changed");
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
    writeContract({
      address: ARGT.address,
      abi: ERC20_ABI,
      functionName: "approve",
      args: [VAULT.address, maxUint256],
      chainId: ARGT.chainId,
    });
  }
  function deposit() {
    if (!address) return;
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
    writeContract({
      address: VAULT.address,
      abi: ERC4626_ABI,
      functionName: "redeem",
      args: [shares as bigint, address as Address, address as Address],
      chainId: VAULT.chainId,
    });
  }

  const position =
    assets !== undefined ? formatUnits(assets as bigint, ARGT.decimals) : "0";
  const busy = isPending || confirming;

  return (
    <div className="card">
      <h2>✦ Earn · ARGt Prime Vault</h2>
      <div className="stat">
        <span className="muted">Your position</span>
        <span className="v">{Number(position).toLocaleString()} ARGt</span>
      </div>
      <div className="stat">
        <span className="muted">Strategy</span>
        <span className="v" style={{ fontSize: 13 }}>Morpho · ERC-4626</span>
      </div>

      <label className="field">Amount to deposit</label>
      <input
        placeholder="0.00"
        inputMode="decimal"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
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
