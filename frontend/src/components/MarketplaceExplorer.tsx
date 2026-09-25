import React, { useState } from "react";
import {
  FEATURED_DATASETS,
  type MarketplaceDataset,
  HARD_SPENDING_CAP_USDC,
} from "../lib/contracts";
import {
  Search,
  Clock,
  Award,
  Zap,
  ArrowUpRight,
  ShieldCheck,
} from "lucide-react";

interface MarketplaceExplorerProps {
  onSelectDataset: (dataset: MarketplaceDataset) => void;
}

export const MarketplaceExplorer: React.FC<MarketplaceExplorerProps> = ({ onSelectDataset }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const categories = [
    "All",
    "Weather & Climate",
    "Order Books & Equities",
    "Macro & Commodities",
    "Aviation & Logistics",
    "DeFi Rates",
    "DEX Liquidity",
    "NFT & Digital Assets",
    "Sports & Events",
    "Prediction Markets",
  ];

  const filteredDatasets = FEATURED_DATASETS.filter((item) => {
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
    const matchesQuery =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  return (
    <section className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="badge badge-monad">Universal Data Feeds</span>
            <span className="text-xs text-zinc-400">Settled via Monad Escrow</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white font-['Outfit']">
            Universal Verified Data Marketplace
          </h2>
          <p className="text-sm text-zinc-400 max-w-2xl mt-1">
            Browse real-world, financial, and digital data feeds published by registered sellers.
            Every query is settled via Monad ERC-8183 escrow with cryptographic SLA verification.
          </p>
        </div>

        {/* Protection Pill */}
        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-2 rounded-xl text-xs text-emerald-300">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Client Spending Guard: Max ${HARD_SPENDING_CAP_USDC} USDC / call</span>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
        {/* Categories */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              id={`filter-cat-${cat.toLowerCase().replace(/\s+/g, "-")}`}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? "bg-[#836ef9] text-white shadow-md shadow-[#836ef9]/30"
                  : "bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 border border-white/5"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="marketplace-search-input"
            type="text"
            placeholder="Search datasets, tokens, rates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-900/80 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#836ef9] transition-colors"
          />
        </div>
      </div>

      {/* Dataset Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDatasets.map((dataset) => {
          const reliabilityPct = (dataset.reliabilityBps / 100).toFixed(1);
          return (
            <div
              key={dataset.name}
              className="glass-panel p-6 rounded-2xl flex flex-col justify-between border border-white/10 hover:border-[#836ef9]/40 hover:shadow-xl hover:shadow-[#836ef9]/10 transition-all group"
            >
              <div>
                {/* Header Tag & Category & Seller ID */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] font-semibold text-[#a797ff] uppercase tracking-wider bg-purple-500/10 px-2 py-0.5 rounded-md border border-purple-500/20">
                      {dataset.category}
                    </span>
                    <span className="text-[11px] font-mono font-medium text-purple-300 bg-white/5 px-2 py-0.5 rounded-md border border-white/10">
                      {dataset.sellerId}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 shrink-0">
                    <Award className="w-3.5 h-3.5" />
                    <span className="font-semibold">{reliabilityPct}% SLA</span>
                  </div>
                </div>

                {/* Name */}
                <h3 className="text-lg font-bold text-white font-['Outfit'] mb-2 group-hover:text-[#a797ff] transition-colors">
                  {dataset.name}
                </h3>

                {/* Description */}
                <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                  {dataset.description}
                </p>

                {/* SLA Specifications & Metrics */}
                <div className="bg-black/30 border border-white/5 rounded-xl p-3 mb-5 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-zinc-300">
                    <span className="flex items-center gap-1.5 text-zinc-400">
                      <Clock className="w-3.5 h-3.5 text-cyan-400" />
                      Freshness Window SLA:
                    </span>
                    <span className="font-semibold text-white">≤ {dataset.freshnessSlaSeconds}s</span>
                  </div>

                  <div className="flex items-center justify-between text-zinc-300">
                    <span className="flex items-center gap-1.5 text-zinc-400">
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      Total Attested Jobs:
                    </span>
                    <span className="font-semibold text-white">{dataset.totalJobs.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Price & Action */}
              <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] text-zinc-400 block uppercase font-medium">Query Price</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-extrabold text-white">${dataset.priceUsdc}</span>
                    <span className="text-xs text-zinc-400">USDC</span>
                  </div>
                </div>

                <button
                  id={`btn-buy-feed-${dataset.name.toLowerCase().replace(/[^a-z0-9]/g, "-").slice(0, 20)}`}
                  onClick={() => onSelectDataset(dataset)}
                  className="btn-primary text-xs py-2 px-4 rounded-xl flex items-center gap-1.5"
                >
                  <span>Purchase Query</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
