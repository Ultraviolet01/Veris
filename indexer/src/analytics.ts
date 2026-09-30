/**
 * analytics.ts — Envio HyperSync Accelerated Analytics Engine for Veris
 *
 * Connects to Envio HyperSync & HyperRPC to stream contract events,
 * aggregate multi-chain metrics, and compute live ERC-8004 reputation scores.
 */

import { ethers } from "ethers";
import { VerisEventProcessor } from "./EventHandlers.js";

export const ENVIO_HYPERRPC_URL =
  process.env["HYPERRPC_URL"] ||
  "https://10143.rpc.hypersync.xyz/dc3a296f-f7c6-4b60-9bd7-a2f9bdcc4c64";

export const ENVIO_HYPERSYNC_TOKEN =
  process.env["ENVIO_HYPERSYNC_TOKEN"] ||
  "2f220cde-2c2f-41d7-8136-c5672680148e";

export const SLA_EVALUATOR_ADDRESS =
  process.env["SLA_EVALUATOR_ADDRESS"] ||
  "0xfc10869E2Bb2E8060DD59C59D0aAB01475bb75A0";

export const ACP_CORE_ADDRESS =
  process.env["ACP_CORE_ADDRESS"] ||
  "0x5898d78653C1f691431A045580c1b1D6aFC28AF9";

export const SELLER_REGISTRY_ADDRESS =
  process.env["SELLER_REGISTRY_ADDRESS"] ||
  "0xE0E71C31890DD9f78b3B7f147046dBF1cc374547";

export class EnvioAnalyticsEngine {
  public processor: VerisEventProcessor;
  public provider: ethers.JsonRpcProvider;

  constructor() {
    this.processor = new VerisEventProcessor();
    this.provider = new ethers.JsonRpcProvider(ENVIO_HYPERRPC_URL, {
      chainId: 10143,
      name: "monad-testnet",
    });

    // Seed default Veris seller
    this.processor.handleSellerRegistered({
      sellerId: "0x76657269732e6574680000000000000000000000000000000000000000000000",
      payoutAddress: "0x402E06B57D2e5c0452492703764a7E24e9772E56",
      datasetId: "0x6b7572752d6f72646572626f6f6b000000000000000000000000000000000000",
      blockNumber: 67000000n,
      blockTimestamp: BigInt(Math.floor(Date.now() / 1000) - 86400),
    });
  }

  /**
   * Syncs latest historical and real-time events via Envio HyperRPC
   */
  async syncLatestEvents(): Promise<void> {
    try {
      const currentBlock = await this.provider.getBlockNumber();
      const fromBlock = Math.max(0, currentBlock - 500);

      // Query SlaEvaluator JobResolved events
      const slaInterface = new ethers.Interface([
        "event JobResolved(uint256 indexed jobId, bytes32 indexed sellerId, uint256 ageSeconds, bool accepted)"
      ]);

      const logs = await this.provider.getLogs({
        address: SLA_EVALUATOR_ADDRESS,
        fromBlock,
        toBlock: currentBlock,
        topics: [slaInterface.getEvent("JobResolved")!.topicHash],
      });

      for (const log of logs) {
        try {
          const parsed = slaInterface.parseLog(log);
          if (parsed) {
            const block = await this.provider.getBlock(log.blockNumber);
            this.processor.handleJobResolved({
              jobId: parsed.args[0],
              sellerId: parsed.args[1],
              ageSeconds: parsed.args[2],
              accepted: parsed.args[3],
              blockNumber: BigInt(log.blockNumber),
              blockTimestamp: BigInt(block?.timestamp || Math.floor(Date.now() / 1000)),
              transactionHash: log.transactionHash,
            });
          }
        } catch {
          // ignore malformed log
        }
      }

      // Track cross-chain telemetry anchor
      this.processor.handleCrossChainEvent(
        "Monad Testnet",
        10143n,
        "Veris Autonomous Escrow",
        ACP_CORE_ADDRESS,
        BigInt(currentBlock),
        BigInt(Math.floor(Date.now() / 1000))
      );
    } catch (err) {
      console.warn("[EnvioAnalytics] Sync warning (will retry):", err instanceof Error ? err.message : err);
    }
  }

  /**
   * Returns complete snapshot formatted for GraphQL and REST queries
   */
  getSnapshot() {
    return {
      sellers: Array.from(this.processor.state.sellers.values()).map(serializeBigInts),
      jobs: Array.from(this.processor.state.jobs.values()).map(serializeBigInts),
      evaluations: Array.from(this.processor.state.evaluations.values()).map(serializeBigInts),
      dailyMetrics: Array.from(this.processor.state.dailyMetrics.values()).map(serializeBigInts),
      protocol: serializeBigInts(this.processor.state.protocolMetric),
      crossChainSources: Array.from(this.processor.state.crossChainSources.values()).map(serializeBigInts),
    };
  }
}

function serializeBigInts(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === "bigint") return obj.toString();
  if (Array.isArray(obj)) return obj.map(serializeBigInts);
  if (typeof obj === "object") {
    const res: any = {};
    for (const [k, v] of Object.entries(obj)) {
      res[k] = serializeBigInts(v);
    }
    return res;
  }
  return obj;
}
