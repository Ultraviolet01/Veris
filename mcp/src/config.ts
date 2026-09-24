/**
 * config.ts — Configuration loader for Veris MCP Server
 *
 * Enforces:
 *   - Monad Testnet (Chain ID 10143)
 *   - Strict fail-loudly policy for configuration
 *   - Safe fallback to public RPC and deployed contracts
 */
import "dotenv/config";
import { ethers } from "ethers";

export const MONAD_TESTNET_CHAIN_ID = 10143;
export const MONAD_TESTNET_RPC_URL =
  process.env["MONAD_TESTNET_RPC_URL"]?.trim() || "https://testnet-rpc.monad.xyz";

// ── Contract Addresses (Live Monad Testnet) ──────────────────────────────────
export const ACP_CORE_ADDRESS =
  process.env["ACP_CORE_ADDRESS"]?.trim() || "0x5898d78653C1f691431A045580c1b1D6aFC28AF9";

export const SLA_EVALUATOR_ADDRESS =
  process.env["SLA_EVALUATOR_ADDRESS"]?.trim() || "0xfc10869E2Bb2E8060DD59C59D0aAB01475bb75A0";

export const SELLER_REGISTRY_ADDRESS =
  process.env["SELLER_REGISTRY_ADDRESS"]?.trim() || "0xE0E71C31890DD9f78b3B7f147046dBF1cc374547";

export const REPUTATION_REGISTRY_ADDRESS =
  process.env["REPUTATION_REGISTRY_ADDRESS"]?.trim() || "0x4b4c76a28a0f5577A80a470C64d64c4dFC5A7183";

export const PAYMENT_TOKEN_ADDRESS =
  process.env["PAYMENT_TOKEN_ADDRESS"]?.trim() || "0x534b2f3A21130d7a60830c2Df862319e593943A3"; // USDC on Monad testnet

// ── Hard Spending Caps & Timing ──────────────────────────────────────────────
export const HARD_SPENDING_CAP_USDC = 50.0;
export const POLL_TIMEOUT_MS = parseInt(process.env["POLL_TIMEOUT_MS"] || "30000", 10);
export const POLL_INTERVAL_MS = parseInt(process.env["POLL_INTERVAL_MS"] || "1500", 10);

// ── Providers & Signers ───────────────────────────────────────────────────────
let _provider: ethers.JsonRpcProvider | null = null;

export function getProvider(): ethers.JsonRpcProvider {
  if (!_provider) {
    _provider = new ethers.JsonRpcProvider(MONAD_TESTNET_RPC_URL, {
      chainId: MONAD_TESTNET_CHAIN_ID,
      name: "monad-testnet",
    });
  }
  return _provider;
}

export function getBuyerSigner(): ethers.Wallet {
  const privateKey = process.env["BUYER_PRIVATE_KEY"]?.trim();
  if (!privateKey) {
    throw new Error(
      "[Veris MCP] BUYER_PRIVATE_KEY environment variable is required to execute on-chain purchases.\n" +
      "Set BUYER_PRIVATE_KEY in mcp/.env with an account funded with testnet MON and testnet USDC."
    );
  }
  return new ethers.Wallet(privateKey, getProvider());
}
