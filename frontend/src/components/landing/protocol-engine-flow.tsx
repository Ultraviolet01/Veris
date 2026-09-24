import { ShieldCheck, Zap, ArrowRight, CheckCircle2, Cpu } from "lucide-react";

interface ProtocolEngineFlowProps {
  onOpenMarketplace?: () => void;
  onOpenPlayground?: () => void;
  onOpenDocs?: () => void;
}

export function ProtocolEngineFlow({
  onOpenMarketplace,
  onOpenPlayground,
  onOpenDocs,
}: ProtocolEngineFlowProps) {
  return (
    <section id="how-it-works" className="mb-32 scroll-mt-32">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-950/20 px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-purple-300 mb-3">
            <Cpu size={12} className="text-purple-400" />
            Agent-Native Architecture
          </div>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white">
            One Protocol. Three Native Actors.
          </h2>
          <p className="mt-2 text-sm sm:text-base text-neutral-400 max-w-2xl leading-relaxed">
            Autonomous AI agents don’t browse phone apps or file customer support tickets.
            Veris connects buyer agents, signing data operators, and settlement hooks in a verifiable on-chain loop.
          </p>
        </div>

        {/* State Machine Tag */}
        <div className="hidden lg:flex items-center gap-2 bg-[#090b12] border border-white/10 px-4 py-2 rounded-xl text-xs font-mono text-neutral-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>ERC-8183 State Machine Active</span>
        </div>
      </div>

      {/* Three Actors Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ACTOR 1: Buyer Agent */}
        <div className="glass-panel p-6 sm:p-7 rounded-2xl flex flex-col justify-between border border-white/10 hover:border-purple-500/30 transition-all duration-300 group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/5 blur-3xl pointer-events-none" />
          
          <div>
            <div className="flex items-center justify-between gap-2 mb-4">
              <span className="text-[10px] font-mono uppercase tracking-widest text-purple-400 bg-purple-950/40 border border-purple-500/20 px-2.5 py-0.5 rounded-full">
                01 · Buyer Agent
              </span>
              <span className="text-xs text-neutral-500 font-mono">ERC-8183 Client</span>
            </div>

            <h3 className="text-xl font-medium text-white mb-2 group-hover:text-purple-200 transition-colors">
              Escrows Query Capital
            </h3>
            <p className="text-xs text-neutral-400 mb-5 leading-relaxed">
              The AI agent initiates a query over MCP or HTTP. It locks payment in <code className="text-purple-300">ACPCore.sol</code> under a strict client-enforced $50.00 USDC cap.
            </p>

            {/* Code Snippet Box */}
            <div className="rounded-xl border border-white/10 bg-[#05060a] p-3.5 font-mono text-[11px] leading-relaxed text-neutral-300 mb-5 overflow-x-auto">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/5 text-[10px] text-neutral-500">
                <span>agent-query.ts</span>
                <span className="text-purple-400">x402 Micropayment</span>
              </div>
              <div className="text-neutral-500">// Locks payment in escrow</div>
              <div><span className="text-purple-400">const</span> job = <span className="text-emerald-400">await</span> veris.query({`{`}</div>
              <div className="pl-3">dataset: <span className="text-amber-300">"aave-v3-rates"</span>,</div>
              <div className="pl-3">maxSlaSec: <span className="text-purple-300">10</span>,</div>
              <div className="pl-3">escrowUsdc: <span className="text-emerald-400">"1.50"</span></div>
              <div>{`}`});</div>
            </div>

            {/* Protection Guarantee */}
            <div className="flex items-center gap-2 text-xs text-neutral-400 bg-white/[0.02] border border-white/5 p-2.5 rounded-lg mb-6">
              <ShieldCheck size={14} className="text-emerald-400 shrink-0" />
              <span className="text-[11px]">Funds remain in escrow until block proof arrives</span>
            </div>
          </div>

          <button
            onClick={onOpenMarketplace}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-white/5 border border-white/10 py-2.5 text-xs font-medium text-white hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer"
          >
            <span>Explore Live Feeds</span>
            <ArrowRight size={13} className="text-purple-400" />
          </button>
        </div>

        {/* ACTOR 2: Off-Chain Operator */}
        <div className="glass-panel p-6 sm:p-7 rounded-2xl flex flex-col justify-between border border-white/10 hover:border-purple-500/30 transition-all duration-300 group relative overflow-hidden bg-[#0a0b12]">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/10 blur-3xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between gap-2 mb-4">
              <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 bg-emerald-950/40 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                02 · Signing Operator
              </span>
              <span className="text-xs text-neutral-500 font-mono">Envio HyperRPC</span>
            </div>

            <h3 className="text-xl font-medium text-white mb-2 group-hover:text-emerald-200 transition-colors">
              Attests Monad Block
            </h3>
            <p className="text-xs text-neutral-400 mb-5 leading-relaxed">
              The operator fetches live on-chain state, hashes the payload, and signs an ECDSA attestation cryptographically bound to a specific Monad block height.
            </p>

            {/* Telemetry Display Box */}
            <div className="rounded-xl border border-white/10 bg-[#05060a] p-3.5 font-mono text-[11px] leading-relaxed text-neutral-300 mb-5">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/5 text-[10px] text-neutral-500">
                <span>telemetry.proof</span>
                <span className="text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  ECDSA Signed
                </span>
              </div>
              <div className="grid grid-cols-2 gap-y-1.5 text-[10.5px]">
                <span className="text-neutral-500">Source Block:</span>
                <span className="text-white font-mono text-right">#38,219,447</span>
                <span className="text-neutral-500">Block Delta:</span>
                <span className="text-emerald-400 font-mono text-right">2.8s &le; 10s SLA</span>
                <span className="text-neutral-500">Signer Key:</span>
                <span className="text-purple-300 font-mono text-right truncate">0x9B14...E8F1</span>
                <span className="text-neutral-500">Payload Hash:</span>
                <span className="text-neutral-400 font-mono text-right truncate">0x7a2d...3c41</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-neutral-400 bg-white/[0.02] border border-white/5 p-2.5 rounded-lg mb-6">
              <Zap size={14} className="text-purple-400 shrink-0" />
              <span className="text-[11px]">Key isolation: server-side operator, passkey seller</span>
            </div>
          </div>

          <button
            onClick={onOpenDocs}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-purple-600/15 border border-purple-500/30 py-2.5 text-xs font-medium text-purple-200 hover:bg-purple-600/25 transition-all cursor-pointer"
          >
            <span>Review Operator Specs</span>
            <ArrowRight size={13} className="text-purple-300" />
          </button>
        </div>

        {/* ACTOR 3: SlaEvaluator Hook */}
        <div className="glass-panel p-6 sm:p-7 rounded-2xl flex flex-col justify-between border border-white/10 hover:border-purple-500/30 transition-all duration-300 group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-600/5 blur-3xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between gap-2 mb-4">
              <span className="text-[10px] font-mono uppercase tracking-widest text-blue-400 bg-blue-950/40 border border-blue-500/20 px-2.5 py-0.5 rounded-full">
                03 · SlaEvaluator Hook
              </span>
              <span className="text-xs text-neutral-500 font-mono">IACPHook.sol</span>
            </div>

            <h3 className="text-xl font-medium text-white mb-2 group-hover:text-blue-200 transition-colors">
              Settles Without Dispute
            </h3>
            <p className="text-xs text-neutral-400 mb-5 leading-relaxed">
              Before funds leave escrow, <code className="text-purple-300">SlaEvaluator</code> evaluates block math on Monad. Fresh data pays the seller; stale data refunds the buyer instantly.
            </p>

            {/* Hook Logic Box */}
            <div className="rounded-xl border border-white/10 bg-[#05060a] p-3.5 font-mono text-[11px] leading-relaxed text-neutral-300 mb-5">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/5 text-[10px] text-neutral-500">
                <span>beforeAction()</span>
                <span className="text-emerald-400">Atomic Settle</span>
              </div>
              <div className="space-y-1.5 text-[10.5px]">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500">Seller Net Proceeds:</span>
                  <span className="text-emerald-400 font-semibold font-mono">1.47 USDC</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500">Veris Protocol Fee:</span>
                  <span className="text-neutral-400 font-mono">0.03 USDC (200 bps)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500">ERC-8004 Reputation:</span>
                  <span className="text-purple-300 font-mono">+0.01 (99.8% SLA)</span>
                </div>
                <div className="flex items-center justify-between border-t border-white/5 pt-1.5 mt-1.5">
                  <span className="text-neutral-500">Arbitration / Tickets:</span>
                  <span className="text-white font-mono font-medium">0 (Automated)</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-neutral-400 bg-white/[0.02] border border-white/5 p-2.5 rounded-lg mb-6">
              <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
              <span className="text-[11px]">Sub-second settlement on Monad 10,000 TPS</span>
            </div>
          </div>

          <button
            onClick={onOpenPlayground}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-white/5 border border-white/10 py-2.5 text-xs font-medium text-white hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer"
          >
            <span>Try Query Simulator</span>
            <ArrowRight size={13} className="text-purple-400" />
          </button>
        </div>
      </div>
    </section>
  );
}
