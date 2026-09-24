import { ShieldCheck, Lock, Clock, Code2, ArrowUpRight, Scale } from "lucide-react";

export function TrustBoundary() {
  const comparisonItems = [
    {
      metric: "Settlement Speed",
      legacy: "24h - 7d dispute windows",
      veris: "< 400ms atomic Monad block check",
    },
    {
      metric: "Freshness Enforcement",
      legacy: "Unenforceable promise in PDF docs",
      veris: "Machine-checkable smart contract SLA",
    },
    {
      metric: "Arbitration",
      legacy: "Human committee or multi-sig",
      veris: "Zero human intervention (pure math)",
    },
    {
      metric: "Reputation Record",
      legacy: "Self-reported marketing testimonials",
      veris: "Persistent on-chain ERC-8004 score",
    },
  ];

  return (
    <section id="safety" className="py-28 relative scroll-mt-32">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Column: Guarantees */}
          <div className="lg:col-span-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-950/20 px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-purple-300 mb-6">
              <ShieldCheck size={12} className="text-purple-400" />
              Cryptographic Trust Boundary
            </div>
            
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white mb-4">
              What Monad Actually Checks
            </h2>
            <p className="text-sm sm:text-base leading-relaxed text-neutral-400 mb-8 font-light">
              Traditional data providers make freshness a vague promise in API documentation.
              Veris transforms freshness into an atomic condition of payment evaluated directly on the Monad VM.
            </p>

            <div className="space-y-5">
              <div className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0 mt-0.5">
                  <Lock size={16} />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">Atomic BeforeAction Hook</h4>
                  <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                    <code className="text-purple-300">ACPCore.sol</code> delegates validation to <code className="text-purple-300">SlaEvaluator.sol</code> before any job completes. Stale data cannot release funds.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                  <Clock size={16} />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">Deterministic Block Delta Math</h4>
                  <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                    Freshness is strictly evaluated as: <code className="text-neutral-300 font-mono text-[11px]">delta = block.timestamp - sourceTimestamp &le; SLA</code>. Pure mathematical truth.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0 mt-0.5">
                  <Scale size={16} />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">Operator Key Isolation</h4>
                  <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                    Human sellers connect via Dynamic embedded wallets (social/passkey). High-speed signing keys remain isolated on the server.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Comparison Table & Live Proof Box */}
          <div className="lg:col-span-6 space-y-6">
            {/* Live Attestation Schema Card */}
            <div className="glass-panel p-6 sm:p-7 rounded-2xl border border-white/10 shadow-2xl">
              <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-4">
                <div className="flex items-center gap-2">
                  <Code2 size={16} className="text-purple-400" />
                  <span className="text-xs font-semibold text-white font-mono">EIP-712 Attestation Schema</span>
                </div>
                <span className="badge-monad text-[10px]">Chain ID 10143</span>
              </div>

              <div className="rounded-xl bg-[#050609] border border-white/5 p-4 font-mono text-xs space-y-2 mb-5">
                <div className="flex justify-between text-[11px]">
                  <span className="text-neutral-500">Target Chain:</span>
                  <span className="text-white">10143 · Monad Testnet</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-neutral-500">Source Block Height:</span>
                  <span className="text-purple-300 font-semibold">#38,219,447</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-neutral-500">Attestation Hash:</span>
                  <span className="text-neutral-400 truncate max-w-[200px]">0x7a2d81f2c90e3a41...</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-neutral-500">EVM Evaluation Latency:</span>
                  <span className="text-emerald-400">14 ms · Monad VM</span>
                </div>
              </div>

              {/* Contrast Matrix */}
              <div className="border-t border-white/5 pt-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-3">
                  Legacy Architecture vs. Veris
                </h4>
                <div className="space-y-2">
                  {comparisonItems.map((item) => (
                    <div
                      key={item.metric}
                      className="grid grid-cols-3 gap-2 text-[11px] p-2 rounded-lg bg-white/[0.02] border border-white/5"
                    >
                      <span className="text-neutral-400 font-medium">{item.metric}</span>
                      <span className="text-rose-400/80 line-through text-[10px]">{item.legacy}</span>
                      <span className="text-emerald-400 font-medium text-[10px]">{item.veris}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-between text-xs text-neutral-400">
                <span>View verified contracts on Monadscan</span>
                <a
                  href="https://testnet.monadscan.com"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-purple-300 hover:text-white transition-colors"
                >
                  <span>Monadscan</span>
                  <ArrowUpRight size={12} />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
