// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IACP} from "./vendor/IACP.sol";
import {SafeERC20} from "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {ReentrancyGuard} from "openzeppelin-contracts/contracts/utils/ReentrancyGuard.sol";

/// @title VerisBuyerRouter — 1-Click Atomic Escrow Router for Veris on Monad
/// @notice Bundles ERC-8183 createJob + setBudget + fund into a single, atomic 1-confirmation transaction.
contract VerisBuyerRouter is ReentrancyGuard {
    using SafeERC20 for IERC20;

    IACP public immutable acpCore;
    IERC20 public immutable paymentToken;

    /// @notice Maps ACPCore jobId to the real buyer's address
    mapping(uint256 => address) public buyerOf;

    /// @notice Maps ACPCore jobId to any refunded amount held for the buyer
    mapping(uint256 => uint256) public pendingRefunds;

    event RoutedJobCreated(
        uint256 indexed jobId,
        address indexed buyer,
        uint256 budget,
        address provider,
        address evaluator,
        address hook
    );

    event RefundClaimed(
        uint256 indexed jobId,
        address indexed buyer,
        uint256 amount
    );

    constructor(address acpCore_, address paymentToken_) {
        require(acpCore_ != address(0), "VerisBuyerRouter: zero acpCore");
        require(paymentToken_ != address(0), "VerisBuyerRouter: zero paymentToken");
        acpCore = IACP(acpCore_);
        paymentToken = IERC20(paymentToken_);
    }

    /// @notice 1-Click Atomic creation, budgeting, and funding of an ACPCore job
    /// @dev Pulls USDC from buyer, creates job, sets budget, and deposits funds in 1 transaction.
    function createAndFund(
        address provider,
        address evaluator,
        uint256 expiredAt,
        string calldata description,
        address hook,
        uint256 budget
    ) external nonReentrant returns (uint256 jobId) {
        require(budget > 0, "VerisBuyerRouter: zero budget");

        // 1. Pull budget from buyer (requires prior approve on paymentToken to this Router)
        paymentToken.safeTransferFrom(msg.sender, address(this), budget);

        // 2. Approve ACPCore to take paymentToken
        paymentToken.forceApprove(address(acpCore), budget);

        // 3. Create job on ACPCore (client on ACPCore is this Router)
        jobId = acpCore.createJob(provider, evaluator, expiredAt, description, hook);

        // 4. Set budget on ACPCore
        acpCore.setBudget(jobId, budget, "");

        // 5. Fund job on ACPCore (locks paymentToken in ACPCore escrow)
        acpCore.fund(jobId, budget, "");

        // Record buyer
        buyerOf[jobId] = msg.sender;

        emit RoutedJobCreated(jobId, msg.sender, budget, provider, evaluator, hook);
    }

    /// @notice Allows the buyer to withdraw their refund if the job was rejected by SlaEvaluator or expired
    function claimRefund(uint256 jobId) external nonReentrant {
        address buyer = buyerOf[jobId];
        require(buyer != address(0), "VerisBuyerRouter: unknown job");
        require(msg.sender == buyer, "VerisBuyerRouter: not buyer");

        IACP.Job memory job = acpCore.getJob(jobId);

        // If job is expired and still Funded/Submitted, trigger ACPCore.claimRefund() first
        if (
            (job.status == IACP.JobStatus.Funded || job.status == IACP.JobStatus.Submitted) &&
            block.timestamp >= job.expiredAt
        ) {
            acpCore.claimRefund(jobId);
            job = acpCore.getJob(jobId);
        }

        require(
            job.status == IACP.JobStatus.Rejected || job.status == IACP.JobStatus.Expired,
            "VerisBuyerRouter: job not refundable"
        );

        uint256 amount = job.budget;
        require(amount > 0, "VerisBuyerRouter: zero refund amount");
        require(
            paymentToken.balanceOf(address(this)) >= amount,
            "VerisBuyerRouter: insufficient router balance"
        );

        paymentToken.safeTransfer(buyer, amount);
        emit RefundClaimed(jobId, buyer, amount);
    }
}
