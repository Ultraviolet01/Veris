// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {SlaEvaluator} from "../src/SlaEvaluator.sol";
import {SellerRegistry} from "../src/SellerRegistry.sol";
import {ReputationRegistry} from "../src/ReputationRegistry.sol";
import {VerisTreasury} from "../src/VerisTreasury.sol";
import {ACPCore} from "../src/vendor/ACPCore.sol";
import {IACP} from "../src/vendor/IACP.sol";
import {MockERC20} from "./helpers/MockERC20.sol";

/// @notice RED tests for SlaEvaluator — written before implementation.
///         Tests cover the core freshness + signature verification logic.
contract SlaEvaluatorTest is Test {
    // Contracts
    SellerRegistry public registry;
    ReputationRegistry public reputation;
    VerisTreasury public treasury;
    ACPCore public acpCore;
    SlaEvaluator public evaluator;
    MockERC20 public usdc;

    // Test actors
    uint256 internal operatorPrivKey = 0xA11CE;
    address internal operatorKey;
    address internal seller = makeAddr("seller");
    address internal buyer = makeAddr("buyer");
    address internal stranger = makeAddr("stranger");

    bytes32 internal constant SELLER_ID = keccak256("test.seller");
    bytes32 internal constant DATASET_ID = keccak256("test.dataset");
    uint256 internal constant FRESHNESS_WINDOW = 60; // 60 seconds
    uint256 internal constant PRICE = 100_000; // 0.10 USDC

    // Job parameters
    uint256 internal jobId;

    function setUp() public {
        operatorKey = vm.addr(operatorPrivKey);

        usdc = new MockERC20("USD Coin", "USDC", 6);

        // Deploy in order
        registry = new SellerRegistry();
        reputation = new ReputationRegistry(address(0)); // evaluator set after deploy
        treasury = new VerisTreasury(address(usdc));
        acpCore = new ACPCore(address(usdc));
        evaluator = new SlaEvaluator(
            address(acpCore),
            address(registry),
            address(reputation),
            address(treasury),
            200, // 2% fee in basis points
            address(usdc)
        );

        // Wire reputation to evaluator
        reputation.setSlaEvaluator(address(evaluator));

        // Register seller
        vm.prank(seller);
        registry.registerSeller(
            SELLER_ID, seller, operatorKey, PRICE, FRESHNESS_WINDOW, DATASET_ID, 1
        );

        // Create and fund a job as buyer
        usdc.mint(buyer, PRICE);
        vm.startPrank(buyer);
        usdc.approve(address(acpCore), PRICE);
        jobId = acpCore.createJob(
            address(evaluator), // SlaEvaluator is the provider — receives 100%, splits fees
            address(evaluator), // SlaEvaluator is also the evaluator (it calls complete/reject)
            block.timestamp + 1 hours,
            "Veris query job",
            address(evaluator)  // hook
        );
        acpCore.setBudget(jobId, PRICE, "");
        acpCore.fund(jobId, PRICE, "");
        vm.stopPrank();
    }

    // ─────────────────────────────────────────────────────────────────────
    // Happy path: fresh, valid attestation
    // ─────────────────────────────────────────────────────────────────────

    function test_resolve_freshAttestation_completesJob() public {
        uint256 sourceTs = block.timestamp - 5; // 5 seconds old — within 60s window
        bytes memory sig = _signAttestation(SELLER_ID, jobId, keccak256("data"), 100, sourceTs, operatorPrivKey);

        SlaEvaluator.Attestation memory att = SlaEvaluator.Attestation({
            sellerId: SELLER_ID,
            jobId: jobId,
            dataHash: keccak256("data"),
            sourceBlockNumber: 100,
            sourceBlockTimestamp: sourceTs,
            signature: sig
        });

        evaluator.resolve(att, abi.encode(att));

        IACP.Job memory job = acpCore.getJob(jobId);
        assertEq(uint8(job.status), uint8(IACP.JobStatus.Completed));
    }

    function test_resolve_freshAttestation_paysSeller() public {
        uint256 sourceTs = block.timestamp - 5;
        bytes memory sig = _signAttestation(SELLER_ID, jobId, keccak256("data"), 100, sourceTs, operatorPrivKey);

        uint256 sellerBefore = usdc.balanceOf(seller);

        SlaEvaluator.Attestation memory att = SlaEvaluator.Attestation({
            sellerId: SELLER_ID,
            jobId: jobId,
            dataHash: keccak256("data"),
            sourceBlockNumber: 100,
            sourceBlockTimestamp: sourceTs,
            signature: sig
        });
        evaluator.resolve(att, abi.encode(att));

        // Seller receives 98% of PRICE
        uint256 expectedPayout = PRICE - (PRICE * 200 / 10_000);
        assertEq(usdc.balanceOf(seller), sellerBefore + expectedPayout);
    }

    function test_resolve_freshAttestation_feeGoesToTreasury() public {
        uint256 sourceTs = block.timestamp - 5;
        bytes memory sig = _signAttestation(SELLER_ID, jobId, keccak256("data"), 100, sourceTs, operatorPrivKey);

        uint256 treasuryBefore = usdc.balanceOf(address(treasury));

        SlaEvaluator.Attestation memory att = SlaEvaluator.Attestation({
            sellerId: SELLER_ID,
            jobId: jobId,
            dataHash: keccak256("data"),
            sourceBlockNumber: 100,
            sourceBlockTimestamp: sourceTs,
            signature: sig
        });
        evaluator.resolve(att, abi.encode(att));

        uint256 expectedFee = PRICE * 200 / 10_000; // 2%
        assertEq(usdc.balanceOf(address(treasury)), treasuryBefore + expectedFee);
    }

    function test_resolve_freshAttestation_incrementsReputation() public {
        uint256 sourceTs = block.timestamp - 5;
        bytes memory sig = _signAttestation(SELLER_ID, jobId, keccak256("data"), 100, sourceTs, operatorPrivKey);

        SlaEvaluator.Attestation memory att = SlaEvaluator.Attestation({
            sellerId: SELLER_ID, jobId: jobId, dataHash: keccak256("data"),
            sourceBlockNumber: 100, sourceBlockTimestamp: sourceTs, signature: sig
        });
        evaluator.resolve(att, abi.encode(att));

        (uint256 met, , , ) = reputation.getReputation(SELLER_ID);
        assertEq(met, 1);
    }

    // ─────────────────────────────────────────────────────────────────────
    // Inclusive boundary: ageSeconds == freshnessWindowSeconds → Completed
    // ─────────────────────────────────────────────────────────────────────

    function test_resolve_exactBoundary_completesJob() public {
        // ageSeconds = FRESHNESS_WINDOW exactly — must still complete (inclusive)
        uint256 sourceTs = block.timestamp - FRESHNESS_WINDOW;
        bytes memory sig = _signAttestation(SELLER_ID, jobId, keccak256("data"), 100, sourceTs, operatorPrivKey);

        SlaEvaluator.Attestation memory att = SlaEvaluator.Attestation({
            sellerId: SELLER_ID, jobId: jobId, dataHash: keccak256("data"),
            sourceBlockNumber: 100, sourceBlockTimestamp: sourceTs, signature: sig
        });
        evaluator.resolve(att, abi.encode(att));

        IACP.Job memory job = acpCore.getJob(jobId);
        assertEq(uint8(job.status), uint8(IACP.JobStatus.Completed));
    }

    // ─────────────────────────────────────────────────────────────────────
    // Stale path: ageSeconds > freshnessWindowSeconds → Rejected
    // ─────────────────────────────────────────────────────────────────────

    function test_resolve_staleAttestation_rejectsJob() public {
        uint256 sourceTs = block.timestamp - FRESHNESS_WINDOW - 1; // one second past window
        bytes memory sig = _signAttestation(SELLER_ID, jobId, keccak256("data"), 100, sourceTs, operatorPrivKey);

        SlaEvaluator.Attestation memory att = SlaEvaluator.Attestation({
            sellerId: SELLER_ID, jobId: jobId, dataHash: keccak256("data"),
            sourceBlockNumber: 100, sourceBlockTimestamp: sourceTs, signature: sig
        });
        evaluator.resolve(att, abi.encode(att));

        IACP.Job memory job = acpCore.getJob(jobId);
        assertEq(uint8(job.status), uint8(IACP.JobStatus.Rejected));
    }

    function test_resolve_staleAttestation_refundsBuyer() public {
        uint256 sourceTs = block.timestamp - FRESHNESS_WINDOW - 1;
        bytes memory sig = _signAttestation(SELLER_ID, jobId, keccak256("data"), 100, sourceTs, operatorPrivKey);

        uint256 buyerBefore = usdc.balanceOf(buyer);

        SlaEvaluator.Attestation memory att = SlaEvaluator.Attestation({
            sellerId: SELLER_ID, jobId: jobId, dataHash: keccak256("data"),
            sourceBlockNumber: 100, sourceBlockTimestamp: sourceTs, signature: sig
        });
        evaluator.resolve(att, abi.encode(att));

        // Full refund, no fee taken on rejection
        assertEq(usdc.balanceOf(buyer), buyerBefore + PRICE);
    }

    function test_resolve_staleAttestation_incrementsMissed() public {
        uint256 sourceTs = block.timestamp - FRESHNESS_WINDOW - 1;
        bytes memory sig = _signAttestation(SELLER_ID, jobId, keccak256("data"), 100, sourceTs, operatorPrivKey);

        SlaEvaluator.Attestation memory att = SlaEvaluator.Attestation({
            sellerId: SELLER_ID, jobId: jobId, dataHash: keccak256("data"),
            sourceBlockNumber: 100, sourceBlockTimestamp: sourceTs, signature: sig
        });
        evaluator.resolve(att, abi.encode(att));

        (, uint256 missed, , ) = reputation.getReputation(SELLER_ID);
        assertEq(missed, 1);
    }

    // ─────────────────────────────────────────────────────────────────────
    // Security: forged signature
    // ─────────────────────────────────────────────────────────────────────

    function test_resolve_forgedSignature_reverts() public {
        uint256 wrongKey = 0xBAD0;
        uint256 sourceTs = block.timestamp - 5;
        bytes memory forgedSig = _signAttestation(SELLER_ID, jobId, keccak256("data"), 100, sourceTs, wrongKey);

        SlaEvaluator.Attestation memory att = SlaEvaluator.Attestation({
            sellerId: SELLER_ID, jobId: jobId, dataHash: keccak256("data"),
            sourceBlockNumber: 100, sourceBlockTimestamp: sourceTs, signature: forgedSig
        });

        vm.expectRevert();
        evaluator.resolve(att, abi.encode(att));

        // Crucially: no state change — job still Funded
        IACP.Job memory job = acpCore.getJob(jobId);
        assertEq(uint8(job.status), uint8(IACP.JobStatus.Funded));
    }

    // ─────────────────────────────────────────────────────────────────────
    // Security: future timestamp
    // ─────────────────────────────────────────────────────────────────────

    function test_resolve_futureTimestamp_reverts() public {
        uint256 futureTs = block.timestamp + 100; // impossible future claim
        bytes memory sig = _signAttestation(SELLER_ID, jobId, keccak256("data"), 999, futureTs, operatorPrivKey);

        SlaEvaluator.Attestation memory att = SlaEvaluator.Attestation({
            sellerId: SELLER_ID, jobId: jobId, dataHash: keccak256("data"),
            sourceBlockNumber: 999, sourceBlockTimestamp: futureTs, signature: sig
        });

        vm.expectRevert();
        evaluator.resolve(att, abi.encode(att));
    }

    // ─────────────────────────────────────────────────────────────────────
    // Security: wrong sellerId (unregistered)
    // ─────────────────────────────────────────────────────────────────────

    function test_resolve_unknownSeller_reverts() public {
        bytes32 fakeSellerId = keccak256("fake.seller");
        uint256 sourceTs = block.timestamp - 5;
        bytes memory sig = _signAttestation(fakeSellerId, jobId, keccak256("data"), 100, sourceTs, operatorPrivKey);

        SlaEvaluator.Attestation memory att = SlaEvaluator.Attestation({
            sellerId: fakeSellerId, jobId: jobId, dataHash: keccak256("data"),
            sourceBlockNumber: 100, sourceBlockTimestamp: sourceTs, signature: sig
        });

        vm.expectRevert();
        evaluator.resolve(att, abi.encode(att));
    }

    // ─────────────────────────────────────────────────────────────────────
    // JobResolved event
    // ─────────────────────────────────────────────────────────────────────

    function test_resolve_emitsJobResolved() public {
        uint256 sourceTs = block.timestamp - 5;
        bytes memory sig = _signAttestation(SELLER_ID, jobId, keccak256("data"), 100, sourceTs, operatorPrivKey);

        SlaEvaluator.Attestation memory att = SlaEvaluator.Attestation({
            sellerId: SELLER_ID, jobId: jobId, dataHash: keccak256("data"),
            sourceBlockNumber: 100, sourceBlockTimestamp: sourceTs, signature: sig
        });

        vm.expectEmit(true, true, false, true);
        emit SlaEvaluator.JobResolved(jobId, SELLER_ID, 5, true);

        evaluator.resolve(att, abi.encode(att));
    }

    // ─────────────────────────────────────────────────────────────────────
    // Internal helper: sign an attestation with a private key
    // ─────────────────────────────────────────────────────────────────────

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

    // ─────────────────────────────────────────────────────────────────────
    // Security: bypass attempt — attacker calls acpCore.complete() directly,
    // skipping resolve() and all sig/freshness validation.
    //
    // SlaEvaluator IS the evaluator, so ACPCore would normally allow it to
    // call complete(). The beforeAction hook is the only gate here.
    // It checks _resolved[jobId] — set only AFTER sig+freshness pass in resolve().
    //
    // This is the highest-stakes test in the suite. A failure means escrow can
    // be drained without any valid attestation being checked.
    // ─────────────────────────────────────────────────────────────────────

    function test_directComplete_withoutResolve_reverts() public {
        vm.prank(address(evaluator));
        vm.expectRevert("SlaEvaluator: resolve() not called");
        acpCore.complete(jobId, "", "");

        // Funds remain escrowed — no state change
        IACP.Job memory job = acpCore.getJob(jobId);
        assertEq(uint8(job.status), uint8(IACP.JobStatus.Funded));
    }

    function test_directReject_withoutResolve_reverts() public {
        // reject() also gated — a bypass would silently skip reputation recording.
        vm.prank(address(evaluator));
        vm.expectRevert("SlaEvaluator: resolve() not called");
        acpCore.reject(jobId, "", "");

        IACP.Job memory job = acpCore.getJob(jobId);
        assertEq(uint8(job.status), uint8(IACP.JobStatus.Funded));
    }

    // ─────────────────────────────────────────────────────────────────────
    // Security: double-resolution — replay a valid attestation a second time.
    // Defense: _resolved[jobId] = true on first call; second call reverts.
    // ─────────────────────────────────────────────────────────────────────

    function test_resolve_doubleResolution_reverts() public {
        uint256 sourceTs = block.timestamp - 5;
        bytes memory sig = _signAttestation(SELLER_ID, jobId, keccak256("data"), 100, sourceTs, operatorPrivKey);
        SlaEvaluator.Attestation memory att = SlaEvaluator.Attestation({
            sellerId: SELLER_ID,
            jobId: jobId,
            dataHash: keccak256("data"),
            sourceBlockNumber: 100,
            sourceBlockTimestamp: sourceTs,
            signature: sig
        });

        // First call succeeds
        evaluator.resolve(att, abi.encode(att));
        assertEq(uint8(acpCore.getJob(jobId).status), uint8(IACP.JobStatus.Completed));

        // Second call on same jobId reverts at the first line of resolve()
        vm.expectRevert("SlaEvaluator: already resolved");
        evaluator.resolve(att, abi.encode(att));
    }

    // ─────────────────────────────────────────────────────────────────────
    // Security: forged signature — exact revert message (tighter than existing test)
    // ─────────────────────────────────────────────────────────────────────

    function test_resolve_forgedSignature_exactRevertMessage() public {
        uint256 wrongKey = 0xBAD0;
        uint256 sourceTs = block.timestamp - 5;
        bytes memory forgedSig = _signAttestation(SELLER_ID, jobId, keccak256("data"), 100, sourceTs, wrongKey);
        SlaEvaluator.Attestation memory att = SlaEvaluator.Attestation({
            sellerId: SELLER_ID,
            jobId: jobId,
            dataHash: keccak256("data"),
            sourceBlockNumber: 100,
            sourceBlockTimestamp: sourceTs,
            signature: forgedSig
        });

        vm.expectRevert("SlaEvaluator: invalid signature");
        evaluator.resolve(att, abi.encode(att));

        // _resolved must NOT be set — a failed resolve() is a complete no-op
        IACP.Job memory job = acpCore.getJob(jobId);
        assertEq(uint8(job.status), uint8(IACP.JobStatus.Funded));
    }
}
