// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IVerisTreasury} from "./interfaces/IVerisTreasury.sol";
import {SafeERC20} from "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";

/// @title VerisTreasury — Veris platform fee treasury
/// @notice Holds the 2% fee collected on every completed job.
///         On-chain spending caps ensure even a compromised admin key cannot drain
///         the treasury in a single transaction or within a single day.
///
/// Security properties:
///   - Only owner can withdraw or change config
///   - All withdrawals must go to an allowlisted address
///   - Per-transaction cap: no single withdrawal exceeds perTransactionCap
///   - Daily cap: total withdrawals within a 24h window cannot exceed dailyCap
///   - Day resets based on block.timestamp (not wall clock calendar)
///   - USDC-denominated (6 decimals) — caps are in USDC smallest unit
contract VerisTreasury is IVerisTreasury {
    using SafeERC20 for IERC20;

    // ─────────────────────────────────────────────────────────────────────────
    // State
    // ─────────────────────────────────────────────────────────────────────────

    IERC20 public immutable paymentToken;

    address public override owner;
    uint256 public override perTransactionCap;
    uint256 public override dailyCap;

    uint256 private _spentToday;
    uint256 private _dayStart;

    mapping(address => bool) private _allowlist;

    // ─────────────────────────────────────────────────────────────────────────
    // Constructor
    // ─────────────────────────────────────────────────────────────────────────

    constructor(address token) {
        require(token != address(0), "VerisTreasury: zero token");
        paymentToken = IERC20(token);
        owner = msg.sender;
        _dayStart = block.timestamp;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Fee collection
    // ─────────────────────────────────────────────────────────────────────────

    /// @inheritdoc IVerisTreasury
    /// @dev Called by SlaEvaluator after a completed job. Requires prior approval.
    function collectFee(uint256 amount) external override {
        paymentToken.safeTransferFrom(msg.sender, address(this), amount);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Owner-only functions
    // ─────────────────────────────────────────────────────────────────────────

    /// @inheritdoc IVerisTreasury
    function withdraw(address to, uint256 amount) external override {
        require(msg.sender == owner, "VerisTreasury: not owner");
        require(_allowlist[to], "VerisTreasury: address not allowlisted");
        require(amount <= perTransactionCap, "VerisTreasury: exceeds per-tx cap");

        // Reset daily counter if a new day has started
        if (block.timestamp >= _dayStart + 1 days) {
            _spentToday = 0;
            _dayStart = block.timestamp;
        }

        require(_spentToday + amount <= dailyCap, "VerisTreasury: exceeds daily cap");
        _spentToday += amount;

        paymentToken.safeTransfer(to, amount);
        emit Withdrawal(to, amount);
    }

    /// @inheritdoc IVerisTreasury
    function setAllowlist(address addr, bool allowed) external override {
        require(msg.sender == owner, "VerisTreasury: not owner");
        _allowlist[addr] = allowed;
        emit AllowlistUpdated(addr, allowed);
    }

    /// @inheritdoc IVerisTreasury
    function setCaps(uint256 perTx, uint256 daily) external override {
        require(msg.sender == owner, "VerisTreasury: not owner");
        require(perTx <= daily, "VerisTreasury: perTx cap exceeds daily cap");
        perTransactionCap = perTx;
        dailyCap = daily;
        emit CapsUpdated(perTx, daily);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // View
    // ─────────────────────────────────────────────────────────────────────────

    function allowlist(address addr) external view override returns (bool) {
        return _allowlist[addr];
    }
}
