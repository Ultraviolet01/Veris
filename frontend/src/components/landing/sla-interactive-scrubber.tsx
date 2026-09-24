import { useState } from "react";
import { ShieldAlert, KeyRound, Clock, ArrowRight, Code2 } from "lucide-react";

export function SlaInteractiveScrubber({
  onOpenPlayground,
  onOpenReputation,
}: {
  onOpenPlayground?: () => void;
  onOpenReputation?: () => void;
}) {
  const [deltaSeconds, setDeltaSeconds] = useState<number>(2.8);
  const slaThreshold = 10.0;
  const isFresh = deltaSeconds <= slaThreshold;

  const grossEscrow = 1.5;
  const sellerNet = isFresh ? 1.47 : 0.0;
  const treasuryFee = isFresh ? 0.03 : 0.0;
  const buyerRefund = isFresh ? 0.0 : 1.5;

  return (
    <section id="outcomes" className="mb-32 scroll-mt-32">
      {/* Industrial Ruler Header */}
      <div className="border-t border-b border-white/10 py-6 mb-10 bg-[#030305]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 font-mono text-[11px] text-neutral-500 uppercase tracking-widest">
              <span className="text-[#FF5A36] font-semibold">[02 // VERIFIER STATE ENGINE]</span>
              <span>Deterministic Settlement Matrix</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white font-['Manrope']">
              The 10-Second Boundary: Real-Time SlaEvaluator
            </h2>
          </div>

          {/* Quick Presets */}
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-neutral-500 hidden sm:inline-block">Presets:</span>
            <button
              type="button"
              onClick={() => setDeltaSeconds(2.8)}
              className={`px-2.5 py-1 rounded border transition-colors cursor-pointer ${
                deltaSeconds === 2.8
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                  : "bg-white/5 border-white/10 text-neutral-400 hover:text-white"
              }`}
            >
              Fresh (2.8s)
            </button>
            <button
              type="button"
              onClick={() => setDeltaSeconds(9.9)}
              className={`px-2.5 py-1 rounded border transition-colors cursor-pointer ${
                deltaSeconds === 9.9
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                  : "bg-white/5 border-white/10 text-neutral-400 hover:text-white"
              }`}
            >
              Edge (9.9s)
            </button>
            <button
              type="button"
              onClick={() => setDeltaSeconds(13.2)}
              className={`px-2.5 py-1 rounded border transition-colors cursor-pointer ${
                deltaSeconds === 13.2
                  ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                  : "bg-white/5 border-white/10 text-neutral-400 hover:text-white"
              }`}
            >
              Stale (13.2s)
            </button>
            {onOpenPlayground && (
              <button
                type="button"
                onClick={onOpenPlayground}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded bg-[#FF5A36]/10 text-[#FF5A36] border border-[#FF5A36]/30 hover:bg-[#FF5A36]/20 transition-colors cursor-pointer text-xs ml-2 font-mono"
              >
                <span>Live Simulator</span>
                <ArrowRight size={11} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Scrubber Console */}
      <div className="rounded-3xl border border-white/10 bg-[#06070a] overflow-hidden mb-8 shadow-2xl">
        {/* Top Control Bar with Drag Scrubber */}
        <div className="p-6 sm:p-8 border-b border-white/5 bg-[#030306]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-neutral-400">
                Observed Block Timestamp Delta:
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className={`text-4xl sm:text-5xl font-mono font-bold tracking-tight tabular-nums ${
                  isFresh ? "text-emerald-400" : "text-[#FF5A36]"
                }`}>
                  {deltaSeconds.toFixed(1)}s
                </span>
                <span className="text-xs font-mono text-neutral-500">
                  / {slaThreshold.toFixed(1)}s max SLA
                </span>
              </div>
            </div>

            {/* Status Pill Badge */}
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-mono text-xs font-semibold uppercase tracking-wider ${
                isFresh
                  ? "bg-emerald-950/40 border border-emerald-500/30 text-emerald-300"
                  : "bg-red-950/40 border border-red-500/30 text-red-300"
              }`}>
                {isFresh ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    SLA Honored · Seller Paid
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-[#FF5A36] animate-pulse" />
                    SLA Breached · 100% Refunded
                  </>
                )}
              </span>
            </div>
          </div>

          {/* Precision Slider Control */}
          <div className="relative pt-2 pb-1">
            <input
              type="range"
              min="0.0"
              max="15.0"
              step="0.1"
              value={deltaSeconds}
              onChange={(e) => setDeltaSeconds(parseFloat(e.target.value))}
              aria-label="Observed block delta in seconds"
              className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-ew-resize accent-[#FF5A36]"
            />
            {/* Threshold Vertical Indicator */}
            <div
              className="absolute top-0 bottom-0 pointer-events-none flex flex-col items-center"
              style={{ left: `${(10.0 / 15.0) * 100}%` }}
            >
              <div className="w-[2px] h-full bg-white/40" />
              <span className="text-[10px] font-mono text-white/70 bg-black/80 px-1 rounded mt-1">
                10.0s SLA
              </span>
            </div>
          </div>

          <div className="flex justify-between text-[11px] font-mono text-neutral-500 mt-2">
            <span>0.0s (Instant Block)</span>
            <span className="text-white/80 font-medium">10.0s Contract Deadline</span>
            <span>15.0s (Stale Tail)</span>
          </div>
        </div>

        {/* Dynamic Split View: Financial Settlement vs EVM Opcode Trace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-white/5 font-mono text-xs">
          {/* Left: Financial Ledger Movement */}
          <div className="lg:col-span-6 p-6 sm:p-8 bg-[#06070a]">
            <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-5">
              <span className="text-neutral-400 font-semibold uppercase tracking-wider text-[11px]">
                On-Chain Escrow Ledger
              </span>
              <span className="text-neutral-500 text-[10.5px]">ACPCore #8183</span>
            </div>

            <div className="space-y-3 text-[11.5px]">
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5">
                <span className="text-neutral-400">Total Buyer Escrow Deposit:</span>
                <span className="text-white font-semibold font-mono">{grossEscrow.toFixed(2)} USDC</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5">
                <span className="text-neutral-400">Seller Net Proceeds (98%):</span>
                <span className={`font-semibold font-mono ${isFresh ? "text-emerald-400" : "text-neutral-600 line-through"}`}>
                  {sellerNet.toFixed(2)} USDC
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5">
                <span className="text-neutral-400">Veris Treasury (200 bps):</span>
                <span className={`font-mono ${isFresh ? "text-neutral-300" : "text-neutral-600 line-through"}`}>
                  {treasuryFee.toFixed(2)} USDC
                </span>
              </div>

              <div className={`flex items-center justify-between p-3 rounded-xl border ${
                isFresh
                  ? "bg-white/[0.01] border-white/5 text-neutral-600"
                  : "bg-red-950/20 border-red-500/30 text-white"
              }`}>
                <span className={isFresh ? "text-neutral-600" : "text-red-300 font-medium"}>
                  Buyer Automatic Refund:
                </span>
                <span className={`font-mono font-bold ${isFresh ? "line-through text-neutral-600" : "text-white"}`}>
                  {buyerRefund.toFixed(2)} USDC (100%)
                </span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-[11px]">
              <span className="text-neutral-500">Reputation Delta:</span>
              <span className={isFresh ? "text-emerald-400 font-semibold" : "text-rose-400 font-semibold"}>
                {isFresh ? "+0.01 reliability score" : "slaMissedCount incremented"}
              </span>
            </div>
          </div>

          {/* Right: Decompiled EVM Execution Opcode Trace */}
          <div className="lg:col-span-6 p-6 sm:p-8 bg-[#030305]">
            <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-4">
              <span className="flex items-center gap-1.5 text-neutral-400 font-semibold uppercase tracking-wider text-[11px]">
                <Code2 size={13} className="text-purple-400" />
                Decompiled SlaEvaluator Opcode Trace
              </span>
              <span className="text-emerald-400 text-[10.5px]">Gas: ~24,800</span>
            </div>

            <div className="rounded-xl bg-[#010204] border border-white/5 p-4 text-[11px] leading-relaxed overflow-x-auto space-y-1.5">
              <div className="text-neutral-600">// 1. Load block timestamp and source timestamp</div>
              <div className="text-neutral-300">0x00 SLOAD  [0x04]   <span className="text-neutral-500">; sourceBlockTimestamp = 1727083440</span></div>
              <div className="text-neutral-300">0x02 TIMESTAMP        <span className="text-neutral-500">; Monad block.timestamp</span></div>
              <div className="text-neutral-300">0x03 SUB              <span className="text-purple-300 font-semibold">; delta = {deltaSeconds.toFixed(1)}s</span></div>
              
              <div className="text-neutral-600 mt-2">// 2. Threshold evaluation (delta &lt;= 10.0s)</div>
              <div className="text-neutral-300">0x04 PUSH1 0x0A       <span className="text-neutral-500">; maxSlaSeconds = 10s</span></div>
              <div className="text-neutral-300">0x06 GT               <span className="text-neutral-500">; delta &gt; SLA? ({!isFresh ? "TRUE" : "FALSE"})</span></div>
              
              {isFresh ? (
                <>
                  <div className="text-emerald-400 mt-2">// 3. SLA HONORED branch</div>
                  <div className="text-emerald-300">0x07 JUMPI 0x1F       ; Jump to EXECUTE_PAYOUT</div>
                  <div className="text-emerald-300">0x1F CALL             ; SafeERC20.transfer(seller, 1.47 USDC)</div>
                  <div className="text-emerald-300">0x24 LOG1             ; emit JobCompleted(jobId, sellerNet)</div>
                </>
              ) : (
                <>
                  <div className="text-rose-400 mt-2">// 3. SLA BREACHED branch (Zero fee refund)</div>
                  <div className="text-rose-300">0x07 JUMPI 0x2A       ; Jump to REVERT_AND_REFUND</div>
                  <div className="text-rose-300">0x2A CALL             ; SafeERC20.transfer(buyer, 1.50 USDC)</div>
                  <div className="text-rose-300">0x2F LOG1             ; emit SlaBreached(jobId, delta, 10s)</div>
                </>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[10.5px] text-neutral-500">
              <span>Atomic execution in Monad transaction</span>
              <span className="text-neutral-400">Zero human dispute latency</span>
            </div>
          </div>
        </div>
      </div>

      {/* Industrial Triplet: Cryptographic Guarantees */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
        <div className="p-5 rounded-2xl bg-[#050609] border border-white/10">
          <div className="flex items-center gap-2 text-white font-semibold mb-1.5">
            <KeyRound size={15} className="text-[#FF5A36]" />
            <span>ECDSA Key Isolation</span>
          </div>
          <p className="text-neutral-400 font-sans text-xs leading-relaxed">
            Mismatched or spoofed signatures revert immediately in EVM execution. Unapproved signers cannot drain escrow.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-[#050609] border border-white/10">
          <div className="flex items-center gap-2 text-white font-semibold mb-1.5">
            <ShieldAlert size={15} className="text-[#FF5A36]" />
            <span>Job Nonce Binding</span>
          </div>
          <p className="text-neutral-400 font-sans text-xs leading-relaxed">
            Attestation hashes bind (sellerId, jobId, dataHash, blockHeight). A valid proof cannot be replayed across jobs.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-[#050609] border border-white/10 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-white font-semibold mb-1.5">
              <Clock size={15} className="text-emerald-400" />
              <span>ERC-8004 Permanent Record</span>
            </div>
            <p className="text-neutral-400 font-sans text-xs leading-relaxed mb-3">
              Every job outcome permanently shifts the seller&apos;s on-chain reliability metric. Trust compounds over time.
            </p>
          </div>
          {onOpenReputation && (
            <button
              type="button"
              onClick={onOpenReputation}
              className="inline-flex items-center gap-1 text-xs text-[#FF5A36] hover:text-white transition-colors cursor-pointer text-left"
            >
              <span>Inspect Reputation Registry</span>
              <ArrowRight size={11} />
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
