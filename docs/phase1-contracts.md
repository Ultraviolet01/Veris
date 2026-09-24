# Veris — Phase 1 Brief: Contracts (Solidity, Foundry)

## File Layout

```
contracts/
  src/
    SellerRegistry.sol
    vendor/
      ACPCore.sol           # vendored from erc8183/erc8183-reference (MIT), unmodified
      IACP.sol              # vendored — the ERC-8183 standard interface
      IACPHook.sol          # vendored — the hook interface ACPCore calls
    SlaEvaluator.sol        # our IACPHook implementation — freshness check
    VerisTreasury.sol       # fee treasury, capped and allowlisted
    ReputationRegistry.sol
    interfaces/
      ISellerRegistry.sol
      IVerisTreasury.sol
      IReputationRegistry.sol
  test/
    SellerRegistry.t.sol
    SlaEvaluator.t.sol
    VerisTreasury.t.sol
    ReputationRegistry.t.sol
    integration/
      FullJobLifecycle.t.sol
  script/
    Deploy.s.sol
  foundry.toml
```

---

## ERC-8183 Adoption — Confirmed Plan

`github.com/erc8183/erc8183-reference` (built by the ClawPlaza team) is a plain-Solidity, MIT-licensed reference implementation of ERC-8183 — ACPCore.sol, built on standard OpenZeppelin primitives (ReentrancyGuard, SafeERC20). Currently deployed on Base Mainnet but with **no Base-specific dependency** in the contract itself.

This vendoring is a **deliberate exception** to the "never clone" rule in the Hard Constraints — that rule covers the two hackathon peer projects (OpenBook, OnchainRouter). ACPCore.sol is a generic, standard reference implementation explicitly released for reuse, the same way you'd import an OpenZeppelin contract. Vendor it **unmodified** into `contracts/src/vendor/`, credit it in the README, and build Veris-specific logic around it.

### Confirmed Role Mapping

| ERC-8183 Term | Veris Role |
|---|---|
| Client | The buyer agent |
| Provider | The seller (running the operator/signing service) |
| Evaluator | `SlaEvaluator.sol` — approves or rejects based on signed freshness attestation |

### Confirmed State Machine (from ACPCore.sol)

```
Open (job posted)
  → Funded (client pays via fund())
    → Submitted (provider calls submit())
      → Completed (evaluator calls complete() — pays provider)
      → Rejected (evaluator calls reject() — refunds client)
    → Expired (anyone calls claimRefund() once expiredAt passes)
  → Expired (anyone calls claimRefund() once expiredAt passes)
```

---

## Payment Asset — Confirmed

ACPCore.sol uses **SafeERC20** — moves an ERC-20 token, not native MON.

- **USDC on Monad testnet:** `0x534b2f3A21130d7a60830c2Df862319e593943A3` (6 decimals)
- `PAYMENT_TOKEN_ADDRESS = 0x534b2f3A21130d7a60830c2Df862319e593943A3`
- `pricePerQuery` is denominated in USDC's 6-decimal units (e.g. `100000` = 0.10 USDC)

### Funding Test Wallets

| Asset | Method |
|---|---|
| MON (gas) | Monad faucet at `faucet.monad.xyz` or Alchemy's faucet — 1 MON per 24h, no login |
| USDC | Circle's CCTP sample app — bridge from another testnet (e.g. Sepolia) — budget setup time |

### `approve()` is Required — Not Optional

Because payment is in USDC, the buyer's wallet must call `approve()` on the USDC contract authorizing ACPCore to pull the payment **before** calling `createJob/fund`. This is a separate transaction with its own MON gas cost. Build it explicitly into Phase 3's buyer flow and Phase 4's purchase tool — not as an afterthought.

### Gas Mechanics

- ACPCore never holds or spends MON — it has no gas budget of its own.
- Gas for any tx is always paid by whichever wallet sent that tx.
- Buyer wallet pays gas for: `approve()` and `createJob/fund`.
- Operator wallet pays gas for: `submit()` and whatever call triggers SlaEvaluator resolution (which also moves USDC out of escrow).
- `claimRefund()` is callable by anyone per spec — typically the operator service or buyer directly.

---

## SellerRegistry.sol

Purpose: on-chain storefront, replacing OpenBook's ENS-name pattern with a plain registry — zero cross-chain dependency.

### State

```solidity
struct SellerTerms {
    address payoutAddress;
    address operatorKey;           // key that signs attestations for this seller
    uint256 pricePerQuery;         // USDC 6-decimal units (e.g. 100000 = 0.10 USDC)
    uint256 freshnessWindowSeconds;
    bytes32 datasetId;             // identifies what data this seller sells
    uint256 sourceChainId;         // chain the underlying data lives on (1=ETH, 137=Polygon, etc.)
    bool active;
}

mapping(bytes32 sellerId => SellerTerms) public sellers;
```

**Note on `sourceChainId`:** Veris escrow/payment/reputation stay on Monad testnet always. `sourceChainId` records which chain the operator actually reads data from (same pattern as OpenBook reselling ETH mainnet Aave/Uniswap data through one marketplace). Costs nothing to add now, avoids schema migration later.

### Functions

- `registerSeller(bytes32 sellerId, address payoutAddress, address operatorKey, uint256 pricePerQuery, uint256 freshnessWindowSeconds, bytes32 datasetId, uint256 sourceChainId)` — reverts if `sellerId` already registered to a different `msg.sender`; emits `SellerRegistered`.
- `updateTerms(bytes32 sellerId, uint256 newPrice, uint256 newFreshnessWindow)` — only callable by the seller's registered `payoutAddress`; emits `SellerTermsUpdated`.
- `deactivateSeller(bytes32 sellerId)` — only the seller; sets `active = false` (preserves historical reputation).
- `getSeller(bytes32 sellerId) external view returns (SellerTerms memory)`

### Edge Cases to Test

- Registering a duplicate `sellerId` from a different address must revert.
- Updating terms from a non-owner address must revert.
- A deactivated seller must be rejected when `ACPCore.createJob` is called.

---

## SlaEvaluator.sol (implements IACPHook — vendored)

Purpose: the trust-enforcement core. ACPCore handles escrow mechanics; SlaEvaluator is Veris's own logic plugged into ACPCore's hook points.

### Hook Interface

IACPHook exposes two callbacks — `beforeAction(...)` and `afterAction(...)` — invoked by ACPCore on every state-changing call, keyed by the call's function selector. SlaEvaluator branches on selector and decodes data accordingly:

| Action | Selector constant | data ABI encoding |
|---|---|---|
| submit | `SUBMIT` | `abi.encode(bytes32 deliverable, bytes optParams)` |
| complete | `COMPLETE` | `abi.encode(uint256 jobId, bytes32 reason, bytes optParams)` |
| reject | `REJECT` | `abi.encode(uint256 jobId, bytes32 reason, bytes optParams)` |
| fund | `FUND` | optParams (raw bytes) |

> **Open — must check vendored files first:** Whether logic belongs in `beforeAction` (gating before the call) or `afterAction` (reacting after state changed) must be confirmed by reading the vendored `IACPHook.sol` and `ACPCore.sol` directly before writing this contract.

### Attestation Struct

```solidity
struct Attestation {
    bytes32 sellerId;
    uint256 jobId;
    bytes32 dataHash;
    uint256 sourceBlockNumber;     // block the data was read from
    uint256 sourceBlockTimestamp;  // that block's own timestamp — the honest anchor
    bytes signature;               // signed by seller's operatorKey
}
```

**Why timestamp, not block number:** A raw `block.number - att.sourceBlockNumber` subtraction can make already-stale data look "0 blocks old" if Monad's block time is sub-second. SlaEvaluator compares `block.timestamp` (Monad current time) against `att.sourceBlockTimestamp` (when data was recorded) directly in seconds.

### Core Logic

1. Recover signer from `att.signature` over `keccak256(abi.encode(att.sellerId, att.jobId, att.dataHash, att.sourceBlockNumber, att.sourceBlockTimestamp))`
2. Revert if recovered signer != `SellerRegistry.getSeller(att.sellerId).operatorKey`
3. Revert if `att.sourceBlockTimestamp > block.timestamp` (impossible future claim)
4. Compute `ageSeconds = block.timestamp - att.sourceBlockTimestamp`
5. If `ageSeconds <= sellers[att.sellerId].freshnessWindowSeconds` → signal ACPCore to `complete()` → call `ReputationRegistry.recordOutcome(att.sellerId, true)`
6. Else → signal ACPCore to `reject()` → call `ReputationRegistry.recordOutcome(att.sellerId, false)`
7. Emit `JobResolved(jobId, sellerId, ageSeconds, accepted: bool)` from SlaEvaluator

### Fee Routing

Check whether ACPCore.sol has a built-in fee mechanism. If it doesn't, SlaEvaluator (or a wrapper around the `complete()` call) routes payout through `VerisTreasury.sol` for the 2% fee cut. **Confirm by reading ACPCore.sol's actual `complete()` implementation before deciding.**

### Edge Cases to Test

- Forged signature (not the registered `operatorKey`) must revert before any state change on ACPCore.
- Resolution for an already-Terminal job must revert (rely on ACPCore's own state checks).
- `sourceBlockTimestamp` in the future must revert.
- `ageSeconds` exactly equal to `freshnessWindowSeconds` must resolve as Completed (inclusive boundary — test explicitly).
- `ageSeconds` one second past the window must resolve as Rejected.

---

## VerisTreasury.sol

Purpose: platform-fee treasury — on-chain spending caps so even a compromised admin key can't drain it.

### State

```solidity
address public owner;
uint256 public perTransactionCapWei;
uint256 public dailyCapWei;
uint256 public spentToday;
uint256 public dayStart;
mapping(address => bool) public allowlist; // addresses fee funds may be withdrawn to
```

### Functions

- `receive() external payable`
- `withdraw(address to, uint256 amount)` — only owner; reverts if `to` not allowlisted, if `amount > perTransactionCapWei`, or if `spentToday + amount > dailyCapWei`; resets `spentToday/dayStart` on a new day; emits `Withdrawal`.
- `setAllowlist(address addr, bool allowed)` — only owner
- `setCaps(uint256 perTx, uint256 daily)` — only owner

### Edge Cases to Test

- Withdrawal to non-allowlisted address must revert.
- Withdrawal exceeding either cap must revert.
- Caps correctly reset after a day boundary.
- Only owner can call any state-changing function.

---

## ReputationRegistry.sol

Purpose: persistent, queryable on-chain trust — the Track 4 differentiator.

### State

```solidity
struct Reputation {
    uint256 slaMetCount;
    uint256 slaMissedCount;
}

mapping(bytes32 sellerId => Reputation) public reputations;
address public slaEvaluator; // only this address may call recordOutcome
```

### Functions

- `recordOutcome(bytes32 sellerId, bool wasFresh)` — only `slaEvaluator`; increments appropriate counter; emits `ReputationUpdated`.
- `getReputation(bytes32 sellerId) external view returns (uint256 met, uint256 missed, uint256 totalJobs, uint256 reliabilityBps)` — `reliabilityBps = met / (met + missed)` in basis points (0–10000).

**Keep genuinely separate from SlaEvaluator** — independently queryable by any agent or frontend.

---

## Integration Test — FullJobLifecycle.t.sol

Simulate end-to-end in Foundry:

1. Register a seller.
2. Buyer calls `ACPCore.createJob/fund` → job reaches Funded.
3. Provider calls `submit()`, SlaEvaluator resolves with fresh attestation → assert: job = Completed, seller's `payoutAddress` received payout (minus 2% fee), VerisTreasury received fee, buyer balance unchanged beyond paid amount, `slaMetCount` incremented.
4. Second job: resolve with stale attestation → assert: job = Rejected, buyer refunded full amount (no fee), `slaMissedCount` incremented.
5. Third job: forged signature attestation → assert revert, no state change on ACPCore/treasury/reputation.
6. Fourth job: sits past `expiredAt` with no resolution → assert anyone can call `claimRefund`, buyer refunded in full, status = Expired.
7. Fifth job: `ageSeconds` exactly equal to `freshnessWindowSeconds` → assert resolves as Completed (inclusive boundary).

---

## Deployment Script — Deploy.s.sol

Deploy in this order, wiring each address into the next:

1. `SellerRegistry`
2. `ReputationRegistry`
3. `VerisTreasury`
4. `ACPCore` (vendored, with your own constructor parameters)
5. `SlaEvaluator` (wired to SellerRegistry, ACPCore, ReputationRegistry)
6. Confirm SlaEvaluator is registered as evaluator/hook per ACPCore's `createJob` parameters (re-check against vendored contract — may differ from "set address after deployment")
7. `ReputationRegistry.slaEvaluator = deployed SlaEvaluator address`
8. `VerisTreasury.setAllowlist` for own payout address
9. `VerisTreasury.setCaps` with sensible testnet limits

Output all deployed addresses to `deployments/monad-testnet.json`.

---

## Setup / Deploy / Verify Commands

### Project Init

```sh
forge init --template monad-developers/foundry-monad veris-contracts
```

### foundry.toml

```toml
[profile.default]
src = "src"
out = "out"
libs = ["lib"]
eth-rpc-url = "https://testnet-rpc.monad.xyz"
chain_id = 10143
```

### Deployment

Use a keystore (not raw private key):
```sh
cast wallet import <name>   # set up keystore
forge script script/Deploy.s.sol --broadcast --rpc-url https://testnet-rpc.monad.xyz --account <name>
```

### Verification (per contract)

```sh
forge verify-contract \
  <contract_address> \
  <contract_name> \
  --chain 10143 \
  --verifier sourcify
```

Run for: `SellerRegistry`, `ACPCore`, `SlaEvaluator`, `VerisTreasury`, `ReputationRegistry`.
