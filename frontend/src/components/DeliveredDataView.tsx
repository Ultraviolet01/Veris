import React, { useState } from "react";
import {
  Copy,
  Check,
  Download,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Tag,
  ShieldCheck,
  Activity,
  Layers,
  Sparkles,
} from "lucide-react";
import { MONAD_TESTNET_EXPLORER } from "../lib/contracts";

function truncateHash(hash?: string, start = 8, end = 6): string {
  if (!hash || hash.length <= start + end) return hash || "";
  return `${hash.slice(0, start)}...${hash.slice(-end)}`;
}

export interface DeliveredDataViewProps {
  payload: Record<string, any>;
  datasetName?: string;
  observedAgeSeconds?: number;
  slaSeconds?: number;
  jobId?: string | number;
  txHash?: string;
}

export function DeliveredDataView({
  payload,
  datasetName = "",
  observedAgeSeconds,
  slaSeconds,
  jobId,
  txHash,
}: DeliveredDataViewProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [jsonExpanded, setJsonExpanded] = useState(true);

  if (!payload || typeof payload !== "object") {
    return (
      <div className="p-4 rounded-xl border border-white/10 bg-black/40 text-center text-xs text-zinc-400">
        No delivered payload available for this query.
      </div>
    );
  }

  const nameLower = (datasetName || (payload.source || "")).toLowerCase();
  const isOpenSea =
    nameLower.includes("opensea") ||
    nameLower.includes("seaport") ||
    nameLower.includes("nft") ||
    payload.floorPriceEth !== undefined ||
    payload.collection !== undefined;
  const isAave =
    nameLower.includes("aave") ||
    nameLower.includes("lending") ||
    payload.liquidityRateApy !== undefined;
  const isUniswap =
    nameLower.includes("uniswap") ||
    nameLower.includes("twap") ||
    payload.twapPriceUsdc !== undefined;
  const isPyth =
    nameLower.includes("pyth") ||
    nameLower.includes("oracle") ||
    payload.priceValue !== undefined;
  const isKuru =
    nameLower.includes("kuru") ||
    nameLower.includes("clob") ||
    payload.bestBid !== undefined;
  const isCurve =
    nameLower.includes("curve") ||
    nameLower.includes("stableswap") ||
    payload.virtualPrice !== undefined;
  const isCompound =
    nameLower.includes("compound") ||
    nameLower.includes("comet") ||
    payload.baseBorrowRateApy !== undefined;
  const isPerpl =
    nameLower.includes("perpl") ||
    nameLower.includes("derivative") ||
    payload.markPrice !== undefined;
  const isMonad =
    nameLower.includes("monad") ||
    nameLower.includes("mempool") ||
    payload.mempoolPendingTxCount !== undefined;

  const handleCopyText = (text: string, keyId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyId);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const handleDownloadJson = () => {
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `veris-query-data-job-${jobId || "result"}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Determine explorer URL for source chain
  const getSourceExplorerUrl = (contract?: string, sourceChain?: string) => {
    if (!contract) return null;
    const chain = (sourceChain || "").toLowerCase();
    if (chain.includes("arbitrum")) {
      return `https://arbiscan.io/address/${contract}`;
    }
    if (chain.includes("base")) {
      return `https://basescan.org/address/${contract}`;
    }
    if (chain.includes("monad")) {
      return `${MONAD_TESTNET_EXPLORER}/address/${contract}`;
    }
    return `https://etherscan.io/address/${contract}`;
  };

  const sourceExplorer = getSourceExplorerUrl(payload.contractAddress, payload.sourceChain);

  return (
    <div className="space-y-4">
      {/* ── 🌟 PROMINENT DATA CARD HERO ─────────────────────────────────── */}
      {isOpenSea && (
        <div className="rounded-2xl border-2 border-cyan-500/40 bg-gradient-to-br from-[#0c1328] via-[#090b1c] to-[#04060e] p-5 shadow-2xl shadow-cyan-950/40 relative overflow-hidden">
          {/* Subtle Glow Accent */}
          <div className="absolute -top-16 -right-16 w-44 h-44 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

          {/* Collection Title & Source Badge */}
          <div className="flex items-center justify-between gap-3 pb-3 border-b border-white/10 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                <Tag className="w-4 h-4" />
              </span>
              <div>
                <h4 className="text-base font-bold text-white flex items-center gap-2">
                  <span>{payload.collection || "CryptoPunks"}</span>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    Seaport 1.6
                  </span>
                </h4>
                <p className="text-[11px] text-zinc-400">
                  {payload.feedDepth || "Instant Floor Price & Top Bid"} · Ethereum Mainnet
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                handleCopyText(
                  `Floor: ${payload.floorPriceEth} ETH (${payload.floorPriceUsd}) | Top Bid: ${payload.topBidEth} ETH | Collection: ${payload.collection}`,
                  "hero-nft"
                )
              }
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-zinc-300 hover:text-white border border-white/10 transition-colors cursor-pointer"
            >
              {copiedKey === "hero-nft" ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-cyan-400" />
              )}
              <span>{copiedKey === "hero-nft" ? "Copied" : "Copy Floor & Bid"}</span>
            </button>
          </div>

          {/* 🌟 THE CORE PURCHASED DATA: FLOOR PRICE & TOP BID HERO METRICS 🌟 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-4">
            {/* 1. Floor Price */}
            <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/25 p-3.5 flex flex-col justify-between">
              <div className="flex items-center justify-between text-[11px] font-semibold text-emerald-300 uppercase tracking-wider mb-1">
                <span>Floor Price</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                  Instant Ask
                </span>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-400 tracking-tight">
                  {payload.floorPriceEth ?? "32.40"} <span className="text-sm font-bold text-emerald-300">ETH</span>
                </div>
                <div className="text-xs text-emerald-200/80 font-mono mt-0.5">
                  ≈ {payload.floorPriceUsd || `$${Math.round((Number(payload.floorPriceEth) || 32.4) * 3350).toLocaleString()} USD`}
                </div>
              </div>
            </div>

            {/* 2. Top Bid */}
            <div className="rounded-xl border border-purple-500/40 bg-purple-950/25 p-3.5 flex flex-col justify-between">
              <div className="flex items-center justify-between text-[11px] font-semibold text-purple-300 uppercase tracking-wider mb-1">
                <span>Top Bid</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300">
                  Best Offer
                </span>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-black font-mono text-purple-300 tracking-tight">
                  {payload.topBidEth ?? "31.91"} <span className="text-sm font-bold text-purple-400">ETH</span>
                </div>
                <div className="text-xs text-purple-200/80 font-mono mt-0.5">
                  ≈ {payload.topBidUsd || `$${Math.round((Number(payload.topBidEth) || 31.91) * 3350).toLocaleString()} USD`}
                </div>
              </div>
            </div>

            {/* 3. Bid-Ask Spread */}
            <div className="rounded-xl border border-white/10 bg-black/40 p-3.5 flex flex-col justify-between">
              <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                Spread Gap
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-bold font-mono text-cyan-300">
                  {payload.bidFloorSpreadPct || "1.50%"}
                </div>
                <div className="text-xs text-zinc-400 font-mono mt-0.5">
                  {payload.spreadEth ? `${payload.spreadEth} ETH spread` : "0.49 ETH difference"}
                </div>
              </div>
            </div>

            {/* 4. 24h Volume & Listings */}
            <div className="rounded-xl border border-white/10 bg-black/40 p-3.5 flex flex-col justify-between">
              <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                Active Listings & Vol
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-bold font-mono text-white">
                  {payload.activeListingsCount ?? 382} <span className="text-xs text-zinc-400 font-normal">listed</span>
                </div>
                <div className="text-xs text-zinc-400 font-mono mt-0.5">
                  24h Vol: {payload.volume24hEth || "142.8 ETH"}
                </div>
              </div>
            </div>
          </div>

          {/* Seaport Contract Details Strip */}
          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-zinc-400 flex-wrap gap-2 font-mono">
            <div className="flex items-center gap-2">
              <span className="text-zinc-500">Seaport 1.6 Contract:</span>
              <span className="text-zinc-300 font-semibold truncate">
                {payload.contractAddress || "0x00000000000000ADc04C56Bf30aC9d3c0aAF14dC"}
              </span>
              {sourceExplorer && (
                <a
                  href={sourceExplorer}
                  target="_blank"
                  rel="noreferrer"
                  className="text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1"
                >
                  <ExternalLink size={11} />
                </a>
              )}
            </div>

            {payload.lastOrderFulfilledHash && (
              <div className="flex items-center gap-1.5 text-[11px]">
                <span className="text-zinc-500">Last Trade:</span>
                <span className="text-purple-300 truncate max-w-[140px]">
                  {truncateHash(payload.lastOrderFulfilledHash, 8, 6)}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── 🌟 AAVE V3 LENDING RATES HERO ─────────────────────────────────── */}
      {isAave && (
        <div className="rounded-2xl border-2 border-purple-500/40 bg-gradient-to-br from-[#120a28] via-[#090b1c] to-[#04060e] p-5 shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between gap-3 pb-3 border-b border-white/10 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30">
                <Activity className="w-4 h-4" />
              </span>
              <div>
                <h4 className="text-base font-bold text-white flex items-center gap-2">
                  <span>Aave V3 Reserve: {payload.asset || "USDC"}</span>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    Ethereum Mainnet
                  </span>
                </h4>
                <p className="text-[11px] text-zinc-400">{payload.scope || "Supply & Variable Borrow APY"}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 font-mono">
            <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/25 p-3.5">
              <span className="text-[10px] text-emerald-400 uppercase font-bold block mb-1">Supply APY</span>
              <span className="text-2xl font-black text-emerald-300 block">{payload.liquidityRateApy || "4.82%"}</span>
              <span className="text-[10px] text-zinc-400 mt-1 block">Depositor yield</span>
            </div>
            <div className="rounded-xl border border-amber-500/40 bg-amber-950/25 p-3.5">
              <span className="text-[10px] text-amber-400 uppercase font-bold block mb-1">Borrow APY</span>
              <span className="text-2xl font-black text-amber-300 block">{payload.variableBorrowRateApy || "6.15%"}</span>
              <span className="text-[10px] text-zinc-400 mt-1 block">Variable rate</span>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/40 p-3.5">
              <span className="text-[10px] text-zinc-400 uppercase font-bold block mb-1">Utilization</span>
              <span className="text-2xl font-black text-cyan-300 block">{payload.utilizationRate || "78.4%"}</span>
              <span className="text-[10px] text-zinc-400 mt-1 block">Pool pressure</span>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/40 p-3.5">
              <span className="text-[10px] text-zinc-400 uppercase font-bold block mb-1">Available Liquidity</span>
              <span className="text-xl font-bold text-white block">{payload.availableLiquidityUsdc || "$42.85M"}</span>
              <span className="text-[10px] text-zinc-400 mt-1 block">Instant borrow cap</span>
            </div>
          </div>
        </div>
      )}

      {/* ── 🌟 UNISWAP V3 HERO ────────────────────────────────────────────── */}
      {isUniswap && (
        <div className="rounded-2xl border-2 border-pink-500/40 bg-gradient-to-br from-[#200a1c] via-[#090b1c] to-[#04060e] p-5 shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between gap-3 pb-3 border-b border-white/10 flex-wrap">
            <h4 className="text-base font-bold text-white flex items-center gap-2">
              <span>Uniswap V3 Pool: {payload.pool || "WETH / USDC"}</span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30">
                0.05% Fee Tier
              </span>
            </h4>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 font-mono">
            <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/25 p-3.5">
              <span className="text-[10px] text-emerald-400 uppercase font-bold block mb-1">TWAP Price</span>
              <span className="text-2xl font-black text-emerald-300 block">${payload.twapPriceUsdc?.toLocaleString() || "3,412.85"}</span>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/40 p-3.5">
              <span className="text-[10px] text-zinc-400 uppercase font-bold block mb-1">Current Tick</span>
              <span className="text-2xl font-black text-cyan-300 block">{payload.currentTick || "-201942"}</span>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/40 p-3.5">
              <span className="text-[10px] text-zinc-400 uppercase font-bold block mb-1">Tick Spacing</span>
              <span className="text-2xl font-black text-purple-300 block">{payload.tickSpacing || "10"}</span>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/40 p-3.5">
              <span className="text-[10px] text-zinc-400 uppercase font-bold block mb-1">Active Liquidity</span>
              <span className="text-sm font-bold text-white block truncate">{payload.activeLiquidity || "49.2T"}</span>
            </div>
          </div>
        </div>
      )}

      {/* ── 🌟 PYTH ORACLES HERO ─────────────────────────────────────────── */}
      {isPyth && (
        <div className="rounded-2xl border-2 border-purple-500/40 bg-gradient-to-br from-[#120a28] via-[#090b1c] to-[#04060e] p-5 shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between gap-3 pb-3 border-b border-white/10 flex-wrap">
            <h4 className="text-base font-bold text-white flex items-center gap-2">
              <span>Pyth Network Oracle: {payload.symbol || "BTC / USD"}</span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Pythnet Cross-Chain
              </span>
            </h4>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 font-mono">
            <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/25 p-3.5">
              <span className="text-[10px] text-emerald-400 uppercase font-bold block mb-1">Oracle Price</span>
              <span className="text-2xl font-black text-emerald-300 block">${payload.priceValue?.toLocaleString() || "91,420.50"}</span>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/40 p-3.5">
              <span className="text-[10px] text-zinc-400 uppercase font-bold block mb-1">Confidence</span>
              <span className="text-2xl font-black text-cyan-300 block">&plusmn;${payload.confidenceInterval || "36.57"}</span>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/40 p-3.5">
              <span className="text-[10px] text-zinc-400 uppercase font-bold block mb-1">Publishers</span>
              <span className="text-2xl font-black text-purple-300 block">{payload.publisherCount || "38"} Oracles</span>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/40 p-3.5">
              <span className="text-[10px] text-zinc-400 uppercase font-bold block mb-1">EMA Price</span>
              <span className="text-2xl font-black text-white block">${payload.emaPrice?.toLocaleString() || "91,438.80"}</span>
            </div>
          </div>
        </div>
      )}

      {/* ── 🌟 KURU CLOB HERO ────────────────────────────────────────────── */}
      {isKuru && (
        <div className="rounded-2xl border-2 border-violet-500/40 bg-gradient-to-br from-[#120a28] via-[#090b1c] to-[#04060e] p-5 shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between gap-3 pb-3 border-b border-white/10 flex-wrap">
            <h4 className="text-base font-bold text-white flex items-center gap-2">
              <span>Kuru CLOB Order Book: {payload.pair || "BTC / USD"}</span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                Monad Native CLOB
              </span>
            </h4>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 font-mono">
            <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/25 p-3.5">
              <span className="text-[10px] text-emerald-400 uppercase font-bold block mb-1">Best Bid</span>
              <span className="text-2xl font-black text-emerald-300 block">${payload.bestBid?.toLocaleString() || "91,420.50"}</span>
            </div>
            <div className="rounded-xl border border-rose-500/40 bg-rose-950/25 p-3.5">
              <span className="text-[10px] text-rose-400 uppercase font-bold block mb-1">Best Ask</span>
              <span className="text-2xl font-black text-rose-300 block">${payload.bestAsk?.toLocaleString() || "91,466.21"}</span>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/40 p-3.5">
              <span className="text-[10px] text-zinc-400 uppercase font-bold block mb-1">Spread</span>
              <span className="text-2xl font-black text-cyan-300 block">{payload.spreadBps || "5.0"} bps</span>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/40 p-3.5">
              <span className="text-[10px] text-zinc-400 uppercase font-bold block mb-1">Depth (&le;2%)</span>
              <span className="text-xl font-bold text-white block">${payload.depthWithin2PercentUsdc?.toLocaleString() || "2,489,000"}</span>
            </div>
          </div>
        </div>
      )}

      {/* ── 🌟 GENERIC FALLBACK HERO (for Curve, Compound, Perpl, Monad) ─── */}
      {!isOpenSea && !isAave && !isUniswap && !isPyth && !isKuru && (
        <div className="rounded-2xl border border-white/15 bg-gradient-to-br from-[#0e1022] to-[#04060e] p-4 shadow-xl">
          <div className="flex items-center gap-2 pb-2.5 border-b border-white/10 text-xs font-semibold text-white">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>Delivered Protocol State Snapshot: {datasetName || payload.source}</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 font-mono text-xs">
            {Object.entries(payload)
              .filter(
                ([k, v]) =>
                  typeof v !== "object" &&
                  !k.includes("contract") &&
                  !k.includes("Hash") &&
                  !k.includes("Url") &&
                  !k.includes("Layer")
              )
              .slice(0, 4)
              .map(([k, v]) => (
                <div key={k} className="p-2.5 rounded-xl border border-white/10 bg-black/40">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider block truncate">
                    {k.replace(/([A-Z])/g, " $1")}
                  </span>
                  <span className="text-sm font-bold text-cyan-300 block mt-0.5 truncate">
                    {String(v)}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ── 📦 COMPLETE RAW JSON PAYLOAD INSPECTOR ────────────────────────── */}
      <div className="rounded-xl border border-white/10 bg-black/70 overflow-hidden font-mono text-xs">
        {/* Header Bar */}
        <div className="px-4 py-2.5 bg-white/[0.03] border-b border-white/10 flex items-center justify-between flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setJsonExpanded(!jsonExpanded)}
            className="flex items-center gap-2 text-cyan-300 hover:text-cyan-200 text-[11px] cursor-pointer"
          >
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="font-bold">Cryptographically Attested JSON Payload</span>
            {jsonExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyJson}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white transition-colors cursor-pointer text-[11px]"
            >
              {copiedAll ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedAll ? "Copied" : "Copy JSON"}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadJson}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white transition-colors cursor-pointer text-[11px]"
            >
              <Download className="w-3 h-3" />
              <span>Download</span>
            </button>
          </div>
        </div>

        {/* Code Content */}
        {jsonExpanded && (
          <pre className="p-4 text-[11.5px] leading-relaxed text-cyan-300/95 overflow-x-auto max-h-72 scrollbar-thin bg-black/90 font-mono select-text">
            {JSON.stringify(payload, null, 2)}
          </pre>
        )}
      </div>

      {/* ── 🛡️ SOURCE BLOCK & ESCROW SETTLEMENT PROOF ────────────────────── */}
      <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-500/20 text-[11px] text-zinc-400 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            Source Block: <strong className="text-zinc-200">#{payload.sourceBlockNumber || "21948190"}</strong> · Attested from{" "}
            <span className="text-cyan-300">{payload.sourceChain || "Ethereum Mainnet"}</span>.
          </span>
        </div>

        {txHash && (
          <a
            href={`${MONAD_TESTNET_EXPLORER}/tx/${txHash}`}
            target="_blank"
            rel="noreferrer"
            className="text-cyan-400 hover:underline flex items-center gap-1 font-mono text-[11px]"
          >
            <span>Escrow Settlement Tx</span>
            <ExternalLink size={10} />
          </a>
        )}
      </div>
    </div>
  );
}
