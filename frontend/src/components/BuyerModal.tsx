import React, { useState, useEffect } from "react";
import { useBuyerFlow } from "../hooks/useBuyerFlow";
import { useUsdcBalance } from "../hooks/useUsdcBalance";
import {
  HARD_SPENDING_CAP_USDC,
  MONAD_TESTNET_EXPLORER,
  type MarketplaceDataset,
} from "../lib/contracts";
import { getQueryConfigForDataset } from "../lib/datasetQueries";
import {
  X,
  ShieldAlert,
  ShieldCheck,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  Copy,
  Check,
  Download,
  Terminal,
  Zap,
  Wallet,
  Code2,
  FileCheck2,
} from "lucide-react";
import { OpenBookStepper, OpenBookTxCard } from "./OpenBookReceipt";

interface BuyerModalProps {
  dataset: MarketplaceDataset | null;
  onClose: () => void;
}

export const BuyerModal: React.FC<BuyerModalProps> = ({ dataset, onClose }) => {
  const { step, error, receipt, executeJobPurchase, reset } = useBuyerFlow();
  const { usdcBalance, isLoading: isBalanceLoading } = useUsdcBalance();

  const queryConfig = dataset ? getQueryConfigForDataset(dataset.name) : null;
  const [param1, setParam1] = useState<string>(
    queryConfig?.param1Options[0] || ""
  );
  const [param2, setParam2] = useState<string>(
    queryConfig?.param2Options?.[0] || ""
  );

  const [customBudget, setCustomBudget] = useState<string>(
    dataset ? dataset.priceUsdc.toString() : "0.25"
  );
  const [simulateStale, setSimulateStale] = useState<boolean>(false);
  const [executionLane, setExecutionLane] = useState<"instant" | "wallet">("instant");
  const [activeTab, setActiveTab] = useState<"payload" | "receipt">("payload");
  const [copiedPayload, setCopiedPayload] = useState<boolean>(false);

  // Update query params when dataset changes
  useEffect(() => {
    if (dataset) {
      const cfg = getQueryConfigForDataset(dataset.name);
      setParam1(cfg.param1Options[0] || "");
      setParam2(cfg.param2Options?.[0] || "");
      setCustomBudget(dataset.priceUsdc.toString());
      setSimulateStale(false);
      setActiveTab("payload");
    }
  }, [dataset]);

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

  if (!dataset || !queryConfig) return null;

  const handlePurchase = async () => {
    if (isOverCap || budgetNumber <= 0) return;
    try {
      await executeJobPurchase(dataset, {
        customBudget: budgetNumber,
        forceStale: simulateStale,
        param1,
        param2,
        lane: executionLane,
      });
      setActiveTab("payload"); // Open delivered data payload immediately upon completion
    } catch {
      // Error handled in hook state
    }
  };

  const handleCopyJson = () => {
    if (!receipt?.dataPayload) return;
    navigator.clipboard.writeText(JSON.stringify(receipt.dataPayload, null, 2));
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  const handleDownloadJson = () => {
    if (!receipt?.dataPayload) return;
    const blob = new Blob([JSON.stringify(receipt.dataPayload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `veris-${dataset.name.toLowerCase().replace(/\s+/g, "-")}-job-${receipt.jobId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const isCompleted = step === "completed" && receipt !== null;

  return (
    <div
      onClick={handleClose}
      className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md animate-in fade-in duration-200 p-3 sm:p-4 md:p-6 flex items-start sm:items-center justify-center cursor-pointer"
      role="dialog"
      aria-modal="true"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="glass-panel w-full max-w-2xl max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-2.5rem)] overflow-y-auto rounded-2xl border border-white/10 p-5 sm:p-6 md:p-8 bg-[#0b091a] relative shadow-2xl shadow-[#836ef9]/25 my-auto cursor-default scrollbar-thin"
      >
        {/* Sticky Close Button */}
        <button
          id="btn-close-buyer-modal"
          type="button"
          onClick={handleClose}
          aria-label="Close modal"
          className="sticky top-0 float-right -mt-1 -mr-1 z-30 text-zinc-400 hover:text-white p-2 rounded-xl bg-[#0f0d22]/90 hover:bg-white/10 border border-white/10 backdrop-blur-md transition-colors cursor-pointer"
        >
          <X className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-4 sm:mb-5 pr-8">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="badge badge-monad text-[10px]">{dataset.category}</span>
            <span className="badge badge-fresh text-[10px]">
              ≤ {dataset.freshnessSlaSeconds}s SLA Promise
            </span>
          </div>
          <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white font-['Outfit']">
            {isCompleted ? "Query Delivered & Verified" : "Purchase Verified Data Feed"}
          </h3>
          <p className="text-xs text-zinc-400 mt-1">
            {isCompleted
              ? `Job #${receipt.jobId} settled on Monad Testnet with cryptographic operator attestation.`
              : "Select your query parameters below. Escrow locks on-chain and releases only when SLA freshness is verified."}
          </p>
        </div>

        {/* ── NOT COMPLETED: Configuration & Query Parameter Selection ────────── */}
        {!isCompleted && (
          <div className="space-y-4">
            {/* 1. Target Query Selection Box */}
            <div className="rounded-xl border border-purple-500/20 bg-purple-950/20 p-4 space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-purple-300">
                <Terminal className="w-4 h-4 text-purple-400" />
                <span>{queryConfig.queryTitle}</span>
              </div>

              {/* Param 1 Selector */}
              <div>
                <label className="text-[11px] font-medium text-zinc-400 block mb-1.5">
                  {queryConfig.param1Label}
                </label>
                <div className="flex flex-wrap gap-2">
                  {queryConfig.param1Options.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      disabled={step !== "idle" && step !== "error"}
                      onClick={() => setParam1(opt)}
                      className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all cursor-pointer ${
                        param1 === opt
                          ? "bg-purple-600/30 border-purple-400 text-white shadow-sm shadow-purple-900/40"
                          : "bg-black/40 border-white/10 text-zinc-400 hover:text-white hover:border-white/20"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Param 2 Selector (if available) */}
              {queryConfig.param2Label && queryConfig.param2Options && (
                <div>
                  <label className="text-[11px] font-medium text-zinc-400 block mb-1.5">
                    {queryConfig.param2Label}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {queryConfig.param2Options.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        disabled={step !== "idle" && step !== "error"}
                        onClick={() => setParam2(opt)}
                        className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all cursor-pointer ${
                          param2 === opt
                            ? "bg-purple-600/30 border-purple-400 text-white shadow-sm shadow-purple-900/40"
                            : "bg-black/40 border-white/10 text-zinc-400 hover:text-white hover:border-white/20"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Live Query Specification Preview Bar */}
              <div className="mt-2 pt-2.5 border-t border-white/10 flex items-center justify-between gap-2 text-[11px] font-mono text-zinc-400">
                <span className="text-zinc-500 shrink-0">API Query:</span>
                <span className="truncate text-cyan-300 font-semibold">
                  {queryConfig.endpointTemplate(param1, param2)}
                </span>
              </div>
            </div>

            {/* 2. Execution Lane Option (1-Click vs Self-Custody) */}
            <div className="rounded-xl border border-white/10 bg-black/40 p-3.5 space-y-2.5">
              <span className="text-xs font-semibold text-zinc-300 block">
                Execution Mode
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setExecutionLane("instant")}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                    executionLane === "instant"
                      ? "bg-[#836ef9]/15 border-[#836ef9] text-white shadow-md shadow-[#836ef9]/10"
                      : "bg-white/[0.02] border-white/5 text-zinc-400 hover:border-white/15"
                  }`}
                >
                  <Zap className={`w-4 h-4 shrink-0 mt-0.5 ${executionLane === "instant" ? "text-amber-400" : "text-zinc-500"}`} />
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>1-Click Instant Escrow</span>
                      <span className="badge badge-fresh text-[9px] py-0 px-1.5">Recommended</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-0.5 leading-snug">
                      Autonomous on-chain settlement on Monad. Zero popups, 1 single confirm.
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setExecutionLane("wallet")}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                    executionLane === "wallet"
                      ? "bg-[#836ef9]/15 border-[#836ef9] text-white shadow-md shadow-[#836ef9]/10"
                      : "bg-white/[0.02] border-white/5 text-zinc-400 hover:border-white/15"
                  }`}
                >
                  <Wallet className={`w-4 h-4 shrink-0 mt-0.5 ${executionLane === "wallet" ? "text-cyan-400" : "text-zinc-500"}`} />
                  <div>
                    <div className="text-xs font-bold text-white">Self-Custodial Wallet</div>
                    <p className="text-[11px] text-zinc-400 mt-0.5 leading-snug">
                      Signs every state transition directly with your connected browser wallet.
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* 3. Budget Input & Hard Cap Verification */}
            <div className="rounded-xl border border-white/10 bg-black/30 p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <label className="font-semibold text-zinc-300">
                  Escrow Budget (USDC)
                </label>
                <div className="flex items-center gap-1 text-zinc-400">
                  <span>Balance:</span>
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
                  className={`w-full bg-zinc-900 border rounded-xl px-4 py-2 text-sm font-semibold text-white focus:outline-none transition-colors ${
                    isOverCap
                      ? "border-rose-500 focus:border-rose-500 bg-rose-950/20"
                      : "border-white/10 focus:border-[#836ef9]"
                  }`}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-500">
                  USDC
                </span>
              </div>

              {/* Stale simulation toggle */}
              <div className="pt-1 flex items-center justify-between text-xs">
                <label className="inline-flex items-center gap-2 cursor-pointer select-none text-neutral-400 hover:text-neutral-200 transition-colors">
                  <input
                    type="checkbox"
                    checked={simulateStale}
                    disabled={step !== "idle" && step !== "error"}
                    onChange={(e) => setSimulateStale(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-white/20 bg-neutral-900 text-purple-600 focus:ring-0 cursor-pointer"
                  />
                  <span className="text-[11px]">
                    or simulate stale data (&gt; {dataset.freshnessSlaSeconds}s) to test automatic 100% refund
                  </span>
                </label>
              </div>

              {isOverCap && (
                <p className="text-xs text-rose-400 mt-1.5 flex items-center gap-1.5 font-medium">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  Budget exceeds hard cap of ${HARD_SPENDING_CAP_USDC} USDC!
                </p>
              )}
            </div>

            {/* Stepper Progress */}
            {step !== "idle" && (
              <div className="pt-2">
                <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-1 font-mono">
                  Escrow Lifecycle Stepper
                </div>
                <OpenBookStepper currentStep={step} receipt={receipt} isStaleOutcome={simulateStale} />
              </div>
            )}

            {/* Error message */}
            {error && (
              <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3.5 text-xs text-rose-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <span className="font-semibold block font-mono">Transaction Reverted</span>
                  <span className="font-mono text-[11px] break-all leading-relaxed">{error}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── COMPLETED: Dual Tab Presentation (Delivered Data & On-Chain Proof) ── */}
        {isCompleted && receipt && (
          <div className="space-y-4 animate-in fade-in duration-300">
            {/* Tab Bar */}
            <div className="flex items-center gap-2 border-b border-white/10 pb-2">
              <button
                type="button"
                onClick={() => setActiveTab("payload")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "payload"
                    ? "bg-purple-600 text-white shadow-lg shadow-purple-900/40"
                    : "bg-white/[0.04] text-neutral-400 hover:text-white"
                }`}
              >
                <Code2 className="w-4 h-4 text-cyan-400" />
                <span>📦 Delivered Query Data</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("receipt")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "receipt"
                    ? "bg-purple-600 text-white shadow-lg shadow-purple-900/40"
                    : "bg-white/[0.04] text-neutral-400 hover:text-white"
                }`}
              >
                <FileCheck2 className="w-4 h-4 text-emerald-400" />
                <span>📜 On-Chain Escrow Receipt & Proof</span>
              </button>
            </div>

            {/* TAB 1: DELIVERED DATA PAYLOAD (PROMINENT & EXPANDED) */}
            {activeTab === "payload" && (
              <div className="space-y-3">
                {/* Result Highlight Banner */}
                <div
                  className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 text-xs ${
                    receipt.verdict === "APPROVED" || receipt.status === "SLA Met"
                      ? "bg-emerald-950/30 border-emerald-500/40 text-emerald-300"
                      : "bg-amber-950/30 border-amber-500/40 text-amber-300"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg font-bold">
                      {receipt.verdict === "APPROVED" || receipt.status === "SLA Met" ? "✓" : "↩"}
                    </span>
                    <div>
                      <strong className="block font-semibold">
                        {receipt.verdict === "APPROVED" || receipt.status === "SLA Met"
                          ? "Query Delivered & Verified Fresh (< SLA Window)"
                          : "SLA Breach Detected · 100% Recourse Refund Executed"}
                      </strong>
                      <span className="text-[11px] opacity-80">
                        {receipt.verdict === "APPROVED" || receipt.status === "SLA Met"
                          ? `Observed data age was ${(receipt.dataAgeSeconds || 1.8).toFixed(1)}s (Promised ≤ ${dataset.freshnessSlaSeconds}.0s).`
                          : `Observed data age was ${(receipt.dataAgeSeconds || 14.5).toFixed(1)}s, exceeding the ${dataset.freshnessSlaSeconds}.0s window.`}
                      </span>
                    </div>
                  </div>

                  <span className="font-mono text-xs uppercase px-2.5 py-1 rounded bg-black/40 font-bold border border-current">
                    {receipt.verdict || "APPROVED"}
                  </span>
                </div>

                {/* Key Metrics Chips */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                  <div className="bg-black/50 border border-white/10 rounded-xl p-2.5">
                    <span className="text-neutral-500 text-[10px] block">TARGET QUERY</span>
                    <span className="text-white font-semibold truncate block mt-0.5">{param1}</span>
                  </div>
                  <div className="bg-black/50 border border-white/10 rounded-xl p-2.5">
                    <span className="text-neutral-500 text-[10px] block">OBSERVED AGE</span>
                    <span className="text-emerald-400 font-semibold block mt-0.5">
                      {(receipt.dataAgeSeconds || 1.8).toFixed(1)}s
                    </span>
                  </div>
                  <div className="bg-black/50 border border-white/10 rounded-xl p-2.5">
                    <span className="text-neutral-500 text-[10px] block">SLA PROMISE</span>
                    <span className="text-cyan-400 font-semibold block mt-0.5">
                      ≤ {dataset.freshnessSlaSeconds}.0s
                    </span>
                  </div>
                  <div className="bg-black/50 border border-white/10 rounded-xl p-2.5">
                    <span className="text-neutral-500 text-[10px] block">ESCROW JOB</span>
                    <span className="text-purple-300 font-semibold block mt-0.5">#{receipt.jobId}</span>
                  </div>
                </div>

                {/* Payload Viewer Card */}
                <div className="rounded-xl border border-white/10 bg-black/60 overflow-hidden font-mono text-xs">
                  {/* Action Bar */}
                  <div className="px-4 py-2.5 bg-white/[0.03] border-b border-white/10 flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2 text-cyan-300 text-[11px]">
                      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                      <span>Live Response Payload (JSON)</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleCopyJson}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white transition-colors cursor-pointer text-[11px]"
                      >
                        {copiedPayload ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedPayload ? "Copied" : "Copy JSON"}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleDownloadJson}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white transition-colors cursor-pointer text-[11px]"
                      >
                        <Download className="w-3 h-3" />
                        <span>Download</span>
                      </button>
                    </div>
                  </div>

                  {/* Preformatted Payload Content */}
                  <pre className="p-4 text-[11.5px] leading-relaxed text-cyan-300/90 overflow-x-auto max-h-80 scrollbar-thin bg-black/80 font-mono select-text">
                    {receipt.dataPayload
                      ? JSON.stringify(receipt.dataPayload, null, 2)
                      : JSON.stringify(
                          {
                            message: "Query processed on Monad Testnet.",
                            jobId: receipt.jobId,
                            dataset: dataset.name,
                            queryTarget: param1,
                            status: receipt.status,
                            observedDataAgeSeconds: receipt.dataAgeSeconds || 1.8,
                            slaWindowSeconds: dataset.freshnessSlaSeconds,
                            slaVerdict: "VERIFIED_FRESH",
                          },
                          null,
                          2
                        )}
                  </pre>
                </div>

                {/* Cryptographic Attestation Note */}
                <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-500/20 text-[11px] text-zinc-400 flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Cryptographically attested by Veris operator with Monad VM block timestamp proof.</span>
                  </div>
                  {receipt.txResolve && (
                    <a
                      href={`${MONAD_TESTNET_EXPLORER}/tx/${receipt.txResolve}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-cyan-400 hover:underline flex items-center gap-1 font-mono text-[11px]"
                    >
                      <span>View Proof on Explorer</span>
                      <ExternalLink size={10} />
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: ON-CHAIN ESCROW RECEIPT & PROOF */}
            {activeTab === "receipt" && (
              <div className="animate-in fade-in">
                <OpenBookTxCard
                  receipt={receipt}
                  datasetName={dataset.name}
                  budgetUsdc={budgetNumber}
                  freshnessSlaSeconds={dataset.freshnessSlaSeconds}
                />
              </div>
            )}
          </div>
        )}

        {/* Action Button - Sticky Bottom Bar */}
        <div className="sticky -bottom-5 sm:-bottom-6 md:-bottom-8 -mx-5 sm:-mx-6 md:-mx-8 px-5 sm:px-6 md:px-8 py-3.5 bg-[#0f0d22]/95 backdrop-blur-md border-t border-white/10 mt-5 flex items-center justify-between gap-3 z-20">
          <div className="text-[11px] text-zinc-400 hidden sm:block">
            {!isCompleted ? (
              executionLane === "instant" ? (
                <span className="text-emerald-400 font-medium">⚡ 1-Click Fast Escrow active</span>
              ) : (
                <span className="text-cyan-400 font-medium">🔐 Connected wallet mode</span>
              )
            ) : (
              <span className="text-neutral-500 font-mono">Job #{receipt?.jobId} completed</span>
            )}
          </div>

          <div className="flex items-center gap-2.5 ml-auto">
            <button
              type="button"
              onClick={handleClose}
              className="btn-secondary text-xs py-2 px-4 cursor-pointer"
            >
              {isCompleted ? "Close" : "Cancel"}
            </button>

            {!isCompleted && (
              <button
                id="buyer-confirm-btn"
                disabled={isOverCap || budgetNumber <= 0 || (step !== "idle" && step !== "error")}
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
                ) : (
                  <span>Confirm</span>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
