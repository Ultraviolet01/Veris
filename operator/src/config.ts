/**
 * config.ts — Veris operator configuration
 *
 * Loads all runtime parameters from environment variables.
 * Fails loudly (throws) if any required value is missing — never falls back to defaults
 * for secrets or contract addresses, as per the "fail loudly" hard constraint.
 *
 * An independent operator runs their own instance by supplying different env vars only.
 */
import "dotenv/config";
import { ethers } from "ethers";

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value || value.trim() === "") {
    throw new Error(
      `[config] Missing required environment variable: ${key}\n` +
      `  Check your .env file against .env.example`
    );
  }
  return value.trim();
}

function optionalEnv(key: string, fallback: string): string {
  return process.env[key]?.trim() || fallback;
}

// ── RPC providers ─────────────────────────────────────────────────────────────
// Monad testnet (chain 10143): escrow, payment, ACPCore, SlaEvaluator live here
export const MONAD_TESTNET_RPC_URL = requireEnv("MONAD_TESTNET_RPC_URL");

// Monad mainnet (chain 143) via HyperRPC or standard RPC: data source for Kuru/Perpl
// HyperRPC is a drop-in RPC backed by Envio HyperSync — preferred for speed.
// HYPERRPC_URL takes precedence; MONAD_MAINNET_RPC_URL is the fallback.
const hyperrpcUrl = process.env["HYPERRPC_URL"]?.trim();
const mainnetFallback = requireEnv("MONAD_MAINNET_RPC_URL");
export const DATA_SOURCE_RPC_URL = hyperrpcUrl || mainnetFallback;

// ── Operator identity ──────────────────────────────────────────────────────────
const rawKey = requireEnv("OPERATOR_PRIVATE_KEY");
export const OPERATOR_WALLET = new ethers.Wallet(rawKey);
export const OPERATOR_ADDRESS = OPERATOR_WALLET.address;

// ── Deployed contract addresses ────────────────────────────────────────────────
export const ACP_CORE_ADDRESS      = requireEnv("ACP_CORE_ADDRESS");
export const SLA_EVALUATOR_ADDRESS = requireEnv("SLA_EVALUATOR_ADDRESS");
export const SELLER_REGISTRY_ADDRESS = requireEnv("SELLER_REGISTRY_ADDRESS");
export const VERIS_TREASURY_ADDRESS  = requireEnv("VERIS_TREASURY_ADDRESS");
export const PAYMENT_TOKEN_ADDRESS   = requireEnv("PAYMENT_TOKEN_ADDRESS");

// ── Seller identity ────────────────────────────────────────────────────────────
// Must be a 32-byte hex string (0x-prefixed, 66 chars total)
const rawSellerId = requireEnv("SELLER_ID");
if (!/^0x[0-9a-fA-F]{64}$/.test(rawSellerId)) {
  throw new Error(
    `[config] SELLER_ID must be a 0x-prefixed 32-byte hex string (66 chars). Got: ${rawSellerId}`
  );
}
export const SELLER_ID = rawSellerId as `0x${string}`;

// ── Dataset config (Kuru) ──────────────────────────────────────────────────────
// The Kuru market contract address on Monad mainnet (chain 143).
// Find the MON/USDC (or desired pair) market address at https://kuru.io or Monadscan.
export const KURU_MARKET_ADDRESS = requireEnv("KURU_MARKET_ADDRESS");

// The chain ID of the source chain where data lives (Monad mainnet = 143)
// This must match the sourceChainId registered in SellerRegistry.
export const SOURCE_CHAIN_ID = 143n; // Monad mainnet

// ── Polling / timing ───────────────────────────────────────────────────────────
export const POLL_INTERVAL_MS = parseInt(
  optionalEnv("POLL_INTERVAL_MS", "2000"),
  10
);

export const JOB_EXPIRY_SECONDS = parseInt(
  optionalEnv("JOB_EXPIRY_SECONDS", "3600"),
  10
);

// ── Derived: connected providers ───────────────────────────────────────────────
export function getTestnetProvider(): ethers.JsonRpcProvider {
  return new ethers.JsonRpcProvider(MONAD_TESTNET_RPC_URL, {
    chainId: 10143,
    name: "monad-testnet",
  });
}

export function getDataSourceProvider(): ethers.JsonRpcProvider {
  // HyperRPC: chain ID 143 = Monad mainnet
  return new ethers.JsonRpcProvider(DATA_SOURCE_RPC_URL, {
    chainId: 143,
    name: "monad-mainnet",
  });
}

export function getTestnetSigner(): ethers.Wallet {
  return OPERATOR_WALLET.connect(getTestnetProvider());
}

// ── Startup validation log ─────────────────────────────────────────────────────
export function logConfig(): void {
  console.log("[config] Veris operator starting with:");
  console.log(`  Operator address:    ${OPERATOR_ADDRESS}`);
  console.log(`  Seller ID:           ${SELLER_ID}`);
  console.log(`  Testnet RPC:         ${MONAD_TESTNET_RPC_URL}`);
  console.log(`  Data source RPC:     ${DATA_SOURCE_RPC_URL}`);
  console.log(`  Kuru market:         ${KURU_MARKET_ADDRESS}`);
  console.log(`  ACPCore:             ${ACP_CORE_ADDRESS}`);
  console.log(`  SlaEvaluator:        ${SLA_EVALUATOR_ADDRESS}`);
  console.log(`  Poll interval:       ${POLL_INTERVAL_MS}ms`);
  if (!hyperrpcUrl) {
    console.warn(
      "[config] WARN: HYPERRPC_URL not set — using standard mainnet RPC. " +
      "Set HYPERRPC_URL for faster data reads via Envio HyperRPC."
    );
  }
}
