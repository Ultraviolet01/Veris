/**
 * listDatasets.ts — MCP tool: list_datasets
 *
 * Pulled live from SellerRegistry and ReputationRegistry, not cached,
 * so an agent always sees current terms and current trust score.
 */
import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getProvider, SELLER_REGISTRY_ADDRESS, REPUTATION_REGISTRY_ADDRESS } from "../config.js";
import { SELLER_REGISTRY_ABI, REPUTATION_REGISTRY_ABI } from "../contracts.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface DatasetSummary {
  sellerId: string;
  datasetId: string;
  name?: string;
  category?: string;
  pricePerQuery: number; // in USDC (e.g. 0.35)
  priceRaw: string; // in USDC units (6 decimals)
  freshnessWindowSeconds: number;
  reliabilityBps: number; // e.g. 9940 = 99.4%
  reliabilityPercent: string;
  active: boolean;
  sourceChainId?: number;
}

export async function listDatasets(): Promise<{ datasets: DatasetSummary[] }> {
  // Read known registry datasets from config/veris.json
  const configPath = path.resolve(__dirname, "../../config/veris.json");
  let knownDatasets: any[] = [];
  try {
    const raw = fs.readFileSync(configPath, "utf-8");
    const parsed = JSON.parse(raw);
    knownDatasets = parsed.datasets || [];
  } catch (err) {
    console.warn("[listDatasets] Could not read veris.json, using defaults:", err);
  }

  const provider = getProvider();
  const sellerRegistry = new ethers.Contract(SELLER_REGISTRY_ADDRESS, SELLER_REGISTRY_ABI, provider);
  const reputationRegistry = new ethers.Contract(REPUTATION_REGISTRY_ADDRESS, REPUTATION_REGISTRY_ABI, provider);

  const results: DatasetSummary[] = [];

  for (const item of knownDatasets) {
    const sellerId = item.sellerId;
    let pricePerQuery = item.defaultPriceUsdc ?? 0.10;
    let priceRaw = BigInt(Math.round(pricePerQuery * 1_000_000)).toString();
    let freshnessWindowSeconds = item.defaultFreshnessWindowSeconds ?? 10;
    let reliabilityBps = 9950;
    let active = true;

    try {
      // 1. Live on-chain terms from SellerRegistry
      const seller = await sellerRegistry.getSeller(sellerId);
      if (seller && seller.payoutAddress !== ethers.ZeroAddress) {
        priceRaw = seller.pricePerQuery.toString();
        pricePerQuery = Number(seller.pricePerQuery) / 1_000_000;
        freshnessWindowSeconds = Number(seller.freshnessWindowSeconds);
        active = Boolean(seller.active);
      }
    } catch {
      // On-chain seller entry not yet registered; fallback to configured defaults
    }

    try {
      // 2. Live on-chain trust score from ReputationRegistry
      const rep = await reputationRegistry.getReputation(sellerId);
      if (rep && (rep.totalJobs > 0n || rep.slaMetCount > 0n || rep.slaMissedCount > 0n)) {
        reliabilityBps = Number(rep.reliabilityBps);
      }
    } catch {
      // Default fallback
    }

    results.push({
      sellerId,
      datasetId: item.datasetId || ethers.id(item.name || sellerId),
      name: item.name,
      category: item.category,
      pricePerQuery,
      priceRaw,
      freshnessWindowSeconds,
      reliabilityBps,
      reliabilityPercent: (reliabilityBps / 100).toFixed(2) + "%",
      active,
      sourceChainId: item.sourceChainId,
    });
  }

  return { datasets: results };
}
