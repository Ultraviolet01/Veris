/**
 * index.ts — Veris operator entrypoint
 *
 * Listens for JobFunded events on ACPCore (Monad testnet) and for each funded job
 * tied to this operator's SELLER_ID, runs the full evaluation pipeline:
 *   fetch data → sign attestation → call SlaEvaluator.resolve()
 *
 * Listening strategy: polling loop (simpler and more reliable than websocket
 * subscriptions for a hackathon build where connection stability matters).
 * Polls every POLL_INTERVAL_MS (default 2000ms ≈ 2 Monad blocks).
 *
 * Design for multi-operator use:
 *   Each operator runs their own instance with their own .env.
 *   The SELLER_ID filter ensures each instance only processes jobs for its seller.
 *   No coordination between operators required.
 *
 * Health HTTP endpoint:
 *   GET /health → { status: "ok", operator: <address>, sellerId: <id>, lastBlock: <n> }
 *   Useful for monitoring and the Metropolis demo.
 */
import http from "http";
import { ethers } from "ethers";
import {
  logConfig,
  getTestnetProvider,
  SELLER_ID,
  ACP_CORE_ADDRESS,
  SLA_EVALUATOR_ADDRESS,
  POLL_INTERVAL_MS,
} from "./config.js";
import { triggerEvaluation } from "./triggerEvaluation.js";

// ── ACPCore ABI (events we listen for) ────────────────────────────────────────
const ACP_CORE_ABI = [
  `event JobCreated(
    uint256 indexed jobId,
    address indexed client,
    address indexed evaluator,
    address provider,
    address hook,
    uint256 expiredAt
  )`,
  `event JobFunded(uint256 indexed jobId, uint256 amount)`,
  `function getJob(uint256 jobId) view returns (
    tuple(
      address client,
      address provider,
      address evaluator,
      address hook,
      address token,
      uint256 budget,
      uint256 expiredAt,
      uint8   status
    )
  )`,
] as const;

// ── Job status constants ───────────────────────────────────────────────────────
const JOB_STATUS_FUNDED = 1;

// ── Operator state ────────────────────────────────────────────────────────────
let lastProcessedBlock = 0n;
let isProcessing = false;
const processedJobs = new Set<bigint>(); // prevent double-processing

// ── Main loop ─────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  logConfig();
  console.log(`\n[operator] Starting Veris operator service`);
  console.log(`[operator] Monitoring ACPCore at ${ACP_CORE_ADDRESS} for jobs with evaluator=${SLA_EVALUATOR_ADDRESS}`);

  const provider = getTestnetProvider();
  const acpCore = new ethers.Contract(ACP_CORE_ADDRESS, ACP_CORE_ABI as unknown as string[], provider);

  // ── Bootstrap: start from current block minus a small lookback ────────────
  const startBlock = await provider.getBlockNumber();
  // Look back 50 blocks (~50 seconds on Monad) to catch any jobs funded while the
  // service was briefly offline. Adjust lookback for longer downtime windows.
  lastProcessedBlock = BigInt(Math.max(0, startBlock - 50));
  console.log(`[operator] Starting from block ${lastProcessedBlock}`);

  // ── Start HTTP health server ──────────────────────────────────────────────
  startHealthServer(provider);

  // ── Polling loop ──────────────────────────────────────────────────────────
  console.log(`[operator] Polling every ${POLL_INTERVAL_MS}ms for funded jobs...`);

  const poll = async (): Promise<void> => {
    if (isProcessing) return; // skip if previous poll still running
    isProcessing = true;

    try {
      const currentBlock = BigInt(await provider.getBlockNumber());
      if (currentBlock <= lastProcessedBlock) {
        isProcessing = false;
        return;
      }

      // Fetch JobFunded events in the new block range
      const fromBlock = lastProcessedBlock + 1n;
      const toBlock   = currentBlock;

      const fundedFilter = acpCore.filters.JobFunded();
      const events = await acpCore.queryFilter(fundedFilter, fromBlock, toBlock);

      if (events.length > 0) {
        console.log(`[operator] ${events.length} JobFunded event(s) in blocks ${fromBlock}–${toBlock}`);
      }

      // Process each funded job
      for (const event of events) {
        const log = event as ethers.EventLog;
        const jobId = BigInt(log.args[0]);

        // Skip if we already processed this job (idempotency)
        if (processedJobs.has(jobId)) continue;

        // Check if this job's evaluator is our SlaEvaluator
        const job = await acpCore.getJob(jobId);
        const jobEvaluator: string = job.evaluator;
        const jobStatus: number = Number(job.status);

        if (jobEvaluator.toLowerCase() !== SLA_EVALUATOR_ADDRESS.toLowerCase()) {
          // Not a Veris job — skip
          continue;
        }

        if (jobStatus !== JOB_STATUS_FUNDED) {
          console.log(`[operator] Job ${jobId} already in status ${jobStatus} — skipping`);
          processedJobs.add(jobId);
          continue;
        }

        // Mark as processing before async work
        processedJobs.add(jobId);

        console.log(`[operator] 🎯 New Veris job detected: ${jobId} (budget: ${job.budget})`);

        // Run evaluation asynchronously — don't block the polling loop
        triggerEvaluation(jobId, "kuru").then((result) => {
          if (!result.success) {
            // Remove from processedJobs so we retry on next poll IF the job is still Funded
            processedJobs.delete(jobId);
            console.warn(`[operator] Job ${jobId} failed — will retry if still Funded`);
          }
        }).catch((err: unknown) => {
          console.error(`[operator] Unexpected error evaluating job ${jobId}:`, err);
          processedJobs.delete(jobId);
        });
      }

      lastProcessedBlock = toBlock;
    } catch (err: unknown) {
      // Log but don't crash — polling continues on RPC errors
      console.error("[operator] Poll error (will retry):", err instanceof Error ? err.message : err);
    } finally {
      isProcessing = false;
    }
  };

  // Start polling
  const intervalHandle = setInterval(poll, POLL_INTERVAL_MS);

  // Graceful shutdown
  process.on("SIGTERM", () => {
    console.log("[operator] SIGTERM received — shutting down gracefully");
    clearInterval(intervalHandle);
    process.exit(0);
  });
  process.on("SIGINT", () => {
    console.log("[operator] SIGINT received — shutting down");
    clearInterval(intervalHandle);
    process.exit(0);
  });

  // Run first poll immediately
  await poll();
}

// ── Health endpoint ───────────────────────────────────────────────────────────

function startHealthServer(provider: ethers.JsonRpcProvider): void {
  const PORT = parseInt(process.env["PORT"] ?? "3001", 10);

  const server = http.createServer(async (req, res) => {
    if (req.method === "GET" && req.url === "/health") {
      try {
        const blockNumber = await provider.getBlockNumber();
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({
          status: "ok",
          operator: (await import("./config.js")).OPERATOR_ADDRESS,
          sellerId: SELLER_ID,
          lastBlock: lastProcessedBlock.toString(),
          currentBlock: blockNumber.toString(),
          processedJobs: processedJobs.size,
          acpCore: ACP_CORE_ADDRESS,
          slaEvaluator: SLA_EVALUATOR_ADDRESS,
        }));
      } catch (err) {
        res.writeHead(503, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ status: "error", error: String(err) }));
      }
    } else {
      res.writeHead(404);
      res.end();
    }
  });

  server.listen(PORT, () => {
    console.log(`[operator] Health endpoint: http://localhost:${PORT}/health`);
  });
}

// ── Entrypoint ────────────────────────────────────────────────────────────────

main().catch((err: unknown) => {
  // Top-level failure: fail loudly, never silently
  console.error("[operator] FATAL:", err instanceof Error ? err.message : err);
  process.exit(1);
});
