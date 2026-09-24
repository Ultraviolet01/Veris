# @veris/mcp-server

> Official Model Context Protocol (MCP) Server for the **Veris Data Marketplace** on Monad Testnet (Chain ID `10143`).

Allows AI agents and LLMs to autonomously discover, quote, purchase, and verify real-time on-chain datasets protected by self-enforcing SLA escrow.

---

## Tools Exposed

1. **`list_datasets`** — Live listing of available data feeds, prices, freshness SLAs, and ERC-8004 reliability ratings.
2. **`get_quote`** — Live quote for a specific `sellerId` (price, freshness window, active status).
3. **`check_reputation`** — Inspects on-chain ERC-8004 trust metrics (`slaMetCount`, `slaMissedCount`, `reliabilityBps`).
4. **`purchase`** — Bundled purchase call: pre-flight limit check → token approval → escrow creation & funding (`ACPCore`) → awaits operator attestation & resolution (`SlaEvaluator`). Returns data on completion or 100% refund guarantee on SLA miss.
5. **`verify_delivery`** — Independently audit any past on-chain job without re-purchasing.

---

## Quickstart

```bash
# 1. Install dependencies
npm install

# 2. Build TypeScript
npm run build

# 3. Run verification tests
npm run test:tools
```

---

## Client Integration

### Claude Desktop (`claude_desktop_config.json`)
```json
{
  "mcpServers": {
    "veris": {
      "command": "node",
      "args": ["<PATH_TO_VERIS>/mcp/dist/server.js"],
      "env": {
        "MONAD_TESTNET_RPC_URL": "https://testnet-rpc.monad.xyz",
        "BUYER_PRIVATE_KEY": "0xYourAgentWalletPrivateKey..."
      }
    }
  }
}
```

### Cursor (`.cursor/mcp.json`)
```json
{
  "mcpServers": {
    "veris": {
      "command": "node",
      "args": ["${workspaceFolder}/mcp/dist/server.js"],
      "env": {
        "MONAD_TESTNET_RPC_URL": "https://testnet-rpc.monad.xyz",
        "BUYER_PRIVATE_KEY": "0xYourAgentWalletPrivateKey..."
      }
    }
  }
}
```

For the complete developer guide with LangChain, CrewAI, AutoGen, and TypeScript SDK integrations, see [`docs/mcp-integration-guide.md`](../docs/mcp-integration-guide.md).
