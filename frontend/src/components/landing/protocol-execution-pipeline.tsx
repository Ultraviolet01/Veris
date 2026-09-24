import { useState } from "react";
import { ArrowRight, ChevronRight, Activity, Code2 } from "lucide-react";

interface PipelineNode {
  id: string;
  index: string;
  name: string;
  role: string;
  status: string;
  contract: string;
  abi: string;
  gasEstimate: string;
  description: string;
  telemetry: { label: string; value: string }[];
}

const PIPELINE_NODES: PipelineNode[] = [
  {
    id: "agent",
    index: "01",
    name: "Autonomous Agent",
    role: "ERC-8183 Client",
    status: "STANDBY_CALLER",
    contract: "Off-Chain / MCP Client",
    abi: "veris.query(datasetId, { maxSlaSeconds: 10, escrowUsdc: 1.50 })",
    gasEstimate: "0 gas (Off-chain trigger)",
    description: "The AI agent detects a data requirement, calculates required freshness, and dispatches an x402 payment escrow intent.",
    telemetry: [
      { label: "Client Protocol", value: "Model Context Protocol (MCP)" },
      { label: "Hard Spending Cap", value: "$50.00 USDC / call guard" },
      { label: "Target Chain", value: "Monad Testnet (10143)" },
    ],
  },
  {
    id: "escrow",
    index: "02",
    name: "ACPCore Escrow",
    role: "ERC-8183 Core Vault",
    status: "FUNDS_LOCKED",
    contract: "0x1111111111111111111111111111111111111111",
    abi: "createJob(provider, evaluator, expiredAt) -> returns (jobId)",
    gasEstimate: "48,210 gas",
    description: "Locks buyer funds in isolated job escrow. Funds cannot be claimed by the provider without evaluator authorization.",
    telemetry: [
      { label: "Job Deposit", value: "1.500000 USDC" },
      { label: "Escrow Status", value: "Funded (State 1)" },
      { label: "Expiry Delta", value: "+300s emergency timeout" },
    ],
  },
  {
    id: "operator",
    index: "03",
    name: "Signing Operator",
    role: "Envio HyperRPC Ingest",
    status: "ATTESTATION_EMITTED",
    contract: "Operator Key 0x9B14...E8F1",
    abi: "signAttestation(sellerId, jobId, dataHash, sourceBlock, timestamp)",
    gasEstimate: "18ms latency",
    description: "Samples live state from Monad DEX or lending pools, computes payload keccak256 hash, and signs verifiable ECDSA proof.",
    telemetry: [
      { label: "Source Block", value: "#38,219,447" },
      { label: "Sampled Latency", value: "14.2 ms" },
      { label: "Attestation Hash", value: "0x7a2d81f2...3c41" },
    ],
  },
  {
    id: "evaluator",
    index: "04",
    name: "SlaEvaluator Hook",
    role: "IACPHook.beforeAction",
    status: "BLOCK_CHECK_PASSED",
    contract: "0x2222222222222222222222222222222222222222",
    abi: "beforeAction(jobId, actionType, payload) -> bool approved",
    gasEstimate: "24,800 gas",
    description: "Validates attestation signature on-chain and enforces block freshness math: delta = block.timestamp - sourceTimestamp <= SLA.",
    telemetry: [
      { label: "Observed Delta", value: "2.80s <= 10.00s SLA" },
      { label: "Verification Result", value: "0x01 (APPROVED)" },
      { label: "Execution Mode", value: "Monad Parallel EVM" },
    ],
  },
  {
    id: "settle",
    index: "05",
    name: "Atomic Settlement",
    role: "Fund Release / Refund",
    status: "FINALIZED",
    contract: "VerisTreasury + Payout",
    abi: "complete(jobId) -> Payout + emit ReputationUpdated(seller, +1)",
    gasEstimate: "31,400 gas",
    description: "Splits funds atomically in the same block: seller net 98%, protocol treasury 2%. Or 100% refund to buyer if stale.",
    telemetry: [
      { label: "Seller Net", value: "1.470000 USDC" },
      { label: "Protocol Fee", value: "0.030000 USDC (200 bps)" },
      { label: "ERC-8004 Record", value: "SLA Met (+0.01 rating)" },
    ],
  },
];

export function ProtocolExecutionPipeline({
  onOpenMarketplace,
  onOpenPlayground,
}: {
  onOpenMarketplace?: () => void;
  onOpenPlayground?: () => void;
}) {
  const [selectedNodeId, setSelectedNodeId] = useState<string>("evaluator");

  const selectedNode =
    PIPELINE_NODES.find((n) => n.id === selectedNodeId) || PIPELINE_NODES[3];

  return (
    <section id="how-it-works" className="mb-32 scroll-mt-32">
      {/* Section Header with Industrial Ruler */}
      <div className="border-t border-b border-white/10 py-6 mb-10 bg-[#030305]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 font-mono text-[11px] text-neutral-500 uppercase tracking-widest">
              <span className="text-[#FF5A36] font-semibold">[01 // PIPELINE]</span>
              <span>On-Chain Execution Circuit</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white font-['Manrope']">
              The Continuous Settlement Pipeline
            </h2>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono text-neutral-400">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-white/5 border border-white/10">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Chain ID: 10143
            </span>
            <span className="hidden sm:inline-block text-neutral-600">|</span>
            <span className="text-neutral-500">Atomic Sub-Second Resolution</span>
          </div>
        </div>
      </div>

      {/* Horizontal Circuit Node Strip */}
      <div className="mb-6 overflow-x-auto pb-2 no-scrollbar">
        <div className="flex items-center min-w-[850px] gap-2 p-1.5 rounded-2xl bg-[#06070a] border border-white/10">
          {PIPELINE_NODES.map((node, i) => {
            const isSelected = selectedNodeId === node.id;
            return (
              <div key={node.id} className="flex-1 flex items-center">
                <button
                  type="button"
                  onClick={() => setSelectedNodeId(node.id)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer relative group ${
                    isSelected
                      ? "bg-[#0d0e17] border-white/25 shadow-lg shadow-black/80"
                      : "bg-transparent border-transparent hover:bg-white/[0.02] hover:border-white/5"
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-mono text-neutral-500 mb-1">
                    <span className={isSelected ? "text-[#FF5A36] font-semibold" : "group-hover:text-neutral-300"}>
                      {node.index}
                    </span>
                    <span className="text-[9px] uppercase tracking-wider">{node.role}</span>
                  </div>
                  <div className="text-xs font-semibold text-white font-mono truncate">
                    {node.name}
                  </div>
                  <div className="text-[10px] text-neutral-400 font-mono mt-1 flex items-center gap-1 truncate">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      i === 4 ? "bg-emerald-400" : isSelected ? "bg-[#FF5A36]" : "bg-neutral-600"
                    }`} />
                    <span className="truncate">{node.status}</span>
                  </div>

                  {/* Active node top glow indicator */}
                  {isSelected && (
                    <div className="absolute -top-[1px] left-4 right-4 h-[2px] bg-gradient-to-r from-transparent via-[#FF5A36] to-transparent" />
                  )}
                </button>

                {i < PIPELINE_NODES.length - 1 && (
                  <ChevronRight size={14} className="text-neutral-700 shrink-0 mx-1" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Low-Level Node Telemetry Inspector */}
      <div className="rounded-2xl border border-white/10 bg-[#06070a] overflow-hidden">
        {/* Terminal Header */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-white/5 bg-[#040407] text-xs font-mono">
          <div className="flex items-center gap-2.5">
            <Activity size={14} className="text-[#FF5A36]" />
            <span className="text-white font-semibold">Node Inspector</span>
            <span className="text-neutral-600">::</span>
            <span className="text-neutral-400">Node [{selectedNode.index}] {selectedNode.name}</span>
          </div>
          <span className="text-neutral-500 text-[11px]">EVM State: Active</span>
        </div>

        {/* Dual Pane Detail Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-white/5">
          {/* Left Column: Mechanical Summary & Description */}
          <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-[#FF5A36] bg-red-950/20 border border-red-500/20 px-2.5 py-0.5 rounded mb-3">
                {selectedNode.role}
              </div>
              <h3 className="text-xl font-medium text-white mb-2 font-['Manrope']">
                {selectedNode.name}
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed font-light mb-6">
                {selectedNode.description}
              </p>

              {/* Telemetry Key-Value List */}
              <div className="space-y-2 border-t border-white/5 pt-4 font-mono text-xs">
                {selectedNode.telemetry.map((t) => (
                  <div key={t.label} className="flex items-center justify-between text-[11px]">
                    <span className="text-neutral-500">{t.label}:</span>
                    <span className="text-white font-medium">{t.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-white/5 flex flex-wrap items-center gap-4">
              {onOpenPlayground && (
                <button
                  type="button"
                  onClick={onOpenPlayground}
                  className="flex items-center gap-1.5 text-xs font-mono font-medium text-[#FF5A36] hover:text-white transition-colors cursor-pointer"
                >
                  <span>Simulate in Playground</span>
                  <ArrowRight size={12} />
                </button>
              )}
              {onOpenMarketplace && (
                <button
                  type="button"
                  onClick={onOpenMarketplace}
                  className="flex items-center gap-1.5 text-xs font-mono font-medium text-neutral-400 hover:text-white transition-colors cursor-pointer"
                >
                  <span>Browse Live Feeds</span>
                  <ArrowRight size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Right Column: Decompiled ABI & Calldata Output */}
          <div className="lg:col-span-7 p-6 sm:p-8 bg-[#030306] flex flex-col justify-between font-mono text-xs">
            <div>
              <div className="flex items-center justify-between text-[11px] text-neutral-500 mb-3 pb-2 border-b border-white/5">
                <span className="flex items-center gap-1.5">
                  <Code2 size={13} className="text-purple-400" />
                  EVM Method Signature
                </span>
                <span className="text-emerald-400 font-semibold">{selectedNode.gasEstimate}</span>
              </div>

              {/* Code Box */}
              <div className="rounded-xl bg-[#010204] border border-white/5 p-4 text-purple-200 text-[11px] leading-relaxed mb-5 overflow-x-auto">
                <div className="text-neutral-600">// Target contract: {selectedNode.contract}</div>
                <div className="text-white font-semibold mt-1">{selectedNode.abi}</div>
              </div>

              {/* Operational Guarantees */}
              <div className="grid grid-cols-2 gap-3 text-[11px]">
                <div className="p-3 rounded-lg bg-white/[0.01] border border-white/5">
                  <span className="text-neutral-500 block text-[10px]">Settlement Finality</span>
                  <span className="text-white font-medium">Single Monad Block</span>
                </div>
                <div className="p-3 rounded-lg bg-white/[0.01] border border-white/5">
                  <span className="text-neutral-500 block text-[10px]">Arbitration Layer</span>
                  <span className="text-emerald-400 font-medium">Zero Human Appeal</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/5 mt-6 flex items-center justify-between text-[10.5px] text-neutral-500">
              <span>Verified contract deployment: Monad Testnet (10143)</span>
              <span>Gas paid by caller or operator</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
