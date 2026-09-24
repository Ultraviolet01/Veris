import { useState, useId } from "react";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { HARD_SPENDING_CAP_USDC } from "../../lib/contracts";

export function EscrowTerminalCalculator({
  onOpenMarketplace,
}: {
  onOpenMarketplace?: () => void;
}) {
  const [deposit, setDeposit] = useState<number>(1.5);
  const [slaWindow, setSlaWindow] = useState<number>(10);
  const depositInputId = useId();
  const slaInputId = useId();

  const treasuryFee = Number((deposit * 0.02).toFixed(4));
  const sellerNet = Number((deposit * 0.98).toFixed(4));

  const kpis = [
    { label: "Settlement Latency", value: "< 400", unit: "ms", note: "Monad parallel VM" },
    { label: "Protocol Fee", value: "200", unit: "bps", note: "2.0% on success only" },
    { label: "SLA Honor Rate", value: "99.8", unit: "%", note: "ERC-8004 verified" },
    { label: "Dispute Overhead", value: "$0.00", unit: "", note: "Zero arbitration delay" },
  ];

  return (
    <section id="economics" className="mb-32 scroll-mt-32">
      {/* Industrial Ruler Header */}
      <div className="border-t border-b border-white/10 py-6 mb-10 bg-[#030305]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 font-mono text-[11px] text-neutral-500 uppercase tracking-widest">
              <span className="text-[#FF5A36] font-semibold">[04 // PROTOCOL ECONOMICS]</span>
              <span>On-Chain Escrow Formula</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white font-['Manrope']">
              Guaranteed Fresh, or 100% Refunded
            </h2>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-neutral-400">
            <span className="px-2.5 py-1 rounded bg-white/5 border border-white/10 text-white font-medium">
              Client Guard: Max ${HARD_SPENDING_CAP_USDC} USDC
            </span>
          </div>
        </div>
      </div>

      {/* Industrial Calculator Console */}
      <div className="rounded-3xl border border-white/10 bg-[#06070a] overflow-hidden shadow-2xl mb-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-white/5">
          {/* Left Console: Parameter Dials */}
          <div className="lg:col-span-6 p-6 sm:p-8 bg-[#040407] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-6 text-xs font-mono">
                <span className="text-neutral-400 font-semibold uppercase tracking-wider">
                  Escrow Input Parameters
                </span>
                <span className="text-neutral-500 text-[11px]">ACPCore Client Controls</span>
              </div>

              <div className="space-y-6">
                {/* Deposit Slider */}
                <div>
                  <div className="flex items-center justify-between text-xs font-mono mb-2">
                    <label htmlFor={depositInputId} className="text-neutral-400 font-medium">
                      Query Deposit Budget:
                    </label>
                    <span className="text-white font-bold font-mono text-sm">
                      {deposit.toFixed(2)} USDC
                    </span>
                  </div>
                  <input
                    id={depositInputId}
                    type="range"
                    min="0.10"
                    max="10.00"
                    step="0.10"
                    value={deposit}
                    onChange={(e) => setDeposit(parseFloat(e.target.value))}
                    aria-label="Query Deposit Budget in USDC"
                    className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-ew-resize accent-[#FF5A36]"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-neutral-500 mt-1.5">
                    <span>$0.10 (Micro query)</span>
                    <span className="text-neutral-400">$10.00 (High-frequency batch)</span>
                  </div>
                </div>

                {/* SLA Window Slider */}
                <div>
                  <div className="flex items-center justify-between text-xs font-mono mb-2">
                    <label htmlFor={slaInputId} className="text-neutral-400 font-medium">
                      Promised Freshness Window (SLA):
                    </label>
                    <span className="text-emerald-400 font-bold font-mono text-sm">
                      &le; {slaWindow} seconds
                    </span>
                  </div>
                  <input
                    id={slaInputId}
                    type="range"
                    min="3"
                    max="30"
                    step="1"
                    value={slaWindow}
                    onChange={(e) => setSlaWindow(parseInt(e.target.value))}
                    aria-label="Promised Freshness Window in seconds"
                    className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-ew-resize accent-emerald-500"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-neutral-500 mt-1.5">
                    <span>3s (HFT Arbitrage)</span>
                    <span className="text-neutral-400">30s (Governance & Signals)</span>
                  </div>
                </div>
              </div>

              {/* Safety notice */}
              <div className="mt-8 p-4 rounded-xl bg-white/[0.02] border border-white/5 font-mono text-xs text-neutral-400 space-y-1">
                <div className="text-white font-semibold flex items-center gap-1.5 text-[11px]">
                  <ShieldCheck size={13} className="text-emerald-400" />
                  Zero-Fee Stale Protection
                </div>
                <p className="text-[11px] text-neutral-400 leading-relaxed font-sans font-light">
                  If the operator attestation delta exceeds &gt; {slaWindow}s, the verifier hook triggers an instant 100% refund. No gas fee or protocol haircut is deducted from the buyer.
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-white/5 mt-6 flex items-center justify-between text-[10.5px] font-mono text-neutral-500">
              <span>Client Hard Spending Cap: $50.00 USDC</span>
              <span>Monad Testnet (10143)</span>
            </div>
          </div>

          {/* Right Console: Settlement Distribution Audit */}
          <div className="lg:col-span-6 p-6 sm:p-8 bg-[#06070a] flex flex-col justify-between font-mono text-xs">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-5 text-[11px]">
                <span className="text-neutral-400 font-semibold uppercase tracking-wider">
                  Settlement Breakdown
                </span>
                <span className="text-neutral-500">Deterministic Split</span>
              </div>

              {/* Two State Ledger Columns */}
              <div className="space-y-3 mb-6 text-[11.5px]">
                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                  <span className="text-neutral-400">Total Escrowed Capital:</span>
                  <span className="text-white font-semibold">{deposit.toFixed(2)} USDC</span>
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 flex items-center justify-between">
                  <div>
                    <span className="text-emerald-300 font-semibold block">Case 1 · Data Fresh (&le; {slaWindow}s)</span>
                    <span className="text-[10px] text-neutral-400">Seller Net (98%): {sellerNet} USDC | Protocol Fee: {treasuryFee} USDC</span>
                  </div>
                  <span className="text-emerald-400 font-bold">PAID</span>
                </div>

                <div className="p-3.5 rounded-xl bg-red-950/20 border border-red-500/30 flex items-center justify-between">
                  <div>
                    <span className="text-red-300 font-semibold block">Case 2 · Data Stale (&gt; {slaWindow}s)</span>
                    <span className="text-[10px] text-neutral-400">100% Escrow Returned to Buyer Wallet | Zero Fee</span>
                  </div>
                  <span className="text-white font-bold">{deposit.toFixed(2)} USDC REFUND</span>
                </div>
              </div>

              {onOpenMarketplace && (
                <button
                  type="button"
                  onClick={onOpenMarketplace}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-white text-black py-3 text-xs font-semibold hover:bg-neutral-200 transition-all cursor-pointer"
                >
                  <span>Explore Marketplace Feeds</span>
                  <ArrowRight size={13} />
                </button>
              )}
            </div>

            <div className="pt-4 border-t border-white/5 mt-6 flex items-center justify-between text-[10.5px] text-neutral-500">
              <span>Automatic ERC-8183 claimRefund()</span>
              <span>Zero support tickets</span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Band Matching HeroFigures */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/5 font-mono">
        {kpis.map((k) => (
          <div key={k.label} className="bg-[#050505] p-5 flex flex-col justify-between">
            <span className="text-[10px] uppercase tracking-widest text-neutral-500 block mb-1">
              {k.label}
            </span>
            <div className="text-2xl text-white font-semibold tracking-tight tabular-nums">
              {k.value}
              <span className="text-xs text-neutral-500 ml-1 font-normal">{k.unit}</span>
            </div>
            <span className="text-[10.5px] text-neutral-500 mt-2 font-sans font-light">
              {k.note}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
