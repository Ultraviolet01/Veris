// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {VerisTreasury} from "../src/VerisTreasury.sol";
import {IVerisTreasury} from "../src/interfaces/IVerisTreasury.sol";
import {MockERC20} from "./helpers/MockERC20.sol";

/// @notice RED tests for VerisTreasury — written before implementation.
contract VerisTreasuryTest is Test {
    VerisTreasury public treasury;
    MockERC20 public usdc;

    address internal owner = makeAddr("owner");
    address internal allowedDst = makeAddr("allowedDst");
    address internal stranger = makeAddr("stranger");

    uint256 internal constant PER_TX_CAP = 1_000_000;  // 1 USDC
    uint256 internal constant DAILY_CAP = 5_000_000;   // 5 USDC

    function setUp() public {
        usdc = new MockERC20("USD Coin", "USDC", 6);
        vm.prank(owner);
        treasury = new VerisTreasury(address(usdc));

        vm.startPrank(owner);
        treasury.setAllowlist(allowedDst, true);
        treasury.setCaps(PER_TX_CAP, DAILY_CAP);
        vm.stopPrank();
    }

    // ─────────────────────────────────────────────────────────────────────
    // collectFee
    // ─────────────────────────────────────────────────────────────────────

    function test_collectFee_depositsUSDC() public {
        usdc.mint(address(this), 1_000_000);
        usdc.approve(address(treasury), 1_000_000);
        treasury.collectFee(1_000_000);
        assertEq(usdc.balanceOf(address(treasury)), 1_000_000);
    }

    // ─────────────────────────────────────────────────────────────────────
    // withdraw
    // ─────────────────────────────────────────────────────────────────────

    function test_withdraw_success() public {
        // Fund treasury first
        usdc.mint(address(treasury), 5_000_000);

        uint256 before = usdc.balanceOf(allowedDst);
        vm.prank(owner);
        treasury.withdraw(allowedDst, 500_000);
        assertEq(usdc.balanceOf(allowedDst), before + 500_000);
    }

    function test_withdraw_emitsEvent() public {
        usdc.mint(address(treasury), 5_000_000);

        vm.expectEmit(true, false, false, true);
        emit IVerisTreasury.Withdrawal(allowedDst, 500_000);

        vm.prank(owner);
        treasury.withdraw(allowedDst, 500_000);
    }

    function test_withdraw_nonOwner_reverts() public {
        usdc.mint(address(treasury), 5_000_000);

        vm.expectRevert();
        vm.prank(stranger);
        treasury.withdraw(allowedDst, 500_000);
    }

    function test_withdraw_notAllowlisted_reverts() public {
        usdc.mint(address(treasury), 5_000_000);

        vm.expectRevert();
        vm.prank(owner);
        treasury.withdraw(stranger, 500_000); // stranger not in allowlist
    }

    function test_withdraw_exceedsPerTxCap_reverts() public {
        usdc.mint(address(treasury), 5_000_000);

        vm.expectRevert();
        vm.prank(owner);
        treasury.withdraw(allowedDst, PER_TX_CAP + 1);
    }

    function test_withdraw_exceedsDailyCap_reverts() public {
        usdc.mint(address(treasury), 10_000_000);

        vm.startPrank(owner);
        // Fill daily cap
        treasury.withdraw(allowedDst, PER_TX_CAP);
        treasury.withdraw(allowedDst, PER_TX_CAP);
        treasury.withdraw(allowedDst, PER_TX_CAP);
        treasury.withdraw(allowedDst, PER_TX_CAP);
        treasury.withdraw(allowedDst, PER_TX_CAP);
        // 5 * 1 USDC = 5 USDC = DAILY_CAP, next should revert
        vm.expectRevert();
        treasury.withdraw(allowedDst, 1);
        vm.stopPrank();
    }

    function test_withdraw_dailyCap_resetsNextDay() public {
        usdc.mint(address(treasury), 10_000_000);

        vm.startPrank(owner);
        // Fill daily cap
        for (uint i = 0; i < 5; i++) {
            treasury.withdraw(allowedDst, PER_TX_CAP);
        }

        // Fast-forward 1 day + 1 second
        skip(1 days + 1);

        // Should succeed after reset
        treasury.withdraw(allowedDst, PER_TX_CAP);
        vm.stopPrank();
    }

    // ─────────────────────────────────────────────────────────────────────
    // setAllowlist
    // ─────────────────────────────────────────────────────────────────────

    function test_setAllowlist_nonOwner_reverts() public {
        vm.expectRevert();
        vm.prank(stranger);
        treasury.setAllowlist(stranger, true);
    }

    function test_setAllowlist_emitsEvent() public {
        vm.expectEmit(true, false, false, true);
        emit IVerisTreasury.AllowlistUpdated(stranger, true);

        vm.prank(owner);
        treasury.setAllowlist(stranger, true);
    }

    // ─────────────────────────────────────────────────────────────────────
    // setCaps
    // ─────────────────────────────────────────────────────────────────────

    function test_setCaps_nonOwner_reverts() public {
        vm.expectRevert();
        vm.prank(stranger);
        treasury.setCaps(1, 1);
    }

    function test_setCaps_perTxExceedsDaily_reverts() public {
        // perTx cap can't exceed daily cap
        vm.expectRevert();
        vm.prank(owner);
        treasury.setCaps(DAILY_CAP + 1, DAILY_CAP);
    }
}
