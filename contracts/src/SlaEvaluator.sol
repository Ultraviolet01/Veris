// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IACPHook} from "./vendor/IACPHook.sol";
import {IACP} from "./vendor/IACP.sol";
import {ISellerRegistry} from "./interfaces/ISellerRegistry.sol";
import {IReputationRegistry} from "./interfaces/IReputationRegistry.sol";
import {IVerisTreasury} from "./interfaces/IVerisTreasury.sol";
import {SafeERC20} from "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {ECDSA} from "openzeppelin-contracts/contracts/utils/cryptography/ECDSA.sol";
import {MessageHashUtils} from "openzeppelin-contracts/contracts/utils/cryptography/MessageHashUtils.sol";

/// @title SlaEvaluator — Veris freshness enforcement hook
/// @notice Implements IACPHook to plug into ACPCore's job lifecycle.
///         This contract is simultaneously the ERC-8183 provider AND evaluator for every Veris job:
///
///         Provider role: SlaEvaluator is set as job.provider so ACPCore pays 100% of the
///         budget to this contract on complete(). SlaEvaluator then atomically splits:
///           - 98% (configurable) ──► seller's payoutAddress
///           - 2%  (configurable) ──► VerisTreasury
///
///         Evaluator role: SlaEvaluator calls acpCore.complete() or acpCore.reject()
///         itself after verifying the attestation — triggered via the public resolve() function
///         which any party (buyer, seller, operator) may call once a Funded job has an attestation.
///
///         Hook role: beforeAction gates the resolve flow; afterAction records reputation.
///
/// Attestation verification logic:
///   1. Recover signer from ETH-signed hash of (sellerId, jobId, dataHash, sourceBlockNumber, sourceBlockTimestamp)
///   2. Reject if recovered != seller's registered operatorKey
///   3. Reject if sourceBlockTimestamp > block.timestamp (impossible future)
///   4. ageSeconds = block.timestamp - sourceBlockTimestamp
///   5. If ageSeconds <= seller.freshnessWindowSeconds → complete (pay seller, record honour)
///   6. Else → reject (refund buyer, record dishonour)
///
/// Fee design rationale:
///   ACPCore.complete() transfers 100% to job.provider (this contract).
///   We receive 100% in afterAction(complete.selector) and immediately forward:
///     - feeBps portion to VerisTreasury
///     - remainder to seller.payoutAddress
///   This is atomic within the same transaction as complete().
///
/// @dev afterAction MUST NOT revert — failure would roll back settlement. All revert-worthy
///      checks happen in beforeAction or in resolve() before any ACPCore state change.
contract SlaEvaluator is IACPHook {
    using SafeERC20 for IERC20;
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    // ─────────────────────────────────────────────────────────────────────────
    // Types
    // ─────────────────────────────────────────────────────────────────────────

    /// @notice The signed proof-of-freshness delivered with every data response.
    struct Attestation {
        bytes32 sellerId;              // identifies the seller in SellerRegistry
        uint256 jobId;                 // the ACPCore job this attestation is for
        bytes32 dataHash;              // keccak256 of the delivered payload
        uint256 sourceBlockNumber;     // block on source chain when data was read
        uint256 sourceBlockTimestamp;  // timestamp of that block — the freshness anchor
        bytes   signature;             // operatorKey's ETH-signed sig over the above fields
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Events
    // ─────────────────────────────────────────────────────────────────────────

    /// @notice Emitted on every job resolution — one clear event for Envio indexing.
    /// @param accepted true = Completed (seller paid), false = Rejected (buyer refunded)
    event JobResolved(
        uint256 indexed jobId,
        bytes32 indexed sellerId,
        uint256 ageSeconds,
        bool    accepted
    );

    // ─────────────────────────────────────────────────────────────────────────
    // Immutable config
    // ─────────────────────────────────────────────────────────────────────────

    IACP                public immutable acpCore;
    ISellerRegistry     public immutable sellerRegistry;
    IReputationRegistry public immutable reputationRegistry;
    IVerisTreasury      public immutable treasury;
    IERC20              public immutable paymentToken;

    /// @notice Platform fee in basis points (200 = 2%).
    uint256 public immutable feeBps;

    // ─────────────────────────────────────────────────────────────────────────
    // Job-level state
    // ─────────────────────────────────────────────────────────────────────────

    /// @notice Attestation submitted for each jobId, set in resolve().
    mapping(uint256 => Attestation) private _pendingAttestations;

    /// @notice Tracks which jobIds have been resolved to prevent double-resolution.
    mapping(uint256 => bool) private _resolved;

    // ─────────────────────────────────────────────────────────────────────────
    // Constructor
    // ─────────────────────────────────────────────────────────────────────────

    constructor(
        address acpCore_,
        address sellerRegistry_,
        address reputationRegistry_,
        address treasury_,
        uint256 feeBps_,
        address paymentToken_
    ) {
        require(acpCore_ != address(0), "SlaEvaluator: zero acpCore");
        require(sellerRegistry_ != address(0), "SlaEvaluator: zero registry");
        require(reputationRegistry_ != address(0), "SlaEvaluator: zero reputation");
        require(treasury_ != address(0), "SlaEvaluator: zero treasury");
        require(paymentToken_ != address(0), "SlaEvaluator: zero token");
        require(feeBps_ <= 1_000, "SlaEvaluator: fee exceeds 10%"); // sanity cap

        acpCore = IACP(acpCore_);
        sellerRegistry = ISellerRegistry(sellerRegistry_);
        reputationRegistry = IReputationRegistry(reputationRegistry_);
        treasury = IVerisTreasury(treasury_);
        feeBps = feeBps_;
        paymentToken = IERC20(paymentToken_);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Public resolve entry point
    // ─────────────────────────────────────────────────────────────────────────

    /// @notice Submit an attestation and trigger job resolution.
    ///         Callable by anyone (buyer, seller, operator, keeper) once the job is Funded.
    ///         Verifies the attestation, then calls acpCore.complete() or acpCore.reject().
    ///
    /// @dev Fee collection happens in afterAction(complete.selector) after ACPCore
    ///      transfers the full budget to this contract.
    ///
    /// @param att The signed freshness attestation from the seller's operator service.
    /// @param encodedAtt ABI-encoded attestation (same data, for hook data parameter).
    function resolve(Attestation calldata att, bytes calldata encodedAtt) external {
        require(!_resolved[att.jobId], "SlaEvaluator: already resolved");

        // ── Validate attestation ──────────────────────────────────────────
        ISellerRegistry.SellerTerms memory terms = sellerRegistry.getSeller(att.sellerId);
        require(terms.payoutAddress != address(0), "SlaEvaluator: unknown seller");
        require(terms.active, "SlaEvaluator: seller not active");

        // Signature verification
        bytes32 msgHash = keccak256(
            abi.encode(
                att.sellerId,
                att.jobId,
                att.dataHash,
                att.sourceBlockNumber,
                att.sourceBlockTimestamp
            )
        );
        address recovered = msgHash.toEthSignedMessageHash().recover(att.signature);
        require(recovered == terms.operatorKey, "SlaEvaluator: invalid signature");

        // Timestamp sanity: cannot be from the future
        require(att.sourceBlockTimestamp <= block.timestamp, "SlaEvaluator: future timestamp");

        uint256 ageSeconds = block.timestamp - att.sourceBlockTimestamp;
        bool isFresh = ageSeconds <= terms.freshnessWindowSeconds;

        // Store attestation for afterAction to access
        _pendingAttestations[att.jobId] = att;
        _resolved[att.jobId] = true;

        // ── Trigger settlement via ACPCore ─────────────────────────────────
        if (isFresh) {
            // complete() will call afterAction(complete.selector) where we split fees
            acpCore.complete(att.jobId, abi.encode(att.sellerId, ageSeconds), "");
        } else {
            // reject() refunds buyer in full; no fee taken on rejection
            acpCore.reject(att.jobId, abi.encode(att.sellerId, ageSeconds), "");
        }

        // Reputation is recorded in afterAction to ensure ACPCore state settled first
        // (afterAction is called after the state change in ACPCore)

        emit JobResolved(att.jobId, att.sellerId, ageSeconds, isFresh);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // IACPHook implementation
    // ─────────────────────────────────────────────────────────────────────────

    /// @inheritdoc IACPHook
    /// @notice Used as a re-entrancy gate and additional validation point.
    ///         For Veris: all substantive checks happen in resolve() before calling
    ///         acpCore.complete/reject. beforeAction is a lightweight guard.
    function beforeAction(uint256 jobId, bytes4 selector, bytes calldata data) external override {
        require(msg.sender == address(acpCore), "SlaEvaluator: only ACPCore");

        if (selector == IACP.complete.selector || selector == IACP.reject.selector) {
            // complete/reject may only be triggered by our own resolve() flow
            require(_resolved[jobId], "SlaEvaluator: resolve() not called");
        }
        // fund, submit, setProvider, setBudget: pass through (no additional gating needed)
    }

    /// @inheritdoc IACPHook
    /// @notice After complete(): split fees and record reputation.
    ///         After reject(): record reputation only (buyer was already refunded by ACPCore).
    ///
    /// @dev MUST NOT REVERT. All revert-worthy logic is in beforeAction or resolve().
    ///      If any transfer fails here, the entire settlement tx rolls back — acceptable
    ///      because it protects funds (fee transfer failure is better than silent loss).
    function afterAction(uint256 jobId, bytes4 selector, bytes calldata data) external override {
        require(msg.sender == address(acpCore), "SlaEvaluator: only ACPCore");

        Attestation storage att = _pendingAttestations[jobId];
        if (att.sellerId == bytes32(0)) return; // no pending attestation (e.g. direct fund/submit)

        if (selector == IACP.complete.selector) {
            // ACPCore transferred 100% of budget to this contract (us, the provider).
            // Now split: (100% - feeBps) to seller, feeBps to treasury.
            IACP.Job memory job = acpCore.getJob(jobId);
            uint256 budget = job.budget;
            IERC20 token = paymentToken; // immutable — same token for all jobs

            uint256 fee = (budget * feeBps) / 10_000;
            uint256 sellerAmount = budget - fee;

            ISellerRegistry.SellerTerms memory terms = sellerRegistry.getSeller(att.sellerId);

            // Transfer to seller
            token.safeTransfer(terms.payoutAddress, sellerAmount);

            // Transfer fee to treasury
            if (fee > 0) {
                token.safeTransfer(address(treasury), fee);
            }

            // Record honour
            _safeRecordOutcome(att.sellerId, true);

        } else if (selector == IACP.reject.selector) {
            // ACPCore already refunded buyer. Just record dishonour.
            _safeRecordOutcome(att.sellerId, false);
        }
        // Other selectors (fund, submit, etc.): no-op
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Internal helpers
    // ─────────────────────────────────────────────────────────────────────────

    /// @dev Reputation recording wrapped in try/catch so a registry failure
    ///      does NOT roll back settlement. Loud failure: emits an event.
    function _safeRecordOutcome(bytes32 sellerId, bool wasFresh) internal {
        try reputationRegistry.recordOutcome(sellerId, wasFresh) {
            // success
        } catch {
            // Never silent — emit a clear signal even though we can't revert here
            emit ReputationRecordFailed(sellerId, wasFresh);
        }
    }

    /// @notice Emitted if reputation recording fails post-settlement.
    ///         Funds are already settled correctly. This is a non-critical side-effect failure.
    event ReputationRecordFailed(bytes32 indexed sellerId, bool wasFresh);
}
