import React, { useState, useRef, useEffect } from "react";
import { useUsdcBalance } from "../hooks/useUsdcBalance";
import { usePendingRefunds } from "../hooks/usePendingRefunds";
import {
  Coins,
  RefreshCw,
  ChevronDown,
  RotateCcw,
} from "lucide-react";

export const UsdcBalanceBadge: React.FC = () => {
  const { usdcBalance, monBalance, isLoading, refetch, walletAddress } = useUsdcBalance();
  const { pendingRefunds, totalPendingUsdc, claimAllRefunds, isClaiming: isClaimingRefunds } = usePendingRefunds();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleRefresh = (e: React.MouseEvent) => {
    e.stopPropagation();
    refetch();
  };

  if (!walletAddress) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Balance Pill Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-500/10 via-cyan-500/10 to-purple-500/10 border border-cyan-500/30 hover:border-cyan-400/60 px-3.5 py-1.5 text-xs font-medium text-white transition-all shadow-sm hover:shadow-cyan-500/20 cursor-pointer backdrop-blur-md group"
        title="View Monad Testnet USDC & MON balance details"
      >
        {/* Token Icon */}
        <div className="w-5 h-5 rounded-full bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-cyan-300">
          <Coins className="w-3 h-3 text-cyan-400" />
        </div>

        {/* Balance Display */}
        <div className="flex items-center gap-1.5 font-mono tracking-tight">
          <span className="font-bold text-white text-xs">{usdcBalance}</span>
          <span className="text-[10px] font-semibold text-cyan-400">USDC</span>
          {totalPendingUsdc > 0 && (
            <span
              className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-500/25 border border-amber-500/50 text-[9.5px] font-bold text-amber-300 animate-pulse ml-0.5"
              title={`${totalPendingUsdc.toFixed(2)} USDC in pending SLA refunds available to withdraw`}
            >
              +{totalPendingUsdc.toFixed(2)} refund
            </span>
          )}
        </div>

        {/* Refresh spinner */}
        <span
          role="button"
          tabIndex={0}
          onClick={handleRefresh}
          className="text-zinc-400 hover:text-white p-0.5 rounded transition-colors cursor-pointer"
          title="Refresh balance"
        >
          <RefreshCw
            className={`w-3 h-3 ${isLoading ? "animate-spin text-cyan-400" : "text-zinc-400 group-hover:text-zinc-300"}`}
          />
        </span>

        <ChevronDown
          className={`w-3 h-3 text-zinc-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-white/10 bg-[#0d0f18]/95 p-4 shadow-2xl backdrop-blur-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-semibold text-white tracking-wide uppercase">
                Monad Testnet Balances
              </span>
            </div>
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-cyan-400 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3 h-3 ${isLoading ? "animate-spin text-cyan-400" : ""}`} />
              <span>Refresh</span>
            </button>
          </div>

          {/* Pending Escrow Refunds Banner */}
          {totalPendingUsdc > 0 && (
            <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500/15 to-orange-500/10 border border-amber-500/40 text-xs space-y-2 mb-3 shadow-lg shadow-amber-950/30">
              <div className="flex items-center justify-between font-bold text-amber-300">
                <span className="flex items-center gap-1.5 font-mono">
                  <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                  Unclaimed SLA Refunds
                </span>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-200">
                  +{totalPendingUsdc.toFixed(2)} USDC
                </span>
              </div>
              <p className="text-[10.5px] leading-relaxed text-zinc-300 font-sans">
                You have <strong>{pendingRefunds.length}</strong> refunded escrow job{pendingRefunds.length > 1 ? "s" : ""} waiting in the Veris Router from SLA breach tests.
              </p>
              <button
                type="button"
                onClick={async (e) => {
                  e.stopPropagation();
                  try {
                    await claimAllRefunds();
                    refetch();
                  } catch (err) {
                    console.error("[UsdcBalanceBadge] Claim all error:", err);
                  }
                }}
                disabled={isClaimingRefunds}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs transition-all cursor-pointer shadow-md disabled:opacity-50"
              >
                {isClaimingRefunds ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Withdrawing All Refunds...</span>
                  </>
                ) : (
                  <>
                    <Coins className="w-3.5 h-3.5" />
                    <span>Withdraw All ({totalPendingUsdc.toFixed(2)} USDC)</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Balances List */}
          <div className="space-y-2 mb-3">
            {/* USDC Row */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-cyan-500/20 hover:border-cyan-500/40 transition-colors">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-cyan-400 font-bold text-xs">
                  $
                </div>
                <div>
                  <div className="text-xs font-semibold text-white">USDC</div>
                  <div className="text-[10px] text-zinc-400">Veris Payment Asset</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold font-mono text-cyan-300">
                  {usdcBalance}
                </div>
                <div className="text-[10px] text-zinc-500">6 Decimals</div>
              </div>
            </div>

            {/* MON Native Row */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-purple-500/20 hover:border-purple-500/40 transition-colors">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-400 font-bold text-xs">
                  M
                </div>
                <div>
                  <div className="text-xs font-semibold text-white">MON</div>
                  <div className="text-[10px] text-zinc-400">Native Gas Token</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold font-mono text-purple-300">
                  {monBalance}
                </div>
                <div className="text-[10px] text-zinc-500">Gas & Tx Fees</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
