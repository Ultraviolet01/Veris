/**
 * EventHandlers.ts — Multi-chain Envio HyperIndex Handlers for Veris Protocol
 *
 * Implements non-trivial relational schema updates and derived aggregations:
 * 1. Monad Testnet (Chain 10143):
 *    - ACPCore: Job lifecycle (Created -> Funded -> Resolved)
 *    - SlaEvaluator: Cryptographic SLA compliance verification & fee splits
 *    - SellerRegistry: Provider storefronts and SLA commitments
 *    - ReputationRegistry: ERC-8004 persistent trust rating calculation
 *
 * 2. Ethereum Mainnet (Chain 1):
 *    - Cross-chain market telemetry tracking (Uniswap V3 Swaps, Aave V3 Supplies)
 */

// Helper to compute daily date string (YYYY-MM-DD)
function getDayString(timestamp: number | bigint): string {
  const date = new Date(Number(timestamp) * 1000);
  return date.toISOString().split("T")[0];
}

export interface IndexerState {
  sellers: Map<string, any>;
  jobs: Map<string, any>;
  clients: Map<string, any>;
  evaluations: Map<string, any>;
  dailyMetrics: Map<string, any>;
  protocolMetric: any;
  crossChainSources: Map<string, any>;
}

export function createInitialState(): IndexerState {
  return {
    sellers: new Map(),
    jobs: new Map(),
    clients: new Map(),
    evaluations: new Map(),
    dailyMetrics: new Map(),
    protocolMetric: {
      id: "global",
      totalJobsCreated: 0n,
      totalJobsCompleted: 0n,
      totalJobsRefunded: 0n,
      totalVolumeEscrowedUsdc: 0n,
      totalVolumeSettledUsdc: 0n,
      totalProtocolFeesCollectedUsdc: 0n,
      globalSlaPassRateBps: 10000n, // 100.00%
      activeSellersCount: 0,
      updatedAtTimestamp: BigInt(Math.floor(Date.now() / 1000)),
    },
    crossChainSources: new Map(),
  };
}

/**
 * Event Processing Engine (can be invoked by Envio runtime or HyperSync streamer)
 */
export class VerisEventProcessor {
  public state: IndexerState;

  constructor(initialState?: IndexerState) {
    this.state = initialState || createInitialState();
  }

  // ── ACPCore Handlers ──────────────────────────────────────────────────────

  handleJobCreated(event: {
    jobId: bigint;
    client: string;
    evaluator: string;
    provider: string;
    hook: string;
    expiredAt: bigint;
    blockNumber: bigint;
    blockTimestamp: bigint;
  }) {
    const jobId = event.jobId.toString();
    const clientId = event.client.toLowerCase();

    // Ensure client entity exists
    if (!this.state.clients.has(clientId)) {
      this.state.clients.set(clientId, {
        id: clientId,
        totalJobsFunded: 0n,
        totalSpentUsdc: 0n,
        totalRefundedUsdc: 0n,
      });
    }

    // Create job entity
    this.state.jobs.set(jobId, {
      id: jobId,
      client_id: clientId,
      provider: event.provider.toLowerCase(),
      evaluator: event.evaluator.toLowerCase(),
      hook: event.hook.toLowerCase(),
      budget: 0n,
      status: "OPEN",
      createdAtBlock: event.blockNumber,
      createdAtTimestamp: event.blockTimestamp,
      expiredAt: event.expiredAt,
      seller_id: null,
    });

    this.state.protocolMetric.totalJobsCreated += 1n;
    this.state.protocolMetric.updatedAtTimestamp = event.blockTimestamp;
  }

  handleJobFunded(event: {
    jobId: bigint;
    amount: bigint;
    blockNumber: bigint;
    blockTimestamp: bigint;
  }) {
    const jobId = event.jobId.toString();
    const job = this.state.jobs.get(jobId);
    if (!job) return;

    job.budget = event.amount;
    job.status = "FUNDED";

    // Update Client aggregates
    const client = this.state.clients.get(job.client_id);
    if (client) {
      client.totalJobsFunded += 1n;
      client.totalSpentUsdc += event.amount;
    }

    // Update Protocol global volume
    this.state.protocolMetric.totalVolumeEscrowedUsdc += event.amount;
    this.state.protocolMetric.updatedAtTimestamp = event.blockTimestamp;
  }

  // ── SlaEvaluator Handlers ─────────────────────────────────────────────────

  handleJobResolved(event: {
    jobId: bigint;
    sellerId: string;
    ageSeconds: bigint;
    accepted: boolean;
    blockNumber: bigint;
    blockTimestamp: bigint;
    transactionHash: string;
  }) {
    const jobId = event.jobId.toString();
    const sellerId = event.sellerId.toLowerCase();
    const job = this.state.jobs.get(jobId);

    const budget = job ? job.budget : 0n;
    const fee = (budget * 200n) / 10000n; // 2% protocol fee
    const payout = event.accepted ? budget - fee : 0n;
    const refund = event.accepted ? 0n : budget;

    // 1. Create SlaEvaluation Entity
    this.state.evaluations.set(jobId, {
      id: jobId,
      job_id: jobId,
      seller_id: sellerId,
      ageSeconds: event.ageSeconds,
      accepted: event.accepted,
      payoutAmountUsdc: payout,
      refundAmountUsdc: refund,
      feeAmountUsdc: fee,
      resolvedAtBlock: event.blockNumber,
      resolvedAtTimestamp: event.blockTimestamp,
      transactionHash: event.transactionHash,
    });

    if (job) {
      job.status = event.accepted ? "COMPLETED" : "REJECTED";
      job.seller_id = sellerId;
    }

    // 2. Update Seller Aggregates
    let seller = this.state.sellers.get(sellerId);
    if (seller) {
      if (event.accepted) {
        seller.totalJobsCompleted += 1n;
        seller.totalVolumeUsdc += payout;
        seller.totalProtocolFeesUsdc += fee;
        seller.slaMetCount += 1n;
      } else {
        seller.totalJobsRefunded += 1n;
        seller.slaMissedCount += 1n;
      }

      // Recompute rolling average delivery latency
      const totalResolved = seller.slaMetCount + seller.slaMissedCount;
      const prevTotalLatency = seller.avgDeliveryLatencySeconds * Number(totalResolved - 1n);
      seller.avgDeliveryLatencySeconds = totalResolved > 0n
        ? (prevTotalLatency + Number(event.ageSeconds)) / Number(totalResolved)
        : Number(event.ageSeconds);

      // Recompute reliability BPS
      seller.reliabilityBps = totalResolved > 0n
        ? (seller.slaMetCount * 10000n) / totalResolved
        : 10000n;
    }

    // 3. Update Client refund stats if rejected
    if (!event.accepted && job) {
      const client = this.state.clients.get(job.client_id);
      if (client) {
        client.totalRefundedUsdc += budget;
      }
    }

    // 4. Update Derived Daily Metric
    const day = getDayString(event.blockTimestamp);
    const dailyId = `${sellerId}-${day}`;
    let daily = this.state.dailyMetrics.get(dailyId);
    if (!daily) {
      daily = {
        id: dailyId,
        seller_id: sellerId,
        date: day,
        timestamp: event.blockTimestamp,
        jobsCompleted: 0n,
        jobsRefunded: 0n,
        volumeUsdc: 0n,
        avgLatencySeconds: Number(event.ageSeconds),
        slaComplianceRate: event.accepted ? 100.0 : 0.0,
      };
      this.state.dailyMetrics.set(dailyId, daily);
    } else {
      if (event.accepted) {
        daily.jobsCompleted += 1n;
        daily.volumeUsdc += payout;
      } else {
        daily.jobsRefunded += 1n;
      }
      const totalDaily = daily.jobsCompleted + daily.jobsRefunded;
      daily.slaComplianceRate = totalDaily > 0n
        ? Number((daily.jobsCompleted * 10000n) / totalDaily) / 100
        : 100.0;
    }

    // 5. Update Protocol Global Metric
    if (event.accepted) {
      this.state.protocolMetric.totalJobsCompleted += 1n;
      this.state.protocolMetric.totalVolumeSettledUsdc += payout;
      this.state.protocolMetric.totalProtocolFeesCollectedUsdc += fee;
    } else {
      this.state.protocolMetric.totalJobsRefunded += 1n;
    }

    const totalGlobal = this.state.protocolMetric.totalJobsCompleted + this.state.protocolMetric.totalJobsRefunded;
    this.state.protocolMetric.globalSlaPassRateBps = totalGlobal > 0n
      ? (this.state.protocolMetric.totalJobsCompleted * 10000n) / totalGlobal
      : 10000n;

    this.state.protocolMetric.updatedAtTimestamp = event.blockTimestamp;
  }

  // ── SellerRegistry Handlers ───────────────────────────────────────────────

  handleSellerRegistered(event: {
    sellerId: string;
    payoutAddress: string;
    datasetId: string;
    blockNumber: bigint;
    blockTimestamp: bigint;
  }) {
    const id = event.sellerId.toLowerCase();
    if (!this.state.sellers.has(id)) {
      this.state.sellers.set(id, {
        id,
        owner: event.payoutAddress.toLowerCase(),
        payoutAddress: event.payoutAddress.toLowerCase(),
        operatorKey: "0x57b45bb6dd6a5369a549ab7e63631cbad11cb821724163d851c3d8c09882b786",
        pricePerQuery: 100000n, // 0.10 USDC
        freshnessWindowSeconds: 10n,
        datasetId: event.datasetId,
        sourceChainId: 10143n,
        active: true,
        totalJobsCreated: 0n,
        totalJobsCompleted: 0n,
        totalJobsRefunded: 0n,
        totalVolumeUsdc: 0n,
        totalProtocolFeesUsdc: 0n,
        slaMetCount: 0n,
        slaMissedCount: 0n,
        reliabilityBps: 10000n,
        avgDeliveryLatencySeconds: 0,
      });

      this.state.protocolMetric.activeSellersCount = this.state.sellers.size;
    }
  }

  handleSellerTermsUpdated(event: {
    sellerId: string;
    newPrice: bigint;
    newFreshnessWindow: bigint;
  }) {
    const seller = this.state.sellers.get(event.sellerId.toLowerCase());
    if (seller) {
      seller.pricePerQuery = event.newPrice;
      seller.freshnessWindowSeconds = event.newFreshnessWindow;
    }
  }

  handleSellerDeactivated(event: { sellerId: string }) {
    const seller = this.state.sellers.get(event.sellerId.toLowerCase());
    if (seller) {
      seller.active = false;
      this.state.protocolMetric.activeSellersCount = Array.from(this.state.sellers.values()).filter(
        (s) => s.active
      ).length;
    }
  }

  // ── Multi-chain Telemetry Handlers (Ethereum) ─────────────────────────────

  handleCrossChainEvent(chain: string, chainId: bigint, protocol: string, contractAddress: string, block: bigint, timestamp: bigint) {
    const id = `${chainId}-${contractAddress.toLowerCase()}`;
    let source = this.state.crossChainSources.get(id);
    if (!source) {
      source = {
        id,
        chain,
        chainId,
        protocol,
        contractAddress: contractAddress.toLowerCase(),
        lastEventBlock: block,
        lastEventTimestamp: timestamp,
        totalEventsIndexed: 1n,
      };
      this.state.crossChainSources.set(id, source);
    } else {
      source.lastEventBlock = block;
      source.lastEventTimestamp = timestamp;
      source.totalEventsIndexed += 1n;
    }
  }
}
