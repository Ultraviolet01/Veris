// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IReputationRegistry} from "./interfaces/IReputationRegistry.sol";

/// @title ReputationRegistry — Veris on-chain seller trust scores
/// @notice Persistent, queryable ERC-8004-compatible reputation registry.
///         Only the deployed SlaEvaluator contract may write outcomes.
///         Any agent, frontend, or contract may read scores without understanding
///         settlement mechanics — this is intentionally kept separate from SlaEvaluator.
///
/// @dev reliabilityBps = slaMetCount * 10_000 / (slaMetCount + slaMissedCount)
///      Uses integer floor division (Solidity default). 0/0 defined as 0 (no revert).
contract ReputationRegistry is IReputationRegistry {
    // ─────────────────────────────────────────────────────────────────────────
    // State
    // ─────────────────────────────────────────────────────────────────────────

    struct ReputationData {
        uint256 slaMetCount;
        uint256 slaMissedCount;
    }

    /// @notice The address permitted to call recordOutcome (SlaEvaluator).
    address public override slaEvaluator;

    /// @notice Raw outcome counts per seller.
    mapping(bytes32 => ReputationData) private _reputations;

    // ─────────────────────────────────────────────────────────────────────────
    // Constructor
    // ─────────────────────────────────────────────────────────────────────────

    /// @param evaluator_ Initial SlaEvaluator address. May be address(0) if wired post-deploy
    ///                   via setSlaEvaluator (which is callable only once if evaluator is 0).
    constructor(address evaluator_) {
        slaEvaluator = evaluator_;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // One-time wiring function
    // ─────────────────────────────────────────────────────────────────────────

    /// @notice Set the authorised evaluator. Only callable once (when evaluator is address(0)).
    ///         Used by the deploy script to wire contracts after all are deployed.
    function setSlaEvaluator(address evaluator_) external {
        require(slaEvaluator == address(0), "ReputationRegistry: evaluator already set");
        require(evaluator_ != address(0), "ReputationRegistry: zero evaluator");
        slaEvaluator = evaluator_;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Write (evaluator only)
    // ─────────────────────────────────────────────────────────────────────────

    /// @inheritdoc IReputationRegistry
    function recordOutcome(bytes32 sellerId, bool wasFresh) external {
        require(msg.sender == slaEvaluator, "ReputationRegistry: not evaluator");

        ReputationData storage rep = _reputations[sellerId];
        if (wasFresh) {
            rep.slaMetCount += 1;
        } else {
            rep.slaMissedCount += 1;
        }

        uint256 total = rep.slaMetCount + rep.slaMissedCount;
        uint256 bps = total == 0 ? 0 : (rep.slaMetCount * 10_000) / total;

        emit ReputationUpdated(sellerId, rep.slaMetCount, rep.slaMissedCount, bps);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Read (unrestricted)
    // ─────────────────────────────────────────────────────────────────────────

    /// @inheritdoc IReputationRegistry
    function getReputation(bytes32 sellerId)
        external
        view
        returns (
            uint256 met,
            uint256 missed,
            uint256 totalJobs,
            uint256 reliabilityBps
        )
    {
        ReputationData storage rep = _reputations[sellerId];
        met = rep.slaMetCount;
        missed = rep.slaMissedCount;
        totalJobs = met + missed;
        reliabilityBps = totalJobs == 0 ? 0 : (met * 10_000) / totalJobs;
    }
}
