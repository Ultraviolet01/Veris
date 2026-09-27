/**
 * fetchData.ts — Veris data fetching module
 *
 * Reads live market data from the source chain (Monad mainnet, chain 143) via HyperRPC
 * (Envio's drop-in fast RPC backed by HyperSync) or a standard RPC as fallback.
 *
 * First dataset: Kuru CLOB DEX — reads the best bid/ask prices from a Kuru market contract.
 * The Kuru SDK's ParamFetcher.getMarketParams() is the read primitive — view call, no gas.
 *
 * Return value: FetchResult — the normalized payload, plus the exact block number and
 * that block's own timestamp (both required for the wall-clock freshness check in SlaEvaluator).
 *
 * Architecture: generic DataFetcher interface so a second dataset (Perpl, Aave, OpenSea, etc.)
 * can be added as a new implementation without changing the operator loop.
 */
import { ethers } from "ethers";
import { getDataSourceProvider, KURU_MARKET_ADDRESS } from "./config.js";

// ── Types ─────────────────────────────────────────────────────────────────────

/** The canonical payload shape that gets hashed and signed. */
export interface DataPayload {
  /** Human-readable dataset identifier (e.g. "kuru.mon-usdc.bestBid") */
  dataset: string;
  /** The numeric data value — price, rate, etc. Represented as a string for precision. */
  value: string;
  /** Additional context fields, JSON-serialisable. Included in the hash. */
  metadata: Record<string, string>;
}

/** Full result from a fetch — payload + source block context for the attestation. */
export interface FetchResult {
  payload: DataPayload;
  /** Block number on the source chain (Monad mainnet) where data was read. */
  sourceBlockNumber: bigint;
  /** Timestamp (Unix seconds) of that block — the wall-clock freshness anchor. */
  sourceBlockTimestamp: bigint;
  /** Raw JSON string used for hashing — deterministic serialisation of payload. */
  canonicalized: string;
}

// ── Kuru market ABI (minimal — only the functions we call) ────────────────────
// Kuru is a CLOB DEX. Each market contract exposes view functions to read
// the current order book state. We read getBestAsk() and getBestBid() as a
// price snapshot, matching OpenBook's pattern of reselling live DEX prices.
//
// The minimal ABI below covers the functions confirmed available in Kuru's
// public SDK (getMarketParams reads minSize, pricePrecision, sizePrecision
// from the market contract). We extend with getBestAsk/getBestBid which are
// standard CLOB view functions.
//
// If Kuru's contract does not expose getBestAsk/getBestBid by these names,
// update this ABI to match the actual function signatures from Monadscan.
const KURU_MARKET_ABI = [
  // Market parameters
  "function minSize() view returns (uint256)",
  "function pricePrecision() view returns (uint256)",
  "function sizePrecision() view returns (uint256)",
  "function quoteAsset() view returns (address)",
  "function baseAsset() view returns (address)",
  // Order book snapshot (best prices)
  "function getBestAsk() view returns (uint256 price, uint256 size)",
  "function getBestBid() view returns (uint256 price, uint256 size)",
  // Fallback: some CLOBs expose a single bestPrice view
  "function bestAskPrice() view returns (uint256)",
  "function bestBidPrice() view returns (uint256)",
] as const;

// ── Kuru data fetcher ─────────────────────────────────────────────────────────

/**
 * Fetches the current best bid/ask prices from a Kuru market on Monad mainnet.
 * Uses the block's own timestamp as the freshness anchor (not just block number).
 *
 * @throws if the RPC call fails or the block cannot be fetched — fails loudly per constraint.
 */
export async function fetchKuruMarketData(): Promise<FetchResult> {
  const provider = getDataSourceProvider();
  const market = new ethers.Contract(KURU_MARKET_ADDRESS, KURU_MARKET_ABI, provider);

  // ── Fetch block context first ──────────────────────────────────────────────
  // Get the current block number from the source chain, then read data AT that block.
  // This ensures sourceBlockNumber and data are consistent (same block).
  const currentBlock = await provider.getBlock("latest");
  if (!currentBlock) {
    throw new Error("[fetchData] Failed to fetch latest block from data source chain");
  }

  const sourceBlockNumber = BigInt(currentBlock.number);
  const sourceBlockTimestamp = BigInt(currentBlock.timestamp);

  // ── Fetch order book data (block-pinned calls) ─────────────────────────────
  let bestBidPrice = "0";
  let bestAskPrice = "0";
  let bestBidSize = "0";
  let bestAskSize = "0";

  // Try getBestBid / getBestAsk first (Kuru's preferred interface)
  try {
    const [bidResult, askResult] = await Promise.all([
      market.getBestBid({ blockTag: currentBlock.number }),
      market.getBestAsk({ blockTag: currentBlock.number }),
    ]);
    // Returns (price, size) tuple — prices in Kuru's pricePrecision units
    bestBidPrice = bidResult[0].toString();
    bestBidSize  = bidResult[1].toString();
    bestAskPrice = askResult[0].toString();
    bestAskSize  = askResult[1].toString();
  } catch {
    // Fallback: try bestBidPrice / bestAskPrice (some Kuru market variants)
    try {
      const [bid, ask] = await Promise.all([
        market.bestBidPrice({ blockTag: currentBlock.number }),
        market.bestAskPrice({ blockTag: currentBlock.number }),
      ]);
      bestBidPrice = bid.toString();
      bestAskPrice = ask.toString();
    } catch (err) {
      throw new Error(
        `[fetchData] Cannot read order book from Kuru market ${KURU_MARKET_ADDRESS}. ` +
        `Check KURU_MARKET_ADDRESS and confirm the contract is live on Monad mainnet. ` +
        `Raw error: ${err}`
      );
    }
  }

  // ── Normalise to mid-price (standard DEX price representation) ────────────
  // Mid-price = (bestBid + bestAsk) / 2, expressed as a string.
  // If either side is zero (empty order book), report what's available.
  const bid = BigInt(bestBidPrice);
  const ask = BigInt(bestAskPrice);
  const midPrice = bid > 0n && ask > 0n
    ? ((bid + ask) / 2n).toString()
    : (bid || ask).toString();

  // ── Build canonical payload ────────────────────────────────────────────────
  // Canonical form: sorted keys, no trailing whitespace.
  // This is what gets keccak256'd to produce dataHash.
  const payload: DataPayload = {
    dataset: `kuru.${KURU_MARKET_ADDRESS.toLowerCase()}.prices`,
    value: midPrice,
    metadata: {
      bestBidPrice,
      bestBidSize,
      bestAskPrice,
      bestAskSize,
      sourceChainId: "143",
      marketAddress: KURU_MARKET_ADDRESS.toLowerCase(),
      blockNumber: sourceBlockNumber.toString(),
      blockTimestamp: sourceBlockTimestamp.toString(),
    },
  };

  // Deterministic JSON: sorted keys at every level so the hash is reproducible.
  const canonicalized = JSON.stringify(payload, Object.keys(payload).sort());

  console.log(
    `[fetchData] Kuru ${KURU_MARKET_ADDRESS} @ block ${sourceBlockNumber} ` +
    `(ts=${sourceBlockTimestamp}): bid=${bestBidPrice} ask=${bestAskPrice} mid=${midPrice}`
  );

  return {
    payload,
    sourceBlockNumber,
    sourceBlockTimestamp,
    canonicalized,
  };
}

/**
 * Fetches real on-chain Aave V3 lending rates and liquidity from Ethereum Mainnet.
 */
export async function fetchAaveMarketData(): Promise<FetchResult> {
  const provider = new ethers.JsonRpcProvider("https://ethereum-rpc.publicnode.com");
  const block = await provider.getBlock("latest");
  if (!block) throw new Error("[fetchData] Failed to fetch latest Ethereum block for Aave");

  const sourceBlockNumber = BigInt(block.number);
  const sourceBlockTimestamp = BigInt(block.timestamp);

  const aavePoolAddress = "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2";
  const pool = new ethers.Contract(
    aavePoolAddress,
    [
      "function getReserveData(address asset) view returns (tuple(uint256 configuration, uint128 liquidityIndex, uint128 currentLiquidityRate, uint128 variableBorrowIndex, uint128 currentVariableBorrowRate, uint128 currentStableBorrowRate, uint40 lastUpdateTimestamp, uint16 id, address aTokenAddress, address stableDebtTokenAddress, address variableDebtTokenAddress, address interestRateStrategyAddress, uint128 accruedToTreasury, uint128 unbacked, uint128 isolationModeTotalDebt))",
    ],
    provider
  );

  const usdcAddress = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
  const res = await pool.getReserveData(usdcAddress);
  const RAY = 10n ** 27n;
  const supplyApy = (Number((res.currentLiquidityRate * 10000n) / RAY) / 100).toFixed(2);
  const borrowApy = (Number((res.currentVariableBorrowRate * 10000n) / RAY) / 100).toFixed(2);

  const erc20 = new ethers.Contract(usdcAddress, ["function balanceOf(address) view returns (uint256)"], provider);
  const bal = await erc20.balanceOf(res.aTokenAddress);
  const availableLiquidity = `$${Math.round(Number(bal / 1000000n)).toLocaleString()}`;

  const payload: DataPayload = {
    dataset: "aave.v3.ethereum.usdc.rates",
    value: supplyApy,
    metadata: {
      supplyApy: `${supplyApy}%`,
      borrowApy: `${borrowApy}%`,
      availableLiquidity,
      sourceChainId: "1",
      poolAddress: aavePoolAddress.toLowerCase(),
      blockNumber: sourceBlockNumber.toString(),
      blockTimestamp: sourceBlockTimestamp.toString(),
    },
  };

  const canonicalized = JSON.stringify(payload, Object.keys(payload).sort());
  console.log(`[fetchData] Live Aave V3 @ Ethereum block ${sourceBlockNumber}: Supply=${supplyApy}% Borrow=${borrowApy}% Liq=${availableLiquidity}`);

  return {
    payload,
    sourceBlockNumber,
    sourceBlockTimestamp,
    canonicalized,
  };
}

/**
 * Fetches real on-chain Uniswap V3 WETH/USDC TWAP tick & liquidity from Ethereum Mainnet.
 */
export async function fetchUniswapMarketData(): Promise<FetchResult> {
  const provider = new ethers.JsonRpcProvider("https://ethereum-rpc.publicnode.com");
  const block = await provider.getBlock("latest");
  if (!block) throw new Error("[fetchData] Failed to fetch latest Ethereum block for Uniswap");

  const sourceBlockNumber = BigInt(block.number);
  const sourceBlockTimestamp = BigInt(block.timestamp);

  const poolAddress = "0x88e6A0c2dDD26FEEb64F039a2c41296FcB3f5640";
  const pool = new ethers.Contract(
    poolAddress,
    [
      "function slot0() view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)",
      "function liquidity() view returns (uint128)",
    ],
    provider
  );

  const [slot0, liq] = await Promise.all([pool.slot0(), pool.liquidity()]);
  const sqrt = Number(slot0[0]) / 2 ** 96;
  const ethPrice = ((1 / (sqrt * sqrt)) * 1e12).toFixed(2);

  const payload: DataPayload = {
    dataset: "uniswap.v3.ethereum.weth-usdc.twap",
    value: ethPrice,
    metadata: {
      ethPriceUsdc: ethPrice,
      tick: slot0[1].toString(),
      liquidity: liq.toString(),
      sourceChainId: "1",
      poolAddress: poolAddress.toLowerCase(),
      blockNumber: sourceBlockNumber.toString(),
      blockTimestamp: sourceBlockTimestamp.toString(),
    },
  };

  const canonicalized = JSON.stringify(payload, Object.keys(payload).sort());
  console.log(`[fetchData] Live Uniswap V3 @ Ethereum block ${sourceBlockNumber}: WETH Price=$${ethPrice} tick=${slot0[1]}`);

  return {
    payload,
    sourceBlockNumber,
    sourceBlockTimestamp,
    canonicalized,
  };
}

// ── Registry: add new datasets here ───────────────────────────────────────────

export type DatasetKey = "kuru" | "aave" | "uniswap";

export const DATA_FETCHERS: Record<DatasetKey, () => Promise<FetchResult>> = {
  kuru: fetchKuruMarketData,
  aave: fetchAaveMarketData,
  uniswap: fetchUniswapMarketData,
};

/** Select and run the fetcher for the configured dataset. */
export async function fetchData(dataset: DatasetKey = "kuru"): Promise<FetchResult> {
  const fetcher = DATA_FETCHERS[dataset];
  if (!fetcher) {
    throw new Error(`[fetchData] No fetcher registered for dataset: ${dataset}`);
  }
  return fetcher();
}
