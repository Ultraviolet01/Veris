// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {ReputationRegistry} from "../src/ReputationRegistry.sol";
import {IReputationRegistry} from "../src/interfaces/IReputationRegistry.sol";

/// @notice RED tests for ReputationRegistry — written before implementation.
contract ReputationRegistryTest is Test {
    ReputationRegistry public rep;

    address internal evaluator = makeAddr("slaEvaluator");
    address internal stranger = makeAddr("stranger");

    bytes32 internal constant SELLER_A = keccak256("seller.a");
    bytes32 internal constant SELLER_B = keccak256("seller.b");

    function setUp() public {
        rep = new ReputationRegistry(evaluator);
    }

    // ─────────────────────────────────────────────────────────────────────
    // Initial state
    // ─────────────────────────────────────────────────────────────────────

    function test_slaEvaluator_isSet() public view {
        assertEq(rep.slaEvaluator(), evaluator);
    }

    function test_getReputation_newSeller_returnsZeros() public view {
        (uint256 met, uint256 missed, uint256 total, uint256 bps) = rep.getReputation(SELLER_A);
        assertEq(met, 0);
        assertEq(missed, 0);
        assertEq(total, 0);
        assertEq(bps, 0); // 0/0 defined as 0, not revert
    }

    // ─────────────────────────────────────────────────────────────────────
    // recordOutcome
    // ─────────────────────────────────────────────────────────────────────

    function test_recordOutcome_fresh_incrementsMet() public {
        vm.prank(evaluator);
        rep.recordOutcome(SELLER_A, true);

        (uint256 met, uint256 missed, uint256 total, uint256 bps) = rep.getReputation(SELLER_A);
        assertEq(met, 1);
        assertEq(missed, 0);
        assertEq(total, 1);
        assertEq(bps, 10_000); // 100%
    }

    function test_recordOutcome_stale_incrementsMissed() public {
        vm.prank(evaluator);
        rep.recordOutcome(SELLER_A, false);

        (uint256 met, uint256 missed, uint256 total, uint256 bps) = rep.getReputation(SELLER_A);
        assertEq(met, 0);
        assertEq(missed, 1);
        assertEq(total, 1);
        assertEq(bps, 0); // 0%
    }

    function test_recordOutcome_mixedResults_correctBps() public {
        vm.startPrank(evaluator);
        rep.recordOutcome(SELLER_A, true);   // met: 1
        rep.recordOutcome(SELLER_A, true);   // met: 2
        rep.recordOutcome(SELLER_A, true);   // met: 3
        rep.recordOutcome(SELLER_A, false);  // missed: 1 → 75%
        vm.stopPrank();

        (uint256 met, uint256 missed, uint256 total, uint256 bps) = rep.getReputation(SELLER_A);
        assertEq(met, 3);
        assertEq(missed, 1);
        assertEq(total, 4);
        assertEq(bps, 7_500); // 75%
    }

    function test_recordOutcome_nonEvaluator_reverts() public {
        vm.expectRevert();
        vm.prank(stranger);
        rep.recordOutcome(SELLER_A, true);
    }

    function test_recordOutcome_emitsEvent() public {
        vm.expectEmit(true, false, false, true);
        emit IReputationRegistry.ReputationUpdated(SELLER_A, 1, 0, 10_000);

        vm.prank(evaluator);
        rep.recordOutcome(SELLER_A, true);
    }

    // ─────────────────────────────────────────────────────────────────────
    // Multiple sellers independence
    // ─────────────────────────────────────────────────────────────────────

    function test_multipleSellerss_areIndependent() public {
        vm.startPrank(evaluator);
        rep.recordOutcome(SELLER_A, true);
        rep.recordOutcome(SELLER_A, true);
        rep.recordOutcome(SELLER_B, false);
        vm.stopPrank();

        (uint256 metA, , , uint256 bpsA) = rep.getReputation(SELLER_A);
        (uint256 metB, uint256 missedB, , uint256 bpsB) = rep.getReputation(SELLER_B);

        assertEq(metA, 2);
        assertEq(bpsA, 10_000);
        assertEq(metB, 0);
        assertEq(missedB, 1);
        assertEq(bpsB, 0);
    }

    // ─────────────────────────────────────────────────────────────────────
    // Reliability basis points edge cases
    // ─────────────────────────────────────────────────────────────────────

    function test_reliabilityBps_roundingIsFloor() public {
        // 1/3 = 33.33...% → should floor to 3333 bps (not round up to 3334)
        vm.startPrank(evaluator);
        rep.recordOutcome(SELLER_A, true);   // met: 1
        rep.recordOutcome(SELLER_A, false);  // missed: 1
        rep.recordOutcome(SELLER_A, false);  // missed: 2
        vm.stopPrank();

        (, , , uint256 bps) = rep.getReputation(SELLER_A);
        assertEq(bps, 3_333); // floor division
    }
}
