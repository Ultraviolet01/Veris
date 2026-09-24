/**
 * getQuote.ts — MCP tool: get_quote
 *
 * Input: { sellerId: string }
 * Returns: { price, freshnessWindowSeconds, reliabilityBps, active }
 */
import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getProvider, SELLER_REGISTRY_ADDRESS, REPUTATION_REGISTRY_ADDRESS } from "../config.js";
import { SELLER_REGISTRY_ABI, REPUTATION_REGISTRY_ABI } from "../contracts.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface QuoteResult {
  sellerId: string;
  price: number; // in USDC (e.g. 0.35)
  priceRaw: string; // in USDC 6-decimal units
  freshnessWindowSeconds: number;
  reliabilityBps: number; // basis points (0 - 10000)
  reliabilityPercent: string;
  active: boolean;
  payoutAddress?: string;
  operatorKey?: string;
  datasetName?: string;
}

export async function getQuote(sellerId: string): Promise<QuoteResult> {
  let normalizedId = (sellerId || "").trim().toLowerCase();
  if (normalizedId === "veris.eth") {
    normalizedId = "0x76657269732e6574680000000000000000000000000000000000000000000000";
  } else if (!/^0x[0-9a-fA-F]{64}$/.test(normalizedId)) {
    throw new Error(
      `[getQuote] Invalid sellerId format. Expected 0x-prefixed 32-byte hex string (66 chars) or veris.eth. Got: ${sellerId}`
    );
  }
  const provider = getProvider();
  const sellerRegistry = new ethers.Contract(SELLER_REGISTRY_ADDRESS, SELLER_REGISTRY_ABI, provider);
  const reputationRegistry = new ethers.Contract(REPUTATION_REGISTRY_ADDRESS, REPUTATION_REGISTRY_ABI, provider);

  // Check veris.json for dataset name fallback
  let datasetName: string | undefined;
  let fallbackPrice = 0.25;
  let fallbackSla = 10;
  try {
    const configPath = path.resolve(__dirname, "../../config/veris.json");
    const raw = fs.readFileSync(configPath, "utf-8");
    const parsed = JSON.parse(raw);
    const found = (parsed.datasets || []).find(
      (d: any) => d.sellerId.toLowerCase() === normalizedId
    );
    if (found) {
      datasetName = found.name;
      fallbackPrice = found.defaultPriceUsdc ?? fallbackPrice;
      fallbackSla = found.defaultFreshnessWindowSeconds ?? fallbackSla;
    }
  } catch {
    // Config read optional
  }

  let price = fallbackPrice;
  let priceRaw = BigInt(Math.round(fallbackPrice * 1_000_000)).toString();
  let freshnessWindowSeconds = fallbackSla;
  let active = true;
  let payoutAddress: string | undefined;
  let operatorKey: string | undefined;

  try {
    const seller = await sellerRegistry.getSeller(normalizedId);
    if (seller && seller.payoutAddress !== ethers.ZeroAddress) {
      priceRaw = seller.pricePerQuery.toString();
      price = Number(seller.pricePerQuery) / 1_000_000;
      freshnessWindowSeconds = Number(seller.freshnessWindowSeconds);
      active = Boolean(seller.active);
      payoutAddress = seller.payoutAddress;
      operatorKey = seller.operatorKey;
    }
  } catch {
    // Contract query fallback to veris.json registry terms
  }

  let reliabilityBps = 9950;
  try {
    const rep = await reputationRegistry.getReputation(normalizedId);
    if (rep && (rep.totalJobs > 0n || rep.slaMetCount > 0n || rep.slaMissedCount > 0n)) {
      reliabilityBps = Number(rep.reliabilityBps);
    }
  } catch {
    // Keep fallback
  }

  return {
    sellerId: normalizedId,
    price,
    priceRaw,
    freshnessWindowSeconds,
    reliabilityBps,
    reliabilityPercent: (reliabilityBps / 100).toFixed(2) + "%",
    active,
    payoutAddress,
    operatorKey,
    datasetName,
  };
}
