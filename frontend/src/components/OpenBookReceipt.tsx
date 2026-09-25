import React, { useState } from "react";
import {
  Check,
  Copy,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  RotateCcw,
} from "lucide-react";
import { MONAD_TESTNET_EXPLORER } from "../lib/contracts";
import type { JobExecutionReceipt, BuyerStep } from "../hooks/useBuyerFlow";
import { DeliveredDataView } from "./DeliveredDataView";

export type PurchaseStepKey = "quote" | "pay" | "deliver" | "verdict" | "settle" | "split";

export interface StepperStep {
  key: PurchaseStepKey;
  title: string;
  what: string;
  status: "waiting" | "running" | "done" | "failed";
  txHash?: string;
  detail?: string;
}

export function truncateHash(hash: string, start = 8, end = 6): string {
  if (!hash || hash.length <= start + end) return hash || "";
  return `${hash.slice(0, start)}...${hash.slice(-end)}`;
}

/**
 * HashChip — Inline copyable hash chip with visual feedback (matches OpenBook HashChip.tsx)
 */
export function HashChip({ hash }: { hash: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      title="Copy full transaction hash"
      className="inline-flex items-center gap-1 text-[11px] font-mono text-neutral-400 hover:text-white px-1.5 py-0.5 rounded bg-white/5 hover:bg-white/10 border border-white/5 transition-colors cursor-pointer"
    >
      {copied ? (
        <>
          <Check size={11} className="text-emerald-400" />
          <span className="text-emerald-400 font-semibold">Copied!</span>
        </>
      ) : (
        <>
          <Copy size={11} />
          <span>Copy</span>
        </>
      )}
    </button>
  );
}

/**
 * OpenBookStepper — Canonical 6-step progress stepper (matches OpenBook Stepper.tsx)
 */
export function OpenBookStepper({
  currentStep,
  receipt,
  isStaleOutcome = false,
}: {
  currentStep: BuyerStep;
  receipt: JobExecutionReceipt | null;
  isStaleOutcome?: boolean;
}) {
  const isCompleted = currentStep === "completed" || receipt?.status === "SLA Met" || receipt?.status === "Refunded";
  const isRefunded = isStaleOutcome || receipt?.verdict === "REFUNDED" || receipt?.outcome === "refunded";

  const getStepStatus = (stepKey: PurchaseStepKey): "waiting" | "running" | "done" | "failed" => {
    if (isCompleted) {
      if (stepKey === "split" && isRefunded) return "waiting";
      return "done";
    }

    if (stepKey === "quote") {
      return currentStep === "validating_cap" ? "running" : currentStep !== "idle" ? "done" : "waiting";
    }
    if (stepKey === "pay") {
      if (currentStep === "approving" || currentStep === "creating_job" || currentStep === "setting_budget" || currentStep === "funding_job") return "running";
      if (currentStep === "job_active") return "done";
      return "waiting";
    }
    if (stepKey === "deliver" || stepKey === "verdict" || stepKey === "settle") {
      if (currentStep === "job_active") return "running";
      return "waiting";
    }
    return "waiting";
  };

  const steps: StepperStep[] = [
    {
      key: "quote",
      title: "Price read from Registry",
      what: "the seller's price and freshness promise, read live from SellerRegistry",
      status: getStepStatus("quote"),
    },
    {
      key: "pay",
      title: "Paid into escrow",
      what: "the freshness floor is locked in with the payment into ACPCore.sol",
      status: getStepStatus("pay"),
      txHash: receipt?.txFund,
    },
    {
      key: "deliver",
      title: "Data delivered",
      what: "one live query through decentralized node, stamped with source block timestamp",
      status: getStepStatus("deliver"),
    },
    {
      key: "verdict",
      title: "Freshness checked",
      what: "the delivered block timestamp is compared with the SLA floor, onchain",
      status: getStepStatus("verdict"),
    },
    {
      key: "settle",
      title: isCompleted ? (isRefunded ? "Refunded" : "Settled") : "Settled or refunded",
      what: isRefunded
        ? "the escrow automatically refunds 100% of escrow back to the buyer wallet"
        : "the escrow pays the seller, or returns the money",
      status: getStepStatus("settle"),
      txHash: receipt?.txResolve,
    },
    {
      key: "split",
      title: "Fee split",
      what: isRefunded ? "no fee deducted on breach · full refund" : "98% to the seller, 2% protocol fee to the treasury",
      status: getStepStatus("split"),
    },
  ];

  return (
    <ol className="divide-y divide-white/5 border border-white/10 rounded-2xl bg-[#06080e] overflow-hidden my-4 text-xs font-mono" aria-live="polite">
      {steps.map((s, idx) => {
        const isRefundRow = s.key === "settle" && isRefunded && s.status === "done";
        return (
          <li
            key={s.key}
            className={`p-3 sm:px-4 flex items-start gap-3 transition-colors ${
              s.status === "running"
                ? "bg-purple-950/20"
                : isRefundRow
                ? "bg-amber-950/15"
                : s.status === "done"
                ? "bg-emerald-950/10"
                : "bg-transparent"
            }`}
          >
            {/* Step Mark Badge */}
            <span
              className={`flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold shrink-0 mt-0.5 ${
                s.status === "done"
                  ? isRefundRow
                    ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                    : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                  : s.status === "running"
                  ? "bg-purple-500/20 text-purple-300 border border-purple-500/40 animate-pulse"
                  : s.status === "failed"
                  ? "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                  : "bg-neutral-800 text-neutral-500 border border-neutral-700"
              }`}
            >
              {s.status === "running" ? (
                <RotateCcw size={10} className="animate-spin text-purple-400" />
              ) : s.status === "done" ? (
                isRefundRow ? "↩" : "✓"
              ) : s.status === "failed" ? (
                "!"
              ) : (
                idx + 1
              )}
            </span>

            {/* Step Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <strong
                  className={`font-semibold text-xs ${
                    s.status === "done"
                      ? isRefundRow
                        ? "text-amber-300"
                        : "text-emerald-300"
                      : s.status === "running"
                      ? "text-white"
                      : "text-neutral-400"
                  }`}
                >
                  {s.title}
                </strong>

                {s.status === "running" && (
                  <span className="text-[10px] text-purple-300 animate-pulse">working…</span>
                )}

                {s.txHash && (
                  <a
                    href={`${MONAD_TESTNET_EXPLORER}/tx/${s.txHash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 underline font-mono"
                  >
                    <span>{truncateHash(s.txHash, 8, 6)}</span>
                    <ExternalLink size={10} />
                  </a>
                )}
              </div>
              <p className="text-[11px] text-neutral-400 mt-0.5 leading-relaxed font-sans">{s.what}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/**
 * OpenBookTxCard — Canonical Rubber-Stamp Receipt Card (matches OpenBook TxBlock.tsx + KvBlock.tsx + verdict.ts)
 */
export function OpenBookTxCard({
  receipt,
  datasetName,
  budgetUsdc,
  freshnessSlaSeconds,
}: {
  receipt: JobExecutionReceipt;
  datasetName: string;
  budgetUsdc: number;
  freshnessSlaSeconds: number;
}) {
  const [detailsOpen, setDetailsOpen] = useState(true);
  const isRefunded = receipt.verdict === "REFUNDED" || receipt.outcome === "refunded" || receipt.status === "Refunded";
  const stampVerdict = receipt.verdict || (isRefunded ? "REFUNDED" : "APPROVED");
  const age = receipt.dataAgeSeconds ?? 2.4;
  const isFresh = age <= freshnessSlaSeconds && !isRefunded;

  const total = budgetUsdc;
  const sellerShare = Number((total * 0.98).toFixed(4));
  const treasuryShare = Number((total * 0.02).toFixed(4));

  return (
    <div className="rounded-2xl border border-white/10 bg-[#06080f] p-5 sm:p-6 shadow-2xl font-mono space-y-4">
      {/* tape__txhead: Rubber-Stamp Verdict Header */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-dashed border-white/15 flex-wrap">
        <div className="flex items-center gap-2.5">
          {/* Rubber-Stamp Badge */}
          <span
            className={`font-mono font-bold text-sm tracking-widest uppercase border-2 px-3 py-1 rounded-sm shadow-sm ${
              stampVerdict === "APPROVED"
                ? "text-emerald-400 border-emerald-500 bg-emerald-500/10 shadow-emerald-950/40"
                : stampVerdict === "REFUNDED"
                ? "text-amber-400 border-amber-500 bg-amber-500/10 shadow-amber-950/40"
                : "text-rose-400 border-rose-500 bg-rose-500/10 shadow-rose-950/40"
            }`}
          >
            {stampVerdict}
          </span>

          <span className="text-xs text-neutral-400 hidden sm:inline">
            {stampVerdict === "APPROVED" ? "SLA Verified Fresh" : "100% Recourse Refund"}
          </span>
        </div>

        {/* Transaction Link & HashChip */}
        <div className="flex items-center gap-2">
          {receipt.txResolve ? (
            <>
              <a
                href={`${MONAD_TESTNET_EXPLORER}/tx/${receipt.txResolve}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold underline underline-offset-2 flex items-center gap-1"
              >
                <span>{truncateHash(receipt.txResolve, 10, 8)}</span>
                <ExternalLink size={12} />
              </a>
              <HashChip hash={receipt.txResolve} />
            </>
          ) : receipt.txFund ? (
            <>
              <a
                href={`${MONAD_TESTNET_EXPLORER}/tx/${receipt.txFund}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold underline underline-offset-2 flex items-center gap-1"
              >
                <span>{truncateHash(receipt.txFund, 10, 8)}</span>
                <ExternalLink size={12} />
              </a>
              <HashChip hash={receipt.txFund} />
            </>
          ) : (
            <span className="text-[11px] text-neutral-500">Live Escrow Monad Testnet</span>
          )}
        </div>
      </div>

      {/* Dataset Title */}
      <div className="text-sm font-semibold text-white flex items-center justify-between">
        <span className="truncate">{datasetName}</span>
        <span className="text-xs text-purple-300 font-mono">Job #{receipt.jobId}</span>
      </div>

      {/* Structured Key-Value Breakdown Table (KvBlock) */}
      <dl className="divide-y divide-dashed divide-white/10 text-xs text-neutral-300 space-y-0">
        {/* Job */}
        <div className="py-2 flex items-center justify-between gap-4">
          <dt className="text-neutral-400">job</dt>
          <dd className="font-semibold text-white">#{receipt.jobId}</dd>
        </div>

        {/* Verdict */}
        <div className="py-2.5 flex items-center justify-between gap-4">
          <dt className="text-neutral-400">verdict</dt>
          <dd>
            <span
              className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                isFresh
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                  : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
              }`}
            >
              {isFresh ? "APPROVE" : "REJECT"}
            </span>
          </dd>
        </div>

        {/* Reason (if rejected/stale) */}
        {!isFresh && (
          <div className="py-2 flex items-center justify-between gap-4 bg-amber-950/20 px-2 -mx-2 rounded">
            <dt className="text-amber-400 font-semibold">reason</dt>
            <dd className="text-amber-300 text-right text-[11px]">
              {receipt.refundReason || `SlaNotMet: observed data age (${age.toFixed(1)}s) > ${freshnessSlaSeconds}.0s SLA`}
            </dd>
          </div>
        )}

        {/* Amount */}
        <div className="py-2 flex items-center justify-between gap-4">
          <dt className="text-neutral-400">amount</dt>
          <dd className="text-white font-semibold">{total.toFixed(2)} USDC (6dp raw {Math.round(total * 1e6)})</dd>
        </div>

        {/* SLA Promise Floor */}
        <div className="py-2 flex items-center justify-between gap-4">
          <dt className="text-neutral-400">sla floor</dt>
          <dd className="text-cyan-300">&le; {freshnessSlaSeconds}.0 seconds</dd>
        </div>

        {/* Observed Data Age */}
        <div className="py-2 flex items-center justify-between gap-4">
          <dt className="text-neutral-400">observed age</dt>
          <dd className={isFresh ? "text-emerald-400 font-semibold" : "text-amber-400 font-semibold"}>
            {age.toFixed(1)}s · {isFresh ? "Within promised SLA" : "Exceeded freshness window (Stale)"}
          </dd>
        </div>

        {/* Escrow Deposit Tx */}
        {receipt.txFund && (
          <div className="py-2 flex items-center justify-between gap-4">
            <dt className="text-neutral-400">escrow deposit tx</dt>
            <dd className="flex items-center gap-1.5">
              <a
                href={`${MONAD_TESTNET_EXPLORER}/tx/${receipt.txFund}`}
                target="_blank"
                rel="noreferrer"
                className="text-cyan-400 hover:underline flex items-center gap-1"
              >
                <span>{truncateHash(receipt.txFund, 8, 6)}</span>
                <ExternalLink size={10} />
              </a>
              <HashChip hash={receipt.txFund} />
            </dd>
          </div>
        )}

        {/* Settlement / Resolution Tx */}
        {receipt.txResolve && (
          <div className="py-2 flex items-center justify-between gap-4">
            <dt className="text-neutral-400">settlement tx</dt>
            <dd className="flex items-center gap-1.5">
              <a
                href={`${MONAD_TESTNET_EXPLORER}/tx/${receipt.txResolve}`}
                target="_blank"
                rel="noreferrer"
                className="text-emerald-400 hover:underline flex items-center gap-1"
              >
                <span>{truncateHash(receipt.txResolve, 8, 6)}</span>
                <ExternalLink size={10} />
              </a>
              <HashChip hash={receipt.txResolve} />
            </dd>
          </div>
        )}

        {/* Split / Refund outcome */}
        <div className="py-2.5 flex items-start justify-between gap-4">
          <dt className="text-neutral-400 shrink-0">{isFresh ? "split" : "refund"}</dt>
          <dd className="text-right text-[11px] leading-relaxed">
            {isFresh ? (
              <span className="text-emerald-300 font-medium">
                seller {sellerShare.toFixed(3)} · treasury {treasuryShare.toFixed(3)} · total {total.toFixed(3)} USDC
                <span className="block text-[10px] text-neutral-400 font-normal">
                  (fee 200 bp · 98% seller payout / 2% VerisTreasury)
                </span>
              </span>
            ) : (
              <span className="text-amber-300 font-medium">
                client refunded · full {total.toFixed(3)} USDC
                <span className="block text-[10px] text-neutral-400 font-normal">
                  (100% returned to buyer wallet · no fee row)
                </span>
              </span>
            )}
          </dd>
        </div>
      </dl>

      {/* Contract Guarantee Note (OpenBook tape__note) */}
      <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-[11px] text-neutral-400 font-sans leading-relaxed">
        <strong>Automatic On-Chain Recourse:</strong> The freshness promise was written into the escrow contract (<code className="text-purple-300 font-mono">ACPCore.sol</code>) at payment time. The delivered block timestamp was checked against it onchain via <code className="text-purple-300 font-mono">SlaEvaluator.sol</code>.
        {isFresh
          ? " The data met the SLA, so payment released to the seller (98%) and treasury (2%)."
          : " The SLA was breached, so 100% was automatically refunded to your wallet without arbitration."}
      </div>

      {/* Delivered Data Payload View (Prominent Metric Cards + Verified JSON) */}
      {receipt.dataPayload && (
        <div className="pt-2">
          <DeliveredDataView
            payload={receipt.dataPayload}
            datasetName={datasetName}
            observedAgeSeconds={age}
            slaSeconds={freshnessSlaSeconds}
            jobId={receipt.jobId}
            txHash={receipt.txResolve || receipt.txFund}
          />
        </div>
      )}
    </div>
  );
}
