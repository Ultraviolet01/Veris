// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ISellerRegistry} from "./interfaces/ISellerRegistry.sol";

/// @title SellerRegistry — Veris on-chain seller storefront
/// @notice Any address can register as a seller. Identity is their EOA/embedded wallet address.
///         Replaces OpenBook's ENS-name pattern with a plain registry — zero cross-chain dependency.
///
/// @dev sellers mapping key is a bytes32 sellerId chosen by the registrant.
///      The mapping from sellerId → registration address (msg.sender) is recorded in `sellerOwner`
///      to prevent squatting: once a sellerId is claimed, only the original claimer can register it again.
contract SellerRegistry is ISellerRegistry {
    // ─────────────────────────────────────────────────────────────────────────
    // State
    // ─────────────────────────────────────────────────────────────────────────

    /// @notice Seller terms indexed by sellerId.
    mapping(bytes32 => SellerTerms) private _sellers;

    /// @notice Who originally registered each sellerId.
    ///         Prevents a different address from claiming an existing sellerId.
    mapping(bytes32 => address) private _sellerOwner;

    // ─────────────────────────────────────────────────────────────────────────
    // External Functions
    // ─────────────────────────────────────────────────────────────────────────

    /// @inheritdoc ISellerRegistry
    function registerSeller(
        bytes32 sellerId,
        address payoutAddress,
        address operatorKey,
        uint256 pricePerQuery,
        uint256 freshnessWindowSeconds,
        bytes32 datasetId,
        uint256 sourceChainId
    ) external {
        // Validation
        require(payoutAddress != address(0), "SellerRegistry: zero payout address");
        require(operatorKey != address(0), "SellerRegistry: zero operator key");
        require(freshnessWindowSeconds > 0, "SellerRegistry: zero freshness window");

        // Squatting prevention: once a sellerId is registered, only the original
        // msg.sender may register it again (even after deactivation)
        address currentOwner = _sellerOwner[sellerId];
        require(
            currentOwner == address(0) || currentOwner == msg.sender,
            "SellerRegistry: sellerId already claimed by another address"
        );
        // Prevent double-registration from the same address
        require(
            _sellers[sellerId].payoutAddress == address(0),
            "SellerRegistry: sellerId already registered"
        );

        _sellerOwner[sellerId] = msg.sender;
        _sellers[sellerId] = SellerTerms({
            payoutAddress: payoutAddress,
            operatorKey: operatorKey,
            pricePerQuery: pricePerQuery,
            freshnessWindowSeconds: freshnessWindowSeconds,
            datasetId: datasetId,
            sourceChainId: sourceChainId,
            active: true
        });

        emit SellerRegistered(sellerId, payoutAddress, datasetId);
    }

    /// @inheritdoc ISellerRegistry
    function updateTerms(bytes32 sellerId, uint256 newPrice, uint256 newFreshnessWindow) external {
        SellerTerms storage terms = _sellers[sellerId];
        require(terms.payoutAddress != address(0), "SellerRegistry: seller not registered");
        require(terms.payoutAddress == msg.sender, "SellerRegistry: not seller");
        require(newFreshnessWindow > 0, "SellerRegistry: zero freshness window");

        terms.pricePerQuery = newPrice;
        terms.freshnessWindowSeconds = newFreshnessWindow;

        emit SellerTermsUpdated(sellerId, newPrice, newFreshnessWindow);
    }

    /// @inheritdoc ISellerRegistry
    function deactivateSeller(bytes32 sellerId) external {
        SellerTerms storage terms = _sellers[sellerId];
        require(terms.payoutAddress != address(0), "SellerRegistry: seller not registered");
        require(terms.payoutAddress == msg.sender, "SellerRegistry: not seller");

        terms.active = false;
        emit SellerDeactivated(sellerId);
    }

    /// @inheritdoc ISellerRegistry
    function getSeller(bytes32 sellerId) external view returns (SellerTerms memory) {
        return _sellers[sellerId];
    }
}
