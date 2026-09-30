// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {VerisBuyerRouter} from "../src/VerisBuyerRouter.sol";
import {ACPCore} from "../src/vendor/ACPCore.sol";
import {IACP} from "../src/vendor/IACP.sol";
import {MockERC20} from "./helpers/MockERC20.sol";

contract VerisBuyerRouterTest is Test {
    MockERC20 internal token;
    ACPCore internal acpCore;
    VerisBuyerRouter internal router;

    address internal buyer = address(0xB0B);
    address internal provider = address(0xCAFE);
    address internal evaluator = address(0xDEAD);
    address internal hook = address(0);

    function setUp() public {
        token = new MockERC20("USDC", "USDC", 6);
        acpCore = new ACPCore(address(token));
        router = new VerisBuyerRouter(address(acpCore), address(token));

        token.mint(buyer, 1_000_000_000); // 1,000 USDC
    }

    function test_CreateAndFund_AtomicSuccess() public {
        uint256 budget = 250_000; // 0.25 USDC
        uint256 expiredAt = block.timestamp + 3600;

        vm.startPrank(buyer);
        token.approve(address(router), budget);

        uint256 jobId = router.createAndFund(
            provider,
            evaluator,
            expiredAt,
            "Freshness Query Test",
            hook,
            budget
        );
        vm.stopPrank();

        assertEq(jobId, 1);
        assertEq(router.buyerOf(jobId), buyer);
        assertEq(token.balanceOf(address(router)), 0);
        assertEq(token.balanceOf(address(acpCore)), budget);

        IACP.Job memory job = acpCore.getJob(jobId);
        assertEq(job.client, address(router));
        assertEq(job.provider, provider);
        assertEq(job.evaluator, evaluator);
        assertEq(job.budget, budget);
        assertEq(uint8(job.status), uint8(IACP.JobStatus.Funded));
    }
}
