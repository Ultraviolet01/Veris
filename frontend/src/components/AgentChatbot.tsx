import React, { useState, useRef, useEffect, useMemo } from "react";
import { useBuyerFlow, type BuyerStep, type JobExecutionReceipt } from "../hooks/useBuyerFlow";
import { useUsdcBalance } from "../hooks/useUsdcBalance";
import { useIsLoggedIn, useDynamicContext } from "@dynamic-labs/sdk-react-core";
import {
  FEATURED_DATASETS,
  MONAD_TESTNET_EXPLORER,
  HARD_SPENDING_CAP_USDC,
  type MarketplaceDataset,
} from "../lib/contracts";
import {
  Sparkles,
  X,
  Send,
  RefreshCw,
  AlertCircle,
  Terminal,
  Maximize2,
  Minimize2,
  Play,
  RotateCcw,
  Trash2,
  Info,
} from "lucide-react";
import { OpenBookStepper, OpenBookTxCard } from "./OpenBookReceipt";

/** Convert dataset name to standard slug */
function datasetToSlug(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes("aave")) return "aave-v3-rates";
  if (lower.includes("uniswap") || lower.includes("twap")) return "uniswap-v3-twap";
  if (lower.includes("pyth") || lower.includes("oracle")) return "pyth-oracles";
  if (lower.includes("kuru") || lower.includes("clob")) return "kuru-clob-dex";
  if (lower.includes("opensea") || lower.includes("seaport")) return "opensea-seaport";
  if (lower.includes("curve") || lower.includes("stableswap")) return "curve-stableswap";
  if (lower.includes("compound") || lower.includes("comet")) return "compound-v3-comet";
  if (lower.includes("perpl") || lower.includes("derivative")) return "perpl-derivatives";
  if (lower.includes("overtime") || lower.includes("sport") || lower.includes("bet") || lower.includes("odds")) return "overtime-sports";
  if (lower.includes("monad") || lower.includes("mempool") || lower.includes("sequencer")) return "monad-sequencer-telemetry";
  return lower.replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

/** Find dataset by slug, first name token, or partial name */
function findDataset(query: string): MarketplaceDataset | undefined {
  const clean = query.trim().toLowerCase();
  return (
    FEATURED_DATASETS.find((d) => datasetToSlug(d.name) === clean) ||
    FEATURED_DATASETS.find((d) => d.name.toLowerCase().includes(clean)) ||
    FEATURED_DATASETS.find((d) => clean.includes(datasetToSlug(d.name).split("-")[0])) ||
    FEATURED_DATASETS.find((d) => clean.includes(d.name.toLowerCase().split(" ")[0]))
  );
}

export interface AskProposal {
  command: string;
  argv: string[];
  rationale: string;
  dataset: MarketplaceDataset;
  maxPrice: number;
  maxAgeSeconds: number;
  forceStale?: boolean;
}

export type MessageKind =
  | "text"
  | "proposal"
  | "table"
  | "kv"
  | "stepper"
  | "receipt"
  | "error"
  | "help";

export interface ChatMessage {
  id: string;
  sender: "user" | "veris" | "system";
  timestamp: string;
  text?: string;
  commandLine?: string;
  kind: MessageKind;
  proposal?: AskProposal;
  tableData?: {
    summary?: string;
    columns: string[];
    rows: Array<Record<string, string>>;
  };
  kvData?: {
    title?: string;
    subtitle?: string;
    rows: Array<[key: string, string]>;
    note?: string;
  };
  executing?: boolean;
  executingStep?: BuyerStep;
  forceStaleSelected?: boolean;
  receipt?: JobExecutionReceipt;
  error?: string;
}

const SAMPLE_COMMANDS = [
  "datasets",
  "quote aave-v3-rates",
  "quote uniswap-v3-twap",
  "buy aave-v3-rates --max 0.25 --fresh 10",
  "buy pyth-oracles --max 0.25 --fresh 3",
  "balance",
  "help",
];

export const AgentChatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isEnlarged, setIsEnlarged] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Default welcome message matches OpenBook console tape
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome-tape",
      sender: "veris",
      kind: "text",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      text: "Veris Natural-Language Console — The Model Proposes, The Registry Executes.\nAsk in plain English or run direct protocol commands (datasets, quote, balance, buy, fail).",
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isLoggedIn = useIsLoggedIn();
  const { setShowAuthFlow, primaryWallet } = useDynamicContext();
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

  // Keep live step updated for the actively executing card
  useEffect(() => {
    if (activeExecutingMsgId) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === activeExecutingMsgId ? { ...m, executingStep: buyerStep } : m
        )
      );
    }
  }, [buyerStep, activeExecutingMsgId]);

  /** Helper to append an entry to the tape */
  const appendMessage = (msg: Omit<ChatMessage, "id" | "timestamp">): string => {
    const id = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const newMsg: ChatMessage = {
      ...msg,
      id,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, newMsg]);
    return id;
  };

  /** Command Dispatcher: handles both direct typed CLI commands and ask queries */
  const handleSend = async (customQuery?: string) => {
    const raw = (customQuery ?? input).trim();
    if (!raw || isLoading) return;

    setInput("");
    const normalized = raw.trim();

    // 1. Record user command on tape with prompt ">"
    appendMessage({
      sender: "user",
      kind: "text",
      commandLine: normalized,
      text: normalized,
    });

    const words = normalized.split(/\s+/);
    const cmd = words[0].toLowerCase();

    // ── Command: clear ─────────────────────────────────────────────────────────
    if (cmd === "clear" || cmd === "cls") {
      setMessages([
        {
          id: `welcome-${Date.now()}`,
          sender: "veris",
          kind: "text",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          text: "Tape cleared. Ask for any data feed in plain English or run: datasets, quote, balance, buy, fail.",
        },
      ]);
      return;
    }

    // ── Command: help ──────────────────────────────────────────────────────────
    if (cmd === "help" || normalized === "man") {
      appendMessage({
        sender: "veris",
        kind: "help",
        tableData: {
          summary: "VERIS PROTOCOL COMMAND REGISTRY (ACP Contract v2)",
          columns: ["COMMAND", "SYNTAX", "DESCRIPTION"],
          rows: [
            {
              COMMAND: "datasets",
              SYNTAX: "datasets [or ls]",
              DESCRIPTION: "List all active decentralized data feeds with price & SLA",
            },
            {
              COMMAND: "quote",
              SYNTAX: "quote <dataset-id>",
              DESCRIPTION: "Inspect live seller SLA floor, price, and escrow payout terms",
            },
            {
              COMMAND: "balance",
              SYNTAX: "balance",
              DESCRIPTION: "Inspect connected buyer wallet USDC funds and gas",
            },
            {
              COMMAND: "buy",
              SYNTAX: "buy <id> [--max <usdc>] [--fresh <sec>]",
              DESCRIPTION: "Propose & fund verified data purchase with self-enforcing escrow",
            },
            {
              COMMAND: "fail",
              SYNTAX: "fail <dataset-id> [or sandbox stale]",
              DESCRIPTION: "Test SLA breach run to verify 100% on-chain refund to buyer",
            },
            {
              COMMAND: "clear",
              SYNTAX: "clear [or cls]",
              DESCRIPTION: "Clear console receipt tape",
            },
          ],
        },
      });
      return;
    }

    // ── Command: datasets / ls ─────────────────────────────────────────────────
    if (cmd === "datasets" || cmd === "ls" || normalized.toLowerCase() === "list") {
      appendMessage({
        sender: "veris",
        kind: "table",
        tableData: {
          summary: `ACTIVE REGISTRY DATASETS (${FEATURED_DATASETS.length} registered)`,
          columns: ["DATASET", "PRICE", "SLA PROMISE", "CATEGORY", "RELIABILITY"],
          rows: FEATURED_DATASETS.map((d) => ({
            DATASET: datasetToSlug(d.name),
            PRICE: `${d.priceUsdc} USDC`,
            "SLA PROMISE": `≤ ${d.freshnessSlaSeconds}.0s`,
            CATEGORY: d.category,
            RELIABILITY: `${((d.reliabilityBps || 9980) / 100).toFixed(1)}%`,
          })),
        },
      });
      return;
    }

    // ── Command: quote <dataset> ───────────────────────────────────────────────
    if (cmd === "quote") {
      const targetQuery = words.slice(1).join(" ");
      const matched = findDataset(targetQuery) || FEATURED_DATASETS[1]; // default Kuru
      const slug = datasetToSlug(matched.name);

      appendMessage({
        sender: "veris",
        kind: "kv",
        kvData: {
          title: `QUOTE · ${slug}`,
          subtitle: "SellerRegistry live read (Monad Testnet)",
          rows: [
            ["dataset", matched.name],
            ["category", matched.category],
            ["base price", `${matched.priceUsdc} USDC`],
            ["sla promise", `≤ ${matched.freshnessSlaSeconds}.0s freshness floor`],
            ["reliability", `${((matched.reliabilityBps || 9980) / 100).toFixed(1)}% on-chain score`],
            ["seller payout", matched.payoutAddress || "0x71C839...1e60"],
            ["escrow contract", "ACPCore.sol (Monad Testnet)"],
            ["fee split", "98% seller payout · 2% VerisTreasury fee (200 bp)"],
            ["guarantee", "100% automatic refund on SLA breach"],
          ],
          note: `Type: buy ${slug} --max ${matched.priceUsdc} --fresh ${matched.freshnessSlaSeconds} to run purchase`,
        },
      });
      return;
    }

    // ── Command: balance / whoami ──────────────────────────────────────────────
    if (cmd === "balance" || cmd === "whoami") {
      const address = primaryWallet?.address;
      appendMessage({
        sender: "veris",
        kind: "kv",
        kvData: {
          title: "BUYER · WALLET STATUS",
          subtitle: "Dynamic Authenticated Session",
          rows: [
            ["buyer address", address ? truncateHash(address, 10, 8) : "Not connected"],
            ["usdc balance", `${usdcBalance} USDC`],
            ["hard cap", `${HARD_SPENDING_CAP_USDC} USDC / call limit`],
            ["network", "Monad Testnet (Chain ID 10143)"],
            ["escrow status", "ACPCore.sol ready · zero-slippage autonomous settlements"],
            ["recourse", "100% automatic refund guaranteed on SLA breach"],
          ],
          note: address ? undefined : "Connect your wallet via the top bar to fund live escrow purchases.",
        },
      });
      return;
    }

    // ── Command: fail / sandbox stale (test SLA breach & 100% refund) ──────────
    if (cmd === "fail" || normalized === "sandbox stale") {
      const targetQuery = words.slice(1).join(" ") || "kuru";
      const matched = findDataset(targetQuery) || FEATURED_DATASETS[1];
      const slug = datasetToSlug(matched.name);

      const proposal: AskProposal = {
        command: `fail ${slug}`,
        argv: [slug, "--fail"],
        rationale: `Simulate SLA breach on ${matched.name} to test 100% on-chain refund to buyer`,
        dataset: matched,
        maxPrice: matched.priceUsdc,
        maxAgeSeconds: matched.freshnessSlaSeconds,
        forceStale: true,
      };

      appendMessage({
        sender: "veris",
        kind: "proposal",
        proposal,
        forceStaleSelected: true,
      });
      return;
    }

    // ── Command: buy <dataset> [--max <usdc>] [--fresh <sec>] ──────────────────
    if (cmd === "buy") {
      const argv = words.slice(1);
      const datasetArg = argv[0] || "kuru-clob-dex";
      const matched = findDataset(datasetArg) || FEATURED_DATASETS[1];
      const slug = datasetToSlug(matched.name);

      const maxIdx = argv.indexOf("--max");
      const freshIdx = argv.indexOf("--fresh");

      const maxPrice = maxIdx >= 0 ? parseFloat(argv[maxIdx + 1]) || matched.priceUsdc : matched.priceUsdc;
      const freshness = freshIdx >= 0 ? parseFloat(argv[freshIdx + 1]) || matched.freshnessSlaSeconds : matched.freshnessSlaSeconds;

      const proposal: AskProposal = {
        command: `buy ${slug} --max ${maxPrice} --fresh ${freshness}`,
        argv: [slug, "--max", String(maxPrice), "--fresh", String(freshness)],
        rationale: `${matched.name} at ${maxPrice} USDC with freshness floor of ${freshness}s`,
        dataset: matched,
        maxPrice,
        maxAgeSeconds: freshness,
        forceStale: false,
      };

      appendMessage({
        sender: "veris",
        kind: "proposal",
        proposal,
        forceStaleSelected: false,
      });
      return;
    }

    // ── Natural Language "Ask" Mode (Claude Parser + Registry Pick) ────────────
    // If the input is conversational (e.g. "get me Kuru price, max 5 cents, under 10s"),
    // map it into an OpenBook Ask Proposal: The Model Proposes, The Registry Executes!
    setIsLoading(true);

    try {
      // Check if query is asking for feeds or balance
      const lower = normalized.toLowerCase();
      if (lower.includes("what dataset") || lower.includes("list feed") || lower.includes("available data")) {
        handleSend("datasets");
        setIsLoading(false);
        return;
      }
      if (lower.includes("balance") || lower.includes("my funds") || lower.includes("how much usdc")) {
        handleSend("balance");
        setIsLoading(false);
        return;
      }
      if (lower.includes("simulate") && (lower.includes("breach") || lower.includes("refund") || lower.includes("fail") || lower.includes("stale"))) {
        handleSend(`fail ${lower.includes("aave") ? "aave" : lower.includes("uniswap") ? "uniswap" : "kuru"}`);
        setIsLoading(false);
        return;
      }

      const sellersPayload = FEATURED_DATASETS.map((d) => ({
        sellerId: d.sellerId,
        name: d.name,
        category: d.category,
        priceUsdc: d.priceUsdc,
        freshnessSlaSeconds: d.freshnessSlaSeconds,
      }));

      const res = await fetch("/api/claude-parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: normalized,
          availableSellers: sellersPayload,
        }),
      });

      const data = await res.json();

      if (data.error) {
        appendMessage({
          sender: "veris",
          kind: "error",
          error: data.error,
          text: `Refused · ${data.error}`,
        });
      } else {
        // Find matched dataset
        const matched =
          FEATURED_DATASETS.find(
            (d) =>
              data.matchedDatasetName &&
              (d.name.toLowerCase().includes(data.matchedDatasetName.toLowerCase()) ||
                data.matchedDatasetName.toLowerCase().includes(d.name.toLowerCase()))
          ) ||
          findDataset(normalized) ||
          FEATURED_DATASETS[1];

        const slug = datasetToSlug(matched.name);
        const maxPrice = Number(data.maxPrice ?? matched.priceUsdc);
        const maxAge = Number(data.maxAgeSeconds ?? matched.freshnessSlaSeconds);

        const proposal: AskProposal = {
          command: `buy ${slug} --max ${maxPrice} --fresh ${maxAge}`,
          argv: [slug, "--max", String(maxPrice), "--fresh", String(maxAge)],
          rationale: `${matched.name} at ${maxPrice} USDC with freshness floor of ${maxAge}s`,
          dataset: matched,
          maxPrice,
          maxAgeSeconds: maxAge,
          forceStale: false,
        };

        appendMessage({
          sender: "veris",
          kind: "proposal",
          proposal,
          forceStaleSelected: false,
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to connect to parser";
      appendMessage({
        sender: "veris",
        kind: "error",
        error: `Parser Network Error: ${msg}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  /** Execute confirmed proposal through canonical OpenBook buyer workflow */
  const handleExecuteProposal = async (msgId: string, proposal: AskProposal, forceStale = false) => {
    if (!isLoggedIn) {
      setShowAuthFlow(true);
      return;
    }

    setActiveExecutingMsgId(msgId);

    // Switch card into executing stepper mode
    setMessages((prev) =>
      prev.map((m) =>
        m.id === msgId
          ? {
              ...m,
              executing: true,
              executingStep: "approving",
              forceStaleSelected: forceStale,
            }
          : m
      )
    );

    try {
      const receipt = await executeJobPurchase(
        proposal.dataset,
        proposal.maxPrice,
        forceStale
      );

      // Update proposal message into completed OpenBookTxCard receipt
      setMessages((prev) =>
        prev.map((m) =>
          m.id === msgId
            ? {
                ...m,
                executing: false,
                kind: "receipt",
                receipt,
              }
            : m
        )
      );

      // Print conversational summary block
      const isRefunded = receipt.verdict === "REFUNDED" || receipt.outcome === "refunded";
      if (isRefunded) {
        appendMessage({
          sender: "veris",
          kind: "text",
          text: `🛡️ Recourse Refund Executed for Order #${receipt.jobId}! The Monad SlaEvaluator detected that data delivery (${(receipt.dataAgeSeconds ?? 14.5).toFixed(1)}s) breached the promised ≤${receipt.freshnessSlaSeconds}s SLA. 100% of escrow (${receipt.budgetUsdc} USDC) has been automatically refunded to your wallet.`,
        });
      } else {
        appendMessage({
          sender: "veris",
          kind: "text",
          text: `🎉 Order #${receipt.jobId} Settled! Data verified fresh within SLA (${(receipt.dataAgeSeconds ?? 1.2).toFixed(1)}s ≤ ${receipt.freshnessSlaSeconds}s). Payment disbursed: 98% to seller, 2% to VerisTreasury. Delivered payload is attached to your receipt above.`,
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Execution failed";
      setMessages((prev) =>
        prev.map((m) =>
          m.id === msgId
            ? {
                ...m,
                executing: false,
                error: msg,
              }
            : m
        )
      );
    } finally {
      setActiveExecutingMsgId(null);
    }
  };

  /** Toggle the "or make it fail" checkbox on a proposal */
  const toggleForceStale = (msgId: string) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === msgId ? { ...m, forceStaleSelected: !m.forceStaleSelected } : m
      )
    );
  };

  return (
    <>
      {/* ── 1. Floating Console Launcher Button (Bottom Right) ──────────────── */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          id="btn-open-claude-console"
          onClick={() => setIsOpen(!isOpen)}
          className="relative group flex items-center gap-2.5 rounded-full bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 p-[1.5px] shadow-2xl shadow-purple-600/40 hover:shadow-cyan-500/50 transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
          title="Open Veris Autonomous Protocol Console"
        >
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#080a14] text-white">
            <div className="relative">
              <Terminal className="w-4 h-4 text-cyan-400" />
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            </div>
            <span className="text-xs font-bold font-mono tracking-wide">
              {isOpen ? "Close Console" : "Veris Console"}
            </span>
          </div>
        </button>
      </div>

      {/* ── 2. OpenBook Console Tape Dialog ─────────────────────────────────── */}
      {isOpen && (
        <div
          className={`fixed z-50 rounded-3xl border border-white/15 bg-[#070913]/95 shadow-2xl shadow-purple-950/60 backdrop-blur-2xl flex flex-col overflow-hidden animate-in fade-in duration-200 transition-all font-mono ${
            isEnlarged
              ? "bottom-6 right-4 sm:right-6 md:right-8 w-[860px] max-w-[calc(100vw-2rem)] h-[820px] max-h-[90vh]"
              : "bottom-20 right-6 w-[470px] max-w-[calc(100vw-2rem)] h-[620px] max-h-[84vh]"
          }`}
        >
          {/* Header Strip with Live Status Chips */}
          <div
            onDoubleClick={() => setIsEnlarged(!isEnlarged)}
            className="px-4 py-3 border-b border-dashed border-white/15 bg-[#05070e] flex items-center justify-between cursor-default select-none"
            title="Double-click to expand/restore console"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300">
                <Terminal className="w-3.5 h-3.5 text-cyan-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white tracking-wider uppercase">
                    Veris Console
                  </span>
                  <span className="text-[10px] text-cyan-300 font-mono px-1.5 py-0.2 rounded bg-cyan-950/60 border border-cyan-500/30">
                    Live
                  </span>
                </div>
                <div className="text-[10px] text-neutral-400 font-sans">
                  The model proposes, the registry executes
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleSend("clear")}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Clear tape (⌘L)"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setIsEnlarged(!isEnlarged)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title={isEnlarged ? "Restore standard width" : "Expand width"}
              >
                {isEnlarged ? (
                  <Minimize2 className="w-3.5 h-3.5 text-cyan-300" />
                ) : (
                  <Maximize2 className="w-3.5 h-3.5" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Close console"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Subheader Strip: Live Chips */}
          <div className="px-4 py-1.5 bg-white/[0.02] border-b border-white/5 flex items-center justify-between text-[11px] text-neutral-400 font-mono flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Monad Testnet</span>
              </div>
              <div className="text-neutral-500 hidden sm:inline">·</div>
              <div className="text-purple-300">ACPCore · live</div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-cyan-300 font-semibold">{usdcBalance} USDC</span>
              {primaryWallet && (
                <span className="text-[10px] text-neutral-500">
                  ({truncateHash(primaryWallet.address, 4, 3)})
                </span>
              )}
            </div>
          </div>

          {/* Tape Stream (Console Entries) */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 scrollbar-thin bg-[#060810]/70">
            {messages.map((m) => (
              <div key={m.id} className="space-y-2">
                {/* 1. Echoed Command Line (if user) */}
                {m.sender === "user" && (
                  <div className="flex items-center gap-2 text-xs font-bold text-white pt-1">
                    <span className="text-cyan-400">&gt;</span>
                    <span className="text-cyan-200 font-mono">{m.commandLine || m.text}</span>
                    <span className="text-[9px] text-neutral-600 font-normal ml-auto">
                      {m.timestamp}
                    </span>
                  </div>
                )}

                {/* 2. Plain Text / Conversational Message */}
                {m.sender !== "user" && m.text && (
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 text-xs text-neutral-200 leading-relaxed font-sans whitespace-pre-wrap">
                    {m.text}
                  </div>
                )}

                {/* 3. Error Bubble */}
                {m.error && (
                  <div className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-500/30 text-xs text-rose-200 space-y-1 font-mono">
                    <div className="flex items-center gap-1.5 text-rose-400 font-bold text-[11px] uppercase tracking-wider">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>Command Refused</span>
                    </div>
                    <p className="text-[11.5px] leading-relaxed text-rose-200 font-sans">
                      {m.error}
                    </p>
                  </div>
                )}

                {/* 4. TableBlock (e.g. for `datasets` or `help`) */}
                {m.tableData && (
                  <div className="rounded-xl border border-white/10 bg-[#060810] p-3.5 font-mono text-xs space-y-2.5 overflow-x-auto shadow-lg">
                    {m.tableData.summary && (
                      <div className="flex items-center justify-between pb-1.5 border-b border-dashed border-white/10 text-neutral-400 text-[11px]">
                        <span className="font-semibold text-white">{m.tableData.summary}</span>
                        <span className="text-cyan-400 text-[10px]">SellerRegistry live read</span>
                      </div>
                    )}
                    <table className="w-full text-left border-collapse text-[11.5px]">
                      <thead>
                        <tr className="text-[10px] text-neutral-500 uppercase border-b border-white/5 pb-1">
                          {m.tableData.columns.map((col) => (
                            <th key={col} className="py-1 px-2.5 font-semibold">
                              {col}
                            </th>
                          ))}
                          <th className="py-1 px-2.5 text-right font-semibold">ACTION</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {m.tableData.rows.map((row, idx) => (
                          <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                            {m.tableData!.columns.map((col) => {
                              const val = row[col];
                              const isDataset = col === "DATASET";
                              const isPrice = col === "PRICE";
                              const isSla = col === "SLA PROMISE";
                              const isReliability = col === "RELIABILITY";
                              return (
                                <td
                                  key={col}
                                  className={`py-2 px-2.5 ${
                                    isDataset
                                      ? "font-bold text-white"
                                      : isPrice
                                      ? "text-cyan-300 font-semibold"
                                      : isSla
                                      ? "text-purple-300"
                                      : isReliability
                                      ? "text-emerald-400 font-semibold"
                                      : "text-neutral-300"
                                  }`}
                                >
                                  {val}
                                </td>
                              );
                            })}
                            <td className="py-2 px-2.5 text-right">
                              {row["DATASET"] ? (
                                <button
                                  type="button"
                                  onClick={() => handleSend(`quote ${row["DATASET"]}`)}
                                  className="px-2 py-0.5 rounded bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 text-[10px] font-bold cursor-pointer transition-colors"
                                >
                                  quote
                                </button>
                              ) : null}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* 5. KvBlock (e.g. for `quote <dataset>` or `balance`) */}
                {m.kvData && (
                  <div className="rounded-xl border border-white/10 bg-[#060810] p-4 font-mono text-xs space-y-2.5 shadow-lg">
                    {m.kvData.title && (
                      <div className="flex items-center justify-between pb-2 border-b border-dashed border-white/10">
                        <span className="font-bold text-cyan-300">{m.kvData.title}</span>
                        {m.kvData.subtitle && (
                          <span className="text-[10px] text-neutral-400">
                            {m.kvData.subtitle}
                          </span>
                        )}
                      </div>
                    )}
                    <dl className="divide-y divide-white/5 text-[11.5px]">
                      {m.kvData.rows.map(([key, val], idx) => (
                        <div key={idx} className="py-1.5 flex items-center justify-between gap-4">
                          <dt className="text-neutral-500 text-[11px] uppercase tracking-wider">
                            {key}
                          </dt>
                          <dd className="text-neutral-200 font-semibold text-right">
                            {val}
                          </dd>
                        </div>
                      ))}
                    </dl>
                    {m.kvData.note && (
                      <div className="pt-1.5 border-t border-white/5 text-[10px] text-neutral-400 font-sans flex items-center gap-1.5">
                        <Info className="w-3 h-3 text-cyan-400 shrink-0" />
                        <span>{m.kvData.note}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* 6. Ask Proposal Block (The Model Proposes, The Registry Executes) */}
                {m.proposal && (
                  <div className="rounded-2xl border border-purple-500/30 bg-[#080b18] p-4 font-mono space-y-3 shadow-xl shadow-purple-950/30">
                    {/* Proposal Tag & Proposed Command Line */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold border border-purple-500/40 text-[10px] tracking-wider uppercase">
                        proposed
                      </span>
                      <code className="text-cyan-300 font-bold text-xs">
                        &gt; {m.proposal.command}
                      </code>
                    </div>

                    {/* Rationale explanation */}
                    <p className="text-xs text-neutral-300 leading-relaxed font-sans">
                      {m.proposal.rationale}{" "}
                      <span className="text-neutral-500">· by Claude 3.5 Sonnet</span>
                    </p>

                    {/* Live Stepper if actively executing */}
                    {m.executing && (
                      <div className="pt-2 animate-in fade-in">
                        <div className="text-[11px] text-purple-300 font-semibold mb-1 flex items-center gap-1.5">
                          <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                          <span>Executing on Monad Testnet (Escrow Deposit)...</span>
                        </div>
                        <OpenBookStepper
                          currentStep={m.executingStep || "approving"}
                          receipt={null}
                          isStaleOutcome={m.forceStaleSelected}
                        />
                      </div>
                    )}

                    {/* Proposal Action Affordances */}
                    {!m.executing && (
                      <div className="flex items-center justify-between gap-3 pt-2 border-t border-white/10 flex-wrap">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() =>
                              handleExecuteProposal(m.id, m.proposal!, m.forceStaleSelected)
                            }
                            disabled={activeExecutingMsgId !== null}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-black font-bold text-xs shadow-md shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
                          >
                            <Play size={12} className="fill-current" />
                            <span>Run ↵</span>
                            <span className="text-[10px] font-normal opacity-80 font-sans">
                              nothing auto-executes
                            </span>
                          </button>

                          <label className="flex items-center gap-1.5 text-xs text-amber-300 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={m.forceStaleSelected ?? false}
                              onChange={() => toggleForceStale(m.id)}
                              className="rounded border-amber-500/50 bg-black/40 text-amber-500 focus:ring-0 cursor-pointer"
                            />
                            <span className="text-[11px]">or make it fail</span>
                          </label>
                        </div>

                        <span className="text-[10px] text-neutral-400 font-sans">
                          {m.forceStaleSelected
                            ? "fail run · tests 100% refund recourse"
                            : "a purchase · runs buy, deliver & settle"}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* 7. OpenBook Canonical Rubber-Stamp Receipt (TxBlock + KvBlock) */}
                {m.receipt && (
                  <div className="animate-in fade-in slide-in-from-bottom-2">
                    <OpenBookTxCard
                      receipt={m.receipt}
                      datasetName={m.receipt.datasetName}
                      budgetUsdc={m.receipt.budgetUsdc}
                      freshnessSlaSeconds={m.receipt.freshnessSlaSeconds}
                    />
                  </div>
                )}
              </div>
            ))}

            {/* In-Flight Asking Indicator */}
            {isLoading && (
              <div className="flex items-center gap-2 text-xs text-neutral-400 p-2.5 rounded-xl bg-white/[0.03] border border-white/5 animate-pulse w-fit font-mono">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                <span>asking Claude 3.5 Sonnet to pick from SellerRegistry…</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggestion Chips Bar */}
          <div className="px-4 py-2 border-t border-dashed border-white/10 bg-[#05070f] flex items-center gap-1.5 overflow-x-auto scrollbar-none text-[11px]">
            <span className="text-[10px] text-neutral-500 uppercase font-semibold shrink-0">
              Try:
            </span>
            {SAMPLE_COMMANDS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => handleSend(s)}
                className="px-2 py-0.5 rounded-md bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white border border-white/5 font-mono text-[10px] whitespace-nowrap transition-colors cursor-pointer shrink-0"
              >
                {s}
              </button>
            ))}
          </div>

          {/* Terminal Input Bar */}
          <div className="p-3 border-t border-white/10 bg-[#04060d]">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <div className="relative flex-1 flex items-center">
                <span className="absolute left-3 text-cyan-400 font-bold font-mono text-xs select-none">
                  &gt;
                </span>
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="e.g. buy aave-v3-rates --max 0.25 --fresh 10 (or ask in plain English)..."
                  disabled={isLoading}
                  className="w-full bg-white/[0.04] border border-white/10 rounded-xl pl-7 pr-3.5 py-2.5 text-xs text-white placeholder-neutral-500 font-mono focus:outline-none focus:border-cyan-400/60 transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="p-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white disabled:opacity-40 transition-colors cursor-pointer shadow-md shadow-purple-600/30"
                title="Send command / query"
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
