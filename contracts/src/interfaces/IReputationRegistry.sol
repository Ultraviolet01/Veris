// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title IReputationRegistry — Veris on-chain seller reputation interface
interface IReputationRegistry {
    event ReputationUpdated(
        bytes32 indexed sellerId,
        uint256 slaMetCount,
        uint256 slaMissedCount,
        uint256 reliabilityBps
    );

    function recordOutcome(bytes32 sellerId, bool wasFresh) external;

    function getReputation(bytes32 sellerId)
        external
        view
        returns (
            uint256 met,
            uint256 missed,
            uint256 totalJobs,
            uint256 reliabilityBps
        );

    function slaEvaluator() external view returns (address);
}
