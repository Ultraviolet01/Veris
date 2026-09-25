/**
 * datasetQueries.ts — Granular Query Options & Schema Definitions for On-Chain Datasets
 *
 * Allows buyers to specify exactly what market, pair, metric, or contract
 * parameters they want to purchase before committing escrow.
 *
 * NOTE: All datasets are purely on-chain protocols across the EVM ecosystem.
 * Monad is the high-speed escrow payment gateway and settlement layer.
 */

export interface DatasetQueryConfig {
  queryTitle: string;
  param1Label: string;
  param1Options: string[];
  param2Label?: string;
  param2Options?: string[];
  endpointTemplate: (p1: string, p2?: string) => string;
  querySummary: (p1: string, p2?: string) => string;
}

export const DATASET_QUERY_CONFIGS: Record<string, DatasetQueryConfig> = {
  // 1. Aave V3 Lending Rates & Liquidity
  aave: {
    queryTitle: "Select Reserve Asset & Rate Parameters",
    param1Label: "Asset Reserve",
    param1Options: ["USDC", "WETH", "WBTC", "USDT", "DAI"],
    param2Label: "Metrics Requested",
    param2Options: [
      "Supply & Variable Borrow APY",
      "Reserve Utilization & Liquidity Caps",
      "Health Factor & Risk Parameters",
    ],
    endpointTemplate: (p1, p2) =>
      `GET /api/v1/lending/aave-v3/rates?asset=${encodeURIComponent(p1)}&scope=${encodeURIComponent(p2 || "rates")}&chain=ethereum`,
    querySummary: (p1, p2) => `Aave V3 pool telemetry for ${p1} (${p2 || "APY"})`,
  },

  // 2. Uniswap V3 Pool TWAP & Ticks
  uniswap: {
    queryTitle: "Select Liquidity Pool & Observation Window",
    param1Label: "Liquidity Pool",
    param1Options: [
      "WETH / USDC (0.05%)",
      "WBTC / WETH (0.05%)",
      "USDC / USDT (0.01%)",
      "ARB / USDC (0.05%)",
    ],
    param2Label: "Observation Mode",
    param2Options: [
      "Spot Tick & Geometric TWAP",
      "Liquidity Density Curve",
      "Fee Growth Global 0/1",
    ],
    endpointTemplate: (p1, p2) =>
      `GET /api/v1/dex/uniswap-v3/twap?pool=${encodeURIComponent(p1)}&metric=${encodeURIComponent(p2 || "twap")}`,
    querySummary: (p1, p2) => `Uniswap V3 ${p1} (${p2 || "TWAP"})`,
  },

  // 3. Pyth Network On-Chain Price Oracles
  pyth: {
    queryTitle: "Select Pyth Price Feed & Confidence Interval",
    param1Label: "Oracle Price Feed",
    param1Options: ["BTC / USD", "ETH / USD", "SOL / USD", "AVAX / USD", "LINK / USD"],
    param2Label: "Confidence Mode",
    param2Options: [
      "99.9% Strict Confidence Interval",
      "95% Standard Interval",
      "EMA Price & Publisher Count",
    ],
    endpointTemplate: (p1, p2) =>
      `GET /api/v1/oracle/pyth/price?symbol=${encodeURIComponent(p1)}&confidence=${encodeURIComponent(p2 || "strict")}`,
    querySummary: (p1, p2) => `Pyth on-chain oracle: ${p1} (${p2 || "99.9%"})`,
  },

  // 4. Kuru CLOB On-Chain Order Book Depth
  kuru: {
    queryTitle: "Select Market Pair & Order Book Depth",
    param1Label: "Market / Symbol",
    param1Options: ["BTC / USD", "ETH / USD", "MON / USDC", "SOL / USD"],
    param2Label: "Order Book Depth",
    param2Options: ["L2 Top 5 (Ultra-Fast)", "L2 Top 20 (Deep Book)", "L3 Full Tick Snapshot"],
    endpointTemplate: (p1, p2) =>
      `GET /api/v1/clob/kuru/orderbook?pair=${encodeURIComponent(p1)}&depth=${p2?.includes("20") ? "20" : p2?.includes("Full") ? "all" : "5"}&attestation=ecdsa`,
    querySummary: (p1, p2) => `Kuru CLOB L2 snapshot for ${p1} (${p2 || "Top 5"})`,
  },

  // 5. OpenSea Seaport 1.6 Protocol Trades & Floor
  opensea: {
    queryTitle: "Select Collection & Protocol Event Feed",
    param1Label: "NFT Collection",
    param1Options: ["CryptoPunks", "Bored Ape Yacht Club", "Pudgy Penguins", "Milady Maker"],
    param2Label: "Feed Depth",
    param2Options: [
      "Instant Floor Price & Top Bid",
      "Recent OrderFulfilled Stream",
      "Listing Velocity Index",
    ],
    endpointTemplate: (p1, p2) =>
      `GET /api/v1/nft/seaport/floor?collection=${encodeURIComponent(p1)}&filter=${encodeURIComponent(p2 || "floor")}`,
    querySummary: (p1, p2) => `Seaport ${p1} (${p2 || "Floor"})`,
  },

  // 6. Curve Finance Multi-Asset Stable-Peg Deviations
  curve: {
    queryTitle: "Select Curve Pool & Peg Deviation Metric",
    param1Label: "Curve Pool",
    param1Options: [
      "3pool (DAI / USDC / USDT)",
      "stETH / ETH Concentrated",
      "crvUSD / USDC (0.01%)",
    ],
    param2Label: "Stability Metric",
    param2Options: [
      "Virtual Price & Peg Deviation Ratio",
      "Amplification Parameter A & Invariant",
      "Pool Imbalance & Fee Accrual",
    ],
    endpointTemplate: (p1, p2) =>
      `GET /api/v1/dex/curve/pool?pool=${encodeURIComponent(p1)}&metric=${encodeURIComponent(p2 || "virtual-price")}`,
    querySummary: (p1, p2) => `Curve ${p1} (${p2 || "Virtual Price"})`,
  },

  // 7. Compound V3 (Comet) Collateral & Borrow
  compound: {
    queryTitle: "Select Comet Market & Utilization Slice",
    param1Label: "Comet Market",
    param1Options: ["USDC Market (WETH/WBTC/ARB)", "USDT Market (WETH/WBTC)"],
    param2Label: "Collateral Metric",
    param2Options: [
      "Borrow Rate & Base Utilization",
      "Collateral Asset Absorption Queue",
      "Reserves & Protocol Equity",
    ],
    endpointTemplate: (p1, p2) =>
      `GET /api/v1/lending/compound-v3/market?market=${encodeURIComponent(p1)}&scope=${encodeURIComponent(p2 || "utilization")}`,
    querySummary: (p1, p2) => `Compound Comet ${p1} (${p2 || "Utilization"})`,
  },

  // 8. Perpl Perpetual Futures Mark Price & Funding
  perpl: {
    queryTitle: "Select Perp Contract & Metric",
    param1Label: "Perpetual Contract",
    param1Options: ["BTC-PERP", "ETH-PERP", "SOL-PERP", "MON-PERP"],
    param2Label: "Data Slice",
    param2Options: [
      "Mark Price & 1h Funding Rate",
      "Open Interest & Long/Short Skew",
      "Liquidation Cluster Map",
    ],
    endpointTemplate: (p1, p2) =>
      `GET /api/v1/derivatives/perpl/feed?market=${encodeURIComponent(p1)}&stream=${encodeURIComponent(p2 || "mark")}`,
    querySummary: (p1, p2) => `Perpl ${p1} telemetry (${p2 || "Mark"})`,
  },

  // 9. Monad Sequencer Queue & Validator Mempool Telemetry
  monad: {
    queryTitle: "Select Validator Telemetry & Risk Stream",
    param1Label: "Stream Metric",
    param1Options: [
      "Base Fee Delta & Optimal Tip Estimator",
      "Sequencer Queue Latency & Congestion Index",
      "Block Space Utilization %",
      "Reorg Risk & Finality Gauge",
    ],
    param2Label: "Sampling Frequency",
    param2Options: ["Block-by-Block (sub-second)", "Rolling 10-Block Exponential Average"],
    endpointTemplate: (p1, p2) =>
      `GET /api/v1/telemetry/monad/mempool?metric=${encodeURIComponent(p1)}&sample=${encodeURIComponent(p2 || "realtime")}`,
    querySummary: (p1, p2) => `Monad node telemetry: ${p1} (${p2 || "Realtime"})`,
  },
};

export function getQueryConfigForDataset(datasetName: string): DatasetQueryConfig {
  const lower = datasetName.toLowerCase();
  if (lower.includes("aave")) return DATASET_QUERY_CONFIGS.aave;
  if (lower.includes("uniswap") || lower.includes("twap")) return DATASET_QUERY_CONFIGS.uniswap;
  if (lower.includes("pyth") || lower.includes("oracle")) return DATASET_QUERY_CONFIGS.pyth;
  if (lower.includes("kuru") || lower.includes("clob")) return DATASET_QUERY_CONFIGS.kuru;
  if (lower.includes("opensea") || lower.includes("seaport") || lower.includes("nft")) return DATASET_QUERY_CONFIGS.opensea;
  if (lower.includes("curve") || lower.includes("stableswap")) return DATASET_QUERY_CONFIGS.curve;
  if (lower.includes("compound") || lower.includes("comet")) return DATASET_QUERY_CONFIGS.compound;
  if (lower.includes("perpl") || lower.includes("derivative")) return DATASET_QUERY_CONFIGS.perpl;
  return DATASET_QUERY_CONFIGS.monad;
}
