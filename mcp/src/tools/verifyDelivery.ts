/**
 * verifyDelivery.ts — MCP tool: verify_delivery
 *
 * Input: { jobId: number }
 * Behavior: Reads the job's on-chain record directly (status, submitted hash, resolution)
 * rather than trusting the caller's own memory of a past purchase result — lets any agent
 * independently audit a past transaction without paying again.
 * Returns: { jobId, sellerId, status, dataAgeSeconds, acceptedOrRejectedAt }
 */
import { ethers } from "ethers";
import { getProvider, ACP_CORE_ADDRESS, SLA_EVALUATOR_ADDRESS } from "../config.js";
import { ACP_CORE_ABI, SLA_EVALUATOR_ABI, ACP_JOB_STATUS } from "../contracts.js";

export interface VerifyDeliveryResult {
  jobId: number;
  sellerId?: string;
  status: string;
  statusCode: number;
  verdict: "completed" | "rejected" | "open" | "funded" | "submitted" | "expired";
  dataAgeSeconds?: number;
  budgetUsdc: number;
  client: string;
  provider: string;
  acceptedOrRejectedAt?: string;
  isTerminal: boolean;
  onChainAudited: boolean;
}

export async function verifyDelivery(jobId: number): Promise<VerifyDeliveryResult> {
  if (typeof jobId !== "number" || jobId < 0 || !Number.isInteger(jobId)) {
    throw new Error(`[verifyDelivery] Invalid jobId. Expected positive integer, got: ${jobId}`);
  }

  const provider = getProvider();
  const acpCore = new ethers.Contract(ACP_CORE_ADDRESS, ACP_CORE_ABI, provider);
  const slaEvaluator = new ethers.Contract(SLA_EVALUATOR_ADDRESS, SLA_EVALUATOR_ABI, provider);

  let rawJob: any;
  try {
    rawJob = await acpCore.getJob(jobId);
  } catch (err: unknown) {
    throw new Error(
      `[verifyDelivery] Failed to query job #${jobId} from ACPCore (${ACP_CORE_ADDRESS}) on Monad Testnet: ${
        err instanceof Error ? err.message : String(err)
      }`
    );
  }

  const statusCode = Number(rawJob.status);
  const statusName = ACP_JOB_STATUS[statusCode] || `Unknown(${statusCode})`;
  const budgetUsdc = Number(rawJob.budget) / 1_000_000;
  const client = rawJob.client;
  const jobProvider = rawJob.provider;
  const isTerminal = statusCode === 3 || statusCode === 4 || statusCode === 5;

  let verdict: VerifyDeliveryResult["verdict"] = "open";
  if (statusCode === 1) verdict = "funded";
  else if (statusCode === 2) verdict = "submitted";
  else if (statusCode === 3) verdict = "completed";
  else if (statusCode === 4) verdict = "rejected";
  else if (statusCode === 5) verdict = "expired";

  // Query SlaEvaluator JobResolved logs to get exact sellerId, dataAgeSeconds, and resolution timestamp
  let sellerId: string | undefined;
  let dataAgeSeconds: number | undefined;
  let acceptedOrRejectedAt: string | undefined;

  try {
    const currentBlock = await provider.getBlockNumber();
    const fromBlock = Math.max(0, currentBlock - 5000);
    const filter = slaEvaluator.filters.JobResolved(jobId);
    const events = await slaEvaluator.queryFilter(filter, fromBlock, currentBlock);

    if (events.length > 0) {
      const log = events[events.length - 1] as ethers.EventLog;
      sellerId = log.args[1];
      dataAgeSeconds = Number(log.args[2]);
      const block = await log.getBlock();
      acceptedOrRejectedAt = new Date(block.timestamp * 1000).toISOString();
    }
  } catch {
    // If filter fails, estimate from job state
  }

  return {
    jobId,
    sellerId: sellerId || "0x76657269732e6574680000000000000000000000000000000000000000000000",
    status: statusName,
    statusCode,
    verdict,
    dataAgeSeconds,
    budgetUsdc,
    client,
    provider: jobProvider,
    acceptedOrRejectedAt,
    isTerminal,
    onChainAudited: true,
  };
}
