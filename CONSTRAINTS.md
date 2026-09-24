# Veris — Hard Constraints
> These apply to **every phase, every file, every commit** — no exceptions.

---

## 1. Original Implementation Only
- You may **read and study** `github.com/Aliserag/OpenBook` and `github.com/web3xDev/onchainrouter` for architectural understanding only.
- **Never** clone, fork, copy-paste, or vendor: code, contract ABIs, config files, or documentation structure from either.
- Everything is written from scratch, in Veris-specific naming conventions and file layout.

## 2. Monad Testnet Only — Everywhere
- Chain ID: **10143**, RPC: `https://testnet-rpc.monad.xyz`, Currency: `MON`
- **No** Hedera, Arc, Circle wallets, Ethereum, Sepolia, or ENS — in code, config, env vars, or docs.
- Any reference-project mechanism that relied on another chain has been redesigned as a Monad-native equivalent — build the redesign, not the original.

## 3. Wallets / Auth: Dynamic Only
- Use `@dynamic-labs/sdk-react-core` + `@dynamic-labs/ethereum` exclusively.
- Embedded wallets with social and/or passkey login.
- Wallet creation triggered **explicitly** via `createWaasWalletAccounts()` immediately after sign-in — it is **not** purely automatic.
- **No seed phrase** is ever shown to a buyer or a seller, under any circumstance.

## 4. Indexing: Envio for History, RPC for Current State
- Use **Envio HyperIndex** (`https://monad-testnet.hypersync.xyz`) for all historical and aggregated data (reputation history, marketplace browse, settlement events).
- Use **direct Monad RPC** (`eth_call`) only for current on-chain state (listing price, escrow balance, active status).
- **No dependency on The Graph**, anywhere, ever.

## 5. Contract Testing: Foundry, TDD — Mandatory
- Every contract follows **RED → GREEN**: failing test written first, then implementation makes it pass.
- No contract is considered done without a passing Foundry test suite.
- Run: `forge test -vv` must be clean before any contract is shipped.

## 6. Security Scan — Not Optional
- Before marking any contract finished, explicitly check for:
  - Reentrancy
  - Access control gaps
  - Signature-verification correctness (ecrecover, EIP-712 domain, replay)
  - Integer overflow / underflow
  - Front-running on settlement
- These contracts hold escrowed user funds. There are no exceptions.

## 7. Fail Loudly, Never Silently
- If a signature check fails → surface a typed error with detail.
- If a freshness window is malformed → revert with a descriptive message.
- If Dynamic auth fails → throw, do not fall back to unauthenticated state.
- If Envio returns stale or missing data → surface the error, do not return a default.
- **Anywhere money moves, silent failures are forbidden.**
