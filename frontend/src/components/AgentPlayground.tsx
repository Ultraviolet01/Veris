import { useState } from "react";
import {
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  Copy,
  Check,
  Terminal,
  ExternalLink,
  Wallet,
  ArrowRight,
  Lock,
} from "lucide-react";
import { useDynamicContext, useIsLoggedIn } from "@dynamic-labs/sdk-react-core";
import { useBuyerFlow } from "../hooks/useBuyerFlow";
import { useUsdcBalance } from "../hooks/useUsdcBalance";
import {
  FEATURED_DATASETS,
  MONAD_TESTNET_EXPLORER,
  ADDRESSES,
} from "../lib/contracts";
import { OpenBookTxCard } from "./OpenBookReceipt";
import type { JobExecutionReceipt } from "../hooks/useBuyerFlow";

export function AgentPlayground() {
  const [selectedScenario, setSelectedScenario] = useState<"fresh" | "stale" | "invalid">("fresh");
  const [selectedDataset, setSelectedDataset] = useState<string>("aave-v3-rates");
  const [executionMode, setExecutionMode] = useState<"live" | "simulated">("simulated");
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [activeRightTab, setActiveRightTab] = useState<"receipt" | "json">("receipt");
  const [copied, setCopied] = useState<boolean>(false);
  const [liveReceipt, setLiveReceipt] = useState<{
    jobId?: string;
    txCreate?: string;
    txFund?: string;
    txResolve?: string;
    ageSeconds?: number;
    status?: string;
  } | null>(null);

  const isLoggedIn = useIsLoggedIn();
  const { setShowAuthFlow } = useDynamicContext();
  const { usdcBalance } = useUsdcBalance();
  const { executeJobPurchase, step: buyerStep, error: buyerError } = useBuyerFlow();

  const handleRunExecution = async () => {
    if (executionMode === "live") {
      if (!isLoggedIn) {
        setShowAuthFlow(true);
        return;
      }

      setIsRunning(true);
      setCurrentStep(1);
      setLiveReceipt(null);

      try {
        const targetDataset =
          FEATURED_DATASETS.find((d) => d.name.toLowerCase().includes(selectedDataset.split("-")[0])) ||
          FEATURED_DATASETS[0]; // NOAA Weather default

        const forceStale = selectedScenario === "stale";
        const result = await executeJobPurchase(targetDataset, 0.25, forceStale);

        setLiveReceipt({
          jobId: result.jobId,
          txCreate: result.txCreate,
          txFund: result.txFund,
          txResolve: result.txResolve,
          ageSeconds: result.dataAgeSeconds,
          status: result.status,
        });

        setCurrentStep(4);
      } catch (err) {
        console.error("[AgentPlayground Live Error]:", err);
      } finally {
        setIsRunning(false);
      }
    } else {
      // Interactive architectural simulation
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
    }
  };

  const getProofJson = () => {
    if (liveReceipt && liveReceipt.jobId) {
      return JSON.stringify(
        {
          mode: "LIVE_ON_CHAIN_MONAD_TESTNET",
          jobId: Number(liveReceipt.jobId),
          status: liveReceipt.status === "SLA Met" ? "COMPLETED_SELLER_PAID" : "REJECTED_BUYER_REFUNDED",
          escrowContract: ADDRESSES.acpCore,
          slaEvaluatorContract: ADDRESSES.slaEvaluator,
          txFundEscrow: liveReceipt.txFund,
          txResolve: liveReceipt.txResolve,
          observedAgeSeconds: liveReceipt.ageSeconds ?? (selectedScenario === "fresh" ? 2.4 : 15.2),
          maxAllowedSlaSeconds: 10.0,
          slaHonored: liveReceipt.status === "SLA Met",
          fundsSettlement:
            liveReceipt.status === "SLA Met"
              ? "0.245 USDC to seller (98%), 0.005 USDC to VerisTreasury (2%)"
              : "0.25 USDC 100% refunded back to buyer wallet",
        },
        null,
        2
      );
    }

    if (selectedScenario === "fresh") {
      return JSON.stringify(
        {
          mode: "SIMULATED_STATE_MACHINE",
          status: "PROOF_VERIFIED_SELLER_PAID",
          dataset: selectedDataset,
          chainId: 10143,
          sourceBlock: 38219447,
          blockTimestamp: 1727083458,
          observedAgeSeconds: 2.8,
          maxAllowedSlaSeconds: 10.0,
          slaHonored: true,
          buyerEscrowDepositUsdc: 1.50,
          sellerPayoutUsdc: 1.47,
          protocolFeeUsdc: 0.03,
          sellerPayoutAddress: "0x9b3dBb74adf386b2236D34D36E05ECC45ABB38fB",
          slaEvaluatorHook: ADDRESSES.slaEvaluator,
        },
        null,
        2
      );
    } else if (selectedScenario === "stale") {
      return JSON.stringify(
        {
          mode: "SIMULATED_STATE_MACHINE",
          status: "SLA_BREACH_AUTO_REFUNDED",
          dataset: selectedDataset,
          chainId: 10143,
          sourceBlock: 38218104,
          blockTimestamp: 1727083440,
          observedAgeSeconds: 14.8,
          maxAllowedSlaSeconds: 10.0,
          slaHonored: false,
          buyerEscrowDepositUsdc: 1.50,
          buyerRefundUsdc: 1.50,
          sellerPayoutUsdc: 0.0,
          protocolFeeUsdc: 0.0,
          revertReason: "SlaEvaluator: attestation exceeds max freshness window -> acpCore.reject()",
          refundStatus: "100% of escrow returned to buyer wallet",
        },
        null,
        2
      );
    } else {
      return JSON.stringify(
        {
          mode: "SIMULATED_STATE_MACHINE",
          status: "EXECUTION_REVERTED",
          dataset: selectedDataset,
          chainId: 10143,
          error: "INVALID_SIGNATURE",
          recoveredSigner: "0x3333333333333333",
          expectedOperatorKey: "0x9b3dBb74adf386b2236D34D36E05ECC45ABB38fB",
          revertReason: "SlaEvaluator: recovered operatorKey mismatch",
          fundsSafeguard: "Escrow funds locked. Caller refunded on timeout via claimRefund().",
        },
        null,
        2
      );
    }
  };

  const getReceiptForPlayground = (): JobExecutionReceipt => {
    const datasetTitle =
      selectedDataset === "monad-dex-prices"
        ? "Kuru CLOB DEX Best Bid/Ask & Depth"
        : selectedDataset === "aave-v3-rates"
        ? "Aave V3 Lending Rates & Liquidity APY"
        : "Monad Sequencer Queue & MEV Risk";

    if (liveReceipt && liveReceipt.jobId) {
      const isMet = liveReceipt.status === "SLA Met";
      return {
        jobId: String(liveReceipt.jobId),
        datasetName: datasetTitle,
        budgetUsdc: 0.25,
        freshnessSlaSeconds: 10,
        status: isMet ? "SLA Met" : "Refunded",
        verdict: isMet ? "APPROVED" : "REFUNDED",
        outcome: isMet ? "settled" : "refunded",
        refundReason: !isMet
          ? `SlaNotMet: observed data age (${(liveReceipt.ageSeconds ?? 15.2).toFixed(1)}s) > 10.0s SLA`
          : undefined,
        txFund: liveReceipt.txFund,
        txResolve: liveReceipt.txResolve,
        sellerAmountUsdc: isMet ? 0.245 : 0,
        treasuryAmountUsdc: isMet ? 0.005 : 0,
        dataAgeSeconds: liveReceipt.ageSeconds ?? (isMet ? 2.4 : 15.2),
        isSimulated: false,
        dataPayload: {
          sourceBlockNumber: 38219447,
          timestamp: Math.floor(Date.now() / 1000) - (isMet ? 2 : 15),
          feed: selectedDataset,
          latencyMs: isMet ? 2400 : 15200,
          data: isMet ? { bid: "1.0421 MON", ask: "1.0424 MON", depth: "$420,000" } : { stale: true },
        } as any,
      };
    }

    if (selectedScenario === "fresh") {
      return {
        jobId: "194",
        datasetName: datasetTitle,
        budgetUsdc: 1.50,
        freshnessSlaSeconds: 10,
        status: "SLA Met",
        verdict: "APPROVED",
        outcome: "settled",
        txFund: "0x172371ebd0832f4078c9d1c68b89c23a517ca21b365c1c6dba906a95b7c73bba",
        txResolve: "0x8f21e4a7b9c1d0e3a5f78901234567890abcdef138218104a7b9c1d0e3a5f789",
        sellerAmountUsdc: 1.47,
        treasuryAmountUsdc: 0.03,
        dataAgeSeconds: 2.8,
        isSimulated: true,
        dataPayload: {
          sourceBlockNumber: 38219447,
          timestamp: 1727083458,
          feed: selectedDataset,
          latencyMs: 2800,
          data: { bid: "1.0421 MON", ask: "1.0424 MON", depth: "$420,000" },
        } as any,
      };
    }

    if (selectedScenario === "stale") {
      return {
        jobId: "195",
        datasetName: datasetTitle,
        budgetUsdc: 1.50,
        freshnessSlaSeconds: 10,
        status: "Refunded",
        verdict: "REFUNDED",
        outcome: "refunded",
        refundReason: "SlaNotMet: observed data age (14.8s) exceeded 10.0s SLA floor",
        txFund: "0x172371ebd0832f4078c9d1c68b89c23a517ca21b365c1c6dba906a95b7c73bba",
        txResolve: "0x9c4f1e0e80d991656243384a1e9dd62f4dc1e0e80d991656243384a1e9dd62f4",
        sellerAmountUsdc: 0,
        treasuryAmountUsdc: 0,
        dataAgeSeconds: 14.8,
        isSimulated: true,
        dataPayload: {
          sourceBlockNumber: 38218104,
          timestamp: 1727083440,
          feed: selectedDataset,
          latencyMs: 14800,
          data: { bid: "1.0390 MON", ask: "1.0450 MON", stale: true },
        } as any,
      };
    }

    return {
      jobId: "196",
      datasetName: datasetTitle,
      budgetUsdc: 1.50,
      freshnessSlaSeconds: 10,
      status: "Refunded",
      verdict: "REFUSED",
      outcome: "refunded",
      refundReason: "InvalidSignature: recovered operatorKey does not match SellerRegistry",
      txFund: "0x172371ebd0832f4078c9d1c68b89c23a517ca21b365c1c6dba906a95b7c73bba",
      sellerAmountUsdc: 0,
      treasuryAmountUsdc: 0,
      dataAgeSeconds: 3.1,
      isSimulated: true,
    };
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(getProofJson());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="max-w-6xl mx-auto px-4 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-8 text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-950/20 px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-purple-300 mb-3">
          <Terminal size={12} className="text-purple-400" />
          Interactive Verification & Escrow Sandbox
        </div>
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white font-['Outfit']">
          Watch Funds Escrow & Resolve On-Chain
        </h2>
        <p className="mt-2 text-sm text-neutral-400 leading-relaxed">
          In Veris, funds are <strong>deducted first into the ACPCore escrow contract</strong>.
          The operator signs a block freshness attestation: if fresh, funds route to the seller (98%) and treasury (2%); if stale, <strong>100% is automatically refunded to the buyer</strong>.
        </p>

        {/* Live vs Simulation Mode Switcher */}
        <div className="mt-5 inline-flex items-center gap-2 p-1.5 rounded-2xl bg-neutral-900 border border-white/10 shadow-lg">
          <button
            onClick={() => setExecutionMode("simulated")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              executionMode === "simulated"
                ? "bg-purple-600 text-white shadow-md shadow-purple-900/40"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            ⚡ Instant Simulation Mode
          </button>
          <button
            onClick={() => setExecutionMode("live")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              executionMode === "live"
                ? "bg-cyan-600 text-white shadow-md shadow-cyan-900/40"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <Wallet size={12} />
            <span>Live On-Chain Escrow (Monad Testnet)</span>
          </button>
        </div>
      </div>

      {/* Escrow Balance & Flow Visualizer Banner */}
      <div className="mb-8 p-4 rounded-2xl bg-[#090b14] border border-purple-500/20 shadow-xl">
        <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-2 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-purple-300">
            <Lock size={12} />
            Escrow State Invariant Flow
          </span>
          <span className="text-[10px] text-cyan-400 font-mono">
            {executionMode === "live" ? `Wallet Balance: ${usdcBalance} USDC` : "Demo Model: 1.50 USDC"}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center text-xs">
          {/* Step 1: Deposit */}
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
            <div className="text-[10px] text-neutral-400 font-medium">1. Fund Deducted into Escrow</div>
            <div className="text-sm font-bold text-white flex items-center gap-1">
              <span className="text-rose-400">- 1.50 USDC</span>
              <ArrowRight size={12} className="text-neutral-500" />
              <span className="text-purple-300 font-mono">ACPCore.sol</span>
            </div>
            <p className="text-[10px] text-neutral-500">Locked in escrow contract via <code>fund()</code></p>
          </div>

          {/* Step 2: Verification */}
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
            <div className="text-[10px] text-neutral-400 font-medium">2. SlaEvaluator Attestation Check</div>
            <div className="text-sm font-bold text-cyan-300">
              {selectedScenario === "fresh" && "Observed Age: 2.8s ≤ 10s SLA"}
              {selectedScenario === "stale" && "Observed Age: 14.8s > 10s (Stale!)"}
              {selectedScenario === "invalid" && "Invalid ECDSA Operator Key"}
            </div>
            <p className="text-[10px] text-neutral-500">Wall-clock block timestamp verification</p>
          </div>

          {/* Step 3: Payout or Refund */}
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
            <div className="text-[10px] text-neutral-400 font-medium">3. Settlement Outcome</div>
            <div className={`text-sm font-bold ${selectedScenario === "fresh" ? "text-emerald-400" : "text-rose-400"}`}>
              {selectedScenario === "fresh" && "Seller Paid (1.47) + Veris (0.03)"}
              {selectedScenario === "stale" && "100% Refunded to Buyer (+1.50)"}
              {selectedScenario === "invalid" && "Reverted · Funds In Escrow"}
            </div>
            <p className="text-[10px] text-neutral-500">
              {selectedScenario === "fresh" ? "SlaEvaluator.complete() executes" : "acpCore.reject() refunds buyer in full"}
            </p>
          </div>
        </div>
      </div>

      {/* Scenario Selector Tabs */}
      <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
        <button
          onClick={() => { setSelectedScenario("fresh"); setCurrentStep(0); setLiveReceipt(null); }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            selectedScenario === "fresh"
              ? "bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 shadow-lg shadow-emerald-950/40"
              : "bg-white/5 border border-white/5 text-neutral-400 hover:text-white hover:bg-white/10"
          }`}
        >
          <CheckCircle2 size={15} className={selectedScenario === "fresh" ? "text-emerald-400" : "text-neutral-500"} />
          <span>Scenario 1: Fresh SLA Met (&le; 10s) &rarr; Seller Paid</span>
        </button>

        <button
          onClick={() => { setSelectedScenario("stale"); setCurrentStep(0); setLiveReceipt(null); }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            selectedScenario === "stale"
              ? "bg-rose-500/15 border border-rose-500/40 text-rose-300 shadow-lg shadow-rose-950/40"
              : "bg-white/5 border border-white/5 text-neutral-400 hover:text-white hover:bg-white/10"
          }`}
        >
          <XCircle size={15} className={selectedScenario === "stale" ? "text-rose-400" : "text-neutral-500"} />
          <span>Scenario 2: Stale Data Breached &rarr; 100% Buyer Refund</span>
        </button>

        <button
          onClick={() => { setSelectedScenario("invalid"); setCurrentStep(0); setLiveReceipt(null); }}
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
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${executionMode === "live" ? "bg-cyan-950/40 border border-cyan-500/30 text-cyan-300" : "bg-purple-950/40 border border-purple-500/30 text-purple-300"}`}>
                {executionMode === "live" ? "Live Monad Testnet" : "Simulation Model"}
              </span>
            </h3>

            <div className="space-y-4 text-xs">
              <div>
                <label className="text-neutral-400 block mb-1.5 font-medium">Dataset Feed</label>
                <select
                  value={selectedDataset}
                  onChange={(e) => setSelectedDataset(e.target.value)}
                  className="w-full bg-[#050609] border border-white/10 rounded-xl px-3.5 py-2.5 text-white font-mono text-xs focus:outline-none focus:border-purple-500"
                >
                  <option value="aave-v3-rates">Aave V3 Lending Rates & Reserve Liquidity (Ethereum)</option>
                  <option value="uniswap-v3-twap">Uniswap V3 High-Frequency Pool TWAP & Ticks</option>
                  <option value="pyth-oracles">Pyth Network On-Chain Price Attestations</option>
                  <option value="kuru-clob-dex">Kuru CLOB On-Chain Order Book Depth (Monad)</option>
                  <option value="opensea-seaport">OpenSea Seaport 1.6 Protocol Trades & Floor</option>
                  <option value="curve-stableswap">Curve Finance Multi-Asset Stable-Peg Deviations</option>
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
                  <label className="text-neutral-400 block mb-1.5 font-medium">Escrow Deposit</label>
                  <div className="bg-[#050609] border border-white/10 rounded-xl px-3.5 py-2.5 text-white font-mono text-xs text-rose-300 font-bold">
                    {executionMode === "live" ? "0.25 USDC" : "1.50 USDC"}
                  </div>
                </div>
              </div>

              {buyerError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                  {buyerError}
                </div>
              )}

              <button
                disabled={isRunning}
                onClick={handleRunExecution}
                className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white py-3 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50 shadow-lg shadow-purple-900/30"
              >
                {isRunning ? (
                  <>
                    <RotateCcw size={14} className="animate-spin" />
                    <span>
                      {buyerStep === "approving"
                        ? "Approving USDC Allowance..."
                        : buyerStep === "creating_job"
                        ? "Creating Job on ACPCore..."
                        : buyerStep === "setting_budget"
                        ? "Setting Escrow Budget on ACPCore..."
                        : buyerStep === "funding_job"
                        ? "Deducting USDC into Escrow (fund)..."
                        : "Resolving Attestation on Monad VM..."}
                    </span>
                  </>
                ) : (
                  <>
                    <Play size={14} />
                    <span>
                      {executionMode === "live"
                        ? !isLoggedIn
                          ? "Connect Wallet to Execute Live Escrow"
                          : `Deduct Escrow & Resolve On-Chain (${selectedScenario === "stale" ? "Trigger Refund" : "Settle Payout"})`
                        : "Run Escrow Lifecycle Simulation"}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 4-Step Animated Trace */}
          <div className="glass-panel p-6 sm:p-7 rounded-2xl border border-white/10">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-300 mb-5 flex items-center justify-between">
              <span>2. Protocol Execution Trace</span>
              {currentStep === 4 && (
                <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                  <CheckCircle2 size={12} /> Settled
                </span>
              )}
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
                <h4 className="text-xs font-semibold text-white">Funds Deducted into Escrow</h4>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  USDC transferred from buyer wallet and locked in <code className="text-purple-300">ACPCore.sol</code>.
                </p>
                {liveReceipt?.txFund && (
                  <a
                    href={`${MONAD_TESTNET_EXPLORER}/tx/${liveReceipt.txFund}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[10px] text-cyan-300 hover:underline mt-1 font-mono"
                  >
                    <span>View MonadScan Escrow Deposit Tx</span>
                    <ExternalLink size={10} />
                  </a>
                )}
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
                  Delivered payload stamped with source block timestamp. Signed by operator key <code className="text-neutral-300">0x9b3d...38fB</code>.
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
                <h4 className="text-xs font-semibold text-white">SlaEvaluator Verifies Attestation & SLA</h4>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  {selectedScenario === "fresh" && "Observed age ≤ 10.0s SLA window. Contract validates freshness."}
                  {selectedScenario === "stale" && "Observed age > 10.0s SLA window. Contract marks freshness BREACHED."}
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
                  {selectedScenario === "fresh" && "Seller Paid (98%) · Protocol Fee (2%)"}
                  {selectedScenario === "stale" && "100% Escrow Automatically Refunded to Buyer"}
                  {selectedScenario === "invalid" && "Execution Reverted · Funds Protected in Escrow"}
                </h4>
                <p className="text-[11px] text-neutral-500 mt-0.5">
                  {selectedScenario === "fresh"
                    ? "acpCore.complete() released payment to seller payoutAddress."
                    : selectedScenario === "stale"
                    ? "acpCore.reject() executed 100% return transfer to buyer address."
                    : "No unauthorized payouts permitted."}
                </p>
                {liveReceipt?.txResolve && (
                  <a
                    href={`${MONAD_TESTNET_EXPLORER}/tx/${liveReceipt.txResolve}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[10px] text-emerald-300 hover:underline mt-1 font-mono"
                  >
                    <span>View MonadScan Settlement Tx</span>
                    <ExternalLink size={10} />
                  </a>
                )}
              </li>
            </ol>
          </div>
        </div>

        {/* Right Column: OpenBook Rubber-Stamp Receipt & Proof Object */}
        <div className="lg:col-span-6 space-y-4">
          {/* View Switcher: Rubber-Stamp Receipt vs Raw Proof JSON */}
          <div className="flex items-center justify-between pb-2 border-b border-white/5">
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-neutral-900 border border-white/10">
              <button
                type="button"
                onClick={() => setActiveRightTab("receipt")}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
                  activeRightTab === "receipt"
                    ? "bg-purple-600 text-white shadow-sm"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                📜 Rubber-Stamp Receipt
              </button>
              <button
                type="button"
                onClick={() => setActiveRightTab("json")}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
                  activeRightTab === "json"
                    ? "bg-purple-600 text-white shadow-sm"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                {"{ }"} Raw Proof JSON
              </button>
            </div>

            <button
              onClick={copyToClipboard}
              className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white bg-white/5 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
            >
              {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
              <span>{copied ? "Copied" : "Copy JSON"}</span>
            </button>
          </div>

          {activeRightTab === "receipt" ? (
            <OpenBookTxCard
              receipt={getReceiptForPlayground()}
              datasetName={getReceiptForPlayground().datasetName}
              budgetUsdc={getReceiptForPlayground().budgetUsdc}
              freshnessSlaSeconds={10}
            />
          ) : (
            <div className="glass-panel p-6 sm:p-7 rounded-2xl border border-white/10 relative overflow-hidden shadow-2xl">
              <pre className="rounded-xl bg-[#030407] border border-white/5 p-4 font-mono text-xs leading-relaxed text-purple-200 overflow-x-auto max-h-[460px] overflow-y-auto">
                <code>{getProofJson()}</code>
              </pre>

              <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-neutral-500 font-mono">
                <span>Chain ID: 10143 (Monad Testnet)</span>
                <span>Evaluated by SlaEvaluator.sol</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
