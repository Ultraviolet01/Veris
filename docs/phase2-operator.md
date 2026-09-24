# Veris — Phase 2 Brief: Off-chain Operator/Signing Service (TypeScript)

## File Layout

```
operator/
  src/
    index.ts            # entrypoint, runs the HTTP/query-handling server
    fetchData.ts        # pulls data via HyperRPC or direct Monad RPC
    signAttestation.ts  # hashes + signs {sellerId, jobId, dataHash, sourceBlockNumber, sourceBlockTimestamp}
    submitWork.ts       # calls SlaEvaluator.resolve() as the operator
    triggerEvaluation.ts # triggers SlaEvaluator hook logic
    config.ts           # loads operator key, RPC URLs, registered sellerId(s) from env
  .env.example
  package.json
```

---

## First Dataset — Confirmed Candidates

| Dataset | Source | Chain | Note |
|---------|--------|-------|------|
| **DEX pool prices** | **Kuru** | **Monad mainnet (143)** | ★ First pick — Metropolis sponsor bounty target |
| Perps/derivatives | Perpl | Monad mainnet (143) | Second pick — Metropolis sponsor bounties |
| Lending rates | Aave V3 | Ethereum mainnet (or L2s) | Matches OpenBook's top listing |
| DEX prices (alt) | Uniswap V3 | Ethereum mainnet / L2s | Matches OpenBook's second listing |
| NFT trades | OpenSea (Seaport) | Ethereum mainnet | Seaport 1.1: `0x00000000006c3852cbEf3e08E8dF289169EdE581` |
| Sports odds | Overtime Markets | Optimism / Arbitrum / Base | Same as OpenBook's listing |
| Prediction markets | Azuro | Polygon / Base / Gnosis / Arbitrum | ~30 front-ends |
| Prediction markets | Polymarket | Polygon | Best-known by volume |

**Scope for submission:** Ship with **Kuru** as the only live integration. Architecture (sourceChainId, generic fetchData) supports adding a second dataset as a `.env` change, no schema migration needed.

---

## Chain Split — Mirroring OpenBook's Design

| Layer | Chain | Chain ID |
|-------|-------|----------|
| Escrow / payment / reputation | Monad testnet | **10143** |
| Kuru / Perpl data source | Monad **mainnet** | **143** |
| (future) Aave / OpenSea data | Ethereum mainnet | 1 |

`fetchData.ts` reads from `sourceChainId` (e.g. 143 for Kuru).
ACPCore, SlaEvaluator, VerisTreasury — always Monad testnet (10143).

---

## Envio Layer — Confirmed: HyperRPC

Three Envio layers:
- **HyperSync** — raw fastest engine
- **HyperIndex** — full framework with schema + GraphQL (overkill for Phase 2)
- **HyperRPC** ← **Use this.** Drop-in RPC replacement, no schema needed, backed by HyperSync.

URL pattern: `https://<chainId>.rpc.hypersync.xyz/<api-token>`
Example for Monad mainnet: `https://143.rpc.hypersync.xyz/<token>`
Get token at: `envio.dev/app/api-tokens`

---

## Environment Variables

```
MONAD_TESTNET_RPC_URL=       # chain 10143 — ACPCore/escrow/payment
MONAD_MAINNET_RPC_URL=       # chain 143 — Kuru/Perpl data source
OPERATOR_PRIVATE_KEY=
ACP_CORE_ADDRESS=
SLA_EVALUATOR_ADDRESS=
SELLER_REGISTRY_ADDRESS=
VERIS_TREASURY_ADDRESS=
PAYMENT_TOKEN_ADDRESS=0x534b2f3A21130d7a60830c2Df862319e593943A3
HYPERRPC_URL=                # https://143.rpc.hypersync.xyz/<token> for Monad mainnet
SELLER_ID=                   # bytes32 sellerId this operator instance serves
```

---

## Step-by-Step Flow

1. Listen for `JobFunded(jobId, amount)` events on ACPCore (Monad testnet, polling or subscription)
2. For each funded job where provider == SlaEvaluator address:
   - Fetch data from the seller's `sourceChainId` via HyperRPC
   - Record exact `sourceBlockNumber` and `sourceBlockTimestamp` (wall-clock anchor)
   - `dataHash = keccak256(canonicalize(payload))`
   - Sign `{sellerId, jobId, dataHash, sourceBlockNumber, sourceBlockTimestamp}` with `OPERATOR_PRIVATE_KEY`
   - Call `SlaEvaluator.resolve(attestation, encodedAttestation)` on Monad testnet
3. Log outcome (Completed / Rejected / revert reason)

---

## Design Requirement

Structure so a second, independent operator can run their own instance with only `.env` changes:
- Their own `SELLER_ID`, `OPERATOR_PRIVATE_KEY`, dataset
- No code modifications required
- This proves the marketplace is real, not hardcoded
