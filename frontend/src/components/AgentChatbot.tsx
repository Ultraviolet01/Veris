import React, { useState, useRef, useEffect } from "react";
import { useBuyerFlow } from "../hooks/useBuyerFlow";
import { useUsdcBalance } from "../hooks/useUsdcBalance";
import { useIsLoggedIn, useDynamicContext } from "@dynamic-labs/sdk-react-core";
import {
  FEATURED_DATASETS,
  MONAD_TESTNET_EXPLORER,
  type MarketplaceDataset,
} from "../lib/contracts";
import {
  Sparkles,
  X,
  Send,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Bot,
  Terminal,
  Zap,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { DataPayloadViewer } from "./DataPayloadViewer";
import type { DeliveredPayload } from "../lib/dataPayloads";

interface ParsedPurchase {
  sellerId: string;
  maxPrice: number;
  maxAgeSeconds: number;
  matchedDatasetName?: string;
  provider?: string;
}

interface ChatMessage {
  id: string;
  sender: "user" | "claude";
  text?: string;
  parsed?: ParsedPurchase;
  error?: string;
  timestamp: string;
  matchedDataset?: MarketplaceDataset;
  executionStatus?: "idle" | "approving" | "funding" | "completed" | "error";
  receipt?: {
    jobId: string;
    txHash?: string;
    slaSeconds: number;
    priceUsdc: number;
    dataAgeSeconds?: number;
    dataPayload?: DeliveredPayload | Record<string, unknown>;
    isSimulated?: boolean;
    realTxHash?: string;
  };
  deliveryData?: {
    datasetName: string;
    payload: DeliveredPayload | Record<string, unknown>;
    dataAgeSeconds: number;
    slaSeconds: number;
    jobId: string;
  };
}

const SAMPLE_PROMPTS = [
  "get me Kuru's ETH/USDC price, max 5 cents, under 10 seconds old",
  "buy Aave lending rates, max 0.25 USDC, under 10s",
  "fetch Uniswap TWAP pool ticks, max 0.30 USDC, 5s freshness",
  "get Polymarket settlement odds, max 0.45 USDC, under 8s",
];

export const AgentChatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isEnlarged, setIsEnlarged] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome-1",
      sender: "claude",
      text: "Welcome to the Veris Natural-Language Console. Ask for any on-chain data in plain English — I will parse your intent into a structured purchase call with self-enforcing SLA escrow.",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isLoggedIn = useIsLoggedIn();
  const { setShowAuthFlow } = useDynamicContext();
  const { usdcBalance } = useUsdcBalance();
  const { executeJobPurchase, step: buyerStep } = useBuyerFlow();

  const [activeExecutingMsgId, setActiveExecutingMsgId] = useState<string | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      inputRef.current?.focus();
    }
  }, [isOpen, messages]);

  const handleSend = async (queryText?: string) => {
    const textToSend = (queryText ?? input).trim();
    if (!textToSend || isLoading) return;

    setInput("");
    const userMsgId = `user-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      sender: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const sellersPayload = FEATURED_DATASETS.map((d) => ({
        sellerId: d.sellerId,
        name: d.name,
        category: d.category,
        priceUsdc: d.priceUsdc,
        freshnessSlaSeconds: d.freshnessSlaSeconds,
      }));

      const response = await fetch("/api/claude-parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: textToSend,
          availableSellers: sellersPayload,
        }),
      });

      const data = await response.json();
      const botMsgId = `claude-${Date.now()}`;

      if (data.error) {
        // Natural language parsing error: explain directly to user
        const botMsg: ChatMessage = {
          id: botMsgId,
          sender: "claude",
          error: data.error,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages((prev) => [...prev, botMsg]);
      } else {
        // Valid structured purchase call
        const parsed: ParsedPurchase = {
          sellerId: data.sellerId,
          maxPrice: data.maxPrice,
          maxAgeSeconds: data.maxAgeSeconds,
          matchedDatasetName: data.matchedDatasetName,
          provider: data.provider,
        };

        // Match dataset in featured catalog
        const matched =
          FEATURED_DATASETS.find(
            (d) =>
              data.matchedDatasetName &&
              (d.name.toLowerCase().includes(data.matchedDatasetName.toLowerCase()) ||
                data.matchedDatasetName.toLowerCase().includes(d.name.toLowerCase()))
          ) ||
          FEATURED_DATASETS.find((d) =>
            textToSend.toLowerCase().includes(d.name.toLowerCase().split(" ")[0].toLowerCase())
          ) ||
          FEATURED_DATASETS[0];

        const botMsg: ChatMessage = {
          id: botMsgId,
          sender: "claude",
          parsed,
          matchedDataset: matched,
          executionStatus: "idle",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages((prev) => [...prev, botMsg]);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to connect to Claude parser";
      setMessages((prev) => [
        ...prev,
        {
          id: `claude-${Date.now()}`,
          sender: "claude",
          error: `Parser Network Error: ${msg}`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecutePurchase = async (msgId: string, parsed: ParsedPurchase, dataset?: MarketplaceDataset) => {
    if (!isLoggedIn) {
      setShowAuthFlow(true);
      return;
    }

    const targetDataset: MarketplaceDataset = dataset || {
      sellerId: parsed.sellerId,
      name: parsed.matchedDatasetName || "Custom Registered Seller Dataset",
      category: "DeFi Rates",
      description: "Autonomous dataset purchase via Claude Natural-Language Console",
      freshnessSlaSeconds: parsed.maxAgeSeconds,
      priceUsdc: parsed.maxPrice,
      reliabilityBps: 9980,
      totalJobs: 1,
      sourceChain: "Monad Testnet",
      payoutAddress: "0x71C839e93ab233B27cb92a7e7Ac33f7bDa6b1e60",
    };

    setActiveExecutingMsgId(msgId);
    setMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, executionStatus: "approving" } : m))
    );

    try {
      const receipt = await executeJobPurchase(targetDataset, parsed.maxPrice);
      
      // Update original proposal card to completed
      setMessages((prev) =>
        prev.map((m) =>
          m.id === msgId
            ? {
                ...m,
                executionStatus: "completed",
                receipt: {
                  jobId: receipt.jobId,
                  txHash: receipt.realTxHash || receipt.txFund,
                  realTxHash: receipt.realTxHash,
                  isSimulated: receipt.isSimulated,
                  slaSeconds: receipt.freshnessSlaSeconds,
                  priceUsdc: receipt.budgetUsdc,
                  dataAgeSeconds: receipt.dataAgeSeconds,
                  dataPayload: receipt.dataPayload,
                },
              }
            : m
        )
      );

      // Append Claude conversational reply with verified data payload
      const deliveryMsgId = `claude-delivery-${Date.now()}`;
      const deliveryMsg: ChatMessage = {
        id: deliveryMsgId,
        sender: "claude",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        text: `🎉 Order #${receipt.jobId} settled! The Monad SlaEvaluator verified that your data attestation was fresh within ${receipt.freshnessSlaSeconds}s (observed age: ${receipt.dataAgeSeconds ?? 1.2}s). Here is your delivered data for ${targetDataset.name}:`,
        deliveryData: receipt.dataPayload
          ? {
              datasetName: targetDataset.name,
              payload: receipt.dataPayload,
              dataAgeSeconds: receipt.dataAgeSeconds ?? 1.2,
              slaSeconds: receipt.freshnessSlaSeconds,
              jobId: receipt.jobId,
            }
          : undefined,
      };

      setMessages((prev) => [...prev, deliveryMsg]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Execution failed";
      setMessages((prev) =>
        prev.map((m) =>
          m.id === msgId ? { ...m, executionStatus: "error", error: msg } : m
        )
      );
    } finally {
      setActiveExecutingMsgId(null);
    }
  };

  return (
    <>
      {/* ── 1. Floating Launcher Button (Bottom Right) ────────────────────── */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          id="btn-open-claude-console"
          onClick={() => setIsOpen(!isOpen)}
          className="relative group flex items-center gap-2.5 rounded-full bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 p-[1.5px] shadow-2xl shadow-purple-600/40 hover:shadow-cyan-500/50 transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
          title="Open Claude Natural-Language Console"
        >
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#0a0c16] text-white">
            <div className="relative">
              <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            </div>
            <span className="text-xs font-bold font-['Outfit'] tracking-wide">
              {isOpen ? "Close Console" : "Agent Console"}
            </span>
          </div>
        </button>
      </div>

      {/* ── 2. Chatbot Dialog Panel ──────────────────────────────────────── */}
      {isOpen && (
        <div
          className={`fixed z-50 rounded-3xl border border-white/15 bg-[#090b14]/95 shadow-2xl shadow-purple-900/40 backdrop-blur-2xl flex flex-col overflow-hidden animate-in fade-in duration-200 transition-all ${
            isEnlarged
              ? "bottom-6 right-4 sm:right-6 md:right-8 w-[820px] max-w-[calc(100vw-2rem)] h-[760px] max-h-[88vh]"
              : "bottom-20 right-6 w-[430px] max-w-[calc(100vw-2rem)] h-[580px] max-h-[82vh]"
          }`}
        >
          {/* Header */}
          <div
            onDoubleClick={() => setIsEnlarged(!isEnlarged)}
            className="p-4 border-b border-white/10 bg-gradient-to-r from-purple-950/40 via-black/40 to-cyan-950/40 flex items-center justify-between cursor-default select-none"
            title="Double click header to toggle expand/restore"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300 shadow-inner">
                <Bot className="w-4 h-4 text-cyan-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white font-['Outfit']">
                    Veris Agent Console
                  </span>
                  {isEnlarged && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 font-mono">
                      Expanded View
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-zinc-400">
                  Natural-language marketplace query parser
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setIsEnlarged(!isEnlarged)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title={isEnlarged ? "Restore standard size" : "Expand console"}
              >
                {isEnlarged ? (
                  <Minimize2 className="w-4 h-4 text-cyan-300" />
                ) : (
                  <Maximize2 className="w-4 h-4" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Close console"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Subheader info pill */}
          <div className="px-4 py-2 bg-white/[0.02] border-b border-white/5 flex items-center justify-between text-[11px] text-zinc-400 font-mono">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Target: Monad Testnet (10143)</span>
            </div>
            <div className="text-cyan-300">
              Bal: {usdcBalance} USDC
            </div>
          </div>

          {/* Message Stream */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 scrollbar-thin">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.sender === "user" ? "items-end" : "items-start"}`}
              >
                {/* Text Bubble */}
                {m.text && (
                  <div
                    className={`max-w-[88%] p-3 rounded-2xl text-xs leading-relaxed ${
                      m.sender === "user"
                        ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-br-none shadow-md shadow-purple-600/20"
                        : "bg-white/[0.05] border border-white/10 text-zinc-200 rounded-bl-none"
                    }`}
                  >
                    {m.text}
                  </div>
                )}

                {/* Delivered Data Payload Display from Claude Reply */}
                {m.deliveryData && (
                  <div className="max-w-[98%] w-full mt-2 animate-in fade-in slide-in-from-bottom-2">
                    <DataPayloadViewer
                      datasetName={m.deliveryData.datasetName}
                      payload={m.deliveryData.payload}
                      jobId={m.deliveryData.jobId}
                      dataAgeSeconds={m.deliveryData.dataAgeSeconds}
                      slaSeconds={m.deliveryData.slaSeconds}
                    />
                  </div>
                )}

                {/* Error Bubble (Claude Ambiguity or Missing Info) */}
                {m.error && (
                  <div className="max-w-[92%] p-3 rounded-2xl bg-rose-950/40 border border-rose-500/30 text-xs text-rose-200 rounded-bl-none space-y-1">
                    <div className="flex items-center gap-1.5 text-rose-400 font-semibold text-[11px] uppercase tracking-wider">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>Parse Ambiguity Rejected</span>
                    </div>
                    <p className="text-[11.5px] leading-relaxed text-rose-200">
                      {m.error}
                    </p>
                    <div className="text-[10px] text-rose-400/80 pt-0.5">
                      ⚠️ Protocol rule: Veris never guesses missing budgets or freshness limits.
                    </div>
                  </div>
                )}

                {/* Parsed Structured Purchase Call Card */}
                {m.parsed && (
                  <div className="max-w-[95%] w-full p-3.5 rounded-2xl bg-[#0e1222] border border-cyan-500/30 text-xs text-zinc-200 rounded-bl-none space-y-3 shadow-lg shadow-cyan-950/40">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                      <div className="flex items-center gap-1.5 text-cyan-300 font-bold text-xs">
                        <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Parsed Purchase Call</span>
                      </div>
                      <span className="text-[10px] font-mono text-zinc-400 px-1.5 py-0.5 bg-white/5 rounded border border-white/10">
                        {m.parsed.provider || "Claude"}
                      </span>
                    </div>

                    {/* Target Dataset details */}
                    <div>
                      <div className="text-[11px] text-zinc-400">Target Dataset</div>
                      <div className="text-xs font-bold text-white">
                        {m.matchedDataset?.name || m.parsed.matchedDatasetName || "CLOB DEX Price Feed"}
                      </div>
                    </div>

                    {/* Parameters Grid */}
                    <div className={`grid gap-2 text-xs ${isEnlarged ? "grid-cols-3" : "grid-cols-2"}`}>
                      <div className="p-2 rounded-xl bg-white/[0.03] border border-white/5">
                        <div className="text-[10px] text-zinc-400">Max Budget</div>
                        <div className="text-sm font-extrabold font-mono text-cyan-300">
                          ${m.parsed.maxPrice} <span className="text-[10px] font-normal text-zinc-400">USDC</span>
                        </div>
                      </div>

                      <div className="p-2 rounded-xl bg-white/[0.03] border border-white/5">
                        <div className="text-[10px] text-zinc-400">Freshness SLA</div>
                        <div className="text-sm font-extrabold font-mono text-purple-300">
                          ≤ {m.parsed.maxAgeSeconds}s <span className="text-[10px] font-normal text-zinc-400">window</span>
                        </div>
                      </div>

                      {isEnlarged && (
                        <div className="p-2 rounded-xl bg-white/[0.03] border border-white/5">
                          <div className="text-[10px] text-zinc-400">Escrow SLA Guarantee</div>
                          <div className="text-xs font-bold text-emerald-300">
                            Auto 100% Refund
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Seller ID */}
                    <div className="p-2 rounded-xl bg-black/40 border border-white/5 font-mono text-[10px] text-zinc-400 flex items-center justify-between">
                      <span>Seller:</span>
                      <span className="text-purple-300 truncate max-w-[200px]" title={m.parsed.sellerId}>
                        {m.parsed.sellerId}
                      </span>
                    </div>

                    {/* SLA Escrow Guarantee Guarantee Pill */}
                    <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 bg-emerald-950/20 border border-emerald-500/20 px-2.5 py-1.5 rounded-lg">
                      <ShieldCheck className="w-3 h-3 shrink-0" />
                      <span>100% on-chain refund if data exceeds {m.parsed.maxAgeSeconds}s</span>
                    </div>

                    {/* Execution UI / Action Button */}
                    {m.executionStatus === "completed" && m.receipt ? (
                      /* Receipt View */
                      <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 space-y-2 animate-in fade-in">
                        <div className="flex items-center justify-between text-xs font-bold text-white">
                          <span className="flex items-center gap-1 text-emerald-400">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Order #{m.receipt.jobId} Settled
                          </span>
                          <span className="text-cyan-300 font-mono">${m.receipt.priceUsdc} USDC</span>
                        </div>
                        <p className="text-[11px] text-zinc-300 leading-snug">
                          Attestation verified fresh within SLA! Data delivered below & seller reputation updated.
                        </p>
                        {m.receipt.realTxHash ? (
                          <div className="flex items-center justify-between pt-0.5">
                            <a
                              href={`${MONAD_TESTNET_EXPLORER}/tx/${m.receipt.realTxHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-cyan-300 hover:underline font-mono text-[10px]"
                            >
                              <span>View MonadScan On-Chain Tx</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                            <span className="text-[9px] text-zinc-400 font-mono">
                              Auth: ERC-20 Escrow Approval
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-[10px] text-amber-300/90 pt-0.5 font-mono">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                            <span>Demo Sandbox Mode (Zero balance deducted)</span>
                          </div>
                        )}

                        {m.receipt.dataPayload && (
                          <div className="pt-1">
                            <DataPayloadViewer
                              datasetName={m.matchedDataset?.name || m.parsed.matchedDatasetName || "Purchased Data Feed"}
                              payload={m.receipt.dataPayload}
                              jobId={m.receipt.jobId}
                              dataAgeSeconds={m.receipt.dataAgeSeconds}
                              slaSeconds={m.receipt.slaSeconds}
                              compact={true}
                            />
                          </div>
                        )}
                      </div>
                    ) : (
                      /* Purchase Button */
                      <button
                        onClick={() => handleExecutePurchase(m.id, m.parsed!, m.matchedDataset)}
                        disabled={activeExecutingMsgId === m.id}
                        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white font-bold text-xs shadow-md shadow-purple-600/30 transition-all cursor-pointer disabled:opacity-50"
                      >
                        {activeExecutingMsgId === m.id ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>
                              {buyerStep === "approving"
                                ? "Approving USDC..."
                                : buyerStep === "creating_job" || buyerStep === "funding_job"
                                ? "Creating Order on Monad..."
                                : "Executing Purchase..."}
                            </span>
                          </>
                        ) : (
                          <>
                            <Zap className="w-3.5 h-3.5 text-yellow-300" />
                            <span>Confirm & Buy ({m.parsed.maxPrice} USDC)</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                )}

                <span className="text-[9px] text-zinc-600 mt-1 px-1">
                  {m.timestamp}
                </span>
              </div>
            ))}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex items-center gap-2 text-xs text-zinc-400 p-2.5 rounded-xl bg-white/[0.03] border border-white/5 animate-pulse w-fit">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                <span>Claude is parsing data request & checking SellerRegistry...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestion Chips (if few messages) */}
          {messages.length <= 2 && (
            <div className="px-4 pb-2 pt-1 border-t border-white/5 bg-black/20">
              <div className="text-[10px] text-zinc-500 mb-1.5">Try an example:</div>
              <div className="flex flex-wrap gap-1.5">
                {SAMPLE_PROMPTS.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(prompt)}
                    className="text-[10px] text-left px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/5 transition-colors cursor-pointer"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Bar */}
          <div className="p-3 border-t border-white/10 bg-[#070910]">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="e.g. get me Kuru price, max 5 cents, under 10s..."
                disabled={isLoading}
                className="flex-1 bg-white/[0.05] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400/60 transition-colors"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="p-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white disabled:opacity-40 disabled:hover:bg-purple-600 transition-colors cursor-pointer shadow-md shadow-purple-600/30"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
