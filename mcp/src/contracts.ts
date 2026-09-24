/**
 * contracts.ts — ABI definitions and helpers for Veris smart contracts
 */

export const ACP_CORE_ABI = [
  "function createJob(address provider, address evaluator, uint256 expiredAt, string calldata description, address hook) external returns (uint256 jobId)",
  "function fund(uint256 jobId, uint256 expectedBudget, bytes calldata optParams) external",
  "function claimRefund(uint256 jobId) external",
  "function getJob(uint256 jobId) external view returns (tuple(address client, address provider, address evaluator, address hook, address token, uint256 budget, uint256 expiredAt, uint8 status))",
  "function jobCount() external view returns (uint256)",
  "event JobCreated(uint256 indexed jobId, address indexed client, address indexed evaluator, address provider, address hook, uint256 expiredAt)",
  "event JobFunded(uint256 indexed jobId, uint256 amount)",
  "event JobCompleted(uint256 indexed jobId)",
  "event JobRejected(uint256 indexed jobId)",
] as const;

export const SLA_EVALUATOR_ABI = [
  "function resolve(tuple(bytes32 sellerId, uint256 jobId, bytes32 dataHash, uint256 sourceBlockNumber, uint256 sourceBlockTimestamp, bytes signature) calldata att, bytes calldata encodedAtt) external",
  "function feeBps() external view returns (uint256)",
  "event JobResolved(uint256 indexed jobId, bytes32 indexed sellerId, uint256 ageSeconds, bool accepted)",
] as const;

export const SELLER_REGISTRY_ABI = [
  "function getSeller(bytes32 sellerId) external view returns (tuple(address payoutAddress, address operatorKey, uint256 pricePerQuery, uint256 freshnessWindowSeconds, bytes32 datasetId, uint256 sourceChainId, bool active))",
  "event SellerRegistered(bytes32 indexed sellerId, address indexed payoutAddress, bytes32 datasetId)",
  "event SellerTermsUpdated(bytes32 indexed sellerId, uint256 newPrice, uint256 newFreshnessWindow)",
  "event SellerDeactivated(bytes32 indexed sellerId)",
] as const;

export const REPUTATION_REGISTRY_ABI = [
  "function getReputation(bytes32 sellerId) external view returns (uint256 slaMetCount, uint256 slaMissedCount, uint256 totalJobs, uint256 reliabilityBps)",
  "event ReputationUpdated(bytes32 indexed sellerId, bool wasFresh, uint256 newMet, uint256 newMissed)",
] as const;

export const ERC20_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)",
  "function decimals() external view returns (uint8)",
  "function symbol() external view returns (string)",
] as const;

export const ACP_JOB_STATUS: Record<number, string> = {
  0: "Open",
  1: "Funded",
  2: "Submitted",
  3: "Completed",
  4: "Rejected",
  5: "Expired",
};
