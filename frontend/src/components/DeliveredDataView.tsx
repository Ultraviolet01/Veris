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
  TrendingUp,
  Coins,
  BarChart3,
  Zap,
  Cpu,
  Trophy,
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
    payload.baseBorrowRateApy !== undefined ||
    payload.baseSupplyRateApy !== undefined;

  const isPerpl =
    nameLower.includes("perpl") ||
    nameLower.includes("derivative") ||
    nameLower.includes("futures") ||
    payload.markPrice !== undefined;

  const isMonad =
    nameLower.includes("monad") ||
    nameLower.includes("mempool") ||
    nameLower.includes("sequencer") ||
    payload.mempoolPendingTxCount !== undefined;

  const isOvertime =
    nameLower.includes("overtime") ||
    nameLower.includes("sport") ||
    nameLower.includes("odds") ||
    nameLower.includes("bet") ||
    payload.homeOdds !== undefined ||
    payload.fixture !== undefined;

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
      {/* ── 1. OPENSEA SEAPORT 1.6 HERO ─────────────────────────────────── */}
      {isOpenSea && (
        <div className="rounded-2xl border-2 border-cyan-500/40 bg-gradient-to-br from-[#0c1328] via-[#090b1c] to-[#04060e] p-5 shadow-2xl shadow-cyan-950/40 relative overflow-hidden">
          <div className="absolute -top-16 -right-16 w-44 h-44 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-4">
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

      {/* ── 2. AAVE V3 LENDING RATES HERO ─────────────────────────────────── */}
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

            <button
              type="button"
              onClick={() =>
                handleCopyText(
                  `Aave V3 ${payload.asset} | Supply APY: ${payload.liquidityRateApy} | Borrow APY: ${payload.variableBorrowRateApy} | Utilization: ${payload.utilizationRate}`,
                  "hero-aave"
                )
              }
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-zinc-300 hover:text-white border border-white/10 transition-colors cursor-pointer"
            >
              {copiedKey === "hero-aave" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-purple-400" />}
              <span>{copiedKey === "hero-aave" ? "Copied" : "Copy APY & Rates"}</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 font-mono">
            <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/25 p-3.5">
              <span className="text-[10px] text-emerald-400 uppercase font-bold block mb-1">Supply APY</span>
              <span className="text-2xl sm:text-3xl font-black text-emerald-300 block">{payload.liquidityRateApy || "4.82%"}</span>
              <span className="text-[10px] text-zinc-400 mt-1 block">Depositor yield</span>
            </div>
            <div className="rounded-xl border border-amber-500/40 bg-amber-950/25 p-3.5">
              <span className="text-[10px] text-amber-400 uppercase font-bold block mb-1">Borrow APY</span>
              <span className="text-2xl sm:text-3xl font-black text-amber-300 block">{payload.variableBorrowRateApy || "6.15%"}</span>
              <span className="text-[10px] text-zinc-400 mt-1 block">Variable rate</span>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/40 p-3.5">
              <span className="text-[10px] text-zinc-400 uppercase font-bold block mb-1">Utilization</span>
              <span className="text-2xl sm:text-3xl font-black text-cyan-300 block">{payload.utilizationRate || "78.4%"}</span>
              <span className="text-[10px] text-zinc-400 mt-1 block">Pool pressure</span>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/40 p-3.5">
              <span className="text-[10px] text-zinc-400 uppercase font-bold block mb-1">Available Liquidity</span>
              <span className="text-lg sm:text-xl font-bold text-white block">{payload.availableLiquidityUsdc || "$42.85M"}</span>
              <span className="text-[10px] text-zinc-400 mt-1 block">Instant borrow cap</span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-zinc-400 flex-wrap gap-2 font-mono">
            <div className="flex items-center gap-2">
              <span className="text-zinc-500">Aave Pool:</span>
              <span className="text-zinc-300 font-semibold">{payload.contractAddress || "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2"}</span>
              {sourceExplorer && (
                <a href={sourceExplorer} target="_blank" rel="noreferrer" className="text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1">
                  <ExternalLink size={11} />
                </a>
              )}
            </div>
            <div className="text-[11px] text-zinc-400">
              Total Borrows: <strong className="text-white">{payload.totalBorrowsUsdc || "$155,200,940"}</strong>
            </div>
          </div>
        </div>
      )}

      {/* ── 3. UNISWAP V3 HERO ────────────────────────────────────────────── */}
      {isUniswap && (
        <div className="rounded-2xl border-2 border-pink-500/40 bg-gradient-to-br from-[#200a1c] via-[#090b1c] to-[#04060e] p-5 shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between gap-3 pb-3 border-b border-white/10 flex-wrap">
            <h4 className="text-base font-bold text-white flex items-center gap-2">
              <span>Uniswap V3 Pool: {payload.pool || "WETH / USDC"}</span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30">
                0.05% Fee Tier
              </span>
            </h4>

            <button
              type="button"
              onClick={() =>
                handleCopyText(
                  `Uniswap V3 ${payload.pool} | TWAP: $${payload.twapPriceUsdc} | Tick: ${payload.currentTick}`,
                  "hero-uni"
                )
              }
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-zinc-300 hover:text-white border border-white/10 transition-colors cursor-pointer"
            >
              {copiedKey === "hero-uni" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-pink-400" />}
              <span>{copiedKey === "hero-uni" ? "Copied" : "Copy TWAP"}</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 font-mono">
            <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/25 p-3.5">
              <span className="text-[10px] text-emerald-400 uppercase font-bold block mb-1">TWAP Price</span>
              <span className="text-2xl sm:text-3xl font-black text-emerald-300 block">${Number(payload.twapPriceUsdc || 3412.85).toLocaleString()}</span>
              <span className="text-[10px] text-zinc-400 mt-1 block">Geometric TWAP</span>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/40 p-3.5">
              <span className="text-[10px] text-zinc-400 uppercase font-bold block mb-1">Current Tick</span>
              <span className="text-2xl sm:text-3xl font-black text-cyan-300 block">{payload.currentTick || "-201942"}</span>
              <span className="text-[10px] text-zinc-400 mt-1 block">Spot tick index</span>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/40 p-3.5">
              <span className="text-[10px] text-zinc-400 uppercase font-bold block mb-1">Tick Spacing</span>
              <span className="text-2xl sm:text-3xl font-black text-purple-300 block">{payload.tickSpacing || "10"}</span>
              <span className="text-[10px] text-zinc-400 mt-1 block">Bin resolution</span>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/40 p-3.5">
              <span className="text-[10px] text-zinc-400 uppercase font-bold block mb-1">Active Liquidity</span>
              <span className="text-xl font-bold text-white block truncate">{payload.activeLiquidity || "49.2T"}</span>
              <span className="text-[10px] text-zinc-400 mt-1 block">Current tick depth</span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-zinc-400 flex-wrap gap-2 font-mono">
            <div className="flex items-center gap-2">
              <span className="text-zinc-500">Pool Contract:</span>
              <span className="text-zinc-300 font-semibold">{payload.contractAddress || "0x88e6A0c2dDD26FEEb64F039a2c41296FcB3f5640"}</span>
              {sourceExplorer && (
                <a href={sourceExplorer} target="_blank" rel="noreferrer" className="text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1">
                  <ExternalLink size={11} />
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── 4. PYTH ORACLES HERO ─────────────────────────────────────────── */}
      {isPyth && (
        <div className="rounded-2xl border-2 border-purple-500/40 bg-gradient-to-br from-[#120a28] via-[#090b1c] to-[#04060e] p-5 shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between gap-3 pb-3 border-b border-white/10 flex-wrap">
            <h4 className="text-base font-bold text-white flex items-center gap-2">
              <span>Pyth Network Oracle: {payload.symbol || "BTC / USD"}</span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Pythnet Cross-Chain
              </span>
            </h4>

            <button
              type="button"
              onClick={() =>
                handleCopyText(
                  `Pyth ${payload.symbol} | Oracle Price: $${payload.priceValue} (±$${payload.confidenceInterval})`,
                  "hero-pyth"
                )
              }
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-zinc-300 hover:text-white border border-white/10 transition-colors cursor-pointer"
            >
              {copiedKey === "hero-pyth" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-purple-400" />}
              <span>{copiedKey === "hero-pyth" ? "Copied" : "Copy Oracle Price"}</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 font-mono">
            <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/25 p-3.5">
              <span className="text-[10px] text-emerald-400 uppercase font-bold block mb-1">Oracle Price</span>
              <span className="text-xl sm:text-2xl font-black text-emerald-300 block">${Number(payload.priceValue || 91420.5).toLocaleString()}</span>
              <span className="text-[10px] text-zinc-400 mt-1 block">Live benchmark</span>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/40 p-3.5">
              <span className="text-[10px] text-zinc-400 uppercase font-bold block mb-1">Confidence</span>
              <span className="text-xl sm:text-2xl font-black text-cyan-300 block">&plusmn;${Number(payload.confidenceInterval || 36.57).toFixed(2)}</span>
              <span className="text-[10px] text-zinc-400 mt-1 block">99.9% certainty</span>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/40 p-3.5">
              <span className="text-[10px] text-zinc-400 uppercase font-bold block mb-1">Publishers</span>
              <span className="text-xl sm:text-2xl font-black text-purple-300 block">{payload.publisherCount || "38"}</span>
              <span className="text-[10px] text-zinc-400 mt-1 block">Consensus nodes</span>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/40 p-3.5">
              <span className="text-[10px] text-zinc-400 uppercase font-bold block mb-1">EMA Price</span>
              <span className="text-lg sm:text-xl font-bold text-white block">${Number(payload.emaPrice || 91438.8).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
              <span className="text-[10px] text-zinc-400 mt-1 block">Exponential moving avg</span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-zinc-400 flex-wrap gap-2 font-mono">
            <div className="flex items-center gap-2">
              <span className="text-zinc-500">Pyth Contract:</span>
              <span className="text-zinc-300 font-semibold">{payload.contractAddress || "0x2880aB155794e1629d1694503182394502891901"}</span>
            </div>
          </div>
        </div>
      )}

      {/* ── 5. KURU CLOB HERO ────────────────────────────────────────────── */}
      {isKuru && (
        <div className="rounded-2xl border-2 border-violet-500/40 bg-gradient-to-br from-[#120a28] via-[#090b1c] to-[#04060e] p-5 shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between gap-3 pb-3 border-b border-white/10 flex-wrap">
            <h4 className="text-base font-bold text-white flex items-center gap-2">
              <span>Kuru CLOB Order Book: {payload.pair || "BTC / USD"}</span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                Monad Native CLOB
              </span>
            </h4>

            <button
              type="button"
              onClick={() =>
                handleCopyText(
                  `Kuru ${payload.pair} | Bid: $${payload.bestBid} | Ask: $${payload.bestAsk} | Spread: ${payload.spreadBps} bps`,
                  "hero-kuru"
                )
              }
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-zinc-300 hover:text-white border border-white/10 transition-colors cursor-pointer"
            >
              {copiedKey === "hero-kuru" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-violet-400" />}
              <span>{copiedKey === "hero-kuru" ? "Copied" : "Copy Order Book"}</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 font-mono">
            <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/25 p-3.5">
              <span className="text-[10px] text-emerald-400 uppercase font-bold block mb-1">Best Bid</span>
              <span className="text-2xl sm:text-3xl font-black text-emerald-300 block">${Number(payload.bestBid || 91420.5).toLocaleString()}</span>
              <span className="text-[10px] text-zinc-400 mt-1 block">Top limit buyer</span>
            </div>
            <div className="rounded-xl border border-rose-500/40 bg-rose-950/25 p-3.5">
              <span className="text-[10px] text-rose-400 uppercase font-bold block mb-1">Best Ask</span>
              <span className="text-2xl sm:text-3xl font-black text-rose-300 block">${Number(payload.bestAsk || 91466.21).toLocaleString()}</span>
              <span className="text-[10px] text-zinc-400 mt-1 block">Lowest seller ask</span>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/40 p-3.5">
              <span className="text-[10px] text-zinc-400 uppercase font-bold block mb-1">Spread</span>
              <span className="text-2xl sm:text-3xl font-black text-cyan-300 block">{payload.spreadBps || "5.0"} bps</span>
              <span className="text-[10px] text-zinc-400 mt-1 block">${payload.spreadUsdc || "45.71"} difference</span>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/40 p-3.5">
              <span className="text-[10px] text-zinc-400 uppercase font-bold block mb-1">Depth (&le;2%)</span>
              <span className="text-xl sm:text-2xl font-bold text-white block truncate">${payload.depthWithin2PercentUsdc ? Number(payload.depthWithin2PercentUsdc).toLocaleString() : "2,489,000"}</span>
              <span className="text-[10px] text-zinc-400 mt-1 block">Liquidity depth</span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-zinc-400 flex-wrap gap-2 font-mono">
            <div className="flex items-center gap-2">
              <span className="text-zinc-500">OrderBook Contract:</span>
              <span className="text-zinc-300 font-semibold">{payload.contractAddress || "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"}</span>
              {sourceExplorer && (
                <a href={sourceExplorer} target="_blank" rel="noreferrer" className="text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1">
                  <ExternalLink size={11} />
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── 6. CURVE FINANCE STABLE-PEG HERO ──────────────────────────────── */}
      {isCurve && (
        <div className="rounded-2xl border-2 border-blue-500/40 bg-gradient-to-br from-[#0c1830] via-[#090b1c] to-[#04060e] p-5 shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between gap-3 pb-3 border-b border-white/10 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/30">
                <Coins className="w-4 h-4" />
              </span>
              <div>
                <h4 className="text-base font-bold text-white flex items-center gap-2">
                  <span>Curve StableSwap: {payload.pool || "3pool (DAI / USDC / USDT)"}</span>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    Ethereum Mainnet
                  </span>
                </h4>
                <p className="text-[11px] text-zinc-400">{payload.metric || "Virtual Price & Peg Deviation Ratio"}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                handleCopyText(
                  `Curve ${payload.pool} | Virtual Price: ${payload.virtualPrice} | Peg Drift: ${payload.pegDeviationBps} bps`,
                  "hero-curve"
                )
              }
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-zinc-300 hover:text-white border border-white/10 transition-colors cursor-pointer"
            >
              {copiedKey === "hero-curve" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-blue-400" />}
              <span>{copiedKey === "hero-curve" ? "Copied" : "Copy Peg Data"}</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 font-mono">
            <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/25 p-3.5">
              <span className="text-[10px] text-emerald-400 uppercase font-bold block mb-1">Virtual Price</span>
              <span className="text-2xl sm:text-3xl font-black text-emerald-300 block">{payload.virtualPrice || "1.028491"}</span>
              <span className="text-[10px] text-zinc-400 mt-1 block">LP invariant value</span>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/40 p-3.5">
              <span className="text-[10px] text-zinc-400 uppercase font-bold block mb-1">Peg Deviation</span>
              <span className="text-2xl sm:text-3xl font-black text-cyan-300 block">{payload.pegDeviationBps || "1.4"} bps</span>
              <span className="text-[10px] text-zinc-400 mt-1 block">Spread vs $1.0000</span>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/40 p-3.5">
              <span className="text-[10px] text-zinc-400 uppercase font-bold block mb-1">Amplification (A)</span>
              <span className="text-2xl sm:text-3xl font-black text-purple-300 block">{payload.amplificationParameterA || "2000"}</span>
              <span className="text-[10px] text-zinc-400 mt-1 block">Curvature parameter</span>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/40 p-3.5">
              <span className="text-[10px] text-zinc-400 uppercase font-bold block mb-1">Admin Fees</span>
              <span className="text-xl sm:text-2xl font-bold text-white block truncate">{payload.adminFeeAccruedUsd || "$14,210"}</span>
              <span className="text-[10px] text-zinc-400 mt-1 block">Accrued protocol fees</span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-zinc-400 flex-wrap gap-2 font-mono">
            <div className="flex items-center gap-2">
              <span className="text-zinc-500">Curve Pool:</span>
              <span className="text-zinc-300 font-semibold">{payload.contractAddress || "0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7"}</span>
              {sourceExplorer && (
                <a href={sourceExplorer} target="_blank" rel="noreferrer" className="text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1">
                  <ExternalLink size={11} />
                </a>
              )}
            </div>
            <div className="text-[11px] text-zinc-400">
              Balances: <strong className="text-cyan-300">DAI 78.4M · USDC 84.9M · USDT 81.2M</strong>
            </div>
          </div>
        </div>
      )}

      {/* ── 7. COMPOUND V3 COMET HERO ────────────────────────────────────── */}
      {isCompound && (
        <div className="rounded-2xl border-2 border-emerald-500/40 bg-gradient-to-br from-[#0c241c] via-[#090b1c] to-[#04060e] p-5 shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between gap-3 pb-3 border-b border-white/10 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <BarChart3 className="w-4 h-4" />
              </span>
              <div>
                <h4 className="text-base font-bold text-white flex items-center gap-2">
                  <span>Compound V3 Comet: {payload.market || "USDC Market"}</span>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Arbitrum One
                  </span>
                </h4>
                <p className="text-[11px] text-zinc-400">{payload.scope || "Borrow Rate & Base Utilization"}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                handleCopyText(
                  `Compound V3 Comet ${payload.market} | Supply APY: ${payload.baseSupplyRateApy} | Borrow APY: ${payload.baseBorrowRateApy} | Utilization: ${payload.utilizationPct}`,
                  "hero-compound"
                )
              }
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-zinc-300 hover:text-white border border-white/10 transition-colors cursor-pointer"
            >
              {copiedKey === "hero-compound" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-emerald-400" />}
              <span>{copiedKey === "hero-compound" ? "Copied" : "Copy Comet Rates"}</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 font-mono">
            <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/25 p-3.5">
              <span className="text-[10px] text-emerald-400 uppercase font-bold block mb-1">Supply APY</span>
              <span className="text-2xl sm:text-3xl font-black text-emerald-300 block">{payload.baseSupplyRateApy || "4.91%"}</span>
              <span className="text-[10px] text-zinc-400 mt-1 block">Base lender yield</span>
            </div>
            <div className="rounded-xl border border-amber-500/40 bg-amber-950/25 p-3.5">
              <span className="text-[10px] text-amber-400 uppercase font-bold block mb-1">Borrow APY</span>
              <span className="text-2xl sm:text-3xl font-black text-amber-300 block">{payload.baseBorrowRateApy || "6.42%"}</span>
              <span className="text-[10px] text-zinc-400 mt-1 block">Base borrow interest</span>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/40 p-3.5">
              <span className="text-[10px] text-zinc-400 uppercase font-bold block mb-1">Utilization</span>
              <span className="text-2xl sm:text-3xl font-black text-cyan-300 block">{payload.utilizationPct || "81.4%"}</span>
              <span className="text-[10px] text-zinc-400 mt-1 block">Capital efficiency</span>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/40 p-3.5">
              <span className="text-[10px] text-zinc-400 uppercase font-bold block mb-1">Total Collateral</span>
              <span className="text-xl sm:text-2xl font-bold text-white block truncate">{payload.totalCollateralUsd || "$184.2M"}</span>
              <span className="text-[10px] text-zinc-400 mt-1 block">Absorption cushion</span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-zinc-400 flex-wrap gap-2 font-mono">
            <div className="flex items-center gap-2">
              <span className="text-zinc-500">Comet Contract:</span>
              <span className="text-zinc-300 font-semibold">{payload.contractAddress || "0xA5EDBDD9646f8dFF606d7448e414884C7d905dCA"}</span>
              {sourceExplorer && (
                <a href={sourceExplorer} target="_blank" rel="noreferrer" className="text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1">
                  <ExternalLink size={11} />
                </a>
              )}
            </div>
            <div className="text-[11px] text-zinc-400">
              Total Borrows: <strong className="text-white">{payload.totalBorrowUsd || "$149,890,200"}</strong>
            </div>
          </div>
        </div>
      )}

      {/* ── 8. PERPL PERPETUAL FUTURES HERO ──────────────────────────────── */}
      {isPerpl && (
        <div className="rounded-2xl border-2 border-rose-500/40 bg-gradient-to-br from-[#240c18] via-[#090b1c] to-[#04060e] p-5 shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between gap-3 pb-3 border-b border-white/10 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30">
                <TrendingUp className="w-4 h-4" />
              </span>
              <div>
                <h4 className="text-base font-bold text-white flex items-center gap-2">
                  <span>Perpl Perpetual: {payload.market || "BTC-PERP"}</span>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    Monad Native DEX
                  </span>
                </h4>
                <p className="text-[11px] text-zinc-400">{payload.dataSlice || "Mark Price & 1h Funding Velocity"}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                handleCopyText(
                  `Perpl ${payload.market} | Mark: $${payload.markPrice} | 1h Funding: ${payload.fundingRate1h} | OI: ${payload.openInterestUsdc}`,
                  "hero-perpl"
                )
              }
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-zinc-300 hover:text-white border border-white/10 transition-colors cursor-pointer"
            >
              {copiedKey === "hero-perpl" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-rose-400" />}
              <span>{copiedKey === "hero-perpl" ? "Copied" : "Copy Perps Data"}</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 font-mono">
            <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/25 p-3.5">
              <span className="text-[10px] text-emerald-400 uppercase font-bold block mb-1">Mark Price</span>
              <span className="text-2xl sm:text-3xl font-black text-emerald-300 block">${Number(payload.markPrice || 91450.0).toLocaleString()}</span>
              <span className="text-[10px] text-zinc-400 mt-1 block">Liquidation benchmark</span>
            </div>
            <div className="rounded-xl border border-purple-500/40 bg-purple-950/25 p-3.5">
              <span className="text-[10px] text-purple-400 uppercase font-bold block mb-1">1h Funding</span>
              <span className="text-2xl sm:text-3xl font-black text-purple-300 block">{payload.fundingRate1h || "+0.0014%"}</span>
              <span className="text-[10px] text-zinc-400 mt-1 block">Hourly rate premium</span>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/40 p-3.5">
              <span className="text-[10px] text-zinc-400 uppercase font-bold block mb-1">Annualized APR</span>
              <span className="text-2xl sm:text-3xl font-black text-cyan-300 block">{payload.annualizedFundingApy || "+12.26%"}</span>
              <span className="text-[10px] text-zinc-400 mt-1 block">Annualized basis rate</span>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/40 p-3.5">
              <span className="text-[10px] text-zinc-400 uppercase font-bold block mb-1">Open Interest</span>
              <span className="text-xl sm:text-2xl font-bold text-white block truncate">{payload.openInterestUsdc || "$14,820,000"}</span>
              <span className="text-[10px] text-zinc-400 mt-1 block">Active positions</span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-zinc-400 flex-wrap gap-2 font-mono">
            <div className="flex items-center gap-2">
              <span className="text-zinc-500">ClearingHouse Contract:</span>
              <span className="text-zinc-300 font-semibold">{payload.contractAddress || "0x93F423e4210ab233B27cb92a7e7Ac33f7bDa6b1e62"}</span>
              {sourceExplorer && (
                <a href={sourceExplorer} target="_blank" rel="noreferrer" className="text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1">
                  <ExternalLink size={11} />
                </a>
              )}
            </div>
            <div className="text-[11px] text-zinc-400">
              Long/Short: <strong className="text-white">{payload.longShortRatio || "52.4% / 47.6%"}</strong>
            </div>
          </div>
        </div>
      )}

      {/* ── 9. MONAD SEQUENCER QUEUE & MEMPOOL TELEMETRY HERO ────────────── */}
      {isMonad && (
        <div className="rounded-2xl border-2 border-[#836ef9]/50 bg-gradient-to-br from-[#180e34] via-[#090b1c] to-[#04060e] p-5 shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between gap-3 pb-3 border-b border-white/10 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-[#836ef9]/20 text-[#a393f9] border border-[#836ef9]/30">
                <Cpu className="w-4 h-4" />
              </span>
              <div>
                <h4 className="text-base font-bold text-white flex items-center gap-2">
                  <span>Monad Sequencer Queue & Mempool Telemetry</span>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-[#836ef9]/20 text-[#a393f9] border border-[#836ef9]/30">
                    Monad Testnet
                  </span>
                </h4>
                <p className="text-[11px] text-zinc-400">{payload.metric || "Base Fee Delta & Optimal Tip Estimator"}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                handleCopyText(
                  `Monad Mempool | Base Fee: ${payload.baseFeeGwei} Gwei | Tip: ${payload.recommendedPriorityFeeGwei} Gwei | Pending: ${payload.mempoolPendingTxCount} tx`,
                  "hero-monad"
                )
              }
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-zinc-300 hover:text-white border border-white/10 transition-colors cursor-pointer"
            >
              {copiedKey === "hero-monad" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-[#a393f9]" />}
              <span>{copiedKey === "hero-monad" ? "Copied" : "Copy Mempool Data"}</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 font-mono">
            <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/25 p-3.5">
              <span className="text-[10px] text-emerald-400 uppercase font-bold block mb-1">Base Fee</span>
              <span className="text-2xl sm:text-3xl font-black text-emerald-300 block">{payload.baseFeeGwei ?? 52.4} <span className="text-sm font-bold">Gwei</span></span>
              <span className="text-[10px] text-zinc-400 mt-1 block">Consensus base cost</span>
            </div>
            <div className="rounded-xl border border-cyan-500/40 bg-cyan-950/25 p-3.5">
              <span className="text-[10px] text-cyan-400 uppercase font-bold block mb-1">Optimal Tip</span>
              <span className="text-2xl sm:text-3xl font-black text-cyan-300 block">{payload.recommendedPriorityFeeGwei ?? 2.5} <span className="text-sm font-bold">Gwei</span></span>
              <span className="text-[10px] text-zinc-400 mt-1 block">Priority inclusion</span>
            </div>
            <div className="rounded-xl border border-purple-500/40 bg-purple-950/25 p-3.5">
              <span className="text-[10px] text-purple-400 uppercase font-bold block mb-1">Pending Tx</span>
              <span className="text-2xl sm:text-3xl font-black text-purple-300 block">{payload.mempoolPendingTxCount ? Number(payload.mempoolPendingTxCount).toLocaleString() : "8,420"}</span>
              <span className="text-[10px] text-zinc-400 mt-1 block">Sequencer buffer</span>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/40 p-3.5">
              <span className="text-[10px] text-zinc-400 uppercase font-bold block mb-1">Queue Latency</span>
              <span className="text-2xl sm:text-3xl font-black text-white block">{payload.sequencerQueueLatencyMs ?? 14} <span className="text-sm font-bold">ms</span></span>
              <span className="text-[10px] text-zinc-400 mt-1 block">Mempool throughput</span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-zinc-400 flex-wrap gap-2 font-mono">
            <div className="flex items-center gap-2">
              <span className="text-zinc-500">Validator Consensus:</span>
              <span className="text-zinc-300 font-semibold">10,000 TPS Monad BFT Pipeline</span>
            </div>
            <div className="text-[11px] text-zinc-400">
              Block Space: <strong className="text-emerald-400">{payload.blockSpaceUtilizationPct || "68.4%"}</strong> · Reorg Risk: <strong className="text-cyan-300">0.00%</strong>
            </div>
          </div>
        </div>
      )}

      {/* ── 10. OVERTIME SPORTS ODDS & SPREADS HERO ─────────────────────── */}
      {isOvertime && (
        <div className="rounded-2xl border-2 border-amber-500/50 bg-gradient-to-br from-[#2a1b05] via-[#150e04] to-[#04060e] p-5 shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between gap-3 pb-3 border-b border-white/10 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Trophy className="w-4 h-4" />
              </span>
              <div>
                <h4 className="text-base font-bold text-white flex items-center gap-2">
                  <span>{payload.fixture || "Arsenal FC vs Manchester City"}</span>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    {payload.league || "English Premier League (EPL)"}
                  </span>
                </h4>
                <p className="text-[11px] text-zinc-400">
                  {payload.marketType || "Moneyline (1X2 / Winner)"} · Overtime SportsAMM Protocol
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                handleCopyText(
                  `${payload.fixture || "Match"}: ${payload.homeTeam || "Home"} (${payload.homeOdds ?? 2.45}) | ${payload.awayTeam || "Away"} (${payload.awayOdds ?? 2.90}) | Draw (${payload.drawOdds ?? 3.40}) | Vault Liquidity: ${payload.totalLiquidityUsdc || "$480,200"}`,
                  "hero-overtime"
                )
              }
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-zinc-300 hover:text-white border border-white/10 transition-colors cursor-pointer"
            >
              {copiedKey === "hero-overtime" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-amber-400" />}
              <span>{copiedKey === "hero-overtime" ? "Copied" : "Copy Sports Odds"}</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 font-mono">
            {/* Home Odds */}
            <div className="rounded-xl border border-amber-500/40 bg-amber-950/25 p-3.5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-amber-400 uppercase font-bold truncate">
                  {payload.homeTeam || "Home Team"}
                </span>
                <span className="text-[10px] text-zinc-500">1</span>
              </div>
              <span className="text-2xl sm:text-3xl font-black text-amber-300 block">
                {payload.homeOdds ?? 2.45}
              </span>
              <span className="text-[10px] text-zinc-400 mt-1 block">
                Implied: <strong className="text-white">{payload.homeImpliedProb || "40.8%"}</strong>
              </span>
            </div>

            {/* Away Odds */}
            <div className="rounded-xl border border-cyan-500/40 bg-cyan-950/25 p-3.5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-cyan-400 uppercase font-bold truncate">
                  {payload.awayTeam || "Away Team"}
                </span>
                <span className="text-[10px] text-zinc-500">2</span>
              </div>
              <span className="text-2xl sm:text-3xl font-black text-cyan-300 block">
                {payload.awayOdds ?? 2.90}
              </span>
              <span className="text-[10px] text-zinc-400 mt-1 block">
                Implied: <strong className="text-white">{payload.awayImpliedProb || "34.5%"}</strong>
              </span>
            </div>

            {/* Draw / Spread */}
            <div className="rounded-xl border border-purple-500/40 bg-purple-950/25 p-3.5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-purple-400 uppercase font-bold">
                  {typeof payload.drawOdds === "number" ? "Draw (X)" : "Spread / Line"}
                </span>
                <span className="text-[10px] text-zinc-500">X / Line</span>
              </div>
              <span className="text-2xl sm:text-3xl font-black text-purple-300 block">
                {payload.drawOdds ?? 3.40}
              </span>
              <span className="text-[10px] text-zinc-400 mt-1 block truncate">
                {payload.spreadLine ? "2-Way Handicap" : "Match Draw"}
              </span>
            </div>

            {/* AMM Liquidity */}
            <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/25 p-3.5">
              <span className="text-[10px] text-emerald-400 uppercase font-bold block mb-1">
                AMM Liquidity
              </span>
              <span className="text-2xl sm:text-3xl font-black text-emerald-300 block">
                {payload.totalLiquidityUsdc || "$480,200"}
              </span>
              <span className="text-[10px] text-zinc-400 mt-1 block">
                Overtime Vault USDC
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-zinc-400 flex-wrap gap-2 font-mono">
            <div className="flex items-center gap-2">
              <span className="text-zinc-500">SportsAMM Contract:</span>
              <span className="text-zinc-300 font-semibold">{payload.contractAddress || "0x170a5714112daEfF20E798565378021Cd28dA8E0"}</span>
              {sourceExplorer && (
                <a href={sourceExplorer} target="_blank" rel="noreferrer" className="text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1">
                  <ExternalLink size={11} />
                </a>
              )}
            </div>
            <div className="text-[11px] text-zinc-400">
              Status: <strong className="text-amber-400">{payload.matchStatus || "Scheduled (Kickoff in 45m)"}</strong> · Attested: <strong className="text-emerald-400">{payload.sportsOracleAttestation || "Chainlink Sports Oracle"}</strong>
            </div>
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
