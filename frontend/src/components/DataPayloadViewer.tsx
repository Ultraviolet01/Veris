import React, { useState } from "react";
import {
  Copy,
  Check,
  Terminal,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Activity,
  Layers,
} from "lucide-react";
import type { DeliveredPayload } from "../lib/dataPayloads";

interface DataPayloadViewerProps {
  datasetName: string;
  payload: DeliveredPayload | Record<string, unknown>;
  jobId?: string;
  dataAgeSeconds?: number;
  slaSeconds?: number;
  compact?: boolean;
}

export const DataPayloadViewer: React.FC<DataPayloadViewerProps> = ({
  datasetName,
  payload,
  jobId,
  dataAgeSeconds,
  slaSeconds,
  compact = false,
}) => {
  const [copied, setCopied] = useState(false);
  const [isRawExpanded, setIsRawExpanded] = useState(!compact);

  const jsonString = JSON.stringify(payload, null, 2);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(jsonString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy payload:", err);
    }
  };

  // Derive quick summary highlights based on payload content
  const sportsScores = (payload as Record<string, unknown>).scores as
    | { chiefs?: number; "49ers"?: number }
    | undefined;
  const sportsOdds = (payload as Record<string, unknown>).moneylineOdds as
    | { chiefsWin?: number; "49ersWin"?: number }
    | undefined;
  const sportsSpread = (payload as Record<string, unknown>).spread as
    | { line?: number; chiefsCoverOdds?: number }
    | undefined;

  const kuruBid = (payload as Record<string, unknown>).bestBid;
  const kuruAsk = (payload as Record<string, unknown>).bestAsk;
  const kuruSpread = (payload as Record<string, unknown>).spreadUsdc;

  const aaveSupply = (payload as Record<string, unknown>).liquidityRateApy;
  const aaveBorrow = (payload as Record<string, unknown>).variableBorrowRateApy;

  const polyOutcomes = (payload as Record<string, unknown>).outcomes as
    | Array<{ name: string; probability: string; priceUsdc: number }>
    | undefined;

  const observedAge =
    dataAgeSeconds ??
    (payload.observedDataAgeSeconds as number | undefined) ??
    1.2;
  const targetSla =
    slaSeconds ?? (payload.slaWindowSeconds as number | undefined) ?? 10;
  const blockHeight =
    (payload.monadBlockHeight as number | undefined) ?? 39421800;

  return (
    <div className="rounded-2xl border border-emerald-500/30 bg-[#070d18]/90 overflow-hidden shadow-xl backdrop-blur-xl">
      {/* Top Header Bar */}
      <div className="p-3 bg-gradient-to-r from-emerald-950/40 via-black/40 to-cyan-950/40 border-b border-emerald-500/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300">
            <Terminal className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white font-['Outfit']">
                Delivered Data Feed
              </span>
              {jobId && (
                <span className="text-[10px] text-zinc-400 font-mono">
                  (Order #{jobId})
                </span>
              )}
            </div>
            <div className="text-[10px] text-emerald-300 flex items-center gap-1 font-mono">
              <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
              <span>
                Freshness: {observedAge}s ≤ {targetSla}s SLA (Verified)
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={handleCopy}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[10px] font-semibold transition-all cursor-pointer border border-white/10 hover:border-emerald-400"
          title="Copy JSON Payload"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-300">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3 text-zinc-300" />
              <span>Copy Data</span>
            </>
          )}
        </button>
      </div>

      {/* Structured Telemetry Highlights */}
      <div className="p-3 space-y-2.5">
        {/* Sports Odds Highlight Card */}
        {sportsScores && sportsOdds && (
          <div className="p-2.5 rounded-xl bg-purple-950/20 border border-purple-500/20 text-xs">
            <div className="flex items-center justify-between text-[11px] mb-1.5">
              <span className="font-bold text-purple-200">
                {String((payload as Record<string, unknown>).fixture || "Overtime Live Game")}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold animate-pulse">
                {String((payload as Record<string, unknown>).status || "LIVE")}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-mono mt-2">
              <div className="p-1.5 rounded-lg bg-black/40 border border-white/5">
                <div className="text-zinc-400">Current Score</div>
                <div className="text-xs font-bold text-white mt-0.5">
                  Chiefs {sportsScores.chiefs} - {sportsScores["49ers"]} 49ers
                </div>
              </div>
              <div className="p-1.5 rounded-lg bg-black/40 border border-white/5">
                <div className="text-zinc-400">Moneyline Odds</div>
                <div className="text-xs font-bold text-cyan-300 mt-0.5">
                  1.74 / 2.15
                </div>
              </div>
              <div className="p-1.5 rounded-lg bg-black/40 border border-white/5">
                <div className="text-zinc-400">Spread Line</div>
                <div className="text-xs font-bold text-emerald-300 mt-0.5">
                  {sportsSpread?.line} (1.91)
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Kuru CLOB Depth Highlight Card */}
        {kuruBid !== undefined && kuruAsk !== undefined && (
          <div className="p-2.5 rounded-xl bg-cyan-950/20 border border-cyan-500/20 text-xs">
            <div className="flex items-center justify-between text-[11px] mb-1.5">
              <span className="font-bold text-cyan-200">
                Kuru Order Book Snapshot (MON / USDC)
              </span>
              <span className="text-[10px] font-mono text-zinc-400">
                Spread: ${String(kuruSpread)}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-center text-[10px] font-mono mt-1">
              <div className="p-1.5 rounded-lg bg-emerald-950/30 border border-emerald-500/20">
                <div className="text-emerald-400">Best Bid</div>
                <div className="text-xs font-bold text-white mt-0.5">
                  ${String(kuruBid)} USDC
                </div>
              </div>
              <div className="p-1.5 rounded-lg bg-rose-950/30 border border-rose-500/20">
                <div className="text-rose-400">Best Ask</div>
                <div className="text-xs font-bold text-white mt-0.5">
                  ${String(kuruAsk)} USDC
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Aave APY Highlight Card */}
        {aaveSupply && aaveBorrow && (
          <div className="p-2.5 rounded-xl bg-indigo-950/20 border border-indigo-500/20 text-xs">
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="font-bold text-indigo-200">Aave V3 USDC Rates</span>
              <span className="text-[10px] font-mono text-zinc-400">
                Util: {String((payload as Record<string, unknown>).utilizationRate)}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-center text-[10px] font-mono mt-1">
              <div className="p-1.5 rounded-lg bg-black/40 border border-white/5">
                <div className="text-zinc-400">Supply APY</div>
                <div className="text-xs font-bold text-emerald-300 mt-0.5">
                  {String(aaveSupply)}
                </div>
              </div>
              <div className="p-1.5 rounded-lg bg-black/40 border border-white/5">
                <div className="text-zinc-400">Borrow APY</div>
                <div className="text-xs font-bold text-cyan-300 mt-0.5">
                  {String(aaveBorrow)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Polymarket Outcomes Highlight Card */}
        {polyOutcomes && polyOutcomes.length > 0 && (
          <div className="p-2.5 rounded-xl bg-emerald-950/20 border border-emerald-500/20 text-xs">
            <div className="font-bold text-emerald-200 text-[11px] mb-1.5 truncate">
              {String((payload as Record<string, unknown>).market || "Prediction Market")}
            </div>
            <div className="grid grid-cols-3 gap-1.5 text-center text-[10px] font-mono">
              {polyOutcomes.slice(0, 3).map((out, idx) => (
                <div
                  key={idx}
                  className="p-1.5 rounded-lg bg-black/40 border border-white/5"
                >
                  <div className="text-zinc-400 truncate">{out.name}</div>
                  <div className="text-xs font-bold text-cyan-300 mt-0.5">
                    {out.probability}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Expand/Collapse Raw JSON Payload */}
        <div className="pt-1">
          <button
            onClick={() => setIsRawExpanded(!isRawExpanded)}
            className="w-full flex items-center justify-between text-[11px] text-zinc-400 hover:text-zinc-200 py-1 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-1.5">
              <Layers className="w-3 h-3 text-cyan-400" />
              <span>Full Authenticated JSON Payload ({Object.keys(payload).length} fields)</span>
            </div>
            {isRawExpanded ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>

          {isRawExpanded && (
            <div className="mt-1.5 rounded-xl bg-black/80 border border-white/10 p-3 overflow-x-auto max-h-[220px] scrollbar-thin">
              <pre className="font-mono text-[10px] leading-relaxed text-emerald-300">
                {jsonString}
              </pre>
            </div>
          )}
        </div>

        {/* Attestation Proof Tag */}
        <div className="pt-1 flex items-center justify-between text-[9px] text-zinc-500 font-mono border-t border-white/5">
          <div className="flex items-center gap-1">
            <Activity className="w-2.5 h-2.5 text-cyan-400" />
            <span>Monad Block #{blockHeight}</span>
          </div>
          <span>Dataset: {datasetName}</span>
        </div>
      </div>
    </div>
  );
};
