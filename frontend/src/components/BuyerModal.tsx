import React, { useState, useEffect } from "react";
import { useIsLoggedIn } from "@dynamic-labs/sdk-react-core";
import { useBuyerFlow } from "../hooks/useBuyerFlow";
import { useUsdcBalance } from "../hooks/useUsdcBalance";
import {
  HARD_SPENDING_CAP_USDC,
  type MarketplaceDataset,
} from "../lib/contracts";
import {
  X,
  ShieldAlert,
  ShieldCheck,
  ExternalLink,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { OpenBookStepper, OpenBookTxCard } from "./OpenBookReceipt";

interface BuyerModalProps {
  dataset: MarketplaceDataset | null;
  onClose: () => void;
}

export const BuyerModal: React.FC<BuyerModalProps> = ({ dataset, onClose }) => {
  const isLoggedIn = useIsLoggedIn();
  const { step, error, receipt, executeJobPurchase, reset } = useBuyerFlow();
  const { usdcBalance, isLoading: isBalanceLoading } = useUsdcBalance();
  const [customBudget, setCustomBudget] = useState<string>(
    dataset ? dataset.priceUsdc.toString() : "0.25"
  );
  const [simulateStale, setSimulateStale] = useState<boolean>(false);

  const budgetNumber = parseFloat(customBudget) || 0;
  const isOverCap = budgetNumber > HARD_SPENDING_CAP_USDC;

  const handleClose = () => {
    reset();
    onClose();
  };

  // Close on Escape key press
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Lock background body scroll while modal is active
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  if (!dataset) return null;

  const handlePurchase = async () => {
    if (isOverCap || budgetNumber <= 0) return;
    try {
      await executeJobPurchase(dataset, budgetNumber, simulateStale);
    } catch {
      // Error handled in hook state
    }
  };

  return (
    <div
      onClick={handleClose}
      className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md animate-in fade-in duration-200 p-3 sm:p-4 md:p-6 flex items-start sm:items-center justify-center cursor-pointer"
      role="dialog"
      aria-modal="true"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="glass-panel w-full max-w-xl max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-2.5rem)] overflow-y-auto rounded-2xl border border-white/10 p-5 sm:p-6 md:p-8 bg-[#0f0d22] relative shadow-2xl shadow-[#836ef9]/20 my-auto cursor-default scrollbar-thin"
      >
        {/* Sticky Close Button (always reachable even after scrolling) */}
        <button
          id="btn-close-buyer-modal"
          type="button"
          onClick={handleClose}
          aria-label="Close modal"
          className="sticky top-0 float-right -mt-1 -mr-1 z-30 text-zinc-400 hover:text-white p-2 rounded-xl bg-[#0f0d22]/90 hover:bg-white/10 border border-white/10 backdrop-blur-md transition-colors cursor-pointer"
        >
          <X className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* Header */}
        <div className="mb-4 sm:mb-6 pr-8">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="badge badge-monad text-[10px]">{dataset.category}</span>
            <span className="badge badge-fresh text-[10px]">
              ≤ {dataset.freshnessSlaSeconds}s SLA Promise
            </span>
          </div>
          <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white font-['Outfit']">
            Purchase Verified Data Feed
          </h3>
          <p className="text-xs text-zinc-400 mt-1">
            Atomic freshness guarantee: Payment settles instantly when SLA is met, or automatically refunds if stale.
          </p>
        </div>

        {/* Dataset Summary Box */}
        <div className="bg-black/40 rounded-xl p-3.5 sm:p-4 border border-white/5 mb-4 sm:mb-5 space-y-2 text-xs">
          <div className="flex justify-between items-center gap-2">
            <span className="text-zinc-400 shrink-0">Dataset Query:</span>
            <span className="font-semibold text-white truncate text-right">{dataset.name}</span>
          </div>
          <div className="flex justify-between items-center gap-2">
            <span className="text-zinc-400 shrink-0">Seller / Provider ID:</span>
            <span className="font-semibold text-purple-300 font-mono bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20 text-[11px] truncate">
              {dataset.sellerId}
            </span>
          </div>
          <div className="flex justify-between items-center gap-2">
            <span className="text-zinc-400 shrink-0">Promised Freshness:</span>
            <span className="font-semibold text-cyan-400">Within {dataset.freshnessSlaSeconds} seconds</span>
          </div>
          <div className="flex justify-between items-center gap-2">
            <span className="text-zinc-400 shrink-0">Historical SLA Met:</span>
            <span className="font-semibold text-emerald-400">
              {(dataset.reliabilityBps / 100).toFixed(1)}% ({dataset.totalJobs} jobs)
            </span>
          </div>
        </div>

        {/* Hard Client-Side Spending Cap Warning */}
        <div className="bg-purple-950/30 border border-purple-500/30 rounded-xl p-3 mb-4 sm:mb-5 flex items-start gap-3 text-xs">
          <ShieldCheck className="w-4 h-4 text-[#836ef9] shrink-0 mt-0.5" />
          <div className="text-zinc-300">
            <span className="font-semibold text-white block">Client-Side Hard Spending Cap Enforced</span>
            Veris protects buyer agents by capping single-call spending at{" "}
            <span className="text-[#a797ff] font-semibold">${HARD_SPENDING_CAP_USDC} USDC</span>. Calls above this
            limit are rejected before requesting wallet signatures.
          </div>
        </div>

        {/* Budget Input & Cap Validation */}
        <div className="mb-5 sm:mb-6">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-zinc-300">
              Purchase Price (USDC)
            </label>
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-zinc-400">Available:</span>
              <span className="font-mono font-semibold text-cyan-300">
                {isBalanceLoading ? "..." : `${usdcBalance} USDC`}
              </span>
            </div>
          </div>
          <div className="relative">
            <input
              id="buyer-budget-input"
              type="number"
              step="0.05"
              min="0.01"
              max={HARD_SPENDING_CAP_USDC}
              value={customBudget}
              disabled={step !== "idle" && step !== "error"}
              onChange={(e) => setCustomBudget(e.target.value)}
              className={`w-full bg-zinc-900 border rounded-xl px-4 py-2.5 text-sm font-semibold text-white focus:outline-none transition-colors ${
                isOverCap
                  ? "border-rose-500 focus:border-rose-500 bg-rose-950/20"
                  : "border-white/10 focus:border-[#836ef9]"
              }`}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-500">
              USDC
            </span>
          </div>

          {/* SLA Breach simulation toggle */}
          <div className="mt-2.5 flex items-center justify-between text-xs">
            <label className="inline-flex items-center gap-2 cursor-pointer select-none text-neutral-400 hover:text-neutral-200 transition-colors">
              <input
                type="checkbox"
                checked={simulateStale}
                disabled={step !== "idle" && step !== "error"}
                onChange={(e) => setSimulateStale(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-white/20 bg-neutral-900 text-purple-600 focus:ring-0 cursor-pointer"
              />
              <span className="text-[11.5px]">or make it fail: simulate stale data (&gt; {dataset.freshnessSlaSeconds}s) to verify 100% refund</span>
            </label>
          </div>

          {isOverCap && (
            <p className="text-xs text-rose-400 mt-2 flex items-center gap-1.5 font-medium">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              Budget exceeds the hard cap of ${HARD_SPENDING_CAP_USDC} USDC! Signature request blocked.
            </p>
          )}

          {!isOverCap && parseFloat(usdcBalance) < budgetNumber && (
            <div className="mt-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                <span>Insufficient USDC balance for this purchase.</span>
              </div>
              <a
                href="https://faucet.circle.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-cyan-300 hover:text-white font-medium underline shrink-0 cursor-pointer"
              >
                <span>Circle Faucet</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
        </div>

        {/* Stepper Progress */}
        {step !== "idle" && (
          <div className="mb-5">
            <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-1 font-mono">
              Escrow Lifecycle Stepper
            </div>
            <OpenBookStepper currentStep={step} receipt={receipt} isStaleOutcome={simulateStale} />
          </div>
        )}

        {/* Error message display */}
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3.5 mb-5 text-xs text-rose-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <span className="font-semibold block font-mono">Transaction Reverted</span>
              <span className="font-mono text-[11px] break-all leading-relaxed">{error}</span>
            </div>
          </div>
        )}

        {/* Rubber-Stamp Tx Receipt & KvBlock Card */}
        {receipt && step === "completed" && (
          <div className="mb-6 animate-in fade-in">
            <OpenBookTxCard
              receipt={receipt}
              datasetName={dataset.name}
              budgetUsdc={budgetNumber}
              freshnessSlaSeconds={dataset.freshnessSlaSeconds}
            />
          </div>
        )}

        {/* Action Button - Sticky Bottom Bar so always visible and reachable */}
        <div className="sticky -bottom-5 sm:-bottom-6 md:-bottom-8 -mx-5 sm:-mx-6 md:-mx-8 px-5 sm:px-6 md:px-8 py-3.5 bg-[#0f0d22]/95 backdrop-blur-md border-t border-white/10 mt-5 flex items-center justify-end gap-3 z-20">
          <button
            type="button"
            onClick={handleClose}
            className="btn-secondary text-xs py-2 px-4 cursor-pointer"
          >
            {step === "completed" ? "Close" : "Cancel"}
          </button>

          {step !== "completed" && (
            <button
              id="buyer-confirm-btn"
              disabled={isOverCap || budgetNumber <= 0 || (step !== "idle" && step !== "error") || !isLoggedIn}
              onClick={handlePurchase}
              className={`text-xs py-2 px-5 flex items-center gap-2 rounded-xl font-semibold transition-all cursor-pointer shadow-lg ${
                simulateStale
                  ? "bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white shadow-amber-950/40"
                  : "btn-primary"
              }`}
            >
              {step !== "idle" && step !== "error" ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : !isLoggedIn ? (
                <span>Sign in to Purchase</span>
              ) : (
                <span>Confirm</span>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
