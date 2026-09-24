#!/usr/bin/env node
/**
 * server.ts — Veris Model Context Protocol (MCP) Server Entrypoint
 *
 * Implements the 5 core Veris tools for AI agents on Monad Testnet:
 *   - list_datasets
 *   - get_quote
 *   - purchase
 *   - verify_delivery
 *   - check_reputation
 *
 * Runs over standard input/output (StdioServerTransport) for plug-and-play
 * integration with Claude Desktop, Cursor, Antigravity, and autonomous agent loops.
 */
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";

import { listDatasets } from "./tools/listDatasets.js";
import { getQuote } from "./tools/getQuote.js";
import { purchase } from "./tools/purchase.js";
import { verifyDelivery } from "./tools/verifyDelivery.js";
import { checkReputation } from "./tools/checkReputation.js";
import { MONAD_TESTNET_CHAIN_ID, MONAD_TESTNET_RPC_URL } from "./config.js";

const server = new Server(
  {
    name: "veris-data-marketplace",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// ── Register Tool Definitions ─────────────────────────────────────────────────
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "list_datasets",
        description:
          "List all on-chain datasets available on the Veris data marketplace on Monad Testnet (Chain ID 10143). " +
          "Returns live terms and trust scores pulled directly from SellerRegistry and ReputationRegistry.",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "get_quote",
        description:
          "Fetch a real-time quote for a specific dataset seller on Veris, including query price (USDC), " +
          "promised freshness SLA window (seconds), ERC-8004 reliability score (basis points), and active status.",
        inputSchema: {
          type: "object",
          properties: {
            sellerId: {
              type: "string",
              description: "The 0x-prefixed 32-byte hex seller identifier (e.g. 0xa2a2a2...102 for Kuru).",
            },
          },
          required: ["sellerId"],
        },
      },
      {
        name: "purchase",
        description:
          "Execute a single bundled SLA-guaranteed dataset purchase on Monad Testnet. " +
          "Pre-validates against maxPrice and maxAgeSeconds before spending anything. " +
          "Creates and funds an escrow job on ACPCore in USDC, waits for operator freshness attestation and " +
          "atomic SlaEvaluator resolution. Returns authenticated data payload on completion, or guarantees a 100% refund on failure.",
        inputSchema: {
          type: "object",
          properties: {
            sellerId: {
              type: "string",
              description: "0x-prefixed 32-byte seller identifier.",
            },
            maxPrice: {
              type: "number",
              description: "Maximum price willing to spend in USDC (e.g. 0.35).",
            },
            maxAgeSeconds: {
              type: "number",
              description: "Maximum acceptable data age SLA in seconds (e.g. 5).",
            },
          },
          required: ["sellerId", "maxPrice", "maxAgeSeconds"],
        },
      },
      {
        name: "verify_delivery",
        description:
          "Independently audit and inspect any past job on-chain on Monad Testnet without paying again. " +
          "Directly verifies status, settlement verdict, data age, and escrow budget from ACPCore and SlaEvaluator contracts.",
        inputSchema: {
          type: "object",
          properties: {
            jobId: {
              type: "number",
              description: "The ACPCore job ID to audit (e.g. 192).",
            },
          },
          required: ["jobId"],
        },
      },
      {
        name: "check_reputation",
        description:
          "Query the permanent on-chain ERC-8004 reputation score for any seller on Veris. " +
          "Returns historical SLA met count, missed count, total jobs, and reliability basis points.",
        inputSchema: {
          type: "object",
          properties: {
            sellerId: {
              type: "string",
              description: "0x-prefixed 32-byte seller identifier.",
            },
          },
          required: ["sellerId"],
        },
      },
    ],
  };
});

// ── Handle Tool Execution ─────────────────────────────────────────────────────
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "list_datasets": {
        const result = await listDatasets();
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "get_quote": {
        if (!args || typeof args.sellerId !== "string") {
          throw new McpError(ErrorCode.InvalidParams, "sellerId (string) is required");
        }
        const result = await getQuote(args.sellerId);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "purchase": {
        if (
          !args ||
          typeof args.sellerId !== "string" ||
          typeof args.maxPrice !== "number" ||
          typeof args.maxAgeSeconds !== "number"
        ) {
          throw new McpError(
            ErrorCode.InvalidParams,
            "sellerId (string), maxPrice (number), and maxAgeSeconds (number) are required"
          );
        }
        const result = await purchase({
          sellerId: args.sellerId,
          maxPrice: args.maxPrice,
          maxAgeSeconds: args.maxAgeSeconds,
        });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "verify_delivery": {
        if (!args || typeof args.jobId !== "number") {
          throw new McpError(ErrorCode.InvalidParams, "jobId (number) is required");
        }
        const result = await verifyDelivery(args.jobId);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "check_reputation": {
        if (!args || typeof args.sellerId !== "string") {
          throw new McpError(ErrorCode.InvalidParams, "sellerId (string) is required");
        }
        const result = await checkReputation(args.sellerId);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      default:
        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              error: true,
              tool: name,
              message,
            },
            null,
            2
          ),
        },
      ],
      isError: true,
    };
  }
});

// ── Server Startup ────────────────────────────────────────────────────────────
async function run() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(
    `[Veris MCP] Server connected via stdio transport (Monad Testnet ${MONAD_TESTNET_CHAIN_ID} at ${MONAD_TESTNET_RPC_URL})`
  );
}

run().catch((error) => {
  console.error("[Veris MCP] Fatal error starting server:", error);
  process.exit(1);
});
