// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title IVerisTreasury — Veris platform fee treasury interface
interface IVerisTreasury {
    event Withdrawal(address indexed to, uint256 amount);
    event AllowlistUpdated(address indexed addr, bool allowed);
    event CapsUpdated(uint256 perTx, uint256 daily);

    function withdraw(address to, uint256 amount) external;
    function setAllowlist(address addr, bool allowed) external;
    function setCaps(uint256 perTx, uint256 daily) external;
    function collectFee(uint256 amount) external;
    function owner() external view returns (address);
    function allowlist(address addr) external view returns (bool);
    function perTransactionCap() external view returns (uint256);
    function dailyCap() external view returns (uint256);
}
