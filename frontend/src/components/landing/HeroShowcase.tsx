import { useState } from "react";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Zap,
  Lock,
  Cpu,
  Layers,
} from "lucide-react";
import { PulseDot } from "./PulseDot";
import { HARD_SPENDING_CAP_USDC } from "../../lib/contracts";

export function HeroShowcase() {
  const [simulationState, setSimulationState] = useState<"fresh" | "stale">("fresh");

  return (
    <div className="relative mb-24 max-w-6xl mx-auto">
      {/* Numbered grid labels */}
      <div className="absolute -left-10 top-2 hidden text-[11px] font-mono text-zinc-600 xl:block">
        01
      </div>
      <div className="absolute -right-10 top-2 hidden text-[11px] font-mono text-zinc-600 xl:block">
        02
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Monitor (lg:col-span-8) */}
        <div className="lg:col-span-8 glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 hover:border-[#836ef9]/40 transition-all bg-[#0b0a1a]/90 relative overflow-hidden flex flex-col justify-between group shadow-2xl shadow-black/60">
          {/* Top Bar of the Terminal */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <span className="font-mono text-xs text-zinc-400 pl-2">
                  SlaEvaluator.sol :: Monad Block Engine
                </span>
              </div>

              {/* Interactive State Toggle */}
              <div className="flex items-center gap-1.5 bg-black/50 p-1 rounded-xl border border-white/10 text-xs">
                <button
                  type="button"
                  onClick={() => setSimulationState("fresh")}
                  className={`px-3 py-1 rounded-lg font-medium transition-all ${
                    simulationState === "fresh"
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Simulate Fresh Attestation
                </button>
                <button
                  type="button"
                  onClick={() => setSimulationState("stale")}
                  className={`px-3 py-1 rounded-lg font-medium transition-all ${
                    simulationState === "stale"
                      ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Simulate Stale Data
                </button>
              </div>
            </div>

            {/* Live Terminal Output */}
            <div className="font-mono text-xs text-zinc-300 bg-black/60 p-5 rounded-2xl border border-white/5 space-y-2.5 mb-6">
              <div className="text-zinc-500 flex items-center justify-between">
                <span>// Cryptographic Monad Block Attestation Proof</span>
                <span className="text-[#a797ff] flex items-center gap-1">
                  <PulseDot color={simulationState === "fresh" ? "emerald" : "amber"} />
                  Block #1,489,102
                </span>
              </div>
              <div className="text-zinc-300">
                <span className="text-purple-400">attestation</span> = &#123;
              </div>
              <div className="pl-4 text-zinc-400">
                jobId: <span className="text-amber-300">&quot;84920&quot;</span>,
              </div>
              <div className="pl-4 text-zinc-400">
                sellerId: <span className="text-[#22d3ee]">&quot;veris.eth&quot;</span> (Aave V3 Reserve APY),
              </div>
              <div className="pl-4 text-zinc-400">
                promisedFreshnessSla: <span className="text-white font-semibold">10.0 seconds</span>,
              </div>
              <div className="pl-4 text-zinc-400">
                blockObservedAge:{" "}
                <span
                  className={
                    simulationState === "fresh"
                      ? "text-emerald-400 font-bold"
                      : "text-rose-400 font-bold"
                  }
                >
                  {simulationState === "fresh" ? "1.4 seconds" : "14.8 seconds"}
                </span>
              </div>
              <div className="text-zinc-300">&#125;;</div>

              <div className="pt-2 border-t border-white/5 text-[11px]">
                {simulationState === "fresh" ? (
                  <div className="text-emerald-400 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      SLA MET! ageSeconds (1.4s) &lt;= 10s promise. ACPCore.complete() called. Escrow released to seller embedded wallet.
                    </span>
                  </div>
                ) : (
                  <div className="text-rose-400 flex items-center gap-2">
                    <XCircle className="w-4 h-4" />
                    <span>
                      SLA VIOLATED! ageSeconds (14.8s) &gt; 10s promise. ACPCore.reject() triggered. 100% instant refund sent to buyer!
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Headline & Callout */}
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#836ef9] uppercase tracking-wider mb-1">
              <Zap className="w-4 h-4" />
              <span>Zero Human Arbitration • Self-Enforcing Solidity Hook</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-white font-['Outfit'] mb-2">
              Self-Enforcing Freshness Guarantees
            </h3>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-xl leading-relaxed">
              Neither buyer nor seller can alter terms once locked. The Monad block header timestamp
              cryptographically decides whether payment is released or refunded.
            </p>
          </div>
        </div>

        {/* Right Cards Stack (lg:col-span-4) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Card 1: Dynamic Embedded Wallets */}
          <div className="glass-panel p-6 rounded-3xl border border-white/10 hover:border-cyan-500/40 transition-all bg-[#0a0d1e]/90 flex-1 flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                  <Lock className="w-5 h-5" />
                </div>
                <span className="badge badge-monad text-[10px]">WaaS Native</span>
              </div>
              <h4 className="text-base font-bold text-white font-['Outfit'] mb-1.5">
                Dynamic Embedded Wallets
              </h4>
              <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                Google, Email OTP, and Passkeys without browser extension popups. Code explicitly calls
                <code className="text-[#22d3ee] bg-white/5 px-1 py-0.5 rounded mx-1 font-mono text-[11px]">
                  createWaasWalletAccounts()
                </code>
                and switches to Monad 10143.
              </p>
            </div>

            <div className="bg-black/40 p-3 rounded-xl border border-white/5 text-[11px] text-zinc-300 space-y-1 font-mono">
              <div className="text-emerald-400 flex items-center gap-1 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Client Spending Guard:</span>
              </div>
              <div className="text-zinc-400">Hard Cap: ${HARD_SPENDING_CAP_USDC} USDC / call</div>
            </div>
          </div>

          {/* Card 2: ERC-8004 Reputation */}
          <div className="glass-panel p-6 rounded-3xl border border-white/10 hover:border-purple-500/40 transition-all bg-[#0e0a1f]/90 flex-1 flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-[#836ef9] group-hover:scale-110 transition-transform">
                  <Layers className="w-5 h-5" />
                </div>
                <span className="badge badge-fresh text-[10px]">ERC-8004 Trust</span>
              </div>
              <h4 className="text-base font-bold text-white font-['Outfit'] mb-1.5">
                Persistent On-Chain Reputation
              </h4>
              <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                Every verified block proof updates the seller&apos;s on-chain reliability score:
                <code className="text-[#a797ff] bg-white/5 px-1 py-0.5 rounded mx-1 font-mono text-[11px]">
                  reliabilityBps
                </code>
                providing queryable agent trust across Monad.
              </p>
            </div>

            <div className="bg-black/40 p-3 rounded-xl border border-white/5 text-[11px] text-zinc-300 space-y-1 font-mono">
              <div className="text-[#a797ff] flex items-center gap-1 font-semibold">
                <Cpu className="w-3.5 h-3.5" />
                <span>On-Chain Audit:</span>
              </div>
              <div className="text-zinc-400">99.4% SLA Compliance (6,292 Jobs)</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
