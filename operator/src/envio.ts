/**
 * envio.ts — Envio HyperRPC & HyperSync Integration for Veris
 *
 * Veris utilizes Envio's dual-tier data engine:
 * 1. Envio HyperRPC (token-authenticated JSON-RPC):
 *    Ultra-low-latency provider for block height, block timestamps, and fast log polling.
 *    Supports chain IDs: 10143 (Monad Testnet), 143 (Monad Mainnet), 1 (Ethereum), 42161 (Arbitrum).
 *
 * 2. Envio HyperSync (token-authenticated high-speed query stream):
 *    Batch query engine for accelerated block context, historical log streams, and resolution indexing.
 */

import { ethers } from "ethers";

export const ENVIO_HYPERRPC_TOKEN =
  process.env["ENVIO_HYPERRPC_TOKEN"] || "dc3a296f-f7c6-4b60-9bd7-a2f9bdcc4c64";

export const ENVIO_HYPERSYNC_TOKEN =
  process.env["ENVIO_HYPERSYNC_TOKEN"] || "2f220cde-2c2f-41d7-8136-c5672680148e";

/**
 * Returns the authenticated Envio HyperRPC endpoint for a given EVM chain.
 */
export function getHyperRpcUrl(chainId: number | bigint = 10143): string {
  const cid = Number(chainId);
  return `https://${cid}.rpc.hypersync.xyz/${ENVIO_HYPERRPC_TOKEN}`;
}

/**
 * Returns the authenticated Envio HyperSync base URL for a given chain name or ID.
 */
export function getHyperSyncUrl(chain: string | number = "monad-testnet"): string {
  if (chain === 1 || chain === "eth" || chain === "ethereum") {
    return "https://eth.hypersync.xyz";
  }
  if (chain === 42161 || chain === "arbitrum") {
    return "https://arbitrum.hypersync.xyz";
  }
  if (chain === 143 || chain === "monad") {
    return "https://monad.hypersync.xyz";
  }
  return "https://monad-testnet.hypersync.xyz";
}

/**
 * Creates an ethers.JsonRpcProvider connected via Envio HyperRPC.
 */
export function getHyperRpcProvider(chainId: number = 10143): ethers.JsonRpcProvider {
  const url = getHyperRpcUrl(chainId);
  return new ethers.JsonRpcProvider(url, {
    chainId,
    name: chainId === 10143 ? "monad-testnet" : chainId === 1 ? "ethereum" : "monad",
  });
}

/**
 * Query Envio HyperSync for lightning-fast block height, events, or transactions.
 */
export async function queryHyperSync<T = any>(
  chain: string | number,
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const baseUrl = getHyperSyncUrl(chain);
  const url = `${baseUrl}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ENVIO_HYPERSYNC_TOKEN}`,
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`[Envio HyperSync] HTTP ${res.status} from ${url}: ${errorText}`);
  }

  return res.json() as Promise<T>;
}

/**
 * Get the latest block number and block timestamp using Envio HyperRPC.
 * Used for SLA freshness attestation stamping.
 */
export async function getEnvioBlockContext(chainId: number = 10143): Promise<{
  blockNumber: bigint;
  blockTimestamp: bigint;
}> {
  const provider = getHyperRpcProvider(chainId);
  const block = await provider.getBlock("latest");
  if (!block) {
    throw new Error(`[Envio] Failed to retrieve latest block header for chain ${chainId} via HyperRPC`);
  }
  return {
    blockNumber: BigInt(block.number),
    blockTimestamp: BigInt(block.timestamp),
  };
}
