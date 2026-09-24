// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console2} from "forge-std/Test.sol";
import {SellerRegistry} from "../../src/SellerRegistry.sol";
import {ReputationRegistry} from "../../src/ReputationRegistry.sol";
import {VerisTreasury} from "../../src/VerisTreasury.sol";
import {SlaEvaluator} from "../../src/SlaEvaluator.sol";
import {ACPCore} from "../../src/vendor/ACPCore.sol";
import {IACP} from "../../src/vendor/IACP.sol";
import {MockERC20} from "../helpers/MockERC20.sol";

/// @notice Full end-to-end lifecycle test — RED until all contracts implemented.
///         Simulates the complete Veris marketplace flow from registration to settlement.
contract FullJobLifecycleTest is Test {
    // Contracts
    SellerRegistry internal registry;
    ReputationRegistry internal reputation;
    VerisTreasury internal treasury;
    ACPCore internal acpCore;
    SlaEvaluator internal slaEval;
    MockERC20 internal usdc;

    // Actors
    address internal treasuryOwner = makeAddr("treasuryOwner");
    address internal sellerPayout = makeAddr("sellerPayout");
    uint256 internal operatorPrivKey = 0xABCDEF;
    address internal operatorKey;
    address internal buyer = makeAddr("buyer");

    bytes32 internal constant SELLER_ID = keccak256("integration.seller");
    bytes32 internal constant DATASET_ID = keccak256("integration.dataset");
    uint256 internal constant FRESHNESS = 60;       // 60 seconds
    uint256 internal constant PRICE = 1_000_000;    // 1.00 USDC
    uint256 internal constant FEE_BPS = 200;        // 2%

    function setUp() public {
        operatorKey = vm.addr(operatorPrivKey);

        usdc = new MockERC20("USD Coin", "USDC", 6);

        // Deploy — VerisTreasury must be deployed by treasuryOwner (sets owner = msg.sender)
        registry = new SellerRegistry();
        reputation = new ReputationRegistry(address(0));
        vm.prank(treasuryOwner);
        treasury = new VerisTreasury(address(usdc));
        acpCore = new ACPCore(address(usdc));
        slaEval = new SlaEvaluator(address(acpCore), address(registry), address(reputation), address(treasury), FEE_BPS, address(usdc));

        // Wire
        reputation.setSlaEvaluator(address(slaEval));

        // Treasury setup — treasuryOwner is now the owner
        vm.startPrank(treasuryOwner);
        treasury.setAllowlist(treasuryOwner, true);
        treasury.setCaps(10_000_000, 100_000_000);
        vm.stopPrank();

        // Register seller
        vm.prank(sellerPayout);
        registry.registerSeller(SELLER_ID, sellerPayout, operatorKey, PRICE, FRESHNESS, DATASET_ID, 1);

        // Fund buyer
        usdc.mint(buyer, PRICE * 10);
    }

    // ─────────────────────────────────────────────────────────────────────
    // Scenario 1: Happy path — fresh attestation, seller paid, reputation++
    // ─────────────────────────────────────────────────────────────────────

    function test_scenario_freshQuery_sellerPaid_reputationIncremented() public {
        uint256 jobId = _createAndFundJob();

        uint256 sourceTs = block.timestamp - 5; // 5s old, within 60s window
        SlaEvaluator.Attestation memory att = _makeAttestation(jobId, sourceTs);
        slaEval.resolve(att, abi.encode(att));

        // Job completed
        IACP.Job memory job = acpCore.getJob(jobId);
        assertEq(uint8(job.status), uint8(IACP.JobStatus.Completed), "Job should be Completed");

        // Seller got 98%
        uint256 expectedPayout = PRICE - (PRICE * FEE_BPS / 10_000);
        assertEq(usdc.balanceOf(sellerPayout), expectedPayout, "Seller payout incorrect");

        // Treasury got 2%
        uint256 expectedFee = PRICE * FEE_BPS / 10_000;
        assertEq(usdc.balanceOf(address(treasury)), expectedFee, "Treasury fee incorrect");

        // Buyer balance unchanged (beyond initial payment)
        // Reputation incremented
        (uint256 met, , , uint256 bps) = reputation.getReputation(SELLER_ID);
        assertEq(met, 1, "Reputation met not incremented");
        assertEq(bps, 10_000, "Reliability should be 100%");
    }

    // ─────────────────────────────────────────────────────────────────────
    // Scenario 2: Stale attestation — buyer refunded, no fee, reputation--
    // ─────────────────────────────────────────────────────────────────────

    function test_scenario_staleQuery_buyerRefunded_reputationMissed() public {
        uint256 jobId = _createAndFundJob();

        uint256 buyerBefore = usdc.balanceOf(buyer);
        uint256 sourceTs = block.timestamp - FRESHNESS - 1; // one second past window
        SlaEvaluator.Attestation memory att = _makeAttestation(jobId, sourceTs);
        slaEval.resolve(att, abi.encode(att));

        // Job rejected
        IACP.Job memory job = acpCore.getJob(jobId);
        assertEq(uint8(job.status), uint8(IACP.JobStatus.Rejected), "Job should be Rejected");

        // Full refund to buyer (no fee on rejection)
        assertEq(usdc.balanceOf(buyer), buyerBefore + PRICE, "Buyer not fully refunded");

        // Treasury received nothing
        assertEq(usdc.balanceOf(address(treasury)), 0, "No fee should be taken on rejection");

        // Reputation missed
        (, uint256 missed, , uint256 bps) = reputation.getReputation(SELLER_ID);
        assertEq(missed, 1, "Reputation missed not incremented");
        assertEq(bps, 0, "Reliability should be 0%");
    }

    // ─────────────────────────────────────────────────────────────────────
    // Scenario 3: Forged signature — revert, no state change
    // ─────────────────────────────────────────────────────────────────────

    function test_scenario_forgedSignature_noStateChange() public {
        uint256 jobId = _createAndFundJob();

        uint256 wrongKey = 0xDEAD;
        uint256 sourceTs = block.timestamp - 5;
        bytes memory forgedSig = _signAttestation(SELLER_ID, jobId, keccak256("data"), 100, sourceTs, wrongKey);

        SlaEvaluator.Attestation memory att = SlaEvaluator.Attestation({
            sellerId: SELLER_ID, jobId: jobId, dataHash: keccak256("data"),
            sourceBlockNumber: 100, sourceBlockTimestamp: sourceTs, signature: forgedSig
        });

        vm.expectRevert();
        slaEval.resolve(att, abi.encode(att));

        // Job still funded
        IACP.Job memory job = acpCore.getJob(jobId);
        assertEq(uint8(job.status), uint8(IACP.JobStatus.Funded), "Job state should be unchanged");

        // Reputation unchanged
        (uint256 met, uint256 missed, , ) = reputation.getReputation(SELLER_ID);
        assertEq(met, 0);
        assertEq(missed, 0);
    }

    // ─────────────────────────────────────────────────────────────────────
    // Scenario 4: Timeout — buyer claims refund after expiry
    // ─────────────────────────────────────────────────────────────────────

    function test_scenario_expiredJob_buyerClaimsRefund() public {
        uint256 jobId = _createAndFundJob();

        uint256 buyerBefore = usdc.balanceOf(buyer);

        // Fast-forward past expiry
        vm.warp(block.timestamp + 2 hours);

        // Anyone can call claimRefund — test from a stranger
        address stranger = makeAddr("stranger");
        vm.prank(stranger);
        acpCore.claimRefund(jobId);

        // Buyer refunded in full
        assertEq(usdc.balanceOf(buyer), buyerBefore + PRICE, "Expired: buyer not refunded");

        // Job expired
        IACP.Job memory job = acpCore.getJob(jobId);
        assertEq(uint8(job.status), uint8(IACP.JobStatus.Expired), "Job should be Expired");
    }

    // ─────────────────────────────────────────────────────────────────────
    // Scenario 5: Inclusive boundary — ageSeconds == freshnessWindow → Completed
    // ─────────────────────────────────────────────────────────────────────

    function test_scenario_exactBoundary_completesJob() public {
        uint256 jobId = _createAndFundJob();

        uint256 sourceTs = block.timestamp - FRESHNESS; // exactly at window
        SlaEvaluator.Attestation memory att = _makeAttestation(jobId, sourceTs);
        slaEval.resolve(att, abi.encode(att));

        IACP.Job memory job = acpCore.getJob(jobId);
        assertEq(uint8(job.status), uint8(IACP.JobStatus.Completed), "Inclusive boundary should complete");
    }

    // ─────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────

    function _createAndFundJob() internal returns (uint256 jobId) {
        vm.startPrank(buyer);
        usdc.approve(address(acpCore), PRICE);
        jobId = acpCore.createJob(
            address(slaEval),
            address(slaEval),
            block.timestamp + 1 hours,
            "Veris integration test job",
            address(slaEval)
        );
        acpCore.setBudget(jobId, PRICE, "");
        acpCore.fund(jobId, PRICE, "");
        vm.stopPrank();
    }

    function _makeAttestation(uint256 jobId, uint256 sourceTs)
        internal
        view
        returns (SlaEvaluator.Attestation memory)
    {
        bytes memory sig = _signAttestation(
            SELLER_ID, jobId, keccak256("live.data.payload"), block.number, sourceTs, operatorPrivKey
        );
        return SlaEvaluator.Attestation({
            sellerId: SELLER_ID,
            jobId: jobId,
            dataHash: keccak256("live.data.payload"),
            sourceBlockNumber: block.number,
            sourceBlockTimestamp: sourceTs,
            signature: sig
        });
    }

    function _signAttestation(
        bytes32 sellerId,
        uint256 _jobId,
        bytes32 dataHash,
        uint256 sourceBlockNumber,
        uint256 sourceBlockTimestamp,
        uint256 privKey
    ) internal pure returns (bytes memory) {
        bytes32 msgHash = keccak256(
            abi.encode(sellerId, _jobId, dataHash, sourceBlockNumber, sourceBlockTimestamp)
        );
        bytes32 ethSignedHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", msgHash));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(privKey, ethSignedHash);
        return abi.encodePacked(r, s, v);
    }
}
