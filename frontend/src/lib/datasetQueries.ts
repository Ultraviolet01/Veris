/**
 * datasetQueries.ts — Granular Query Options & Schema Definitions for Datasets
 *
 * Allows buyers to specify exactly what market, pair, metric, or contract
 * parameters they want to purchase before committing escrow.
 *
 * NOTE: The datasets represent universal real-world, financial, and digital data.
 * Monad is strictly the payment gateway and settlement layer for escrow.
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
  // 1. NOAA Doppler Radar & Weather
  weather: {
    queryTitle: "Select Meteorological Station & Atmospheric Metric",
    param1Label: "Weather Station / Airport",
    param1Options: [
      "JFK International (New York)",
      "Heathrow Airport (London)",
      "Haneda Airport (Tokyo)",
      "Frankfurt Airport (Germany)",
      "Sydney Kingsford Smith (Australia)",
    ],
    param2Label: "Observation Metric",
    param2Options: [
      "Doppler Radar Reflectivity & Storm Velocity",
      "Barometric Pressure & Humidity Gradient",
      "Surface Wind Shear & Vector Turbulence",
      "GOES-16 Satellite Infrared Thermal Density",
    ],
    endpointTemplate: (p1, p2) =>
      `GET /api/v1/weather/noaa/station?station=${encodeURIComponent(p1)}&metric=${encodeURIComponent(p2 || "radar")}&attestation=ecdsa`,
    querySummary: (p1, p2) => `NOAA station feed for ${p1} (${p2 || "Doppler Radar"})`,
  },

  // 2. Global Equities & Crypto L2 Order Book Stream
  equities: {
    queryTitle: "Select Trading Pair & Order Book Depth",
    param1Label: "Market / Symbol",
    param1Options: ["BTC / USD", "ETH / USD", "NVDA / USD", "AAPL / USD", "EUR / USD", "SOL / USD"],
    param2Label: "Order Book Depth",
    param2Options: ["L2 Top 5 (Ultra-Fast)", "L2 Top 20 (Deep Book)", "L3 Full Tick Snapshot"],
    endpointTemplate: (p1, p2) =>
      `GET /api/v1/clob/orderbook?symbol=${encodeURIComponent(p1)}&depth=${p2?.includes("20") ? "20" : p2?.includes("Full") ? "all" : "5"}&attestation=ecdsa`,
    querySummary: (p1, p2) => `Global L2 order book for ${p1} (${p2 || "Top 5"})`,
  },

  // 3. Global Macro & Commodities Index Feeds
  macro: {
    queryTitle: "Select Macro Benchmark & Delivery Stream",
    param1Label: "Commodity / Macro Asset",
    param1Options: [
      "WTI Crude Oil ($/bbl)",
      "Gold Spot (XAU/USD)",
      "US 10Y Treasury Yield",
      "EUR / USD FX Spot",
      "S&P 500 Index (SPX)",
    ],
    param2Label: "Data Scope",
    param2Options: [
      "Real-Time Spot Tick & Bid/Ask",
      "1-Minute VWAP & Open Interest",
      "Implied Volatility Surface Index",
    ],
    endpointTemplate: (p1, p2) =>
      `GET /api/v1/macro/commodities/quote?symbol=${encodeURIComponent(p1)}&scope=${encodeURIComponent(p2 || "spot")}`,
    querySummary: (p1, p2) => `CME/ICE Macro feed for ${p1} (${p2})`,
  },

  // 4. FlightAware Global Aviation & ADS-B Telemetry
  aviation: {
    queryTitle: "Select Airspace Corridor & Telemetry Metric",
    param1Label: "Flight Corridor / Oceanic Track",
    param1Options: [
      "North Atlantic Tracks (NAT JFK-LHR)",
      "Transpacific Air Corridor (PAC HKG-LAX)",
      "US Northeast Megalopolis (BOS-DCA)",
      "Eurocontrol Central Core (FRA-CDG)",
    ],
    param2Label: "Telemetry Stream",
    param2Options: [
      "ADS-B Transponder Coordinates & Altitude",
      "Active Squawk Codes & Divert Alerts",
      "Runway Dwell & Airport Delay Matrix",
    ],
    endpointTemplate: (p1, p2) =>
      `GET /api/v1/aviation/adsb/corridor?corridor=${encodeURIComponent(p1)}&telemetry=${encodeURIComponent(p2 || "adsb")}`,
    querySummary: (p1, p2) => `Global aviation telemetry: ${p1} (${p2})`,
  },

  // 5. Aave V3 Multi-Chain Lending Rates & APY
  aave: {
    queryTitle: "Select Lending Asset & Interest Rate Mode",
    param1Label: "Asset Reserve",
    param1Options: ["USDC", "WETH", "WBTC", "USDT", "DAI"],
    param2Label: "Metrics Requested",
    param2Options: ["Supply & Borrow APY", "Utilization & Liquidity Caps", "Health Factor & Risk Parameters"],
    endpointTemplate: (p1, p2) =>
      `GET /api/v1/lending/aave-v3/rates?asset=${encodeURIComponent(p1)}&scope=${encodeURIComponent(p2 || "rates")}`,
    querySummary: (p1, p2) => `Aave V3 pool telemetry for ${p1} (${p2})`,
  },

  // 6. Uniswap V3 Multi-Chain Liquidity & TWAP
  uniswap: {
    queryTitle: "Select Liquidity Pool & Fee Tier",
    param1Label: "Liquidity Pool",
    param1Options: ["WETH / USDC (0.05%)", "WBTC / WETH (0.05%)", "USDC / USDT (0.01%)", "ARB / USDC (0.05%)"],
    param2Label: "Observation Mode",
    param2Options: ["Spot Tick & Geometric TWAP", "Liquidity Density Curve", "Fee Growth Global 0/1"],
    endpointTemplate: (p1, p2) =>
      `GET /api/v1/dex/uniswap-v3/twap?pool=${encodeURIComponent(p1)}&metric=${encodeURIComponent(p2 || "twap")}`,
    querySummary: (p1, p2) => `Uniswap V3 ${p1} (${p2})`,
  },

  // 7. OpenSea Seaport Floor Prices & Trades
  opensea: {
    queryTitle: "Select Digital Asset Collection & Feed Type",
    param1Label: "Collection",
    param1Options: ["CryptoPunks", "Bored Ape Yacht Club", "Pudgy Penguins", "Milady Maker"],
    param2Label: "Feed Depth",
    param2Options: ["Instant Floor Price & Top Bid", "Recent OrderFulfilled Stream", "Listing Velocity Index"],
    endpointTemplate: (p1, p2) =>
      `GET /api/v1/nft/seaport/floor?collection=${encodeURIComponent(p1)}&filter=${encodeURIComponent(p2 || "floor")}`,
    querySummary: (p1, p2) => `Seaport ${p1} (${p2})`,
  },

  // 8. Overtime Live Sports Odds & Moneyline Spreads
  sports: {
    queryTitle: "Select Sporting Event & Market Type",
    param1Label: "Upcoming Fixture",
    param1Options: [
      "EPL: Arsenal vs Manchester City",
      "NFL: Kansas City Chiefs vs SF 49ers",
      "NBA: Boston Celtics vs LA Lakers",
      "UCL: Real Madrid vs Bayern Munich",
    ],
    param2Label: "Odds Market",
    param2Options: ["Moneyline & Winner Odds", "Spread & Handicap (-2.5)", "Over / Under Points (47.5)"],
    endpointTemplate: (p1, p2) =>
      `GET /api/v1/sports/overtime/odds?fixture=${encodeURIComponent(p1)}&market=${encodeURIComponent(p2 || "all")}`,
    querySummary: (p1, p2) => `Overtime live odds: ${p1} (${p2})`,
  },

  // 9. Polymarket Global Macro & Prediction Curves
  polymarket: {
    queryTitle: "Select Prediction Market & Probability Curve",
    param1Label: "Market Proposition",
    param1Options: [
      "Fed Interest Rate Cut (Next FOMC Meeting)",
      "US CPI Inflation YoY < 2.5% in 2026",
      "Global Crude Oil Price > $90 in Q3",
      "SpaceX Starship Orbital Landing Success",
    ],
    param2Label: "Data Scope",
    param2Options: ["Probability Curve & Best Bids/Asks", "24h Volume & Open Interest", "Outcome Settlement Shares"],
    endpointTemplate: (p1, p2) =>
      `GET /api/v1/prediction/polymarket/book?market=${encodeURIComponent(p1)}&scope=${encodeURIComponent(p2 || "curve")}`,
    querySummary: (p1, p2) => `Polymarket: ${p1} (${p2})`,
  },
};

export function getQueryConfigForDataset(datasetName: string): DatasetQueryConfig {
  const lower = datasetName.toLowerCase();
  if (lower.includes("weather") || lower.includes("noaa") || lower.includes("radar")) return DATASET_QUERY_CONFIGS.weather;
  if (lower.includes("equit") || lower.includes("order book") || lower.includes("clob") || lower.includes("nasdaq")) return DATASET_QUERY_CONFIGS.equities;
  if (lower.includes("macro") || lower.includes("commodit") || lower.includes("crude") || lower.includes("gold")) return DATASET_QUERY_CONFIGS.macro;
  if (lower.includes("aviation") || lower.includes("flight") || lower.includes("ads-b")) return DATASET_QUERY_CONFIGS.aviation;
  if (lower.includes("aave") || lower.includes("lending")) return DATASET_QUERY_CONFIGS.aave;
  if (lower.includes("uniswap") || lower.includes("twap")) return DATASET_QUERY_CONFIGS.uniswap;
  if (lower.includes("opensea") || lower.includes("seaport") || lower.includes("nft")) return DATASET_QUERY_CONFIGS.opensea;
  if (lower.includes("sport") || lower.includes("overtime")) return DATASET_QUERY_CONFIGS.sports;
  if (lower.includes("polymarket") || lower.includes("prediction")) return DATASET_QUERY_CONFIGS.polymarket;
  return DATASET_QUERY_CONFIGS.weather;
}
