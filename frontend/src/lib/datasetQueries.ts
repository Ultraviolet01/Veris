/**
 * datasetQueries.ts — Granular Query Options & Schema Definitions for Datasets
 *
 * Allows buyers to specify exactly what market, pair, metric, or contract
 * parameters they want to purchase before committing escrow.
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
  // 1. Kuru CLOB
  kuru: {
    queryTitle: "Select Market Pair & Orderbook Depth",
    param1Label: "Trading Pair",
    param1Options: ["MON / USDC", "ETH / USDC", "BTC / USDC", "USDT / USDC"],
    param2Label: "Orderbook Depth",
    param2Options: ["L2 Top 5 (Ultra-Fast)", "L2 Top 20 (Deep Liquidity)", "L3 Full Tick Snapshot"],
    endpointTemplate: (p1, p2) =>
      `GET /api/v1/clob/kuru/orderbook?pair=${encodeURIComponent(p1)}&depth=${p2?.includes("20") ? "20" : p2?.includes("Full") ? "all" : "5"}&attestation=ecdsa`,
    querySummary: (p1, p2) => `Kuru CLOB L2 snapshot for ${p1} (${p2 || "Top 5"})`,
  },

  // 2. Aave V3
  aave: {
    queryTitle: "Select Lending Asset & Interest Rate Mode",
    param1Label: "Asset Reserve",
    param1Options: ["USDC", "WETH", "WBTC", "MON", "USDT"],
    param2Label: "Metrics Requested",
    param2Options: ["Supply & Borrow APY", "Utilization & Liquidity Caps", "Health Factor & Risk Parameters"],
    endpointTemplate: (p1, p2) =>
      `GET /api/v1/lending/aave-v3/rates?asset=${encodeURIComponent(p1)}&scope=${encodeURIComponent(p2 || "rates")}`,
    querySummary: (p1, p2) => `Aave V3 pool telemetry for ${p1} (${p2})`,
  },

  // 3. Perpl Derivatives
  perpl: {
    queryTitle: "Select Perp Contract & Metric",
    param1Label: "Perpetual Contract",
    param1Options: ["MON-PERP", "ETH-PERP", "BTC-PERP", "SOL-PERP"],
    param2Label: "Data Slice",
    param2Options: ["Mark Price & 1h Funding Rate", "Open Interest & Long/Short Skew", "Liquidation Cluster Map"],
    endpointTemplate: (p1, p2) =>
      `GET /api/v1/derivatives/perpl/feed?market=${encodeURIComponent(p1)}&stream=${encodeURIComponent(p2 || "mark")}`,
    querySummary: (p1, p2) => `Perpl ${p1} telemetry (${p2})`,
  },

  // 4. Uniswap V3
  uniswap: {
    queryTitle: "Select Liquidity Pool & Fee Tier",
    param1Label: "Liquidity Pool",
    param1Options: ["WETH / USDC (0.05%)", "MON / USDC (0.30%)", "WBTC / WETH (0.05%)", "USDC / USDT (0.01%)"],
    param2Label: "Observation Mode",
    param2Options: ["Spot Tick & Geometric TWAP", "Liquidity Density Curve", "Fee Growth Global 0/1"],
    endpointTemplate: (p1, p2) =>
      `GET /api/v1/dex/uniswap-v3/twap?pool=${encodeURIComponent(p1)}&metric=${encodeURIComponent(p2 || "twap")}`,
    querySummary: (p1, p2) => `Uniswap V3 ${p1} (${p2})`,
  },

  // 5. OpenSea Seaport
  opensea: {
    queryTitle: "Select NFT Collection & Feed Type",
    param1Label: "Collection",
    param1Options: ["Monad Early Adopters Pass", "Pudgy Penguins", "Milady Maker", "CryptoPunks"],
    param2Label: "Feed Depth",
    param2Options: ["Instant Floor Price & Top Bid", "Recent OrderFulfilled Stream", "Listing Velocity Index"],
    endpointTemplate: (p1, p2) =>
      `GET /api/v1/nft/seaport/floor?collection=${encodeURIComponent(p1)}&filter=${encodeURIComponent(p2 || "floor")}`,
    querySummary: (p1, p2) => `Seaport ${p1} (${p2})`,
  },

  // 6. Overtime Sports
  overtime: {
    queryTitle: "Select Sporting Event & Market Type",
    param1Label: "Upcoming Fixture",
    param1Options: [
      "NFL: Kansas City Chiefs vs SF 49ers",
      "EPL: Arsenal vs Manchester City",
      "NBA: Boston Celtics vs LA Lakers",
      "UCL: Real Madrid vs Bayern Munich",
    ],
    param2Label: "Odds Market",
    param2Options: ["Moneyline & Winner", "Spread & Handicap (-2.5)", "Over / Under Points (47.5)"],
    endpointTemplate: (p1, p2) =>
      `GET /api/v1/sports/overtime/odds?fixture=${encodeURIComponent(p1)}&market=${encodeURIComponent(p2 || "all")}`,
    querySummary: (p1, p2) => `Overtime live odds: ${p1} (${p2})`,
  },

  // 7. Azuro Prediction
  azuro: {
    queryTitle: "Select Prediction Category & Condition",
    param1Label: "Event Category",
    param1Options: ["UEFA Champions League", "Counter-Strike 2 Major", "Valorant Champions", "Formula 1 Grand Prix"],
    param2Label: "Resolution Status",
    param2Options: ["Live In-Play Odds", "Condition Outcome Status", "Liquidity Pool Depth"],
    endpointTemplate: (p1, p2) =>
      `GET /api/v1/prediction/azuro/pool?category=${encodeURIComponent(p1)}&type=${encodeURIComponent(p2 || "odds")}`,
    querySummary: (p1, p2) => `Azuro ${p1} (${p2})`,
  },

  // 8. Polymarket
  polymarket: {
    queryTitle: "Select Prediction Market & Probability Curve",
    param1Label: "Market Question",
    param1Options: [
      "Fed Interest Rate Cut (Next FOMC)",
      "Ethereum Spot ETF Inflows >$10B in 2026",
      "Monad Mainnet TPS Sustained >10,000",
      "US Inflation YoY < 2.5%",
    ],
    param2Label: "Data Scope",
    param2Options: ["Probability Curve & Best Bids/Asks", "24h Volume & Open Interest", "Outcome Settlement Shares"],
    endpointTemplate: (p1, p2) =>
      `GET /api/v1/prediction/polymarket/book?market=${encodeURIComponent(p1)}&scope=${encodeURIComponent(p2 || "curve")}`,
    querySummary: (p1, p2) => `Polymarket: ${p1} (${p2})`,
  },

  // 9. Monad Mempool & Gas
  monad: {
    queryTitle: "Select Validator Telemetry & Risk Stream",
    param1Label: "Stream Metric",
    param1Options: [
      "Base Fee Delta & Optimal Tip Estimator",
      "Pending Whale Transactions (>10k MON)",
      "Sequencer Queue Latency & Congestion Index",
      "Mempool Frontrunning Risk Gauge",
    ],
    param2Label: "Sampling Frequency",
    param2Options: ["Block-by-Block (sub-second)", "Rolling 10-Block Exponential Average"],
    endpointTemplate: (p1, p2) =>
      `GET /api/v1/telemetry/monad/mempool?metric=${encodeURIComponent(p1)}&sample=${encodeURIComponent(p2 || "realtime")}`,
    querySummary: (p1, p2) => `Monad node telemetry: ${p1} (${p2})`,
  },
};

export function getQueryConfigForDataset(datasetName: string): DatasetQueryConfig {
  const lower = datasetName.toLowerCase();
  if (lower.includes("kuru") || lower.includes("clob")) return DATASET_QUERY_CONFIGS.kuru;
  if (lower.includes("aave") || lower.includes("lending")) return DATASET_QUERY_CONFIGS.aave;
  if (lower.includes("perpl") || lower.includes("derivative")) return DATASET_QUERY_CONFIGS.perpl;
  if (lower.includes("uniswap") || lower.includes("twap")) return DATASET_QUERY_CONFIGS.uniswap;
  if (lower.includes("opensea") || lower.includes("seaport") || lower.includes("nft")) return DATASET_QUERY_CONFIGS.opensea;
  if (lower.includes("overtime") || lower.includes("sport")) return DATASET_QUERY_CONFIGS.overtime;
  if (lower.includes("azuro")) return DATASET_QUERY_CONFIGS.azuro;
  if (lower.includes("polymarket") || lower.includes("prediction")) return DATASET_QUERY_CONFIGS.polymarket;
  return DATASET_QUERY_CONFIGS.monad;
}
