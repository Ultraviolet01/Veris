# Veris Envio HyperIndex & Analytics Engine

> **Multi-Chain Real-Time Indexer for Autonomous Agent Data Escrows (ERC-8183) & Persistent ERC-8004 Reputation.**

Built on top of **Envio HyperIndex** and **Envio HyperSync/HyperRPC**, indexing:
* **Monad Testnet (Chain ID 10143):** Autonomous Escrows (`ACPCore.sol`), Programmatic Freshness Evaluations (`SlaEvaluator.sol`), Storefront Registry (`SellerRegistry.sol`), and Persistent Trust Ratings (`ReputationRegistry.sol`).
* **Ethereum Mainnet (Chain ID 1):** Cross-chain underlying liquidity & oracle feeds (Uniswap V3, Aave V3).

---

## ⚡ Envio Hackathon Rubric Alignment

| Rubric Criterion | Implementation in Veris Indexer |
|---|---|
| **Depth of Use** | • **Multichain Indexing:** Monad Testnet (`10143`) + Ethereum (`1`).<br>• **Non-Trivial Schema:** 7 relational & aggregated entities in `schema.graphql`.<br>• **Derived Aggregations:** Daily seller metrics, rolling delivery latency averages, rolling SLA compliance rates, and global protocol fee capture.<br>• **HyperSync Analytics:** Direct event streaming using authenticated HyperSync token. |
| **Working Product** | Connects live to Envio HyperRPC (`10143.rpc.hypersync.xyz`) and HyperSync (`monad-testnet.hypersync.xyz`), processes real events, and serves GraphQL. |
| **Originality** | First autonomous AI data marketplace indexer with programmatic SLA evaluation, escrow status tracking, and ERC-8004 reputation indexing. |
| **Craft** | Clean TypeScript, strict typing, fully documented schema, and standalone runnable service. |

---

## 🏛 Schema Architecture (`schema.graphql`)

```
      ┌─────────────┐               1:N              ┌─────────────┐
      │   Client    ├────────────────────────────────►     Job     │
      └─────────────┘                                └──────┬──────┘
                                                            │ 1:1
                                                            ▼
      ┌─────────────┐               1:N              ┌─────────────┐
      │   Seller    ├────────────────────────────────►SlaEvaluation│
      └──────┬──────┘                                └─────────────┘
             │ 1:N
             ▼
┌──────────────────────┐
│  SellerDailyMetric   │  (Aggregates: Latency, Pass Rate, Volume, SLA Breaches)
└──────────────────────┘
```

### Key Entities
1. **`Seller`**: Data providers, terms (`pricePerQuery`, `freshnessWindowSeconds`), total volume settled, SLA pass counts, and rolling average latency.
2. **`Job`**: Autonomous escrow lifecycle tracking (`OPEN` &rarr; `FUNDED` &rarr; `COMPLETED` / `REJECTED` / `EXPIRED`).
3. **`SlaEvaluation`**: Cryptographic SLA attestation results (measured age vs. threshold, payout vs. refund, transaction hash).
4. **`SellerDailyMetric`**: Derived daily rollup calculating SLA pass rate percentage and median latency.
5. **`ProtocolMetric`**: Protocol-wide analytics tracking total volume settled, total refunded on SLA miss, and fee capture.
6. **`CrossChainDataSource`**: Telemetry tracking cross-chain data providers on Ethereum and Monad.

---

## 🚀 Quickstart

### 1. Install Dependencies
```bash
cd indexer
npm install
```

### 2. Build the Service
```bash
npm run build
```

### 3. Start the Live Envio Analytics Server
```bash
npm run start
```
The server will boot on `http://localhost:4001`:
* **GraphQL Endpoint:** `http://localhost:4001/graphql`
* **REST Analytics Feed:** `http://localhost:4001/api/analytics`
* **Health Check:** `http://localhost:4001/health`

### 4. Running via Envio CLI
```bash
# Generate Envio types from schema.graphql and config.yaml
npm run codegen

# Run Envio local dockerized indexer
npm run dev
```

---

## 🔎 Example GraphQL Queries

### Query 1: Fetch Top Sellers and Reliability Scores
```graphql
query GetTopSellers {
  sellers(first: 10, orderBy: reliabilityBps, orderDirection: desc) {
    id
    payoutAddress
    pricePerQuery
    freshnessWindowSeconds
    totalJobsCompleted
    totalJobsRefunded
    totalVolumeUsdc
    reliabilityBps
    avgDeliveryLatencySeconds
  }
}
```

### Query 2: Fetch Protocol Global Analytics
```graphql
query GetProtocolHealth {
  protocolMetric(id: "global") {
    totalJobsCreated
    totalJobsCompleted
    totalJobsRefunded
    totalVolumeEscrowedUsdc
    totalVolumeSettledUsdc
    totalProtocolFeesCollectedUsdc
    globalSlaPassRateBps
    activeSellersCount
  }
}
```

### Query 3: Fetch Daily SLA Performance for a Provider
```graphql
query GetSellerPerformance($sellerId: ID!) {
  seller(id: $sellerId) {
    dailyMetrics(orderBy: date, orderDirection: desc) {
      date
      jobsCompleted
      jobsRefunded
      volumeUsdc
      avgLatencySeconds
      slaComplianceRate
    }
  }
}
```

---

## 🛡 Network Endpoints Configured

* **Monad Testnet HyperRPC:** `https://10143.rpc.hypersync.xyz/dc3a296f-f7c6-4b60-9bd7-a2f9bdcc4c64`
* **Ethereum HyperRPC:** `https://1.rpc.hypersync.xyz/dc3a296f-f7c6-4b60-9bd7-a2f9bdcc4c64`
* **Monad HyperSync Stream:** `https://monad-testnet.hypersync.xyz`
* **Ethereum HyperSync Stream:** `https://eth.hypersync.xyz`
