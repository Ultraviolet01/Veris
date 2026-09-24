import { useState } from "react";
import { Play, RotateCcw, CheckCircle2, XCircle, ShieldAlert, Copy, Check, Terminal } from "lucide-react";

export function AgentPlayground() {
  const [selectedScenario, setSelectedScenario] = useState<"fresh" | "stale" | "invalid">("fresh");
  const [selectedDataset, setSelectedDataset] = useState<string>("monad-dex-prices");
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(4);
  const [copied, setCopied] = useState<boolean>(false);

  const handleRunSimulation = () => {
    setIsRunning(true);
    setCurrentStep(1);

    setTimeout(() => {
      setCurrentStep(2);
      setTimeout(() => {
        setCurrentStep(3);
        setTimeout(() => {
          setCurrentStep(4);
          setIsRunning(false);
        }, 600);
      }, 600);
    }, 600);
  };

  const getProofJson = () => {
    if (selectedScenario === "fresh") {
      return JSON.stringify(
        {
          status: "PROOF_VERIFIED",
          dataset: selectedDataset,
          chainId: 10143,
          sourceBlock: 38219447,
          blockTimestamp: 1727083458,
          observedAgeSeconds: 2.8,
          maxAllowedSlaSeconds: 10.0,
          slaHonored: true,
          sellerPayoutUsdc: 1.47,
          protocolFeeUsdc: 0.03,
          seller: "0x8a41b3e8912d098e12fa",
          signerKey: "0x9B14E8F192804b72",
          settlementTx: "0x7c19ad84f019b841e01928a",
        },
        null,
        2
      );
    } else if (selectedScenario === "stale") {
      return JSON.stringify(
        {
          status: "SLA_BREACH_REFUNDED",
          dataset: selectedDataset,
          chainId: 10143,
          sourceBlock: 38218104,
          blockTimestamp: 1727083440,
          observedAgeSeconds: 14.8,
          maxAllowedSlaSeconds: 10.0,
          slaHonored: false,
          buyerRefundUsdc: 1.50,
          protocolFeeUsdc: 0.0,
          reputationPenaltyApplied: true,
          revertReason: "SlaEvaluator: attestation exceeds maxSlaSeconds",
        },
        null,
        2
      );
    } else {
      return JSON.stringify(
        {
          status: "EXECUTION_REVERTED",
          dataset: selectedDataset,
          chainId: 10143,
          error: "INVALID_SIGNATURE",
          recoveredSigner: "0x3333333333333333",
          expectedOperatorKey: "0x9B14E8F192804b72",
          revertReason: "SlaEvaluator: unauthorized attestation signer",
          fundsSafeguard: "Escrow funds locked. Caller refunded on timeout.",
        },
        null,
        2
      );
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(getProofJson());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="max-w-6xl mx-auto px-4 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-10 text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-950/20 px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-purple-300 mb-3">
          <Terminal size={12} className="text-purple-400" />
          Interactive Verification Sandbox
        </div>
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white font-['Outfit']">
          Watch a Query Become an On-Chain Proof
        </h2>
        <p className="mt-2 text-sm text-neutral-400 leading-relaxed">
          Simulate autonomous agent execution on Monad without configuring a wallet or holding testnet MON.
          Choose a scenario below to inspect how the smart contracts settle funds mathematically.
        </p>
      </div>

      {/* Scenario Selector Tabs */}
      <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
        <button
          onClick={() => setSelectedScenario("fresh")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            selectedScenario === "fresh"
              ? "bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 shadow-lg shadow-emerald-950/40"
              : "bg-white/5 border border-white/5 text-neutral-400 hover:text-white hover:bg-white/10"
          }`}
        >
          <CheckCircle2 size={15} className={selectedScenario === "fresh" ? "text-emerald-400" : "text-neutral-500"} />
          <span>Scenario 1: Fresh SLA Met (&le; 10s)</span>
        </button>

        <button
          onClick={() => setSelectedScenario("stale")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            selectedScenario === "stale"
              ? "bg-rose-500/15 border border-rose-500/40 text-rose-300 shadow-lg shadow-rose-950/40"
              : "bg-white/5 border border-white/5 text-neutral-400 hover:text-white hover:bg-white/10"
          }`}
        >
          <XCircle size={15} className={selectedScenario === "stale" ? "text-rose-400" : "text-neutral-500"} />
          <span>Scenario 2: Stale Data Breached (100% Refund)</span>
        </button>

        <button
          onClick={() => setSelectedScenario("invalid")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            selectedScenario === "invalid"
              ? "bg-amber-500/15 border border-amber-500/40 text-amber-300 shadow-lg shadow-amber-950/40"
              : "bg-white/5 border border-white/5 text-neutral-400 hover:text-white hover:bg-white/10"
          }`}
        >
          <ShieldAlert size={15} className={selectedScenario === "invalid" ? "text-amber-400" : "text-neutral-500"} />
          <span>Scenario 3: Forged / Corrupted Signer</span>
        </button>
      </div>

      {/* Main Sandbox Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Query Config & Execution Trace */}
        <div className="lg:col-span-6 space-y-6">
          <div className="glass-panel p-6 sm:p-7 rounded-2xl border border-white/10">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-300 mb-4 flex items-center justify-between">
              <span>1. Request Parameters</span>
              <span className="badge-monad text-[10px]">Mock Agent</span>
            </h3>

            <div className="space-y-4 text-xs">
              <div>
                <label className="text-neutral-400 block mb-1.5 font-medium">Dataset Feed</label>
                <select
                  value={selectedDataset}
                  onChange={(e) => setSelectedDataset(e.target.value)}
                  className="w-full bg-[#050609] border border-white/10 rounded-xl px-3.5 py-2.5 text-white font-mono text-xs focus:outline-none focus:border-purple-500"
                >
                  <option value="monad-dex-prices">Monad DEX Spot Prices (Kuru & Uniswap)</option>
                  <option value="aave-v3-rates">Aave V3 Lending APY & Reserve Factors</option>
                  <option value="gas-priority-risk">Monad Sequencer Queue & MEV Risk</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-neutral-400 block mb-1.5 font-medium">Promised SLA</label>
                  <div className="bg-[#050609] border border-white/10 rounded-xl px-3.5 py-2.5 text-white font-mono text-xs">
                    &le; 10.0 seconds
                  </div>
                </div>
                <div>
                  <label className="text-neutral-400 block mb-1.5 font-medium">Escrow Amount</label>
                  <div className="bg-[#050609] border border-white/10 rounded-xl px-3.5 py-2.5 text-white font-mono text-xs">
                    1.50 USDC
                  </div>
                </div>
              </div>

              <button
                disabled={isRunning}
                onClick={handleRunSimulation}
                className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white py-3 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
              >
                {isRunning ? (
                  <>
                    <RotateCcw size={14} className="animate-spin" />
                    <span>Executing SlaEvaluator on Monad VM...</span>
                  </>
                ) : (
                  <>
                    <Play size={14} />
                    <span>Run & Verify Settlement</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 4-Step Animated Trace */}
          <div className="glass-panel p-6 sm:p-7 rounded-2xl border border-white/10">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-300 mb-5">
              2. Protocol Execution Trace
            </h3>

            <ol className="relative border-l border-white/10 ml-3 space-y-6">
              {/* Step 1 */}
              <li className="ml-6">
                <span
                  className={`absolute -left-2.5 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-mono ${
                    currentStep >= 1 ? "bg-purple-500 text-white" : "bg-neutral-800 text-neutral-500"
                  }`}
                >
                  1
                </span>
                <h4 className="text-xs font-semibold text-white">Escrow Funded on Monad</h4>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  1.50 USDC locked in <code className="text-purple-300">ACPCore.sol</code>. Job ID generated.
                </p>
              </li>

              {/* Step 2 */}
              <li className="ml-6">
                <span
                  className={`absolute -left-2.5 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-mono ${
                    currentStep >= 2 ? "bg-purple-500 text-white" : "bg-neutral-800 text-neutral-500"
                  }`}
                >
                  2
                </span>
                <h4 className="text-xs font-semibold text-white">Operator Block Attestation Signed</h4>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Telemetry stamped at block #38,219,447. Signed by ECDSA key <code className="text-neutral-300">0x9B14...E8F1</code>.
                </p>
              </li>

              {/* Step 3 */}
              <li className="ml-6">
                <span
                  className={`absolute -left-2.5 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-mono ${
                    currentStep >= 3 ? "bg-purple-500 text-white" : "bg-neutral-800 text-neutral-500"
                  }`}
                >
                  3
                </span>
                <h4 className="text-xs font-semibold text-white">SlaEvaluator.beforeAction() Hook Evaluates</h4>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  {selectedScenario === "fresh" && "Observed age 2.8s <= 10.0s SLA. Freshness promise verified."}
                  {selectedScenario === "stale" && "Observed age 14.8s > 10.0s SLA. Freshness promise breached."}
                  {selectedScenario === "invalid" && "Recovered signer 0x333... does not match registered operatorKey."}
                </p>
              </li>

              {/* Step 4 */}
              <li className="ml-6">
                <span
                  className={`absolute -left-2.5 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-mono ${
                    currentStep >= 4
                      ? selectedScenario === "fresh"
                        ? "bg-emerald-500 text-white"
                        : "bg-rose-500 text-white"
                      : "bg-neutral-800 text-neutral-500"
                  }`}
                >
                  4
                </span>
                <h4
                  className={`text-xs font-semibold ${
                    selectedScenario === "fresh" ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {selectedScenario === "fresh" && "Seller Paid (1.47 USDC) · Reputation +0.01"}
                  {selectedScenario === "stale" && "Buyer 100% Refunded (1.50 USDC) · Reputation Penalty"}
                  {selectedScenario === "invalid" && "Execution Reverted · Funds Protected in Escrow"}
                </h4>
                <p className="text-[11px] text-neutral-500 mt-0.5">
                  Resolved atomically on Monad. Zero dispute latency.
                </p>
              </li>
            </ol>
          </div>
        </div>

        {/* Right Column: Cryptographic Proof Object JSON */}
        <div className="lg:col-span-6">
          <div className="glass-panel p-6 sm:p-7 rounded-2xl border border-white/10 relative overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-white font-mono">Proof Receipt JSON</span>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                    selectedScenario === "fresh"
                      ? "bg-emerald-950/40 border border-emerald-500/30 text-emerald-400"
                      : "bg-rose-950/40 border border-rose-500/30 text-rose-400"
                  }`}
                >
                  {selectedScenario === "fresh" ? "200 PROOF_VERIFIED" : "400 SLA_BREACH"}
                </span>
              </div>

              <button
                onClick={copyToClipboard}
                className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white bg-white/5 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
              >
                {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                <span>{copied ? "Copied" : "Copy JSON"}</span>
              </button>
            </div>

            <pre className="rounded-xl bg-[#030407] border border-white/5 p-4 font-mono text-xs leading-relaxed text-purple-200 overflow-x-auto max-h-[460px] overflow-y-auto">
              <code>{getProofJson()}</code>
            </pre>

            <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-neutral-500 font-mono">
              <span>Chain ID: 10143 (Monad Testnet)</span>
              <span>Evaluated by SlaEvaluator.sol</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
