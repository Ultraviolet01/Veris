/**
 * submitWork.ts — Veris operator: submit signed work to SlaEvaluator
 *
 * Calls SlaEvaluator.resolve(attestation, encodedAttestation) on Monad testnet.
 * This is the single on-chain transaction the operator sends per job:
 *   - Verifies the attestation (sig check + freshness check) inside the contract
 *   - Calls ACPCore.complete() or ACPCore.reject() atomically
 *   - Routes 98% to seller and 2% to VerisTreasury (on complete)
 *   - Records reputation outcome
 *
 * Why resolve() instead of submit() then complete() separately:
 *   In our deployment, SlaEvaluator is both the ERC-8183 Provider and Evaluator.
 *   ACPCore.complete() accepts Funded jobs directly (no prior submit() required
 *   when provider == evaluator). resolve() is a single atomic call that handles
 *   the full settlement in one transaction, saving one round-trip and one gas spend.
 */
import { ethers } from "ethers";
import { getTestnetSigner, SLA_EVALUATOR_ADDRESS } from "./config.js";
import { SignedAttestation } from "./signAttestation.js";

// ── SlaEvaluator ABI (only the resolve function we call) ─────────────────────
const SLA_EVALUATOR_ABI = [
  `function resolve(
    tuple(
      bytes32 sellerId,
      uint256 jobId,
      bytes32 dataHash,
      uint256 sourceBlockNumber,
      uint256 sourceBlockTimestamp,
      bytes   signature
    ) calldata att,
    bytes calldata encodedAtt
  ) external`,
  // Events we listen for to confirm outcome
  `event JobResolved(uint256 indexed jobId, bytes32 indexed sellerId, uint256 ageSeconds, bool accepted)`,
] as const;

// ── ACPCore ABI (minimal — for reading job state) ────────────────────────────
const ACP_CORE_ABI = [
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

export const JOB_STATUS = {
  Open: 0,
  Funded: 1,
  Submitted: 2,
  Completed: 3,
  Rejected: 4,
  Expired: 5,
} as const;

// ── Submit result ─────────────────────────────────────────────────────────────

export interface SubmitResult {
  txHash: string;
  jobId: bigint;
  accepted: boolean;
  ageSeconds: bigint;
  gasUsed: bigint;
}

// ── Core submit function ───────────────────────────────────────────────────────

/**
 * Submit signed work to SlaEvaluator and wait for the transaction to be confirmed.
 *
 * @param signed The signed attestation from signAttestation().
 * @param acpCoreAddress The ACPCore contract address (for pre-flight job status check).
 * @returns SubmitResult with the transaction hash, outcome, and gas used.
 *
 * @throws if the transaction reverts — fails loudly per hard constraint.
 */
export async function submitWork(
  signed: SignedAttestation,
  acpCoreAddress: string,
): Promise<SubmitResult> {
  const signer = getTestnetSigner();
  const jobId = signed.attestation.jobId;

  // ── Pre-flight: confirm job is still Funded (not already resolved/expired) ──
  const acpCore = new ethers.Contract(acpCoreAddress, ACP_CORE_ABI, signer);
  const job = await acpCore.getJob(jobId);

  if (Number(job.status) !== JOB_STATUS.Funded && Number(job.status) !== JOB_STATUS.Submitted) {
    throw new Error(
      `[submitWork] Job ${jobId} is not in a resolvable state. ` +
      `Current status: ${job.status} (${statusName(Number(job.status))}). ` +
      `Skipping resolve() call.`
    );
  }

  console.log(
    `[submitWork] Submitting resolve() for job ${jobId} ` +
    `(budget: ${job.budget} token units, expiry: ${new Date(Number(job.expiredAt) * 1000).toISOString()})`
  );

  // ── Call SlaEvaluator.resolve() ───────────────────────────────────────────
  const slaEval = new ethers.Contract(SLA_EVALUATOR_ADDRESS, SLA_EVALUATOR_ABI, signer);

  // Encode the struct argument for the call
  const att = signed.attestation;

  let tx: ethers.TransactionResponse;
  try {
    tx = await slaEval.resolve(
      {
        sellerId:             att.sellerId,
        jobId:                att.jobId,
        dataHash:             att.dataHash,
        sourceBlockNumber:    att.sourceBlockNumber,
        sourceBlockTimestamp: att.sourceBlockTimestamp,
        signature:            att.signature,
      },
      signed.encodedAttestation,
      {
        // Explicit gas limit prevents silent out-of-gas failure
        gasLimit: 500_000n,
      }
    );
  } catch (err: unknown) {
    // Fail loudly — never silently swallow a revert
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(
      `[submitWork] SlaEvaluator.resolve() reverted for job ${jobId}.\n` +
      `  This means the attestation failed on-chain (bad sig, wrong seller, already resolved, etc.).\n` +
      `  Raw error: ${msg}`
    );
  }

  console.log(`[submitWork] Transaction submitted: ${tx.hash}. Waiting for confirmation...`);

  // ── Wait for confirmation ─────────────────────────────────────────────────
  const receipt = await tx.wait(1); // 1 block confirmation
  if (!receipt) {
    throw new Error(`[submitWork] Transaction ${tx.hash} not confirmed after wait(1). Check network.`);
  }

  if (receipt.status === 0) {
    throw new Error(
      `[submitWork] Transaction ${tx.hash} was mined but reverted on-chain. ` +
      `Check the contract state and attestation validity.`
    );
  }

  // ── Parse the JobResolved event ───────────────────────────────────────────
  const iface = new ethers.Interface(SLA_EVALUATOR_ABI as unknown as string[]);
  let accepted = false;
  let ageSeconds = 0n;

  for (const log of receipt.logs) {
    try {
      const parsed = iface.parseLog({ topics: [...log.topics], data: log.data });
      if (parsed?.name === "JobResolved") {
        accepted   = Boolean(parsed.args[3]);
        ageSeconds = BigInt(parsed.args[2]);
        break;
      }
    } catch {
      // Not a SlaEvaluator log — skip
    }
  }

  const outcome = accepted ? "COMPLETED (seller paid)" : "REJECTED (buyer refunded)";
  console.log(
    `[submitWork] ✅ Job ${jobId} resolved — ${outcome}\n` +
    `  ageSeconds: ${ageSeconds}\n` +
    `  txHash: ${tx.hash}\n` +
    `  gasUsed: ${receipt.gasUsed}`
  );

  return {
    txHash: tx.hash,
    jobId,
    accepted,
    ageSeconds,
    gasUsed: receipt.gasUsed,
  };
}

// ── Helper ────────────────────────────────────────────────────────────────────

function statusName(status: number): string {
  const names = ["Open", "Funded", "Submitted", "Completed", "Rejected", "Expired"];
  return names[status] ?? `Unknown(${status})`;
}
