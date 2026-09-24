import React, { useState } from "react";
import { FEATURED_DATASETS } from "../lib/contracts";
import {
  Award,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Activity,
} from "lucide-react";

export const ReputationHub: React.FC = () => {
  const [selectedDatasetName, setSelectedDatasetName] = useState<string>(
    FEATURED_DATASETS[0].name
  );
  const [customId, setCustomId] = useState<string>("");

  const currentDataset =
    FEATURED_DATASETS.find((d) => d.name === selectedDatasetName) ||
    FEATURED_DATASETS[0];

  const slaMet = Math.round((currentDataset.reliabilityBps / 10000) * currentDataset.totalJobs);
  const slaMissed = currentDataset.totalJobs - slaMet;
  const reliabilityPct = (currentDataset.reliabilityBps / 100).toFixed(1);

  return (
    <section className="max-w-6xl mx-auto px-4 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <span className="badge badge-monad">ERC-8004 Engine</span>
          <span className="text-xs text-zinc-400">ReputationRegistry.sol</span>
        </div>
        <h2 className="text-3xl font-extrabold text-white font-['Outfit']">
          Persistent Agent Reputation & SLA Proofs
        </h2>
        <p className="text-sm text-zinc-400 mt-1 max-w-2xl">
          Veris records every SLA outcome directly on Monad. This persistent ERC-8004 reliability score
          transforms single-call freshness guarantees into queryable, on-chain agent trust.
        </p>
      </div>

      {/* Top Formula Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-white/10 mb-8 bg-gradient-to-r from-purple-950/20 via-zinc-900/40 to-cyan-950/20">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-[#836ef9]">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white font-['Outfit']">
                On-Chain Reliability Metric
              </h4>
              <p className="text-xs text-zinc-400">
                Calculated on-chain by ReputationRegistry after each SlaEvaluator resolution.
              </p>
            </div>
          </div>

          <div className="bg-black/60 border border-white/10 px-4 py-2 rounded-xl text-xs font-mono text-[#a797ff]">
            reliabilityBps = (slaMetCount × 10,000) ÷ totalJobs
          </div>
        </div>
      </div>

      {/* Seller Selector & Metrics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Seller Selector List */}
        <div className="glass-panel p-5 rounded-2xl border border-white/10">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">
            Verified Sellers
          </h3>
          <div className="space-y-2 mb-4">
            {FEATURED_DATASETS.map((ds) => (
              <button
                key={ds.name}
                id={`rep-seller-btn-${ds.name.toLowerCase().replace(/[^a-z0-9]/g, "-").slice(0, 15)}`}
                onClick={() => setSelectedDatasetName(ds.name)}
                className={`w-full text-left p-3 rounded-xl border transition-all ${
                  selectedDatasetName === ds.name
                    ? "bg-[#836ef9]/15 border-[#836ef9]/50 shadow-md shadow-[#836ef9]/10"
                    : "bg-white/5 border-white/5 hover:bg-white/10"
                }`}
              >
                <div className="text-xs font-bold text-white font-['Outfit'] truncate mb-1">
                  {ds.name}
                </div>
                <div className="flex items-center justify-between text-[11px] text-zinc-400">
                  <span className="font-mono text-purple-300 font-medium">{ds.sellerId}</span>
                  <span className="text-emerald-400 font-semibold">
                    {(ds.reliabilityBps / 100).toFixed(1)}% SLA
                  </span>
                </div>
              </button>
            ))}
          </div>

          <div className="pt-3 border-t border-white/10">
            <label className="text-[11px] text-zinc-400 block mb-1.5 font-medium">
              Inspect Custom Seller Address / ID
            </label>
            <div className="relative">
              <input
                id="rep-custom-id-input"
                type="text"
                placeholder="0x..."
                value={customId}
                onChange={(e) => setCustomId(e.target.value)}
                className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-[#836ef9]"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Scorecard & Visual Breakdown */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Scorecard */}
          <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-white/10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <span className="badge badge-monad text-[10px] mb-2">{currentDataset.category}</span>
                <h3 className="text-xl font-bold text-white font-['Outfit']">{currentDataset.name}</h3>
                <span className="font-mono text-[11px] text-zinc-400 block truncate max-w-md mt-1">
                  Seller ID: <span className="text-purple-300 font-semibold">{currentDataset.sellerId}</span>
                </span>
              </div>

              {/* Big Reliability Ring / Badge */}
              <div className="flex items-center gap-3 bg-black/40 border border-white/5 px-4 py-3 rounded-2xl">
                <div className="text-right">
                  <span className="text-[10px] text-zinc-400 block uppercase font-medium">Score</span>
                  <div className="text-3xl font-extrabold text-white font-mono">{reliabilityPct}%</div>
                </div>
                <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Award className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Metrics Trio */}
            <div className="grid grid-cols-3 gap-3 mb-6 text-center">
              <div className="bg-black/30 border border-white/5 p-3 rounded-xl">
                <span className="text-[11px] text-zinc-400 block mb-1">Total Escrows</span>
                <span className="text-lg font-bold text-white font-mono">
                  {currentDataset.totalJobs.toLocaleString()}
                </span>
              </div>
              <div className="bg-black/30 border border-white/5 p-3 rounded-xl">
                <span className="text-[11px] text-zinc-400 block mb-1">SLA Met (Paid)</span>
                <span className="text-lg font-bold text-emerald-400 font-mono">
                  {slaMet.toLocaleString()}
                </span>
              </div>
              <div className="bg-black/30 border border-white/5 p-3 rounded-xl">
                <span className="text-[11px] text-zinc-400 block mb-1">SLA Missed (Refunded)</span>
                <span className="text-lg font-bold text-rose-400 font-mono">
                  {slaMissed.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Visual Progress Bar */}
            <div>
              <div className="flex justify-between text-xs text-zinc-400 mb-2">
                <span>SLA Freshness Compliance</span>
                <span className="text-white font-medium">{slaMet} of {currentDataset.totalJobs} fulfilled</span>
              </div>
              <div className="w-full h-3 bg-zinc-800 rounded-full overflow-hidden flex">
                <div
                  style={{ width: `${reliabilityPct}%` }}
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-l-full"
                />
                <div
                  style={{ width: `${(100 - parseFloat(reliabilityPct)).toFixed(1)}%` }}
                  className="h-full bg-rose-500 rounded-r-full"
                />
              </div>
            </div>
          </div>

          {/* Recent Attestation Audit Trail */}
          <div className="glass-panel p-6 rounded-2xl border border-white/10">
            <h4 className="text-sm font-bold text-white font-['Outfit'] mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#836ef9]" />
              <span>Recent On-Chain Verification Feed</span>
            </h4>

            <div className="space-y-2.5">
              {[
                {
                  id: "Job #84920",
                  block: "#1,489,102",
                  age: "1.4s",
                  max: "10.0s",
                  status: "SLA MET",
                  payout: "0.25 USDC",
                },
                {
                  id: "Job #84918",
                  block: "#1,489,095",
                  age: "0.8s",
                  max: "10.0s",
                  status: "SLA MET",
                  payout: "0.25 USDC",
                },
                {
                  id: "Job #84899",
                  block: "#1,488,712",
                  age: "12.3s",
                  max: "10.0s",
                  status: "SLA MISSED (REFUNDED)",
                  payout: "0.00 USDC",
                },
              ].map((tx, idx) => (
                <div
                  key={idx}
                  className="bg-black/30 border border-white/5 p-3 rounded-xl flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    {tx.status.includes("MET") ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    )}
                    <div>
                      <span className="font-semibold text-white block">{tx.id}</span>
                      <span className="text-[10px] text-zinc-500">Monad Block {tx.block}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`font-semibold text-[11px] block ${
                        tx.status.includes("MET") ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      {tx.status}
                    </span>
                    <span className="text-[10px] text-zinc-400">
                      Age: {tx.age} (Limit {tx.max})
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
