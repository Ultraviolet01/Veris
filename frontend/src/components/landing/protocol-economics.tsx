import { useState, useId } from "react";
import { Coins, ArrowRight } from "lucide-react";

interface ProtocolEconomicsProps {
  onOpenMarketplace?: () => void;
}

export function ProtocolEconomics({ onOpenMarketplace }: ProtocolEconomicsProps) {
  const [deposit, setDeposit] = useState<number>(1.5);
  const [slaWindow, setSlaWindow] = useState<number>(10);
  const depositInputId = useId();
  const slaInputId = useId();

  const treasuryFee = Number((deposit * 0.02).toFixed(4));
  const sellerNet = Number((deposit * 0.98).toFixed(4));

  const metrics = [
    {
      value: "< 400",
      unit: "ms",
      label: "Avg settlement latency",
      desc: "Instant Monad VM execution",
    },
    {
      value: "200",
      unit: "bps",
      label: "Capped protocol fee",
      desc: "Net 98% to data sellers",
    },
    {
      value: "99.8",
      unit: "%",
      label: "SLA honor rate",
      desc: "Recorded on ERC-8004",
    },
    {
      value: "$0.00",
      unit: "",
      label: "Dispute losses",
      desc: "Zero human arbitration cost",
    },
  ];

  return (
    <section id="economics" className="relative border-t border-white/5 bg-[#020204] py-32 overflow-hidden scroll-mt-32">
      {/* Background glow */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-900/10 blur-[150px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Column: Heading & Metrics */}
          <div className="lg:col-span-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-950/20 px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-purple-300 mb-6">
              <Coins size={12} className="text-purple-400" />
              Freshness Economics
            </div>

            <h2 className="text-3xl sm:text-5xl font-semibold tracking-tight text-white mb-4">
              Guaranteed Fresh. <span className="text-neutral-500">Or 100% Refunded.</span>
            </h2>

            <p className="text-sm sm:text-base leading-relaxed text-neutral-400 font-light mb-8 max-w-lg">
              The buyer agent deposits into an ERC-8183 escrow contract on Monad.
              Gross price, protocol fee, and seller proceeds are disclosed up-front.
              If the block proof arrives stale, the buyer is refunded automatically with zero deductions.
            </p>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-8">
              {metrics.map(({ value, unit, label, desc }) => (
                <div key={label} className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5">
                  <div className="text-2xl sm:text-3xl font-semibold text-white tracking-tight font-mono">
                    {value}
                    <span className="text-sm font-normal text-purple-400 ml-1">{unit}</span>
                  </div>
                  <div className="text-[11px] font-medium text-neutral-300 mt-1 uppercase tracking-wider">
                    {label}
                  </div>
                  <div className="text-[10px] text-neutral-500 mt-0.5">{desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Interactive Escrow Simulator */}
          <div className="lg:col-span-6">
            <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden">
              <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-6">
                <div>
                  <h3 className="text-base font-semibold text-white">Escrow Settlement Calculator</h3>
                  <p className="text-xs text-neutral-400">Simulate fund distribution and SLA threshold</p>
                </div>
                <span className="badge-monad text-[10px]">Live Formula</span>
              </div>

              {/* Sliders */}
              <div className="space-y-5 mb-8">
                <div>
                  <div className="flex items-center justify-between text-xs mb-2">
                    <label htmlFor={depositInputId} className="text-neutral-300 font-medium">Buyer Escrow Deposit</label>
                    <span className="font-mono text-purple-300 font-semibold">{deposit.toFixed(2)} USDC</span>
                  </div>
                  <input
                    id={depositInputId}
                    type="range"
                    min="0.10"
                    max="10.00"
                    step="0.10"
                    value={deposit}
                    onChange={(e) => setDeposit(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                  <div className="flex justify-between text-[10px] text-neutral-500 mt-1 font-mono">
                    <span>$0.10 USDC</span>
                    <span>$10.00 USDC (Cap: $50)</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs mb-2">
                    <label htmlFor={slaInputId} className="text-neutral-300 font-medium">Freshness SLA Window</label>
                    <span className="font-mono text-emerald-400 font-semibold">&le; {slaWindow}s</span>
                  </div>
                  <input
                    id={slaInputId}
                    type="range"
                    min="3"
                    max="30"
                    step="1"
                    value={slaWindow}
                    onChange={(e) => setSlaWindow(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                  <div className="flex justify-between text-[10px] text-neutral-500 mt-1 font-mono">
                    <span>3 seconds (HFT)</span>
                    <span>30 seconds (Standard)</span>
                  </div>
                </div>
              </div>

              {/* Two Outcomes Split Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6 font-mono text-xs">
                {/* Scenario 1: Fresh */}
                <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30">
                  <div className="flex items-center gap-1.5 text-emerald-400 text-[11px] font-semibold mb-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    If Fresh (&le; {slaWindow}s)
                  </div>
                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex justify-between text-neutral-400">
                      <span>Seller Net (98%):</span>
                      <span className="text-white font-semibold">{sellerNet} USDC</span>
                    </div>
                    <div className="flex justify-between text-neutral-400">
                      <span>Treasury (200 bps):</span>
                      <span className="text-neutral-300">{treasuryFee} USDC</span>
                    </div>
                    <div className="flex justify-between text-emerald-300 border-t border-emerald-500/20 pt-1 mt-1">
                      <span>Status:</span>
                      <span>PAID ON-CHAIN</span>
                    </div>
                  </div>
                </div>

                {/* Scenario 2: Stale */}
                <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/30">
                  <div className="flex items-center gap-1.5 text-rose-400 text-[11px] font-semibold mb-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                    If Stale (&gt; {slaWindow}s)
                  </div>
                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex justify-between text-neutral-400">
                      <span>Buyer Refund:</span>
                      <span className="text-white font-semibold">{deposit.toFixed(2)} USDC</span>
                    </div>
                    <div className="flex justify-between text-neutral-400">
                      <span>Deductions:</span>
                      <span className="text-emerald-400">$0.00 (Zero fee)</span>
                    </div>
                    <div className="flex justify-between text-rose-300 border-t border-rose-500/20 pt-1 mt-1">
                      <span>Status:</span>
                      <span>100% REFUNDED</span>
                    </div>
                  </div>
                </div>
              </div>

              {onOpenMarketplace && (
                <button
                  onClick={onOpenMarketplace}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-white text-black py-3 text-xs font-semibold hover:bg-neutral-200 transition-all cursor-pointer"
                >
                  <span>Browse Market Feeds with Guaranteed SLA</span>
                  <ArrowRight size={14} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
