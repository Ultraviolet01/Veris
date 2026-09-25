/**
 * dataPayloads.ts — Authenticated Data Feed Payload Generators
 *
 * Simulates high-fidelity live telemetry feeds attested by Veris operators
 * on Monad with cryptographic freshness timestamps.
 */

export interface DeliveredPayload {
  [key: string]: unknown;
  source: string;
  queryParam1?: string;
  queryParam2?: string;
  endpointUrl?: string;
  observedDataAgeSeconds: number;
  slaWindowSeconds: number;
  slaVerdict: "VERIFIED_FRESH" | "SLA_BREACH";
  attestedAt: string;
  monadBlockHeight: number;
}

export function generateDeliveredPayload(
  datasetName: string,
  ageSeconds: number,
  slaSeconds: number = 10,
  param1?: string,
  param2?: string
): DeliveredPayload {
  const now = new Date();
  const safeAge = Math.max(0.4, Number(ageSeconds.toFixed(1)));
  const baseBlock = 65595700 + Math.floor(Math.random() * 200);
  const lower = datasetName.toLowerCase();

  if (lower.includes("sport") || lower.includes("overtime")) {
    const fixture = param1 || "Kansas City Chiefs vs San Francisco 49ers";
    const marketType = param2 || "Moneyline & Winner";
    return {
      source: "Overtime Markets (Optimism / Arbitrum)",
      fixture,
      marketType,
      league: "NFL Super Bowl Rematch",
      status: "LIVE - 3rd Quarter (08:14)",
      scores: {
        chiefs: 24,
        "49ers": 21,
      },
      moneylineOdds: {
        chiefsWin: 1.74,
        "49ersWin": 2.15,
      },
      spread: {
        line: -2.5,
        chiefsCoverOdds: 1.91,
        "49ersCoverOdds": 1.91,
      },
      overUnder: {
        total: 47.5,
        overOdds: 1.88,
        underOdds: 1.94,
      },
      marketVolume24hUsdc: "$642,800",
      queryParam1: fixture,
      queryParam2: marketType,
      endpointUrl: `/api/v1/sports/overtime/odds?fixture=${encodeURIComponent(fixture)}`,
      observedDataAgeSeconds: safeAge,
      slaWindowSeconds: slaSeconds,
      slaVerdict: safeAge <= slaSeconds ? "VERIFIED_FRESH" : "SLA_BREACH",
      attestedAt: now.toISOString(),
      monadBlockHeight: baseBlock,
    };
  }

  if (lower.includes("kuru") || lower.includes("clob")) {
    const pair = param1 || "MON / USDC";
    const depth = param2 || "L2 Top 5";
    const basePrice = pair.includes("BTC") ? 91420.5 : pair.includes("ETH") ? 3350.2 : pair.includes("USDT") ? 1.0002 : 12.451;
    const spread = (basePrice * 0.0025);
    return {
      source: "Kuru CLOB DEX (Monad Mainnet 143)",
      pair,
      depthLevel: depth,
      bestBid: basePrice,
      bestAsk: Number((basePrice + spread).toFixed(4)),
      spreadUsdc: Number(spread.toFixed(4)),
      spreadBps: 2.48,
      bidsDepth: [
        { price: basePrice, amount: 4520.5, totalUsdc: Number((basePrice * 4520.5).toFixed(2)) },
        { price: Number((basePrice * 0.999).toFixed(4)), amount: 8900.0, totalUsdc: Number((basePrice * 0.999 * 8900).toFixed(2)) },
        { price: Number((basePrice * 0.998).toFixed(4)), amount: 15400.0, totalUsdc: Number((basePrice * 0.998 * 15400).toFixed(2)) },
      ],
      asksDepth: [
        { price: Number((basePrice + spread).toFixed(4)), amount: 3200.0, totalUsdc: Number(((basePrice + spread) * 3200).toFixed(2)) },
        { price: Number(((basePrice + spread) * 1.001).toFixed(4)), amount: 11450.2, totalUsdc: Number(((basePrice + spread) * 1.001 * 11450.2).toFixed(2)) },
      ],
      depthWithin2PercentUsdc: 342600.0,
      queryParam1: pair,
      queryParam2: depth,
      endpointUrl: `/api/v1/clob/kuru/orderbook?pair=${encodeURIComponent(pair)}&depth=${encodeURIComponent(depth)}`,
      observedDataAgeSeconds: safeAge,
      slaWindowSeconds: slaSeconds,
      slaVerdict: safeAge <= slaSeconds ? "VERIFIED_FRESH" : "SLA_BREACH",
      attestedAt: now.toISOString(),
      monadBlockHeight: baseBlock,
    };
  }

  if (lower.includes("aave") || lower.includes("lending")) {
    const asset = param1 || "USDC";
    const scope = param2 || "Supply & Borrow APY";
    return {
      source: "Aave V3 Lending Pool (Ethereum / Arbitrum)",
      asset,
      scope,
      liquidityRateApy: asset === "USDC" ? "4.82%" : asset === "WETH" ? "2.15%" : "3.40%",
      variableBorrowRateApy: asset === "USDC" ? "6.15%" : "3.80%",
      stableBorrowRateApy: "7.90%",
      utilizationRate: "78.4%",
      availableLiquidityUsdc: "$42,850,210",
      totalBorrowsUsdc: "$155,200,940",
      reserveFactor: "10.0%",
      healthFactorThreshold: 1.05,
      queryParam1: asset,
      queryParam2: scope,
      endpointUrl: `/api/v1/lending/aave-v3/rates?asset=${encodeURIComponent(asset)}`,
      observedDataAgeSeconds: safeAge,
      slaWindowSeconds: slaSeconds,
      slaVerdict: safeAge <= slaSeconds ? "VERIFIED_FRESH" : "SLA_BREACH",
      attestedAt: now.toISOString(),
      monadBlockHeight: baseBlock,
    };
  }

  if (lower.includes("polymarket") || lower.includes("prediction")) {
    const market = param1 || "Federal Reserve Interest Rate Decision (Next FOMC)";
    const scope = param2 || "Probability Curve & Best Bids/Asks";
    return {
      source: "Polymarket CTF Exchange",
      market,
      scope,
      conditionId: "0x4b9a91428a1c940b1275d27b99c41",
      outcomes: [
        { name: "25 bps Rate Cut", probability: "68.4%", priceUsdc: 0.684, bid: 0.68, ask: 0.69 },
        { name: "No Change", probability: "27.1%", priceUsdc: 0.271, bid: 0.26, ask: 0.28 },
        { name: "50 bps Rate Cut", probability: "4.5%", priceUsdc: 0.045, bid: 0.04, ask: 0.05 },
      ],
      volume24hUsdc: "$1,450,200",
      openInterestUsdc: "$3,890,400",
      queryParam1: market,
      queryParam2: scope,
      endpointUrl: `/api/v1/prediction/polymarket/book?market=${encodeURIComponent(market)}`,
      observedDataAgeSeconds: safeAge,
      slaWindowSeconds: slaSeconds,
      slaVerdict: safeAge <= slaSeconds ? "VERIFIED_FRESH" : "SLA_BREACH",
      attestedAt: now.toISOString(),
      monadBlockHeight: baseBlock,
    };
  }

  if (lower.includes("uniswap") || lower.includes("twap")) {
    const pool = param1 || "WETH / USDC (0.05%)";
    const metric = param2 || "Spot Tick & Geometric TWAP";
    return {
      source: "Uniswap V3 High-Frequency Pool",
      pool,
      metric,
      poolAddress: "0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640",
      sqrtPriceX96: "194829148204918239019",
      currentTick: -201942,
      twapPriceUsdc: pool.includes("MON") ? 12.45 : pool.includes("BTC") ? 91420.0 : 3412.85,
      tickSpacing: 10,
      feeGrowthGlobal0X128: "9420849201942",
      feeGrowthGlobal1X128: "1482094209142",
      queryParam1: pool,
      queryParam2: metric,
      endpointUrl: `/api/v1/dex/uniswap-v3/twap?pool=${encodeURIComponent(pool)}`,
      observedDataAgeSeconds: safeAge,
      slaWindowSeconds: slaSeconds,
      slaVerdict: safeAge <= slaSeconds ? "VERIFIED_FRESH" : "SLA_BREACH",
      attestedAt: now.toISOString(),
      monadBlockHeight: baseBlock,
    };
  }

  if (lower.includes("perpl") || lower.includes("derivative")) {
    const market = param1 || "MON-PERP";
    const dataSlice = param2 || "Mark Price & 1h Funding Rate";
    return {
      source: "Perpl Perpetual Exchange (Monad Native)",
      market,
      dataSlice,
      markPrice: market.includes("BTC") ? 91450.0 : market.includes("ETH") ? 3352.0 : 12.465,
      indexPrice: market.includes("BTC") ? 91430.0 : market.includes("ETH") ? 3350.0 : 12.461,
      deviationBps: 3.2,
      fundingRate1h: "+0.0014%",
      annualizedFundingApy: "+12.26%",
      openInterestUsdc: "$8,420,000",
      longShortRatio: "52.4% / 47.6%",
      queryParam1: market,
      queryParam2: dataSlice,
      endpointUrl: `/api/v1/derivatives/perpl/feed?market=${encodeURIComponent(market)}`,
      observedDataAgeSeconds: safeAge,
      slaWindowSeconds: slaSeconds,
      slaVerdict: safeAge <= slaSeconds ? "VERIFIED_FRESH" : "SLA_BREACH",
      attestedAt: now.toISOString(),
      monadBlockHeight: baseBlock,
    };
  }

  if (lower.includes("azuro")) {
    const category = param1 || "UEFA Champions League";
    const statusType = param2 || "Live In-Play Odds";
    return {
      source: "Azuro Protocol (Base / Polygon)",
      category,
      statusType,
      game: "UEFA Champions League: Real Madrid vs Bayern Munich",
      marketType: "Full Time Result (1X2)",
      odds: { team1Win: 2.1, draw: 3.45, team2Win: 3.2 },
      poolTotalLiquidityUsdc: "$890,400",
      conditionResolutionStatus: "PENDING_KICKOFF",
      queryParam1: category,
      queryParam2: statusType,
      endpointUrl: `/api/v1/prediction/azuro/pool?category=${encodeURIComponent(category)}`,
      observedDataAgeSeconds: safeAge,
      slaWindowSeconds: slaSeconds,
      slaVerdict: safeAge <= slaSeconds ? "VERIFIED_FRESH" : "SLA_BREACH",
      attestedAt: now.toISOString(),
      monadBlockHeight: baseBlock,
    };
  }

  if (lower.includes("opensea") || lower.includes("seaport") || lower.includes("nft")) {
    const collection = param1 || "Monad Early Adopters Pass";
    const feedDepth = param2 || "Instant Floor Price & Top Bid";
    return {
      source: "OpenSea Seaport 1.6 Protocol",
      collection,
      feedDepth,
      floorPriceMon: 42.5,
      floorPriceUsdc: 529.55,
      lastSalePriceMon: 44.0,
      totalVolumeMon: 12840.5,
      listedCount: 142,
      queryParam1: collection,
      queryParam2: feedDepth,
      endpointUrl: `/api/v1/nft/seaport/floor?collection=${encodeURIComponent(collection)}`,
      observedDataAgeSeconds: safeAge,
      slaWindowSeconds: slaSeconds,
      slaVerdict: safeAge <= slaSeconds ? "VERIFIED_FRESH" : "SLA_BREACH",
      attestedAt: now.toISOString(),
      monadBlockHeight: baseBlock,
    };
  }

  // Fallback for Gas / Risk or any other query
  const metric = param1 || "Base Fee Delta & Optimal Tip Estimator";
  const freq = param2 || "Block-by-Block (sub-second)";
  return {
    source: datasetName || "Monad Validator Telemetry",
    metric,
    samplingFrequency: freq,
    baseFeeGwei: 52.4,
    recommendedPriorityFeeGwei: 2.5,
    mempoolPendingTxCount: 8420,
    sequencerQueueLatencyMs: 14,
    frontrunningRiskIndex: "LOW (0.12 / 1.0)",
    reorgRiskIndex: "0.00%",
    queryParam1: metric,
    queryParam2: freq,
    endpointUrl: `/api/v1/telemetry/monad/mempool?metric=${encodeURIComponent(metric)}`,
    observedDataAgeSeconds: safeAge,
    slaWindowSeconds: slaSeconds,
    slaVerdict: safeAge <= slaSeconds ? "VERIFIED_FRESH" : "SLA_BREACH",
    attestedAt: now.toISOString(),
    monadBlockHeight: baseBlock,
  };
}
