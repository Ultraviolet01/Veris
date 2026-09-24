/**
 * signAttestation.ts — Veris attestation signing module
 *
 * Produces the signed proof-of-freshness that SlaEvaluator.sol verifies on-chain.
 *
 * Signing scheme (must match SlaEvaluator.sol exactly):
 *   msgHash = keccak256(abi.encode(sellerId, jobId, dataHash, sourceBlockNumber, sourceBlockTimestamp))
 *   ethSignedHash = keccak256("\x19Ethereum Signed Message:\n32" || msgHash)
 *   signature = sign(ethSignedHash, operatorPrivateKey)   // 65-byte r+s+v
 *
 * This matches OpenZeppelin's ECDSA.recover() + MessageHashUtils.toEthSignedMessageHash()
 * as used in the contract — verified against the Foundry test suite's _signAttestation helper.
 *
 * The dataHash is keccak256 of the canonicalized JSON payload — ensuring the buyer can
 * independently verify the hash matches the data they received.
 */
import { ethers } from "ethers";
import { getTestnetSigner, SELLER_ID } from "./config.js";

// ── Types ─────────────────────────────────────────────────────────────────────

/** The exact struct shape that SlaEvaluator.sol's Attestation expects. */
export interface Attestation {
  sellerId: string;            // bytes32 — 0x-prefixed 66-char hex
  jobId: bigint;               // uint256
  dataHash: string;            // bytes32 — keccak256 of canonicalized payload
  sourceBlockNumber: bigint;   // uint256 — block on source chain
  sourceBlockTimestamp: bigint; // uint256 — Unix timestamp of that block
  signature: string;           // bytes — 65-byte r+s+v sig (hex string)
}

/** ABI-encoded attestation for passing to SlaEvaluator.resolve(att, encodedAtt). */
export interface SignedAttestation {
  attestation: Attestation;
  encodedAttestation: string; // ABI-encoded bytes
}

// ── Core signing function ─────────────────────────────────────────────────────

/**
 * Hash and sign an attestation with the operator's private key.
 *
 * @param jobId        The ACPCore job ID being served.
 * @param canonicalized The deterministic JSON string of the data payload.
 * @param sourceBlockNumber  Block on source chain when data was read.
 * @param sourceBlockTimestamp  Unix timestamp of that block.
 * @returns SignedAttestation ready to submit to SlaEvaluator.resolve()
 */
export async function signAttestation(
  jobId: bigint,
  canonicalized: string,
  sourceBlockNumber: bigint,
  sourceBlockTimestamp: bigint,
): Promise<SignedAttestation> {
  const signer = getTestnetSigner();

  // ── Step 1: Hash the payload ────────────────────────────────────────────────
  // dataHash = keccak256(canonicalized UTF-8 bytes)
  // This is what buyers can verify independently — hash the response you received.
  const dataHash = ethers.keccak256(ethers.toUtf8Bytes(canonicalized));

  // ── Step 2: Compute msgHash (matches SlaEvaluator.sol line-for-line) ─────────
  // keccak256(abi.encode(sellerId, jobId, dataHash, sourceBlockNumber, sourceBlockTimestamp))
  const msgHash = ethers.keccak256(
    ethers.AbiCoder.defaultAbiCoder().encode(
      ["bytes32", "uint256", "bytes32", "uint256", "uint256"],
      [SELLER_ID, jobId, dataHash, sourceBlockNumber, sourceBlockTimestamp]
    )
  );

  // ── Step 3: Ethereum-prefix and sign ──────────────────────────────────────
  // toEthSignedMessageHash adds "\x19Ethereum Signed Message:\n32" prefix.
  // signMessage() does this automatically in ethers v6.
  const signature = await signer.signMessage(ethers.getBytes(msgHash));

  // ── Step 4: Build the Attestation struct ──────────────────────────────────
  const attestation: Attestation = {
    sellerId: SELLER_ID,
    jobId,
    dataHash,
    sourceBlockNumber,
    sourceBlockTimestamp,
    signature,
  };

  // ── Step 5: ABI-encode for the on-chain call ──────────────────────────────
  // SlaEvaluator.resolve(Attestation calldata att, bytes calldata encodedAtt)
  // encodedAtt is passed as the second argument — SlaEvaluator uses it for
  // any downstream hook data parameters.
  const encodedAttestation = ethers.AbiCoder.defaultAbiCoder().encode(
    [
      "tuple(bytes32 sellerId, uint256 jobId, bytes32 dataHash, uint256 sourceBlockNumber, uint256 sourceBlockTimestamp, bytes signature)",
    ],
    [
      {
        sellerId:              attestation.sellerId,
        jobId:                 attestation.jobId,
        dataHash:              attestation.dataHash,
        sourceBlockNumber:     attestation.sourceBlockNumber,
        sourceBlockTimestamp:  attestation.sourceBlockTimestamp,
        signature:             attestation.signature,
      },
    ]
  );

  console.log(
    `[sign] Signed attestation for job ${jobId}:\n` +
    `  sellerId:            ${SELLER_ID}\n` +
    `  dataHash:            ${dataHash}\n` +
    `  sourceBlockNumber:   ${sourceBlockNumber}\n` +
    `  sourceBlockTimestamp:${sourceBlockTimestamp}\n` +
    `  signer:              ${signer.address}`
  );

  return { attestation, encodedAttestation };
}

// ── Verification helper (for testing / debugging) ─────────────────────────────

/**
 * Recover the signer address from an attestation.
 * Useful for verifying a signature before submitting — and for end-to-end testing.
 */
export function recoverAttestationSigner(att: Attestation): string {
  const msgHash = ethers.keccak256(
    ethers.AbiCoder.defaultAbiCoder().encode(
      ["bytes32", "uint256", "bytes32", "uint256", "uint256"],
      [att.sellerId, att.jobId, att.dataHash, att.sourceBlockNumber, att.sourceBlockTimestamp]
    )
  );

  // ethers.verifyMessage adds the prefix before recovering
  return ethers.verifyMessage(ethers.getBytes(msgHash), att.signature);
}
