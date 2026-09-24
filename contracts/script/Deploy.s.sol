// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {SellerRegistry} from "../src/SellerRegistry.sol";
import {ReputationRegistry} from "../src/ReputationRegistry.sol";
import {VerisTreasury} from "../src/VerisTreasury.sol";
import {ACPCore} from "../src/vendor/ACPCore.sol";
import {SlaEvaluator} from "../src/SlaEvaluator.sol";

/// @title Deploy — Veris contract deployment script for Monad testnet (chain 10143)
///
/// Deploy order:
///   1. SellerRegistry
///   2. ReputationRegistry (slaEvaluator = address(0), wired post-deploy)
///   3. VerisTreasury
///   4. ACPCore (vendored ERC-8183, takes USDC address)
///   5. SlaEvaluator (wired to all above)
///   6. Wire: ReputationRegistry.setSlaEvaluator(slaEvaluator)
///   7. Wire: VerisTreasury.setAllowlist + setCaps
///
/// Usage:
///   cast wallet import deployer --interactive   # import deployer key once
///
///   forge script script/Deploy.s.sol \
///     --broadcast \
///     --rpc-url https://testnet-rpc.monad.xyz \
///     --account deployer \
///     --verify \
///     --verifier sourcify \
///     --chain 10143
///
/// Outputs deployed addresses to deployments/monad-testnet.json
contract Deploy is Script {
    // ── Monad testnet constants ───────────────────────────────────────────────
    address constant USDC = 0x534b2f3A21130d7a60830c2Df862319e593943A3; // USDC on Monad testnet (6 decimals)

    // ── Fee configuration ────────────────────────────────────────────────────
    uint256 constant FEE_BPS = 200; // 2%

    // ── Treasury caps (in USDC 6-decimal units) ───────────────────────────────
    uint256 constant TREASURY_PER_TX_CAP = 10_000_000;  // 10 USDC max per withdrawal
    uint256 constant TREASURY_DAILY_CAP  = 50_000_000;  // 50 USDC max per day

    function run() external {
        address deployer = msg.sender;
        console2.log("Deploying Veris contracts to Monad testnet (chain 10143)");
        console2.log("Deployer:", deployer);
        console2.log("USDC:    ", USDC);

        vm.startBroadcast();

        // ── 1. SellerRegistry ────────────────────────────────────────────────
        SellerRegistry registry = new SellerRegistry();
        console2.log("SellerRegistry:      ", address(registry));

        // ── 2. ReputationRegistry (slaEvaluator wired below) ─────────────────
        ReputationRegistry reputation = new ReputationRegistry(address(0));
        console2.log("ReputationRegistry:  ", address(reputation));

        // ── 3. VerisTreasury ─────────────────────────────────────────────────
        VerisTreasury treasury = new VerisTreasury(USDC);
        console2.log("VerisTreasury:       ", address(treasury));

        // ── 4. ACPCore (vendored ERC-8183) ────────────────────────────────────
        ACPCore acpCore = new ACPCore(USDC);
        console2.log("ACPCore:             ", address(acpCore));

        // ── 5. SlaEvaluator ──────────────────────────────────────────────────
        SlaEvaluator slaEval = new SlaEvaluator(
            address(acpCore),
            address(registry),
            address(reputation),
            address(treasury),
            FEE_BPS,
            USDC
        );
        console2.log("SlaEvaluator:        ", address(slaEval));

        // ── 6. Wire: ReputationRegistry → SlaEvaluator ───────────────────────
        reputation.setSlaEvaluator(address(slaEval));
        console2.log("ReputationRegistry.slaEvaluator wired to SlaEvaluator");

        // ── 7. Wire: VerisTreasury caps and allowlist ─────────────────────────
        treasury.setAllowlist(deployer, true);
        treasury.setCaps(TREASURY_PER_TX_CAP, TREASURY_DAILY_CAP);
        console2.log("VerisTreasury: deployer allowlisted, caps set");

        vm.stopBroadcast();

        // ── Write deployment manifest ─────────────────────────────────────────
        string memory json = string.concat(
            '{\n',
            '  "network": "monad-testnet",\n',
            '  "chainId": 10143,\n',
            '  "usdc": "', vm.toString(USDC), '",\n',
            '  "feeBps": ', vm.toString(FEE_BPS), ',\n',
            '  "contracts": {\n',
            '    "SellerRegistry": "', vm.toString(address(registry)), '",\n',
            '    "ReputationRegistry": "', vm.toString(address(reputation)), '",\n',
            '    "VerisTreasury": "', vm.toString(address(treasury)), '",\n',
            '    "ACPCore": "', vm.toString(address(acpCore)), '",\n',
            '    "SlaEvaluator": "', vm.toString(address(slaEval)), '"\n',
            '  }\n',
            '}'
        );

        vm.writeFile("deployments/monad-testnet.json", json);
        console2.log("\nDeployment manifest written to deployments/monad-testnet.json");
        console2.log("\nNext steps:");
        console2.log("  1. Verify each contract on Sourcify:");
        console2.log("     forge verify-contract <addr> <ContractName> --chain 10143 --verifier sourcify");
        console2.log("  2. Register your seller dataset via SellerRegistry.registerSeller()");
        console2.log("  3. Start the operator signing service (Phase 2)");
    }
}
