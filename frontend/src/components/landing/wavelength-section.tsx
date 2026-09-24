import { Coins } from "lucide-react";
import { DiscountChart } from "./discount-chart";
import { LensVisual } from "./lens-visual";

export function WavelengthSection() {
  const metrics = [
    {
      value: "< 400",
      unit: "ms",
      label: "Avg settlement latency",
    },
    {
      value: "200",
      unit: "bps",
      label: "Capped protocol fee",
    },
    {
      value: "99.8",
      unit: "%",
      label: "SLA honor rate",
    },
  ];

  return (
    <section
      id="economics"
      className="relative border-t border-white/5 bg-[#020202] py-32 overflow-hidden scroll-mt-32"
    >
      <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-red-900/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute right-0 bottom-0 translate-x-1/3 translate-y-1/3 w-[500px] h-[500px] bg-white/5 blur-[100px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="animate-on-scroll [animation:fadeInUp_0.8s_ease-out_0.2s_both]">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-neutral-300 mb-6">
              <Coins size={12} />
              Freshness Economics
            </div>

            <h2 className="text-3xl font-medium tracking-tight text-white md:text-5xl mb-6">
              Guaranteed fresh, <span className="text-neutral-500">or 100% refunded.</span>
            </h2>

            <p className="leading-relaxed font-light text-neutral-400 max-w-lg mb-8">
              The buyer agent deposits into an escrow contract on Monad. Gross price, protocol fee,
              and seller net are disclosed up-front. If the block proof exceeds the seller&apos;s SLA window,
              the buyer is refunded with zero deductions.
            </p>

            <div className="relative w-full rounded-2xl border border-white/10 bg-[#080808] p-6 mb-8 shadow-2xl">
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center mb-6">
                <div>
                  <div className="text-xs font-semibold text-white">Resolution probability by block age</div>
                  <div className="text-[10px] text-neutral-500 font-mono">
                    Sample Feed · 10.0s SLA window · Monad Testnet
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    <span className="text-[10px] text-neutral-400">Fresh settlement</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-neutral-700" />
                    <span className="text-[10px] text-neutral-400">Stale refund</span>
                  </div>
                </div>
              </div>
              <div className="h-[250px] w-full">
                <DiscountChart />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 border-t border-white/5 pt-6">
              {metrics.map(({ value, unit, label }) => (
                <div key={label}>
                  <div className="text-2xl font-medium text-white tracking-tight">
                    {value}
                    <span className="text-sm text-neutral-500 ml-1">{unit}</span>
                  </div>
                  <div className="text-[10px] text-neutral-500 uppercase tracking-widest mt-1">
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <LensVisual />
        </div>
      </div>
    </section>
  );
}
