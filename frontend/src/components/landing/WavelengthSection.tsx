import { useState } from "react";
import {
  ShieldCheck,
  Lock,
  ArrowRight,
  Cpu,
  Clock,
  Terminal,
} from "lucide-react";
import { HARD_SPENDING_CAP_USDC } from "../../lib/contracts";

export function WavelengthSection() {
  const [activeStep, setActiveStep] = useState<number>(0);

  const steps = [
    {
      title: "1. Buyer Escrow Deposit",
      badge: "ACPCore.sol",
      icon: Lock,
      color: "text-cyan-400",
      bg: "bg-cyan-500/10",
      border: "border-cyan-500/20",
      summary: `Buyer agent signs approve() and calls ACPCore.createJob() & fund() within the client-side $${HARD_SPENDING_CAP_USDC} spending cap.`,
      code: `// Client-side guard check before requesting signature
if (budget > HARD_SPENDING_CAP_USDC) throw new Error("Cap exceeded");

// Sign approve() + fund() escrow on ACPCore
await paymentToken.approve(acpCore.address, budget);
await acpCore.createJob(provider, slaEvaluator, expiry, description, hook);
await acpCore.fund(jobId, budget, "0x");`,
    },
    {
      title: "2. Off-Chain Operator Attestation",
      badge: "Operator Service (Phase 2)",
      icon: Cpu,
      color: "text-[#836ef9]",
      bg: "bg-purple-500/10",
      border: "border-purple-500/20",
      summary:
        "The operator fetches live data, records Monad sourceBlockNumber + sourceBlockTimestamp, and signs the attestation with its dedicated server key.",
      code: `// Operator signs {sellerId, jobId, dataHash, blockNum, timestamp}
const msgHash = keccak256(abi.encode(sellerId, jobId, dataHash, blockNum, timestamp));
const signature = await operatorSigner.signMessage(msgHash);

// Submit attestation to SlaEvaluator hook
await slaEvaluator.resolve(attestation);`,
    },
    {
      title: "3. Self-Enforcing SLA Hook Resolution",
      badge: "SlaEvaluator.sol",
      icon: ShieldCheck,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
      summary:
        "SlaEvaluator validates the cryptographic signature and block timestamp. If fresh <= promise, seller is paid; if stale, buyer gets 100% instant refund.",
      code: `// SlaEvaluator computes observed block age
uint256 ageSeconds = block.timestamp - att.sourceBlockTimestamp;

if (ageSeconds <= seller.freshnessWindowSeconds) {
    acpCore.complete(att.jobId, "SLA_MET"); // Escrow paid to seller
    reputationRegistry.recordOutcome(att.sellerId, true);
} else {
    acpCore.reject(att.jobId, "SLA_STALE");   // 100% refund to buyer
    reputationRegistry.recordOutcome(att.sellerId, false);
}`,
    },
  ];

  return (
    <section className="max-w-6xl mx-auto px-4 lg:px-8 py-16">
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-zinc-300 mb-3">
          <Clock className="w-3.5 h-3.5 text-[#836ef9]" />
          <span>Execution Lifecycle Architecture</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-['Outfit'] mb-3">
          How Veris Freshness Escrow Operates
        </h2>
        <p className="text-sm text-zinc-400 max-w-2xl mx-auto">
          Every query flows through an automated 3-step lifecycle: client-side cap validation, cryptographic
          off-chain attestation, and on-chain SLA hook settlement.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Interactive Step Selector */}
        <div className="lg:col-span-5 space-y-4">
          {steps.map((s, index) => {
            const Icon = s.icon;
            const isSelected = activeStep === index;
            return (
              <div
                key={index}
                onClick={() => setActiveStep(index)}
                className={`glass-panel p-5 rounded-2xl border cursor-pointer transition-all ${
                  isSelected
                    ? "border-[#836ef9]/60 bg-[#836ef9]/10 shadow-lg shadow-[#836ef9]/10"
                    : "border-white/5 hover:border-white/15 bg-black/30"
                }`}
              >
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl ${s.bg} ${s.border} border flex items-center justify-center ${s.color}`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm font-bold text-white font-['Outfit']">{s.title}</h3>
                  </div>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-white/5 text-zinc-400 border border-white/5">
                    {s.badge}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed pl-12">{s.summary}</p>
              </div>
            );
          })}
        </div>

        {/* Right Column: Code & Flow Inspector */}
        <div className="lg:col-span-7 glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 bg-[#0b0a1a]/95">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-[#836ef9]" />
              <span className="font-mono text-xs text-zinc-300 font-semibold">
                {steps[activeStep].badge}
              </span>
            </div>
            <span className="text-[11px] text-zinc-500 font-mono">
              Step {activeStep + 1} of 3
            </span>
          </div>

          <pre className="font-mono text-xs text-zinc-300 bg-black/70 p-5 rounded-2xl border border-white/5 overflow-x-auto leading-relaxed">
            <code>{steps[activeStep].code}</code>
          </pre>

          <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-zinc-400">
            <span>Deterministic Solidity execution on Monad Testnet</span>
            <div className="flex items-center gap-1.5 text-[#a797ff]">
              <span>Next Step</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
