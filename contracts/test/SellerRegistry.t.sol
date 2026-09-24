// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {SellerRegistry} from "../src/SellerRegistry.sol";
import {ISellerRegistry} from "../src/interfaces/ISellerRegistry.sol";

/// @notice RED tests for SellerRegistry — written before implementation.
///         All tests should FAIL until SellerRegistry.sol is implemented.
contract SellerRegistryTest is Test {
    SellerRegistry public registry;

    address internal alice = makeAddr("alice");
    address internal bob = makeAddr("bob");
    address internal aliceOperator = makeAddr("aliceOperator");

    bytes32 internal constant SELLER_ID = keccak256("veris.demo.seller.1");
    bytes32 internal constant DATASET_ID = keccak256("monad.aave.lending.rates");

    function setUp() public {
        registry = new SellerRegistry();
    }

    // ─────────────────────────────────────────────────────────────────────
    // registerSeller
    // ─────────────────────────────────────────────────────────────────────

    function test_registerSeller_success() public {
        vm.prank(alice);
        registry.registerSeller(
            SELLER_ID,
            alice,          // payoutAddress
            aliceOperator,  // operatorKey
            100_000,        // pricePerQuery: 0.10 USDC
            10,             // freshnessWindowSeconds: 10s
            DATASET_ID,
            1               // sourceChainId: Ethereum mainnet
        );

        ISellerRegistry.SellerTerms memory terms = registry.getSeller(SELLER_ID);
        assertEq(terms.payoutAddress, alice);
        assertEq(terms.operatorKey, aliceOperator);
        assertEq(terms.pricePerQuery, 100_000);
        assertEq(terms.freshnessWindowSeconds, 10);
        assertEq(terms.datasetId, DATASET_ID);
        assertEq(terms.sourceChainId, 1);
        assertTrue(terms.active);
    }

    function test_registerSeller_emitsEvent() public {
        vm.expectEmit(true, true, false, true);
        emit ISellerRegistry.SellerRegistered(SELLER_ID, alice, DATASET_ID);

        vm.prank(alice);
        registry.registerSeller(SELLER_ID, alice, aliceOperator, 100_000, 10, DATASET_ID, 1);
    }

    function test_registerSeller_duplicateIdSameOwner_reverts() public {
        vm.startPrank(alice);
        registry.registerSeller(SELLER_ID, alice, aliceOperator, 100_000, 10, DATASET_ID, 1);

        // Re-registering the same sellerId from the same address must revert
        vm.expectRevert();
        registry.registerSeller(SELLER_ID, alice, aliceOperator, 200_000, 10, DATASET_ID, 1);
        vm.stopPrank();
    }

    function test_registerSeller_duplicateIdDifferentOwner_reverts() public {
        vm.prank(alice);
        registry.registerSeller(SELLER_ID, alice, aliceOperator, 100_000, 10, DATASET_ID, 1);

        // Different address trying to claim the same sellerId must revert
        vm.expectRevert();
        vm.prank(bob);
        registry.registerSeller(SELLER_ID, bob, bob, 50_000, 5, DATASET_ID, 1);
    }

    function test_registerSeller_zeroPayoutAddress_reverts() public {
        vm.expectRevert();
        vm.prank(alice);
        registry.registerSeller(SELLER_ID, address(0), aliceOperator, 100_000, 10, DATASET_ID, 1);
    }

    function test_registerSeller_zeroOperatorKey_reverts() public {
        vm.expectRevert();
        vm.prank(alice);
        registry.registerSeller(SELLER_ID, alice, address(0), 100_000, 10, DATASET_ID, 1);
    }

    function test_registerSeller_zeroFreshnessWindow_reverts() public {
        vm.expectRevert();
        vm.prank(alice);
        registry.registerSeller(SELLER_ID, alice, aliceOperator, 100_000, 0, DATASET_ID, 1);
    }

    // ─────────────────────────────────────────────────────────────────────
    // updateTerms
    // ─────────────────────────────────────────────────────────────────────

    function test_updateTerms_success() public {
        vm.startPrank(alice);
        registry.registerSeller(SELLER_ID, alice, aliceOperator, 100_000, 10, DATASET_ID, 1);
        registry.updateTerms(SELLER_ID, 200_000, 30);
        vm.stopPrank();

        ISellerRegistry.SellerTerms memory terms = registry.getSeller(SELLER_ID);
        assertEq(terms.pricePerQuery, 200_000);
        assertEq(terms.freshnessWindowSeconds, 30);
    }

    function test_updateTerms_emitsEvent() public {
        vm.prank(alice);
        registry.registerSeller(SELLER_ID, alice, aliceOperator, 100_000, 10, DATASET_ID, 1);

        vm.expectEmit(true, false, false, true);
        emit ISellerRegistry.SellerTermsUpdated(SELLER_ID, 200_000, 30);

        vm.prank(alice);
        registry.updateTerms(SELLER_ID, 200_000, 30);
    }

    function test_updateTerms_nonOwner_reverts() public {
        vm.prank(alice);
        registry.registerSeller(SELLER_ID, alice, aliceOperator, 100_000, 10, DATASET_ID, 1);

        vm.expectRevert();
        vm.prank(bob);
        registry.updateTerms(SELLER_ID, 200_000, 30);
    }

    function test_updateTerms_nonexistentSeller_reverts() public {
        vm.expectRevert();
        vm.prank(alice);
        registry.updateTerms(SELLER_ID, 200_000, 30);
    }

    function test_updateTerms_zeroFreshnessWindow_reverts() public {
        vm.prank(alice);
        registry.registerSeller(SELLER_ID, alice, aliceOperator, 100_000, 10, DATASET_ID, 1);

        vm.expectRevert();
        vm.prank(alice);
        registry.updateTerms(SELLER_ID, 100_000, 0);
    }

    // ─────────────────────────────────────────────────────────────────────
    // deactivateSeller
    // ─────────────────────────────────────────────────────────────────────

    function test_deactivateSeller_success() public {
        vm.startPrank(alice);
        registry.registerSeller(SELLER_ID, alice, aliceOperator, 100_000, 10, DATASET_ID, 1);
        registry.deactivateSeller(SELLER_ID);
        vm.stopPrank();

        ISellerRegistry.SellerTerms memory terms = registry.getSeller(SELLER_ID);
        assertFalse(terms.active);
        // Historical data preserved (not deleted)
        assertEq(terms.payoutAddress, alice);
        assertEq(terms.datasetId, DATASET_ID);
    }

    function test_deactivateSeller_nonOwner_reverts() public {
        vm.prank(alice);
        registry.registerSeller(SELLER_ID, alice, aliceOperator, 100_000, 10, DATASET_ID, 1);

        vm.expectRevert();
        vm.prank(bob);
        registry.deactivateSeller(SELLER_ID);
    }

    function test_deactivateSeller_emitsEvent() public {
        vm.prank(alice);
        registry.registerSeller(SELLER_ID, alice, aliceOperator, 100_000, 10, DATASET_ID, 1);

        vm.expectEmit(true, false, false, false);
        emit ISellerRegistry.SellerDeactivated(SELLER_ID);

        vm.prank(alice);
        registry.deactivateSeller(SELLER_ID);
    }

    // ─────────────────────────────────────────────────────────────────────
    // getSeller
    // ─────────────────────────────────────────────────────────────────────

    function test_getSeller_nonexistent_returnsEmpty() public view {
        ISellerRegistry.SellerTerms memory terms = registry.getSeller(keccak256("doesNotExist"));
        assertEq(terms.payoutAddress, address(0));
        assertFalse(terms.active);
    }
}
