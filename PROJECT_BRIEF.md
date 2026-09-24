# Veris — Project Brief

## What It Is

Veris is a data marketplace for AI agents, built natively on Monad, with a self-enforcing freshness guarantee.

Sellers list on-chain data (lending rates, DEX prices, liquidation risk, governance activity, etc.) under a price and a promised freshness window (e.g. "no older than 10 seconds"). A buyer agent pays into an escrow contract, the data arrives with a cryptographically signed proof of which Monad block it was read from, and a verifier contract automatically checks that claim against the promise — paying the seller if the data was genuinely fresh, or refunding the buyer instantly if it was stale.

**No dispute. No support ticket. No human arbitration.**

On top of that, Veris maintains a persistent, on-chain, ERC-8004-style reputation score per seller: how often they've honored their freshness promise over time. This is the piece neither reference project below has, and it's what turns a single-call payment guarantee into actual queryable agent trust.

---

## Why This Design

Inspired by two ETHOnline 2026 projects, studied for pattern only, never cloned:

- **[github.com/Aliserag/OpenBook](https://github.com/Aliserag/OpenBook)** — the self-enforcing SLA/refund mechanism: signed, block-stamped data attestations checked against a promised freshness window, with automatic escrow refund on failure. Built on Arc + Circle wallets + ENS on Sepolia + The Graph.
- **[github.com/web3xDev/onchainrouter](https://github.com/web3xDev/onchainrouter)** — the agent-payment pattern: pay-per-call over MCP or HTTP via x402 micropayments, no account, no API key, "no answer, no charge." Built on Hedera + Arc.

Neither project has a persistent reputation layer, and neither deploys on Monad. Combining OpenBook's freshness-guarantee mechanism with OnchainRouter's agent-native payment UX, adding a genuine ERC-8004 reputation layer, and deploying the whole thing exclusively on Monad is what makes Veris a real fit for **Metropolis Track 4 (Trust, Identity & AI Infrastructure)** rather than a re-skin of either.

---

## Hackathon Context

| Field | Value |
|-------|-------|
| **Event** | Monad Metropolis |
| **Track** | Track 4 — Trust, Identity & AI Infrastructure |
| **Build window** | 1 Sep – 13 Oct 2026 |
| **Submission deadline** | Oct 13, 2026 |
| **Judging period** | Oct 14–27 |
| **Winners announced** | Nov 3, 2026 |
| **Track prize** | $30,000 (split evenly between 3 teams) |
| **Grand champion pool** | $25,000 across all tracks |

### Sponsor Bounties in Scope

| Sponsor | Bounty | Amount |
|---------|--------|--------|
| **Dynamic** | "Best Use of Dynamic" — wallet/passkey embedded wallets | $5,000 |
| **Envio** | "Best Use of Envio" — indexing | $1,000 + free Envio Cloud hosting for winning teams |
| **Chainlink CRE** | "Best workflow with CRE" — automation *(stretch goal)* | $3,000 |

---

## Roles

### Seller (me — the demo operator)
- I run the operator/signing service and register my own dataset(s).
- The `SellerRegistry` contract must stay **generic** — any address can call `registerSeller`, not just mine — so the marketplace claim is demonstrably real, not hardcoded.

### Buyer
- Any AI agent (or the demo frontend, standing in for one) that pays for a data query and expects either a fresh answer or its money back.

---

## Core Mechanic (in one sentence)

> A buyer agent pays `priceWei` into escrow → operator returns data with a block-stamped signed attestation → the verifier contract checks the promised freshness window → seller is paid if fresh, buyer is refunded if stale — automatically, on-chain, with every outcome recorded in the seller's permanent reputation score.
