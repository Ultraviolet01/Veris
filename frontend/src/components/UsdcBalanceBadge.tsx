import React, { useState, useRef, useEffect } from "react";
import { useUsdcBalance } from "../hooks/useUsdcBalance";
import { ADDRESSES, MONAD_TESTNET_EXPLORER } from "../lib/contracts";
import {
  Coins,
  RefreshCw,
  ExternalLink,
  Copy,
  Check,
  Droplets,
  Info,
  ChevronDown,
} from "lucide-react";

export const UsdcBalanceBadge: React.FC = () => {
  const { usdcBalance, monBalance, isLoading, refetch, walletAddress } = useUsdcBalance();
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
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

  const handleCopyContract = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(ADDRESSES.paymentToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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

          {/* Note on Dynamic */}
          <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 text-[11px] text-zinc-400 space-y-1 mb-3">
            <div className="flex items-start gap-1.5 text-zinc-300 font-medium">
              <Info className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
              <span>Why Dynamic only shows MON:</span>
            </div>
            <p className="text-[10.5px] leading-relaxed text-zinc-400">
              Dynamic&apos;s embedded wallet only queries native gas (<code className="text-purple-300">MON</code>) on custom EVM testnets. Veris tracks your official <code className="text-cyan-300">USDC</code> payment balance directly on Monad Testnet.
            </p>
          </div>

          {/* Quick Actions & Faucet Links */}
          <div className="space-y-1.5 pt-1">
            <a
              href="https://faucet.circle.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-gradient-to-r from-blue-600/20 to-cyan-600/20 hover:from-blue-600/30 hover:to-cyan-600/30 border border-cyan-500/30 text-xs font-medium text-cyan-300 hover:text-white transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Droplets className="w-3.5 h-3.5 text-cyan-400" />
                <span>Get Testnet USDC (Circle Faucet)</span>
              </div>
              <ExternalLink className="w-3 h-3 text-cyan-400" />
            </a>

            <div className="flex items-center gap-1.5 pt-1">
              <button
                onClick={handleCopyContract}
                className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] text-zinc-300 hover:text-white transition-colors cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 text-zinc-400" />
                    <span>Copy USDC Address</span>
                  </>
                )}
              </button>

              <a
                href={`${MONAD_TESTNET_EXPLORER}/token/${ADDRESSES.paymentToken}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] text-zinc-300 hover:text-white transition-colors cursor-pointer"
                title="View USDC on MonadScan"
              >
                <span>MonadScan</span>
                <ExternalLink className="w-3 h-3 text-zinc-400" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
