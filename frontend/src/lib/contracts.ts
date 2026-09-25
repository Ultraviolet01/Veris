/**
 * contracts.ts — ABI fragments, constants, and addresses for Veris contracts
 *
 * Enforces:
 *   - Monad Testnet (Chain ID 10143)
 *   - Client-side hard spending cap (HARD_SPENDING_CAP_USDC)
 *   - Minimal ABI fragments for lean bundle size
 */

import type { NetworkData } from "@dynamic-labs-sdk/client";

// ── Client-side hard spending cap ──────────────────────────────────────────
// Hard per-call spending cap enforced client-side before any signature is requested.
export const HARD_SPENDING_CAP_USDC = 50.0; // Max 50 USDC per job
export const HARD_SPENDING_CAP_WEI = BigInt(50 * 10 ** 6); // 6 decimals for USDC

// ── Monad Testnet Configuration ───────────────────────────────────────────
export const MONAD_TESTNET_CHAIN_ID = 10143;
export const MONAD_TESTNET_RPC = "https://testnet-rpc.monad.xyz";
export const MONAD_TESTNET_EXPLORER = "https://testnet.monadscan.com";

// Dynamic React SDK EVM Network configuration
export const MONAD_TESTNET_EVM = {
  blockExplorerUrls: [MONAD_TESTNET_EXPLORER],
  chainId: MONAD_TESTNET_CHAIN_ID,
  chainName: "Monad Testnet",
  iconUrls: ["https://raw.githubusercontent.com/monad-xyz/monad-brand/main/monad-icon.png"],
  name: "Monad Testnet",
  nativeCurrency: { decimals: 18, name: "MON", symbol: "MON" },
  networkId: MONAD_TESTNET_CHAIN_ID,
  rpcUrls: [MONAD_TESTNET_RPC],
  vanityName: "Monad Testnet",
} as const;

// Dynamic Client SDK NetworkData configuration for addNetwork
export const MONAD_TESTNET_NETWORK_DATA: NetworkData = {
  blockExplorerUrls: [MONAD_TESTNET_EXPLORER],
  chain: "EVM",
  displayName: "Monad Testnet",
  iconUrl: "https://raw.githubusercontent.com/monad-xyz/monad-brand/main/monad-icon.png",
  name: "monad-testnet",
  nativeCurrency: {
    decimals: 18,
    name: "MON",
    symbol: "MON",
  },
  networkId: "10143",
  rpcUrls: {
    http: [MONAD_TESTNET_RPC],
  },
  testnet: true,
};

// ── Contract addresses (from .env, fallback to live Monad Testnet addresses) ──
export const ADDRESSES = {
  acpCore: (import.meta.env.VITE_ACP_CORE_ADDRESS || "0x5898d78653C1f691431A045580c1b1D6aFC28AF9") as `0x${string}`,
  slaEvaluator: (import.meta.env.VITE_SLA_EVALUATOR_ADDRESS || "0xfc10869E2Bb2E8060DD59C59D0aAB01475bb75A0") as `0x${string}`,
  sellerRegistry: (import.meta.env.VITE_SELLER_REGISTRY_ADDRESS || "0xE0E71C31890DD9f78b3B7f147046dBF1cc374547") as `0x${string}`,
  reputationRegistry: (import.meta.env.VITE_REPUTATION_REGISTRY_ADDRESS || "0x4b4c76a28a0f5577A80a470C64d64c4dFC5A7183") as `0x${string}`,
  verisTreasury: (import.meta.env.VITE_VERIS_TREASURY_ADDRESS || "0x402E06B57D2e5c0452492703764a7E24e9772E56") as `0x${string}`,
  paymentToken: (import.meta.env.VITE_PAYMENT_TOKEN_ADDRESS || "0x534b2f3A21130d7a60830c2Df862319e593943A3") as `0x${string}`,
  // Default server-side operator public key
  defaultOperatorKey: (import.meta.env.VITE_OPERATOR_PUBLIC_KEY || "0x9b3dBb74adf386b2236D34D36E05ECC45ABB38fB") as `0x${string}`,
} as const;

// ── ACPCore ABI ────────────────────────────────────────────────────────────
export const ACP_CORE_ABI = [
  {
    type: "function",
    name: "createJob",
    stateMutability: "nonpayable",
    inputs: [
      { name: "provider", type: "address" },
      { name: "evaluator", type: "address" },
      { name: "expiredAt", type: "uint256" },
      { name: "description", type: "string" },
      { name: "hook", type: "address" },
    ],
    outputs: [{ name: "jobId", type: "uint256" }],
  },
  {
    type: "function",
    name: "fund",
    stateMutability: "nonpayable",
    inputs: [
      { name: "jobId", type: "uint256" },
      { name: "expectedBudget", type: "uint256" },
      { name: "optParams", type: "bytes" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "setBudget",
    stateMutability: "nonpayable",
    inputs: [
      { name: "jobId", type: "uint256" },
      { name: "amount", type: "uint256" },
      { name: "optParams", type: "bytes" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "claimRefund",
    stateMutability: "nonpayable",
    inputs: [{ name: "jobId", type: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "getJob",
    stateMutability: "view",
    inputs: [{ name: "jobId", type: "uint256" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "client", type: "address" },
          { name: "provider", type: "address" },
          { name: "evaluator", type: "address" },
          { name: "hook", type: "address" },
          { name: "token", type: "address" },
          { name: "budget", type: "uint256" },
          { name: "expiredAt", type: "uint256" },
          { name: "status", type: "uint8" },
        ],
      },
    ],
  },
  {
    type: "function",
    name: "jobCount",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "event",
    name: "JobCreated",
    inputs: [
      { name: "jobId", type: "uint256", indexed: true },
      { name: "client", type: "address", indexed: true },
      { name: "evaluator", type: "address", indexed: true },
      { name: "provider", type: "address", indexed: false },
      { name: "hook", type: "address", indexed: false },
      { name: "expiredAt", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "JobFunded",
    inputs: [
      { name: "jobId", type: "uint256", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "JobCompleted",
    inputs: [
      { name: "jobId", type: "uint256", indexed: true },
      { name: "reason", type: "bytes", indexed: false },
    ],
  },
  {
    type: "event",
    name: "JobRejected",
    inputs: [
      { name: "jobId", type: "uint256", indexed: true },
      { name: "reason", type: "bytes", indexed: false },
    ],
  },
] as const;

// ── SlaEvaluator ABI ───────────────────────────────────────────────────────
export const SLA_EVALUATOR_ABI = [
  {
    type: "function",
    name: "resolve",
    stateMutability: "nonpayable",
    inputs: [
      {
        name: "att",
        type: "tuple",
        components: [
          { name: "sellerId", type: "bytes32" },
          { name: "jobId", type: "uint256" },
          { name: "dataHash", type: "bytes32" },
          { name: "sourceBlockNumber", type: "uint256" },
          { name: "sourceBlockTimestamp", type: "uint256" },
          { name: "signature", type: "bytes" },
        ],
      },
      { name: "encodedAtt", type: "bytes" },
    ],
    outputs: [],
  },
  {
    type: "event",
    name: "JobResolved",
    inputs: [
      { name: "jobId", type: "uint256", indexed: true },
      { name: "sellerId", type: "bytes32", indexed: true },
      { name: "ageSeconds", type: "uint256", indexed: false },
      { name: "accepted", type: "bool", indexed: false },
    ],
  },
] as const;

// ── SellerRegistry ABI ─────────────────────────────────────────────────────
export const SELLER_REGISTRY_ABI = [
  {
    type: "function",
    name: "registerSeller",
    stateMutability: "nonpayable",
    inputs: [
      { name: "sellerId", type: "bytes32" },
      { name: "payoutAddress", type: "address" },
      { name: "operatorKey", type: "address" },
      { name: "price", type: "uint256" },
      { name: "freshnessWindowSeconds", type: "uint256" },
      { name: "datasetId", type: "bytes32" },
      { name: "sourceChainId", type: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "updateTerms",
    stateMutability: "nonpayable",
    inputs: [
      { name: "sellerId", type: "bytes32" },
      { name: "payoutAddress", type: "address" },
      { name: "operatorKey", type: "address" },
      { name: "price", type: "uint256" },
      { name: "freshnessWindowSeconds", type: "uint256" },
      { name: "datasetId", type: "bytes32" },
      { name: "sourceChainId", type: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "deactivateSeller",
    stateMutability: "nonpayable",
    inputs: [{ name: "sellerId", type: "bytes32" }],
    outputs: [],
  },
  {
    type: "function",
    name: "getSeller",
    stateMutability: "view",
    inputs: [{ name: "sellerId", type: "bytes32" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "payoutAddress", type: "address" },
          { name: "operatorKey", type: "address" },
          { name: "price", type: "uint256" },
          { name: "freshnessWindowSeconds", type: "uint256" },
          { name: "datasetId", type: "bytes32" },
          { name: "sourceChainId", type: "uint256" },
          { name: "active", type: "bool" },
        ],
      },
    ],
  },
] as const;

// ── ReputationRegistry ABI ─────────────────────────────────────────────────
export const REPUTATION_REGISTRY_ABI = [
  {
    type: "function",
    name: "getReputation",
    stateMutability: "view",
    inputs: [{ name: "sellerId", type: "bytes32" }],
    outputs: [
      { name: "slaMetCount", type: "uint256" },
      { name: "slaMissedCount", type: "uint256" },
      { name: "totalJobs", type: "uint256" },
      { name: "reliabilityBps", type: "uint256" },
    ],
  },
] as const;

// ── ERC20 ABI ──────────────────────────────────────────────────────────────
export const ERC20_ABI = [
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "allowance",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "decimals",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
  },
  {
    type: "function",
    name: "symbol",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
  },
] as const;

// ── Job Status Names ───────────────────────────────────────────────────────
export const JOB_STATUS_MAP: Record<number, { name: string; color: string }> = {
  0: { name: "Open", color: "text-amber-400" },
  1: { name: "Funded", color: "text-blue-400" },
  2: { name: "Submitted", color: "text-purple-400" },
  3: { name: "Completed (SLA Met)", color: "text-emerald-400" },
  4: { name: "Rejected (Refunded)", color: "text-rose-400" },
  5: { name: "Expired", color: "text-zinc-400" },
};

// ── Sample Curated Datasets Available on Veris ─────────────────────────────
export const VERIS_SELLER_ID = "veris.eth";
export const VERIS_SELLER_ID_BYTES32 =
  "0x76657269732e6574680000000000000000000000000000000000000000000000" as `0x${string}`;

export interface MarketplaceDataset {
  sellerId: string;
  sellerIdBytes32?: `0x${string}`;
  name: string;
  category:
    | "DeFi Lending"
    | "DEX Liquidity"
    | "CLOB Liquidity"
    | "On-Chain Oracles"
    | "NFT Protocol State"
    | "Perps & Derivatives"
    | "Sports & Prediction"
    | "Network Telemetry";
  description: string;
  freshnessSlaSeconds: number;
  priceUsdc: number;
  reliabilityBps: number; // e.g. 9940 = 99.4%
  totalJobs: number;
  sourceChain: string;
  payoutAddress: `0x${string}`;
}

export const FEATURED_DATASETS: MarketplaceDataset[] = [
  {
    sellerId: VERIS_SELLER_ID,
    sellerIdBytes32: VERIS_SELLER_ID_BYTES32,
    name: "Aave V3 Lending Rates & Reserve Liquidity",
    category: "DeFi Lending",
    description: "On-chain reserve data, variable borrow rates, supply APYs, and reserve factors attested from Aave V3 lending pools on Ethereum and Arbitrum.",
    freshnessSlaSeconds: 10,
    priceUsdc: 0.25,
    reliabilityBps: 9980, // 99.8%
    totalJobs: 4120,
    sourceChain: "Ethereum / Arbitrum One (Aave V3)",
    payoutAddress: "0x71C839e93ab233B27cb92a7e7Ac33f7bDa6b1e60",
  },
  {
    sellerId: VERIS_SELLER_ID,
    sellerIdBytes32: VERIS_SELLER_ID_BYTES32,
    name: "Uniswap V3 High-Frequency Pool TWAP & Ticks",
    category: "DEX Liquidity",
    description: "High-frequency spot ticks, fee growth globals, and tick cumulative depth snapshots attested directly from Uniswap V3 on-chain pools.",
    freshnessSlaSeconds: 5,
    priceUsdc: 0.30,
    reliabilityBps: 9960, // 99.6%
    totalJobs: 6840,
    sourceChain: "Ethereum / Arbitrum / Base (Uniswap V3)",
    payoutAddress: "0x82A123e4210ab233B27cb92a7e7Ac33f7bDa6b1e61",
  },
  {
    sellerId: VERIS_SELLER_ID,
    sellerIdBytes32: VERIS_SELLER_ID_BYTES32,
    name: "Pyth Network On-Chain Price Feed Attestations",
    category: "On-Chain Oracles",
    description: "Sub-second on-chain Pyth price attestations, exponential confidence intervals, and publisher signatures verified by Pyth EVM contracts.",
    freshnessSlaSeconds: 3,
    priceUsdc: 0.25,
    reliabilityBps: 9990, // 99.9%
    totalJobs: 11240,
    sourceChain: "Pythnet / EVM On-Chain Oracles",
    payoutAddress: "0x93F423e4210ab233B27cb92a7e7Ac33f7bDa6b1e62",
  },
  {
    sellerId: VERIS_SELLER_ID,
    sellerIdBytes32: VERIS_SELLER_ID_BYTES32,
    name: "Kuru CLOB On-Chain Order Book Depth",
    category: "CLOB Liquidity",
    description: "On-chain central limit order book snapshot (best bid, best ask, tick spread, depth within 2%) attested from Kuru CLOB contracts on Monad.",
    freshnessSlaSeconds: 3,
    priceUsdc: 0.35,
    reliabilityBps: 9990, // 99.9%
    totalJobs: 9420,
    sourceChain: "Monad Mainnet (Native Kuru CLOB)",
    payoutAddress: "0x45E923e4210ab233B27cb92a7e7Ac33f7bDa6b1e63",
  },
  {
    sellerId: VERIS_SELLER_ID,
    sellerIdBytes32: VERIS_SELLER_ID_BYTES32,
    name: "OpenSea Seaport 1.6 Protocol Trades & Floor Bids",
    category: "NFT Protocol State",
    description: "Verified on-chain OrderFulfilled event streams, instant settlement volume, and collection floor prices across Seaport 1.6 contracts.",
    freshnessSlaSeconds: 15,
    priceUsdc: 0.40,
    reliabilityBps: 9920, // 99.2%
    totalJobs: 2190,
    sourceChain: "Ethereum Mainnet (Seaport 1.6)",
    payoutAddress: "0x56F023e4210ab233B27cb92a7e7Ac33f7bDa6b1e64",
  },
  {
    sellerId: VERIS_SELLER_ID,
    sellerIdBytes32: VERIS_SELLER_ID_BYTES32,
    name: "Curve Finance Multi-Asset Pool Stable-Peg Deviations",
    category: "DEX Liquidity",
    description: "On-chain StableSwap virtual prices, 3pool balances, amplification coefficients (A), and peg deviation ratios from Curve contracts.",
    freshnessSlaSeconds: 8,
    priceUsdc: 0.30,
    reliabilityBps: 9970, // 99.7%
    totalJobs: 3450,
    sourceChain: "Ethereum Mainnet (Curve Finance)",
    payoutAddress: "0x67A123e4210ab233B27cb92a7e7Ac33f7bDa6b1e65",
  },
  {
    sellerId: VERIS_SELLER_ID,
    sellerIdBytes32: VERIS_SELLER_ID_BYTES32,
    name: "Compound V3 (Comet) Collateral & Borrow Utilization",
    category: "DeFi Lending",
    description: "Real-time Comet base asset supply, collateral absorption queues, liquidation risk indices, and utilization curves on Arbitrum.",
    freshnessSlaSeconds: 10,
    priceUsdc: 0.25,
    reliabilityBps: 9950, // 99.5%
    totalJobs: 2890,
    sourceChain: "Arbitrum One (Compound V3 Comet)",
    payoutAddress: "0x78B223e4210ab233B27cb92a7e7Ac33f7bDa6b1e66",
  },
  {
    sellerId: VERIS_SELLER_ID,
    sellerIdBytes32: VERIS_SELLER_ID_BYTES32,
    name: "Perpl Perpetual Futures Mark Price & Funding Velocity",
    category: "Perps & Derivatives",
    description: "On-chain perpetual mark price, index deviation, 1h funding velocity, and open interest attested from Perpl exchange contracts.",
    freshnessSlaSeconds: 5,
    priceUsdc: 0.45,
    reliabilityBps: 9970, // 99.7%
    totalJobs: 5120,
    sourceChain: "Monad Mainnet (Native Perpl DEX)",
    payoutAddress: "0x89C323e4210ab233B27cb92a7e7Ac33f7bDa6b1e67",
  },
  {
    sellerId: VERIS_SELLER_ID,
    sellerIdBytes32: VERIS_SELLER_ID_BYTES32,
    name: "Monad Sequencer Queue & Validator Mempool Telemetry",
    category: "Network Telemetry",
    description: "On-chain base fee deltas, block packing efficiency, sequencer queue latency, and validator consensus telemetry on Monad.",
    freshnessSlaSeconds: 6,
    priceUsdc: 0.35,
    reliabilityBps: 9960, // 99.6%
    totalJobs: 4320,
    sourceChain: "Monad Testnet (Chain ID 10143)",
    payoutAddress: "0x90D423e4210ab233B27cb92a7e7Ac33f7bDa6b1e68",
  },
  {
    sellerId: VERIS_SELLER_ID,
    sellerIdBytes32: VERIS_SELLER_ID_BYTES32,
    name: "Overtime Protocol Live Sports Odds & Spreads",
    category: "Sports & Prediction",
    description: "Decentralized on-chain sports betting odds, moneyline spreads, 2-way handicap lines, and fixture statuses attested from Overtime SportsAMM contracts on Arbitrum.",
    freshnessSlaSeconds: 10,
    priceUsdc: 0.35,
    reliabilityBps: 9940, // 99.4%
    totalJobs: 3840,
    sourceChain: "Arbitrum One (Overtime SportsAMM)",
    payoutAddress: "0x89C323e4210ab233B27cb92a7e7Ac33f7bDa6b1e67",
  },
];
