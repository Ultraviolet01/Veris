import React, { useState } from "react";
import { useIsLoggedIn } from "@dynamic-labs/sdk-react-core";
import { useBuyerFlow } from "../hooks/useBuyerFlow";
import { useUsdcBalance } from "../hooks/useUsdcBalance";
import {
  HARD_SPENDING_CAP_USDC,
  MONAD_TESTNET_EXPLORER,
  type MarketplaceDataset,
} from "../lib/contracts";
import {
  X,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  Zap,
} from "lucide-react";
import { DataPayloadViewer } from "./DataPayloadViewer";

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

  if (!dataset) return null;

  const budgetNumber = parseFloat(customBudget) || 0;
  const isOverCap = budgetNumber > HARD_SPENDING_CAP_USDC;

  const handlePurchase = async () => {
    if (isOverCap || budgetNumber <= 0) return;
    try {
      await executeJobPurchase(dataset, budgetNumber);
    } catch {
      // Error handled in hook state
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="glass-panel w-full max-w-xl rounded-2xl border border-white/10 p-6 md:p-8 bg-[#0f0d22] relative shadow-2xl shadow-[#836ef9]/20">
        {/* Close Button */}
        <button
          id="btn-close-buyer-modal"
          onClick={handleClose}
          className="absolute top-5 right-5 text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="badge badge-monad text-[10px]">{dataset.category}</span>
            <span className="badge badge-fresh text-[10px]">
              ≤ {dataset.freshnessSlaSeconds}s SLA Promise
            </span>
          </div>
          <h3 className="text-xl md:text-2xl font-bold text-white font-['Outfit']">
            Purchase Verified Data Feed
          </h3>
          <p className="text-xs text-zinc-400 mt-1">
            Atomic freshness guarantee: Payment settles instantly when SLA is met, or automatically refunds if stale.
          </p>
        </div>

        {/* Dataset Summary Box */}
        <div className="bg-black/40 rounded-xl p-4 border border-white/5 mb-5 space-y-2 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-zinc-400">Dataset Query:</span>
            <span className="font-semibold text-white">{dataset.name}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-zinc-400">Seller / Provider ID:</span>
            <span className="font-semibold text-purple-300 font-mono bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
              {dataset.sellerId}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-zinc-400">Promised Freshness Window:</span>
            <span className="font-semibold text-cyan-400">Within {dataset.freshnessSlaSeconds} seconds</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-zinc-400">Seller Historical SLA Met:</span>
            <span className="font-semibold text-emerald-400">
              {(dataset.reliabilityBps / 100).toFixed(1)}% ({dataset.totalJobs} jobs)
            </span>
          </div>
        </div>

        {/* Hard Client-Side Spending Cap Warning */}
        <div className="bg-purple-950/30 border border-purple-500/30 rounded-xl p-3 mb-5 flex items-start gap-3 text-xs">
          <ShieldCheck className="w-4 h-4 text-[#836ef9] shrink-0 mt-0.5" />
          <div className="text-zinc-300">
            <span className="font-semibold text-white block">Client-Side Hard Spending Cap Enforced</span>
            Veris protects buyer agents by capping single-call spending at{" "}
            <span className="text-[#a797ff] font-semibold">${HARD_SPENDING_CAP_USDC} USDC</span>. Calls above this
            limit are rejected before requesting wallet signatures.
          </div>
        </div>

        {/* Budget Input & Cap Validation */}
        <div className="mb-6">
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

          {isOverCap && (
            <p className="text-xs text-rose-400 mt-2 flex items-center gap-1.5 font-medium">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              Budget exceeds the hard cap of ${HARD_SPENDING_CAP_USDC} USDC! Signature request blocked.
            </p>
          )}

          {!isOverCap && parseFloat(usdcBalance) < budgetNumber && (
            <div className="mt-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-center justify-between">
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
          <div className="bg-black/50 border border-white/10 rounded-xl p-4 mb-6 space-y-3">
            <div className="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
              Execution Progress
            </div>

            {/* Step 1: Cap check */}
            <div className="flex items-center gap-3 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-zinc-200">1. Client spending cap validated (≤ ${HARD_SPENDING_CAP_USDC} USDC)</span>
            </div>

            {/* Step 2: Approve */}
            <div className="flex items-center gap-3 text-xs">
              {step === "approving" ? (
                <RefreshCw className="w-4 h-4 text-[#836ef9] animate-spin shrink-0" />
              ) : step === "validating_cap" ? (
                <div className="w-4 h-4 rounded-full border border-zinc-600 shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              )}
              <span className={step === "approving" ? "text-white font-semibold" : "text-zinc-400"}>
                2. Approve USDC payment token
              </span>
            </div>

            {/* Step 3: Create Order */}
            <div className="flex items-center gap-3 text-xs">
              {step === "creating_job" ? (
                <RefreshCw className="w-4 h-4 text-[#836ef9] animate-spin shrink-0" />
              ) : step === "funding_job" || step === "job_active" || step === "completed" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <div className="w-4 h-4 rounded-full border border-zinc-600 shrink-0" />
              )}
              <span className={step === "creating_job" ? "text-white font-semibold" : "text-zinc-400"}>
                3. Create verification order on Monad
              </span>
            </div>

            {/* Step 4: Authorize Payment */}
            <div className="flex items-center gap-3 text-xs">
              {step === "funding_job" ? (
                <RefreshCw className="w-4 h-4 text-[#836ef9] animate-spin shrink-0" />
              ) : step === "job_active" || step === "completed" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <div className="w-4 h-4 rounded-full border border-zinc-600 shrink-0" />
              )}
              <span className={step === "funding_job" ? "text-white font-semibold" : "text-zinc-400"}>
                4. Authorize settlement payment
              </span>
            </div>

            {/* Step 5: SLA Resolution */}
            <div className="flex items-center gap-3 text-xs">
              {step === "job_active" ? (
                <Clock className="w-4 h-4 text-cyan-400 animate-spin shrink-0" />
              ) : step === "completed" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <div className="w-4 h-4 rounded-full border border-zinc-600 shrink-0" />
              )}
              <span className={step === "completed" ? "text-emerald-300 font-semibold" : "text-zinc-400"}>
                5. Operator Attestation & SLA Hook Resolution
              </span>
            </div>
          </div>
        )}

        {/* Error message display */}
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3.5 mb-5 text-xs text-rose-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block">Transaction Failed</span>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Completed Receipt & Delivered Data Payload Card */}
        {receipt && step === "completed" && (
          <div className="space-y-3 mb-6 animate-in fade-in">
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 text-xs text-emerald-200 space-y-2">
              <div className="flex items-center justify-between font-bold text-white text-sm">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  Purchase Complete · SLA Verified Fresh!
                </span>
                <span>Order #{receipt.jobId}</span>
              </div>
              <p className="text-zinc-300">
                Data attestation validated against Monad block timestamp. Data was genuinely fresh (within {receipt.freshnessSlaSeconds}s). Seller received payment; reputation score incremented.
              </p>
              {receipt.txFund && (
                <a
                  href={`${MONAD_TESTNET_EXPLORER}/tx/${receipt.txFund}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[#a797ff] hover:underline font-mono text-[11px] pt-1"
                >
                  <span>View MonadScan Tx</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            {/* Delivered Data Payload */}
            {receipt.dataPayload && (
              <DataPayloadViewer
                datasetName={dataset.name}
                payload={receipt.dataPayload}
                jobId={receipt.jobId}
                dataAgeSeconds={receipt.dataAgeSeconds}
                slaSeconds={receipt.freshnessSlaSeconds}
              />
            )}
          </div>
        )}

        {/* Action Button */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="btn-secondary text-xs py-2.5 px-4"
          >
            {step === "completed" ? "Close" : "Cancel"}
          </button>

          {step !== "completed" && (
            <button
              id="buyer-confirm-btn"
              disabled={isOverCap || budgetNumber <= 0 || (step !== "idle" && step !== "error") || !isLoggedIn}
              onClick={handlePurchase}
              className="btn-primary text-xs py-2.5 px-5 flex items-center gap-2"
            >
              {step !== "idle" && step !== "error" ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Processing Purchase...</span>
                </>
              ) : !isLoggedIn ? (
                <span>Sign in to Purchase</span>
              ) : (
                <>
                  <span>Confirm & Buy (${budgetNumber.toFixed(2)} USDC)</span>
                  <Zap className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
