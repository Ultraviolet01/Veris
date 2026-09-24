# Veris · Autonomous Data Marketplace on Monad

> **Self-enforcing SLA escrow and persistent ERC-8004 trust ratings for AI agents, built natively on Monad.**

[![Monad Testnet](https://img.shields.io/badge/Monad-Testnet%20(10143)-836ef9.svg)](https://testnet.monadscan.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![ERC-8183](https://img.shields.io/badge/Standard-ERC--8183%20Escrow-emerald.svg)](https://eips.ethereum.org/EIPS/eip-8183)
[![ERC-8004](https://img.shields.io/badge/Reputation-ERC--8004%20Trust-cyan.svg)](https://eips.ethereum.org/EIPS/eip-8004)

---

## ⚡ What is Veris?

Veris is an autonomous data marketplace designed specifically for AI agents, trading data natively on **Monad**.

When an agent needs real-time on-chain data (such as DEX order book depth, lending rates, funding rates, or prediction market odds), it specifies a **hard budget cap** and a **freshness SLA window** (e.g. *“≤ 3 seconds old”*).

1. **Buyer deposits into Escrow:** Funds are locked in an `ACPCore` (ERC-8183) escrow contract.
2. **Operator attests & signs block proof:** The data provider's operator captures the payload, stamps it with the source block height and timestamp, and ECDSA-signs the attestation.
3. **On-Chain Evaluation:** `SlaEvaluator.sol` atomically evaluates the proof against the promised SLA.
   - **If fresh (SLA met):** 98% of payment is released to the seller's wallet, 2% protocol fee goes to `VerisTreasury`, and the seller's on-chain ERC-8004 reputation is incremented.
   - **If stale or offline:** The escrow contract **automatically refunds 100% of the funds back to the buyer agent**.

**Zero human dispute. Zero arbitration. Fully deterministic on-chain execution.**

---

## 📋 Deployed Contracts (Monad Testnet · Chain ID 10143)

| Contract | Address | Explorer Link |
|---|---|---|
| **`ACPCore`** (ERC-8183 Escrow) | `0x5898d78653C1f691431A045580c1b1D6aFC28AF9` | [MonadScan](https://testnet.monadscan.com/address/0x5898d78653C1f691431A045580c1b1D6aFC28AF9) |
| **`SlaEvaluator`** (Verifier Hook) | `0xfc10869E2Bb2E8060DD59C59D0aAB01475bb75A0` | [MonadScan](https://testnet.monadscan.com/address/0xfc10869E2Bb2E8060DD59C59D0aAB01475bb75A0) |
| **`SellerRegistry`** (Storefront) | `0xE0E71C31890DD9f78b3B7f147046dBF1cc374547` | [MonadScan](https://testnet.monadscan.com/address/0xE0E71C31890DD9f78b3B7f147046dBF1cc374547) |
| **`ReputationRegistry`** (ERC-8004) | `0x4b4c76a28a0f5577A80a470C64d64c4dFC5A7183` | [MonadScan](https://testnet.monadscan.com/address/0x4b4c76a28a0f5577A80a470C64d64c4dFC5A7183) |
| **`VerisTreasury`** (Protocol Treasury) | `0x402E06B57D2e5c0452492703764a7E24e9772E56` | [MonadScan](https://testnet.monadscan.com/address/0x402E06B57D2e5c0452492703764a7E24e9772E56) |
| **Payment Token (USDC)** | `0x534b2f3A21130d7a60830c2Df862319e593943A3` | [MonadScan](https://testnet.monadscan.com/address/0x534b2f3A21130d7a60830c2Df862319e593943A3) |

---

## 🏛 Monorepo Architecture

```
Veris/
├── contracts/        # Solidity smart contracts & Foundry test suite
│   ├── src/          # SellerRegistry, ReputationRegistry, SlaEvaluator, VerisTreasury
│   ├── script/       # Deploy.s.sol deployment scripts
│   └── test/         # 58/58 passing Foundry unit & integration tests
│
├── frontend/         # React + Vite + Tailwind CSS Web Application
│   ├── src/          # Dynamic EVM wallet, Terminal, Reputation Hub, Buyer Modal
│   │   └── components/AgentChatbot.tsx  # Claude natural-language purchase console
│   └── vite.config.ts# Vite config with server-side Anthropic API streaming
│
├── operator/         # Autonomous backend operator service
│   └── src/          # Polling engine, data fetcher, ECDSA attestation signer
│
├── mcp/              # Model Context Protocol (MCP) Server for AI agents
│   ├── src/tools/    # list_datasets, get_quote, purchase, verify_delivery, check_reputation
│   └── config/       # veris.json dataset registry
│
└── docs/             # Technical specifications & developer integration guides
    └── mcp-integration-guide.md
```

---

## 🚀 Getting Started

### 1. Smart Contracts (`contracts/`)
```bash
cd contracts
# Run the 58 test Foundry suite
forge test -vv
```

### 2. Frontend Application (`frontend/`)
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173/` to interact with:
- **Dynamic Embedded Wallets:** Social & passkey EVM wallet creation.
- **Data Market Terminal:** Real-time browse, query generation, and SLA statistics.
- **Reputation Hub:** Live ERC-8004 persistent reliability rankings.
- **Claude Natural-Language Console:** Type queries like *"Get me Kuru's price under 5s, max 0.05 USDC"* to generate structured purchase transactions.

### 3. Operator Signing Service (`operator/`)
```bash
cd operator
cp .env.example .env
# Fill in OPERATOR_PRIVATE_KEY
npm install
npm run dev
```

### 4. Model Context Protocol Server (`mcp/`)
Connect Claude Desktop, Cursor, or autonomous Python/TS agent loops:
```bash
cd mcp
npm install
npm run build
```
Run directly via standard I/O:
```bash
npx -y @veris/mcp-server
```

---

## 🛡 Security & Design Principles

- **Hard Client-Side Spending Cap:** Enforced before any wallet signature is requested.
- **ECDSA Attestation Replay Prevention:** Hashes bind `(sellerId, jobId, dataHash, sourceBlockNumber, sourceBlockTimestamp)` uniquely to each job.
- **Atomic Escrow Releases:** Funds are only transferred after cryptographic evaluation on Monad.
- **Zero Human Arbitrators:** SLAs are evaluated strictly on-chain by `SlaEvaluator.sol`.

---

## 📄 License

MIT License. See [LICENSE](LICENSE) for details.
