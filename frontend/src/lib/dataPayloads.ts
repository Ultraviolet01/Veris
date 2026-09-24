/**
 * dataPayloads.ts — Authenticated Data Feed Payload Generators
 *
 * Simulates high-fidelity live telemetry feeds attested by Veris operators
 * on Monad with cryptographic freshness timestamps.
 */

export interface DeliveredPayload {
  [key: string]: unknown;
  source: string;
  observedDataAgeSeconds: number;
  slaWindowSeconds: number;
  slaVerdict: "VERIFIED_FRESH" | "SLA_BREACH";
  attestedAt: string;
  monadBlockHeight: number;
}

export function generateDeliveredPayload(
  datasetName: string,
  ageSeconds: number,
  slaSeconds: number = 10
): DeliveredPayload {
  const now = new Date();
  const safeAge = Math.max(0.4, Number(ageSeconds.toFixed(1)));
  const baseBlock = 39420000 + Math.floor(Math.random() * 5000);
  const lower = datasetName.toLowerCase();

  if (lower.includes("sport") || lower.includes("overtime")) {
    return {
      source: "Overtime Markets (Optimism / Arbitrum)",
      fixture: "Kansas City Chiefs vs San Francisco 49ers",
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
      oracleFeed: "Chainlink Sports / Overtime AMM",
      observedDataAgeSeconds: safeAge,
      slaWindowSeconds: slaSeconds,
      slaVerdict: safeAge <= slaSeconds ? "VERIFIED_FRESH" : "SLA_BREACH",
      attestedAt: now.toISOString(),
      monadBlockHeight: baseBlock,
    };
  }

  if (lower.includes("kuru") || lower.includes("clob")) {
    return {
      source: "Kuru CLOB DEX (Monad Mainnet 143)",
      pair: "MON / USDC",
      bestBid: 12.451,
      bestAsk: 12.482,
      spreadUsdc: 0.031,
      spreadBps: 2.48,
      bidsDepth: [
        { price: 12.451, amountMon: 4520.5, totalUsdc: 56284.74 },
        { price: 12.448, amountMon: 8900.0, totalUsdc: 110787.2 },
        { price: 12.442, amountMon: 15400.0, totalUsdc: 191606.8 },
      ],
      asksDepth: [
        { price: 12.482, amountMon: 3200.0, totalUsdc: 39942.4 },
        { price: 12.485, amountMon: 11450.2, totalUsdc: 142955.74 },
        { price: 12.49, amountMon: 18200.0, totalUsdc: 227318.0 },
      ],
      depthWithin2PercentUsdc: 342600.0,
      observedDataAgeSeconds: safeAge,
      slaWindowSeconds: slaSeconds,
      slaVerdict: safeAge <= slaSeconds ? "VERIFIED_FRESH" : "SLA_BREACH",
      attestedAt: now.toISOString(),
      monadBlockHeight: baseBlock,
    };
  }

  if (lower.includes("aave") || lower.includes("lending")) {
    return {
      source: "Aave V3 Lending Pool (Ethereum / Arbitrum)",
      asset: "USDC",
      liquidityRateApy: "4.82%",
      variableBorrowRateApy: "6.15%",
      stableBorrowRateApy: "7.90%",
      utilizationRate: "78.4%",
      availableLiquidityUsdc: "$42,850,210",
      totalBorrowsUsdc: "$155,200,940",
      reserveFactor: "10.0%",
      healthFactorThreshold: 1.05,
      observedDataAgeSeconds: safeAge,
      slaWindowSeconds: slaSeconds,
      slaVerdict: safeAge <= slaSeconds ? "VERIFIED_FRESH" : "SLA_BREACH",
      attestedAt: now.toISOString(),
      monadBlockHeight: baseBlock,
    };
  }

  if (lower.includes("polymarket") || lower.includes("prediction")) {
    return {
      source: "Polymarket CTF Exchange",
      market: "Federal Reserve Interest Rate Decision (Next FOMC)",
      conditionId: "0x4b9a91428a1c940b1275d27b99c41",
      outcomes: [
        { name: "25 bps Rate Cut", probability: "68.4%", priceUsdc: 0.684, bid: 0.68, ask: 0.69 },
        { name: "No Change", probability: "27.1%", priceUsdc: 0.271, bid: 0.26, ask: 0.28 },
        { name: "50 bps Rate Cut", probability: "4.5%", priceUsdc: 0.045, bid: 0.04, ask: 0.05 },
      ],
      volume24hUsdc: "$1,450,200",
      openInterestUsdc: "$3,890,400",
      observedDataAgeSeconds: safeAge,
      slaWindowSeconds: slaSeconds,
      slaVerdict: safeAge <= slaSeconds ? "VERIFIED_FRESH" : "SLA_BREACH",
      attestedAt: now.toISOString(),
      monadBlockHeight: baseBlock,
    };
  }

  if (lower.includes("uniswap") || lower.includes("twap")) {
    return {
      source: "Uniswap V3 High-Frequency Pool",
      pool: "WETH / USDC (0.05%)",
      poolAddress: "0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640",
      sqrtPriceX96: "194829148204918239019",
      currentTick: -201942,
      twapPriceUsdc: 3412.85,
      tickSpacing: 10,
      feeGrowthGlobal0X128: "9420849201942",
      feeGrowthGlobal1X128: "1482094209142",
      observedDataAgeSeconds: safeAge,
      slaWindowSeconds: slaSeconds,
      slaVerdict: safeAge <= slaSeconds ? "VERIFIED_FRESH" : "SLA_BREACH",
      attestedAt: now.toISOString(),
      monadBlockHeight: baseBlock,
    };
  }

  if (lower.includes("perpl") || lower.includes("derivative")) {
    return {
      source: "Perpl Perpetual Exchange (Monad Native)",
      market: "MON-PERP",
      markPrice: 12.465,
      indexPrice: 12.461,
      deviationBps: 3.2,
      fundingRate1h: "+0.0014%",
      annualizedFundingApy: "+12.26%",
      openInterestUsdc: "$8,420,000",
      longShortRatio: "52.4% / 47.6%",
      observedDataAgeSeconds: safeAge,
      slaWindowSeconds: slaSeconds,
      slaVerdict: safeAge <= slaSeconds ? "VERIFIED_FRESH" : "SLA_BREACH",
      attestedAt: now.toISOString(),
      monadBlockHeight: baseBlock,
    };
  }

  if (lower.includes("azuro")) {
    return {
      source: "Azuro Protocol (Base / Polygon)",
      game: "UEFA Champions League: Real Madrid vs Bayern Munich",
      marketType: "Full Time Result (1X2)",
      odds: { team1Win: 2.1, draw: 3.45, team2Win: 3.2 },
      poolTotalLiquidityUsdc: "$890,400",
      conditionResolutionStatus: "PENDING_KICKOFF",
      observedDataAgeSeconds: safeAge,
      slaWindowSeconds: slaSeconds,
      slaVerdict: safeAge <= slaSeconds ? "VERIFIED_FRESH" : "SLA_BREACH",
      attestedAt: now.toISOString(),
      monadBlockHeight: baseBlock,
    };
  }

  if (lower.includes("opensea") || lower.includes("seaport") || lower.includes("nft")) {
    return {
      source: "OpenSea Seaport 1.6 Protocol",
      collection: "Monad Early Adopters Pass",
      floorPriceMon: 42.5,
      floorPriceUsdc: 529.55,
      lastSalePriceMon: 44.0,
      totalVolumeMon: 12840.5,
      listedCount: 142,
      observedDataAgeSeconds: safeAge,
      slaWindowSeconds: slaSeconds,
      slaVerdict: safeAge <= slaSeconds ? "VERIFIED_FRESH" : "SLA_BREACH",
      attestedAt: now.toISOString(),
      monadBlockHeight: baseBlock,
    };
  }

  // Fallback for Gas / Risk or any other query
  return {
    source: datasetName || "Monad Validator Telemetry",
    baseFeeGwei: 52.4,
    recommendedPriorityFeeGwei: 2.5,
    mempoolPendingTxCount: 8420,
    sequencerQueueLatencyMs: 14,
    frontrunningRiskIndex: "LOW (0.12 / 1.0)",
    reorgRiskIndex: "0.00%",
    observedDataAgeSeconds: safeAge,
    slaWindowSeconds: slaSeconds,
    slaVerdict: safeAge <= slaSeconds ? "VERIFIED_FRESH" : "SLA_BREACH",
    attestedAt: now.toISOString(),
    monadBlockHeight: baseBlock,
  };
}
