// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title ISellerRegistry — Veris seller storefront interface
interface ISellerRegistry {
    struct SellerTerms {
        address payoutAddress;
        address operatorKey;           // key that signs attestations for this seller
        uint256 pricePerQuery;         // USDC 6-decimal units (e.g. 100000 = 0.10 USDC)
        uint256 freshnessWindowSeconds;
        bytes32 datasetId;             // opaque ID for what this seller sells
        uint256 sourceChainId;         // chain the underlying data is read from
        bool active;
    }

    event SellerRegistered(bytes32 indexed sellerId, address indexed payoutAddress, bytes32 datasetId);
    event SellerTermsUpdated(bytes32 indexed sellerId, uint256 newPrice, uint256 newFreshnessWindow);
    event SellerDeactivated(bytes32 indexed sellerId);

    function registerSeller(
        bytes32 sellerId,
        address payoutAddress,
        address operatorKey,
        uint256 pricePerQuery,
        uint256 freshnessWindowSeconds,
        bytes32 datasetId,
        uint256 sourceChainId
    ) external;

    function updateTerms(bytes32 sellerId, uint256 newPrice, uint256 newFreshnessWindow) external;

    function deactivateSeller(bytes32 sellerId) external;

    function getSeller(bytes32 sellerId) external view returns (SellerTerms memory);
}
