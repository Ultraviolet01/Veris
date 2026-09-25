import React, { useState } from "react";
import {
  FEATURED_DATASETS,
  type MarketplaceDataset,
  MONAD_TESTNET_EXPLORER,
} from "../lib/contracts";
import {
  Search,
  ChevronDown,
  ChevronUp,
  Terminal,
  Code2,
  Copy,
  Check,
  ExternalLink,
  Info,
} from "lucide-react";

interface DataMarketTerminalProps {
  onSelectDataset: (dataset: MarketplaceDataset) => void;
}

export interface GlobalTrade {
  jobId: number;
  timeAgo: string;
  datasetName: string;
  amountUsdc: number;
  outcome: "open" | "settled" | "refunded";
  txHash: string;
  blockNumber: number;
  promisedSlaSeconds: number;
  observedDataAgeSeconds?: number;
  buyerAddress: string;
}

const GLOBAL_TRADES: GlobalTrade[] = [
  {
    jobId: 193,
    timeAgo: "3 h ago",
    datasetName: "Aave V3 Lending Rates & Reserve Liquidity",
    amountUsdc: 0.25,
    outcome: "open",
    txHash: "0x8f21e4a7b9c1d0e3a5f78901234567890abcdef1",
    blockNumber: 38221410,
    promisedSlaSeconds: 10,
    buyerAddress: "0x3a91E5aB23...7bDa",
  },
  {
    jobId: 192,
    timeAgo: "7 h ago",
    datasetName: "Uniswap V3 High-Frequency Pool TWAP & Ticks",
    amountUsdc: 0.30,
    outcome: "settled",
    txHash: "0x7c10b49ad68e5410982345678901234567890abc",
    blockNumber: 38219447,
    promisedSlaSeconds: 5,
    observedDataAgeSeconds: 1.8,
    buyerAddress: "0x71C839e93a...b1e60",
  },
  {
    jobId: 191,
    timeAgo: "16 h ago",
    datasetName: "Pyth Network On-Chain Price Feed Attestations",
    amountUsdc: 0.25,
    outcome: "open",
    txHash: "0x9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b",
    blockNumber: 38215820,
    promisedSlaSeconds: 3,
    buyerAddress: "0x89e173e421...a1e61",
  },
  {
    jobId: 190,
    timeAgo: "4 d ago",
    datasetName: "Kuru CLOB On-Chain Order Book Depth",
    amountUsdc: 0.35,
    outcome: "settled",
    txHash: "0x6be0f9210ac573b9876543210fedcba987654321",
    blockNumber: 38208124,
    promisedSlaSeconds: 3,
    observedDataAgeSeconds: 1.4,
    buyerAddress: "0x45E923e421...b1e63",
  },
  {
    jobId: 189,
    timeAgo: "5 d ago",
    datasetName: "OpenSea Seaport 1.6 Protocol Trades & Floor Bids",
    amountUsdc: 0.40,
    outcome: "settled",
    txHash: "0x44e12088cb39d89271625341209876543210fedc",
    blockNumber: 38194500,
    promisedSlaSeconds: 15,
    observedDataAgeSeconds: 4.1,
    buyerAddress: "0x89C323e421...b1e67",
  },
  {
    jobId: 188,
    timeAgo: "5 d ago",
    datasetName: "Curve Finance Multi-Asset Pool Stable-Peg Deviations",
    amountUsdc: 0.30,
    outcome: "open",
    txHash: "0x19a0bc443210fe8976543210fedcba9876543210",
    blockNumber: 38180940,
    promisedSlaSeconds: 8,
    buyerAddress: "0x55c3210fe8...99a0",
  },
  {
    jobId: 184,
    timeAgo: "6 d ago",
    datasetName: "Perpl Perpetual Futures Mark Price & Funding Velocity",
    amountUsdc: 0.45,
    outcome: "refunded",
    txHash: "0x92d044e1234567890abcdef1234567890abcdef1",
    blockNumber: 38132490,
    promisedSlaSeconds: 5,
    observedDataAgeSeconds: 14.8,
    buyerAddress: "0x93F423e421...b1e62",
  },
  {
    jobId: 183,
    timeAgo: "7 d ago",
    datasetName: "Compound V3 (Comet) Collateral & Borrow Utilization",
    amountUsdc: 0.25,
    outcome: "settled",
    txHash: "0x8e5678901234567890abcdef1234567890abcdef1",
    blockNumber: 38118204,
    promisedSlaSeconds: 10,
    observedDataAgeSeconds: 2.1,
    buyerAddress: "0x82A123e421...b1e61",
  },
  {
    jobId: 182,
    timeAgo: "7 d ago",
    datasetName: "OpenSea Seaport Floor Prices & Trades",
    amountUsdc: 0.10,
    outcome: "refunded",
    txHash: "0x7f45678901234567890abcdef1234567890abcdef1",
    blockNumber: 38115080,
    promisedSlaSeconds: 15,
    observedDataAgeSeconds: 22.4,
    buyerAddress: "0x56F023e421...b1e64",
  },
  {
    jobId: 181,
    timeAgo: "7 d ago",
    datasetName: "Aave V3 Lending Rates & Liquidity APY",
    amountUsdc: 0.10,
    outcome: "settled",
    txHash: "0x6a345678901234567890abcdef1234567890abcdef1",
    blockNumber: 38112940,
    promisedSlaSeconds: 10,
    observedDataAgeSeconds: 4.6,
    buyerAddress: "0x71C839e93a...b1e60",
  },
  {
    jobId: 180,
    timeAgo: "7 d ago",
    datasetName: "Monad Gas Priority & Sequencer Queue Risk",
    amountUsdc: 0.10,
    outcome: "settled",
    txHash: "0x5b2345678901234567890abcdef1234567890abcdef1",
    blockNumber: 38110400,
    promisedSlaSeconds: 8,
    observedDataAgeSeconds: 3.0,
    buyerAddress: "0x90D423e421...b1e68",
  },
  {
    jobId: 179,
    timeAgo: "7 d ago",
    datasetName: "Azuro Event Prediction & Betting Liquidity",
    amountUsdc: 0.10,
    outcome: "refunded",
    txHash: "0x4c1234567890abcdef1234567890abcdef12345678",
    blockNumber: 38108120,
    promisedSlaSeconds: 10,
    observedDataAgeSeconds: 16.2,
    buyerAddress: "0x78B223e421...b1e66",
  },
  {
    jobId: 178,
    timeAgo: "7 d ago",
    datasetName: "Overtime Markets Live Sports Odds & Spreads",
    amountUsdc: 0.10,
    outcome: "open",
    txHash: "0x3d01234567890abcdef1234567890abcdef1234567",
    blockNumber: 38105700,
    promisedSlaSeconds: 12,
    buyerAddress: "0x67A123e421...b1e65",
  },
  {
    jobId: 177,
    timeAgo: "7 d ago",
    datasetName: "Uniswap V3 High-Frequency Pool TWAP",
    amountUsdc: 0.10,
    outcome: "refunded",
    txHash: "0x2e901234567890abcdef1234567890abcdef123456",
    blockNumber: 38102340,
    promisedSlaSeconds: 5,
    observedDataAgeSeconds: 16.1,
    buyerAddress: "0x45E923e421...b1e63",
  },
  {
    jobId: 176,
    timeAgo: "7 d ago",
    datasetName: "Kuru CLOB DEX Best Bid/Ask & Depth",
    amountUsdc: 0.10,
    outcome: "settled",
    txHash: "0x1f801234567890abcdef1234567890abcdef123455",
    blockNumber: 38099800,
    promisedSlaSeconds: 3,
    observedDataAgeSeconds: 2.1,
    buyerAddress: "0x82A123e421...b1e61",
  },
  {
    jobId: 175,
    timeAgo: "7 d ago",
    datasetName: "Aave V3 Lending Rates & Liquidity APY",
    amountUsdc: 0.10,
    outcome: "settled",
    txHash: "0x0a701234567890abcdef1234567890abcdef123454",
    blockNumber: 38097210,
    promisedSlaSeconds: 10,
    observedDataAgeSeconds: 5.8,
    buyerAddress: "0x71C839e93a...b1e60",
  },
];

export const DataMarketTerminal: React.FC<DataMarketTerminalProps> = ({ onSelectDataset }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [expandedDatasetName, setExpandedDatasetName] = useState<string | null>(FEATURED_DATASETS[0].name);
  const [copiedName, setCopiedName] = useState<string | null>(null);

  // Trades state
  const [tradeFilter, setTradeFilter] = useState<"all" | "settled" | "refunded" | "open">("all");

  const categories = [
    "All",
    "DeFi Lending",
    "DEX Liquidity",
    "CLOB Liquidity",
    "On-Chain Oracles",
    "NFT Protocol State",
    "Perps & Derivatives",
    "Network Telemetry",
  ];

  const filteredDatasets = FEATURED_DATASETS.filter((item) => {
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
    const matchesQuery =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  const filteredTrades = GLOBAL_TRADES.filter((trade) => {
    if (tradeFilter === "all") return true;
    return trade.outcome === tradeFilter;
  });

  const copySnippet = (dataset: MarketplaceDataset) => {
    const code = `const result = await veris.query("${dataset.sellerId}", {\n  maxSlaSeconds: ${dataset.freshnessSlaSeconds},\n  priceUsdc: "${dataset.priceUsdc.toFixed(2)}"\n});`;
    navigator.clipboard.writeText(code);
    setCopiedName(dataset.name);
    setTimeout(() => setCopiedName(null), 2000);
  };

  const toggleExpand = (name: string) => {
    setExpandedDatasetName(expandedDatasetName === name ? null : name);
  };

  return (
    <section className="space-y-8">
      {/* Top Banner / Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-[#836ef9]/10 text-[#836ef9] border border-[#836ef9]/20">
              TERMINAL MODE
            </span>
            <span className="text-[11px] font-mono text-neutral-500">
              CHAIN ID: 10143 (MONAD TESTNET)
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-mono">
            VERIS DATA TERMINAL
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1 max-w-2xl font-mono">
            Autonomous data feed registry. Query live on-chain datasets protected by self-enforcing SLA escrow.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Horizontal Category Pill Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 lg:pb-0 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? "bg-white text-black font-semibold shadow-sm"
                  : "bg-[#0b0c10] text-neutral-400 hover:text-white border border-white/5 hover:border-white/10"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search size={14} className="text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search feed, asset, pool..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#06070a] border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-white/30 font-mono transition-colors"
          />
        </div>
      </div>

      {/* Protocol Telemetry Metrics Bar */}
      <div className="rounded-xl border border-white/10 bg-[#06070a] overflow-hidden shadow-lg">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 font-mono">
          <div className="px-4 py-3 sm:px-5 sm:py-3.5 flex flex-col justify-center border-b sm:border-b-0 border-r border-white/10">
            <span className="text-[10px] sm:text-[10.5px] uppercase tracking-wider text-neutral-400 font-medium">
              24H SETTLED
            </span>
            <span className="text-xs sm:text-sm font-bold text-white mt-1">
              0.10 USDC (1)
            </span>
          </div>

          <div className="px-4 py-3 sm:px-5 sm:py-3.5 flex flex-col justify-center border-b sm:border-b-0 border-r sm:border-r border-white/10">
            <span className="text-[10px] sm:text-[10.5px] uppercase tracking-wider text-neutral-400 font-medium">
              24H REFUNDED
            </span>
            <span className="text-xs sm:text-sm font-bold text-white mt-1">
              0 USDC (0)
            </span>
          </div>

          <div className="px-4 py-3 sm:px-5 sm:py-3.5 flex flex-col justify-center border-b md:border-b-0 md:border-r-0 lg:border-r border-white/10">
            <span className="text-[10px] sm:text-[10.5px] uppercase tracking-wider text-neutral-400 font-medium">
              REFUND RATE 30D
            </span>
            <span className="text-xs sm:text-sm font-bold text-white mt-1">
              46%
            </span>
          </div>

          <div className="px-4 py-3 sm:px-5 sm:py-3.5 flex flex-col justify-center border-r border-white/10">
            <div className="flex items-center gap-1">
              <span
                className="text-[10px] sm:text-[10.5px] uppercase tracking-wider text-neutral-400 font-medium border-b border-dotted border-neutral-500 cursor-help"
                title="Protocol fee collected by VerisTreasury on completed SLA jobs (2% / 200 bps)"
              >
                PROTOCOL FEES
              </span>
              <Info size={11} className="text-neutral-500 hover:text-neutral-300 transition-colors" />
            </div>
            <span className="text-xs sm:text-sm font-bold text-white mt-1">
              2%
            </span>
          </div>

          <div className="px-4 py-3 sm:px-5 sm:py-3.5 flex flex-col justify-center">
            <span className="text-[10px] sm:text-[10.5px] uppercase tracking-wider text-neutral-400 font-medium">
              INDEX LAG
            </span>
            <span className="text-xs sm:text-sm font-bold text-white mt-1">
              71 blocks
            </span>
          </div>
        </div>
      </div>

      {/* High-Density Data Feed Terminal Table — locked to 100% width with no horizontal scroll */}
      <div className="rounded-2xl border border-white/10 bg-[#06070a] overflow-hidden shadow-2xl">
        <div className="w-full overflow-hidden">
          <table className="w-full table-fixed text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-[#030305] text-[10.5px] uppercase tracking-wider text-neutral-500 font-mono">
                <th className="py-3 px-4 w-[50%]">Feed / Asset</th>
                <th className="py-3 px-3 w-[20%]">Category</th>
                <th className="py-3 px-3 w-[16%]">Call Price</th>
                <th className="py-3 px-4 w-[14%] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredDatasets.map((ds) => {
                const isExpanded = expandedDatasetName === ds.name;

                return (
                  <React.Fragment key={ds.name}>
                    {/* Main Row */}
                    <tr
                      onClick={() => toggleExpand(ds.name)}
                      className={`hover:bg-white/[0.02] transition-colors cursor-pointer ${
                        isExpanded ? "bg-white/[0.015]" : ""
                      }`}
                    >
                      <td className="py-3.5 px-4 overflow-hidden">
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <div className="text-white font-semibold text-xs font-mono truncate">{ds.name}</div>
                            <div className="text-[10px] text-neutral-500 font-mono truncate mt-0.5">
                              {ds.description}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-3 text-neutral-400 font-mono text-[11px] truncate">
                        {ds.category}
                      </td>

                      <td className="py-3.5 px-3 text-white font-semibold font-mono text-xs whitespace-nowrap">
                        {ds.priceUsdc.toFixed(2)} USDC
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectDataset(ds);
                            }}
                            className="px-3 py-1 rounded-md bg-white text-black text-xs font-semibold hover:bg-neutral-200 transition-colors cursor-pointer"
                          >
                            Buy
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleExpand(ds.name);
                            }}
                            className="p-1 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                          >
                            {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expandable Technical Drawer */}
                    {isExpanded && (
                      <tr className="bg-[#030306] border-b border-white/10">
                        <td colSpan={4} className="p-6">
                          <div className="rounded-xl border border-white/10 bg-[#010204] p-5 space-y-4">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-white/5 text-[11px]">
                              <div className="flex items-center gap-2">
                                <Terminal size={14} className="text-[#FF5A36]" />
                                <span className="text-white font-semibold">Feed Telemetry & Contract Metadata</span>
                              </div>
                              <div className="flex items-center gap-3 text-neutral-400">
                                <span>Seller ID: <code className="text-purple-300 font-semibold">{ds.sellerId}</code></span>
                                <span>Payout Address: <code className="text-neutral-300">{ds.payoutAddress.slice(0, 8)}...</code></span>
                              </div>
                            </div>

                            {/* SDK Code Snippet Generator */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-[10.5px] text-neutral-400">
                                <span className="flex items-center gap-1.5">
                                  <Code2 size={12} className="text-purple-400" />
                                  TypeScript Agent Query Payload
                                </span>
                                <button
                                  type="button"
                                  onClick={() => copySnippet(ds)}
                                  className="flex items-center gap-1 text-[#FF5A36] hover:text-white transition-colors cursor-pointer"
                                >
                                  {copiedName === ds.name ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                                  <span>{copiedName === ds.name ? "Copied" : "Copy Code"}</span>
                                </button>
                              </div>
                              <div className="rounded-lg bg-black/80 border border-white/5 p-3 text-[11px] text-purple-200 overflow-x-auto">
                                <code>const result = await veris.query(&quot;{ds.sellerId}&quot;, &#123; maxSlaSeconds: {ds.freshnessSlaSeconds}, priceUsdc: &quot;{ds.priceUsdc.toFixed(2)}&quot; &#125;);</code>
                              </div>
                            </div>

                            {/* Actions bar */}
                            <div className="flex flex-wrap items-center justify-between gap-4 pt-2 text-[11px]">
                              <span className="text-neutral-500">
                                Evaluated atomically on Monad Testnet (10143) via SlaEvaluator.sol
                              </span>
                              <div className="flex items-center gap-3">
                                <button
                                  type="button"
                                  onClick={() => onSelectDataset(ds)}
                                  className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-semibold transition-colors cursor-pointer"
                                >
                                  Buy Feed · {ds.priceUsdc.toFixed(2)} USDC
                                </button>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Global Trades Table Section */}
      <div className="space-y-3 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <h2 className="text-sm font-bold text-white tracking-widest font-mono uppercase">
              TRADES
            </h2>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] text-neutral-500 font-mono">
              Global Protocol Activity (All Datasets)
            </span>
          </div>

          {/* Outcome Filter Pills */}
          <div className="flex items-center gap-1.5 text-xs font-mono">
            <span className="text-neutral-500 text-[11px] mr-1">Outcome:</span>
            {(["all", "settled", "refunded", "open"] as const).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setTradeFilter(filter)}
                className={`px-2 py-0.5 rounded text-[10.5px] uppercase transition-colors cursor-pointer ${
                  tradeFilter === filter
                    ? "bg-white/10 text-white font-semibold border border-white/20"
                    : "text-neutral-500 hover:text-neutral-300"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* High-Density Trades Terminal Table */}
        <div className="rounded-2xl border border-white/10 bg-[#06070a] overflow-hidden shadow-2xl">
          <div className="w-full overflow-hidden">
            <table className="w-full table-fixed text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-[#030305] text-[10.5px] uppercase tracking-wider text-neutral-500 font-mono">
                  <th className="py-3 px-4 w-[13%]">TIME</th>
                  <th className="py-3 px-3 w-[9%]">JOB</th>
                  <th className="py-3 px-3 w-[36%]">DATASET</th>
                  <th className="py-3 px-3 w-[14%]">AMOUNT</th>
                  <th className="py-3 px-3 w-[13%]">OUTCOME</th>
                  <th className="py-3 px-4 w-[15%] text-right">TX HASH</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono">
                {filteredTrades.map((trade) => (
                  <tr key={trade.jobId} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-4 text-neutral-400 text-xs whitespace-nowrap">
                      {trade.timeAgo}
                    </td>

                    <td className="py-3.5 px-3 text-neutral-300 text-xs font-semibold whitespace-nowrap">
                      #{trade.jobId}
                    </td>

                    <td className="py-3.5 px-3 text-white text-xs truncate" title={trade.datasetName}>
                      {trade.datasetName}
                    </td>

                    <td className="py-3.5 px-3 text-neutral-300 text-xs whitespace-nowrap">
                      {trade.amountUsdc.toFixed(2)} USDC
                    </td>

                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <span
                        className={
                          trade.outcome === "settled"
                            ? "text-emerald-400 font-semibold"
                            : trade.outcome === "refunded"
                            ? "text-rose-400 font-semibold"
                            : "text-amber-400 font-semibold"
                        }
                      >
                        {trade.outcome}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <a
                        href={`${MONAD_TESTNET_EXPLORER}/tx/${trade.txHash}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-neutral-400 hover:text-white font-mono text-xs transition-colors"
                        title={`View Tx on MonadScan: ${trade.txHash}`}
                      >
                        <span>{trade.txHash.slice(0, 6)}…{trade.txHash.slice(-4)}</span>
                        <ExternalLink size={10} className="text-neutral-500 hover:text-neutral-300" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
};
