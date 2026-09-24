// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IACP} from "./IACP.sol";
import {IACPHook} from "./IACPHook.sol";
import {ReentrancyGuard} from "openzeppelin-contracts/contracts/utils/ReentrancyGuard.sol";
import {SafeERC20} from "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";

/// @title ACPCore — ERC-8183 Agentic Commerce Protocol Reference Implementation
/// @notice Trustless job escrow for AI agent commerce.
///
/// All payment is in a single ERC-20 token (e.g., USDC) specified at deployment.
/// Native gas token (ETH/MON) is never held — only used for transaction fees.
///
/// Job lifecycle:
///   createJob ──► fund ──► submit ──► complete (funds ──► provider)
///                             └───► reject  (funds ──► client)
///              └── claimRefund after expiredAt (funds ──► client, permissionless)
///
/// Hooks (IACPHook):
///   Every state-changing function (except claimRefund) calls beforeAction and afterAction.
///   beforeAction may revert to block the action. afterAction side-effects only.
///
/// @dev Deploy this contract once; create many jobs from it.
/// @dev Deliberately not upgradeable — trust is derived from immutability.
// vendored from erc8183/erc8183-reference (MIT) — unmodified
contract ACPCore is IACP, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ─────────────────────────────────────────────────────────────────────────
    // State
    // ─────────────────────────────────────────────────────────────────────────

    /// @notice The ERC-20 token used for all payments (e.g., USDC).
    IERC20 public immutable paymentToken;

    /// @notice Auto-incrementing job ID counter.
    uint256 private _jobCount;

    /// @notice All jobs indexed by jobId.
    mapping(uint256 => Job) private _jobs;

    // ─────────────────────────────────────────────────────────────────────────
    // Constructor
    // ─────────────────────────────────────────────────────────────────────────

    /// @param token The ERC-20 payment token address (e.g., USDC on Monad testnet).
    constructor(address token) {
        require(token != address(0), "ACPCore: zero token address");
        paymentToken = IERC20(token);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // External Functions
    // ─────────────────────────────────────────────────────────────────────────

    /// @inheritdoc IACP
    function createJob(
        address provider,
        address evaluator,
        uint256 expiredAt,
        string calldata description,
        address hook
    ) external returns (uint256 jobId) {
        require(evaluator != address(0), "ACPCore: zero evaluator");
        require(expiredAt > block.timestamp, "ACPCore: expiry in past");

        jobId = ++_jobCount;

        _jobs[jobId] = Job({
            client: msg.sender,
            provider: provider,
            evaluator: evaluator,
            hook: hook,
            token: address(paymentToken),
            budget: 0,
            expiredAt: expiredAt,
            status: JobStatus.Open
        });

        emit JobCreated(jobId, msg.sender, evaluator, provider, hook, expiredAt);
        // description is emitted as an event for off-chain indexers, not stored on-chain
        // (keeping storage minimal per ERC-8183 design philosophy)
    }

    /// @inheritdoc IACP
    function setProvider(uint256 jobId, address provider, bytes calldata optParams) external {
        Job storage job = _getOpenJob(jobId);
        require(msg.sender == job.client, "ACPCore: not client");

        _callBeforeAction(job.hook, jobId, IACP.setProvider.selector, optParams);
        job.provider = provider;
        emit ProviderSet(jobId, provider);
        _callAfterAction(job.hook, jobId, IACP.setProvider.selector, optParams);
    }

    /// @inheritdoc IACP
    function setBudget(uint256 jobId, uint256 amount, bytes calldata optParams) external {
        Job storage job = _getOpenJob(jobId);
        require(msg.sender == job.client || msg.sender == job.provider, "ACPCore: not client or provider");

        _callBeforeAction(job.hook, jobId, IACP.setBudget.selector, optParams);
        job.budget = amount;
        emit BudgetSet(jobId, amount);
        _callAfterAction(job.hook, jobId, IACP.setBudget.selector, optParams);
    }

    /// @inheritdoc IACP
    function fund(uint256 jobId, uint256 expectedBudget, bytes calldata optParams) external nonReentrant {
        Job storage job = _getOpenJob(jobId);
        require(msg.sender == job.client, "ACPCore: not client");
        require(job.budget > 0, "ACPCore: budget not set");
        require(job.budget == expectedBudget, "ACPCore: budget mismatch");

        _callBeforeAction(job.hook, jobId, IACP.fund.selector, optParams);

        job.status = JobStatus.Funded;
        // Pull funds from client — requires prior approve() on paymentToken
        paymentToken.safeTransferFrom(msg.sender, address(this), job.budget);
        emit JobFunded(jobId, job.budget);

        _callAfterAction(job.hook, jobId, IACP.fund.selector, optParams);
    }

    /// @inheritdoc IACP
    function submit(uint256 jobId, bytes calldata deliverable, bytes calldata optParams) external nonReentrant {
        Job storage job = _jobs[jobId];
        require(job.status == JobStatus.Funded, "ACPCore: not Funded");
        require(msg.sender == job.provider, "ACPCore: not provider");
        require(block.timestamp < job.expiredAt, "ACPCore: expired");

        _callBeforeAction(job.hook, jobId, IACP.submit.selector, deliverable);

        job.status = JobStatus.Submitted;
        emit JobSubmitted(jobId, deliverable);

        _callAfterAction(job.hook, jobId, IACP.submit.selector, deliverable);
    }

    /// @inheritdoc IACP
    function complete(uint256 jobId, bytes calldata reason, bytes calldata optParams) external nonReentrant {
        Job storage job = _jobs[jobId];
        require(
            job.status == JobStatus.Funded || job.status == JobStatus.Submitted,
            "ACPCore: not Funded or Submitted"
        );
        require(msg.sender == job.evaluator, "ACPCore: not evaluator");

        _callBeforeAction(job.hook, jobId, IACP.complete.selector, reason);

        job.status = JobStatus.Completed;
        address provider = job.provider;
        uint256 budget = job.budget;
        emit JobCompleted(jobId, reason);

        // Transfer full budget to provider; hook's afterAction handles fee split if needed
        paymentToken.safeTransfer(provider, budget);

        _callAfterAction(job.hook, jobId, IACP.complete.selector, reason);
    }

    /// @inheritdoc IACP
    function reject(uint256 jobId, bytes calldata reason, bytes calldata optParams) external nonReentrant {
        Job storage job = _jobs[jobId];
        require(
            job.status == JobStatus.Open ||
            job.status == JobStatus.Funded ||
            job.status == JobStatus.Submitted,
            "ACPCore: already terminal"
        );
        // Client may reject when Open; evaluator may reject when Funded or Submitted
        require(
            (job.status == JobStatus.Open && msg.sender == job.client) ||
            (job.status != JobStatus.Open && msg.sender == job.evaluator),
            "ACPCore: unauthorized reject"
        );

        _callBeforeAction(job.hook, jobId, IACP.reject.selector, reason);

        bool hadFunds = job.status != JobStatus.Open;
        job.status = JobStatus.Rejected;
        emit JobRejected(jobId, reason);

        // Refund escrowed funds if job was funded
        if (hadFunds) {
            paymentToken.safeTransfer(job.client, job.budget);
        }

        _callAfterAction(job.hook, jobId, IACP.reject.selector, reason);
    }

    /// @inheritdoc IACP
    /// @dev Deliberately NOT hookable. Prevents hooks from blocking refunds.
    function claimRefund(uint256 jobId) external nonReentrant {
        Job storage job = _jobs[jobId];
        require(
            job.status == JobStatus.Funded || job.status == JobStatus.Submitted,
            "ACPCore: not refundable"
        );
        require(block.timestamp >= job.expiredAt, "ACPCore: not expired");

        job.status = JobStatus.Expired;
        emit JobExpired(jobId);
        paymentToken.safeTransfer(job.client, job.budget);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // View Functions
    // ─────────────────────────────────────────────────────────────────────────

    /// @inheritdoc IACP
    function getJob(uint256 jobId) external view returns (Job memory) {
        return _jobs[jobId];
    }

    /// @inheritdoc IACP
    function jobCount() external view returns (uint256) {
        return _jobCount;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Internal Helpers
    // ─────────────────────────────────────────────────────────────────────────

    function _getOpenJob(uint256 jobId) internal view returns (Job storage job) {
        job = _jobs[jobId];
        require(job.status == JobStatus.Open, "ACPCore: not Open");
    }

    /// @dev Call beforeAction on hook if configured. No-op if hook == address(0).
    function _callBeforeAction(address hook, uint256 jobId, bytes4 selector, bytes calldata data) internal {
        if (hook != address(0)) {
            IACPHook(hook).beforeAction(jobId, selector, data);
        }
    }

    /// @dev Call afterAction on hook if configured. No-op if hook == address(0).
    /// @dev afterAction should not revert — if it does, the entire tx reverts.
    function _callAfterAction(address hook, uint256 jobId, bytes4 selector, bytes calldata data) internal {
        if (hook != address(0)) {
            IACPHook(hook).afterAction(jobId, selector, data);
        }
    }
}
