// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {VerisBuyerRouter} from "../src/VerisBuyerRouter.sol";

contract DeployRouter is Script {
    address constant ACP_CORE = 0x5898d78653C1f691431A045580c1b1D6aFC28AF9;
    address constant USDC = 0x534b2f3A21130d7a60830c2Df862319e593943A3;

    function run() external returns (address routerAddress) {
        vm.startBroadcast();
        VerisBuyerRouter router = new VerisBuyerRouter(ACP_CORE, USDC);
        console2.log("VerisBuyerRouter deployed at:", address(router));
        vm.stopBroadcast();
        return address(router);
    }
}
