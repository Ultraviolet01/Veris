import { CheckCircle2, XCircle, ShieldAlert, KeyRound, Clock, ArrowRight } from "lucide-react";

interface SettlementMatrixProps {
  onOpenPlayground?: () => void;
  onOpenReputation?: () => void;
}

export function SettlementMatrix({ onOpenPlayground, onOpenReputation }: SettlementMatrixProps) {
  return (
    <section id="outcomes" className="relative border-t border-white/5 bg-[#030306] py-32 overflow-hidden scroll-mt-32">
      {/* Background Glows */}
      <div className="absolute left-1/4 top-1/4 w-[500px] h-[500px] bg-purple-600/5 blur-[140px] pointer-events-none rounded-full" />
      <div className="absolute right-1/4 bottom-1/4 w-[500px] h-[500px] bg-emerald-600/5 blur-[140px] pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="mb-16 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-950/20 px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-emerald-300 mb-4">
            <Clock size={12} className="text-emerald-400" />
            Deterministic Execution
          </div>
          <h2 className="text-3xl sm:text-5xl font-semibold tracking-tight text-white">
            Two Outcomes. Never Both.
          </h2>
          <p className="mt-4 text-sm sm:text-base text-neutral-400 font-light leading-relaxed">
            The Monad block header decides what happened. <code className="text-purple-300">SlaEvaluator.sol</code> settles strictly on the proof.
            No human judgment, no multi-sig committees, no support tickets.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {/* PRIMARY CARD: OUTCOME A - SUCCESS */}
          <div className="md:col-span-2 lg:col-span-2 rounded-3xl border border-emerald-500/30 bg-gradient-to-b from-[#09150e]/80 to-[#050907]/90 p-8 flex flex-col justify-between relative overflow-hidden group shadow-xl shadow-emerald-950/20">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-3xl pointer-events-none" />

            <div>
              <div className="flex items-center justify-between mb-6">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 font-mono text-[11px] font-semibold text-emerald-300">
                  <CheckCircle2 size={13} className="text-emerald-400" />
                  Outcome A · SLA Honored
                </span>
                <span className="font-mono text-xs text-neutral-500">Atomic Settle</span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-medium tracking-tight text-white mb-3">
                Attested Within SLA Window
              </h3>
              <p className="text-sm text-neutral-300 font-light leading-relaxed mb-6">
                The operator submits a signed proof with <code className="text-emerald-400">sourceBlockTimestamp</code> within the promised freshness window.
                <code className="text-purple-300 font-mono mx-1">SlaEvaluator.sol</code> releases seller proceeds in the exact same block.
              </p>

              {/* Live telemetry visual */}
              <div className="rounded-2xl border border-emerald-500/20 bg-black/50 p-5 font-mono text-xs mb-6">
                <div className="flex items-center justify-between pb-3 border-b border-emerald-500/10 mb-3 text-[11px]">
                  <span className="text-neutral-400">Resolution Check</span>
                  <span className="text-emerald-400 font-semibold">SUCCESS · PAID</span>
                </div>
                <div className="space-y-2 text-[11px]">
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-500">Observed Age:</span>
                    <span className="text-emerald-400 font-semibold">2.8s &le; 10.0s SLA</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-500">Seller Net Payout:</span>
                    <span className="text-white">1.47 USDC (98%)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-500">Protocol Fee:</span>
                    <span className="text-neutral-400">0.03 USDC (200 bps)</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-white/5 pt-2">
                    <span className="text-neutral-500">Reputation Increment:</span>
                    <span className="text-purple-400">+0.01 on ERC-8004</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-neutral-400 font-mono">
                Settles in &lt; 400ms on Monad Testnet
              </span>
              {onOpenPlayground && (
                <button
                  onClick={onOpenPlayground}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400 hover:text-emerald-300 cursor-pointer"
                >
                  <span>Simulate Fresh Trade</span>
                  <ArrowRight size={13} />
                </button>
              )}
            </div>
          </div>

          {/* OUTCOME B: STALE DATA - 100% REFUND */}
          <div className="md:col-span-1 lg:col-span-2 rounded-3xl border border-rose-500/25 bg-gradient-to-b from-[#170a0d]/80 to-[#090406]/90 p-8 flex flex-col justify-between relative overflow-hidden group shadow-xl shadow-rose-950/20">
            <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/10 blur-3xl pointer-events-none" />

            <div>
              <div className="flex items-center justify-between mb-6">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 font-mono text-[11px] font-semibold text-rose-300">
                  <XCircle size={13} className="text-rose-400" />
                  Outcome B · Stale Data
                </span>
                <span className="font-mono text-xs text-neutral-500">100% Refund</span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-medium tracking-tight text-white mb-3">
                Freshness SLA Breached
              </h3>
              <p className="text-sm text-neutral-300 font-light leading-relaxed mb-6">
                If the operator response arrives beyond the agreed freshness window (e.g. 14.8s &gt; 10s),
                <code className="text-purple-300 font-mono mx-1">SlaEvaluator.sol</code> triggers automatic refund. The buyer pays nothing.
              </p>

              {/* Refund breakdown visual */}
              <div className="rounded-2xl border border-rose-500/20 bg-black/50 p-5 font-mono text-xs mb-6">
                <div className="flex items-center justify-between pb-3 border-b border-rose-500/10 mb-3 text-[11px]">
                  <span className="text-neutral-400">Evaluation State</span>
                  <span className="text-rose-400 font-semibold">REJECTED · REFUNDED</span>
                </div>
                <div className="space-y-2 text-[11px]">
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-500">Observed Age:</span>
                    <span className="text-rose-400 font-semibold">14.8s &gt; 10.0s SLA</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-500">Buyer Refunded:</span>
                    <span className="text-white">1.50 USDC (100%)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-500">Penalty Fee:</span>
                    <span className="text-neutral-400">0.00 USDC (Zero deduction)</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-white/5 pt-2">
                    <span className="text-neutral-500">Seller Reliability:</span>
                    <span className="text-rose-400">slaMissedCount incremented</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-neutral-400 font-mono">
                No human appeal required
              </span>
              {onOpenPlayground && (
                <button
                  onClick={onOpenPlayground}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-400 hover:text-rose-300 cursor-pointer"
                >
                  <span>Simulate Stale Refund</span>
                  <ArrowRight size={13} />
                </button>
              )}
            </div>
          </div>

          {/* TILE 1: Key Isolation & Signer Check */}
          <div className="glass-panel p-6 rounded-2xl border border-white/10 hover:border-purple-500/30 transition-all">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-4">
              <KeyRound size={18} />
            </div>
            <h4 className="text-base font-medium text-white mb-1.5">Signer Isolation</h4>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Mismatched ECDSA keys or spoofed signers are rejected in the contract call. Zero escrow leakage.
            </p>
          </div>

          {/* TILE 2: Replay & Nonce Defense */}
          <div className="glass-panel p-6 rounded-2xl border border-white/10 hover:border-purple-500/30 transition-all">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-4">
              <ShieldAlert size={18} />
            </div>
            <h4 className="text-base font-medium text-white mb-1.5">Replay Prevention</h4>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Attestation hashes cryptographically bind <code className="text-neutral-300">jobId</code> and Monad block height. Proofs cannot be reused.
            </p>
          </div>

          {/* TILE 3: Zero Human Arbitration */}
          <div className="glass-panel p-6 rounded-2xl border border-white/10 hover:border-purple-500/30 transition-all">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
              <CheckCircle2 size={18} />
            </div>
            <h4 className="text-base font-medium text-white mb-1.5">Zero Human Arbitrators</h4>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Eliminates DAO voting, multi-sig delays, and 7-day challenge windows. Pure mathematical execution.
            </p>
          </div>

          {/* TILE 4: ERC-8004 Permanent Record */}
          <div className="glass-panel p-6 rounded-2xl border border-white/10 hover:border-purple-500/30 transition-all flex flex-col justify-between">
            <div>
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-4">
                <Clock size={18} />
              </div>
              <h4 className="text-base font-medium text-white mb-1.5">Persistent Reputation</h4>
              <p className="text-xs text-neutral-400 leading-relaxed mb-3">
                Every job resolution permanently updates the seller&apos;s on-chain reliability record. Trust compounds over time.
              </p>
            </div>
            {onOpenReputation && (
              <button
                onClick={onOpenReputation}
                className="inline-flex items-center gap-1 text-xs text-purple-300 hover:text-white transition-colors cursor-pointer text-left"
              >
                <span>Explore Reputation Hub</span>
                <ArrowRight size={12} />
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
