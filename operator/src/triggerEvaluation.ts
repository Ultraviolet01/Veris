/**
 * triggerEvaluation.ts — Veris operator: full job evaluation pipeline
 *
 * Orchestrates the complete per-job flow:
 *   1. Fetch data from source chain (Monad mainnet via HyperRPC)
 *   2. Sign the attestation with the operator's private key
 *   3. Submit to SlaEvaluator.resolve() on Monad testnet
 *   4. Return the outcome
 *
 * This is the function called by index.ts for each newly funded job.
 * Separation of concerns: index.ts handles event listening and retries;
 * triggerEvaluation.ts handles the per-job business logic.
 */
import { fetchData, DatasetKey } from "./fetchData.js";
import { signAttestation, recoverAttestationSigner } from "./signAttestation.js";
import { submitWork, SubmitResult } from "./submitWork.js";
import { ACP_CORE_ADDRESS, OPERATOR_ADDRESS } from "./config.js";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface EvaluationResult {
  jobId: bigint;
  success: boolean;
  outcome: "completed" | "rejected" | "error";
  txHash?: string;
  error?: string;
  ageSeconds?: bigint;
}

// ── Core evaluation pipeline ──────────────────────────────────────────────────

/**
 * Run the full evaluation pipeline for a single funded job.
 *
 * @param jobId    The ACPCore job ID to resolve.
 * @param dataset  Which dataset to fetch (default: "kuru").
 * @returns EvaluationResult with the full outcome.
 */
export async function triggerEvaluation(
  jobId: bigint,
  dataset: DatasetKey = "kuru",
): Promise<EvaluationResult> {
  console.log(`\n[eval] ──── Evaluating job ${jobId} (dataset: ${dataset}) ────`);

  try {
    // ── Step 1: Fetch live data from source chain ───────────────────────────
    console.log(`[eval] Step 1/3: Fetching ${dataset} data from Monad mainnet...`);
    const fetchResult = await fetchData(dataset);
    console.log(
      `[eval]   Payload: ${fetchResult.payload.dataset} = ${fetchResult.payload.value}\n` +
      `[eval]   Source block: ${fetchResult.sourceBlockNumber} @ ts=${fetchResult.sourceBlockTimestamp}`
    );

    // ── Step 2: Sign attestation ────────────────────────────────────────────
    console.log(`[eval] Step 2/3: Signing attestation...`);
    const signed = await signAttestation(
      jobId,
      fetchResult.canonicalized,
      fetchResult.sourceBlockNumber,
      fetchResult.sourceBlockTimestamp,
    );

    // Self-verify before submitting — fail loudly if our own signature is wrong
    const recoveredSigner = recoverAttestationSigner(signed.attestation);
    if (recoveredSigner.toLowerCase() !== OPERATOR_ADDRESS.toLowerCase()) {
      throw new Error(
        `[eval] Signature self-verification FAILED.\n` +
        `  Expected signer: ${OPERATOR_ADDRESS}\n` +
        `  Recovered:       ${recoveredSigner}\n` +
        `  This should never happen — check OPERATOR_PRIVATE_KEY config.`
      );
    }
    console.log(`[eval]   Signature self-verified ✓ (signer: ${OPERATOR_ADDRESS})`);

    // ── Step 3: Submit to SlaEvaluator ─────────────────────────────────────
    console.log(`[eval] Step 3/3: Submitting to SlaEvaluator on Monad testnet...`);
    const submitResult: SubmitResult = await submitWork(signed, ACP_CORE_ADDRESS);

    console.log(
      `[eval] ✅ Job ${jobId} evaluation complete:\n` +
      `[eval]   Outcome:     ${submitResult.accepted ? "COMPLETED (seller paid 98%)" : "REJECTED (buyer refunded 100%)"}\n` +
      `[eval]   Age:         ${submitResult.ageSeconds}s\n` +
      `[eval]   Tx:          ${submitResult.txHash}\n` +
      `[eval]   Gas used:    ${submitResult.gasUsed}\n` +
      `[eval] ────────────────────────────────────────────────`
    );

    return {
      jobId,
      success: true,
      outcome: submitResult.accepted ? "completed" : "rejected",
      txHash: submitResult.txHash,
      ageSeconds: submitResult.ageSeconds,
    };

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(
      `[eval] ❌ Job ${jobId} evaluation FAILED:\n` +
      `[eval]   ${message}\n` +
      `[eval] ────────────────────────────────────────────────`
    );
    return {
      jobId,
      success: false,
      outcome: "error",
      error: message,
    };
  }
}
