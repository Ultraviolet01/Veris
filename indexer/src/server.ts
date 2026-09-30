/**
 * server.ts — Envio HyperIndex GraphQL & Analytics Service for Veris
 *
 * Exposes:
 *   - POST /graphql: Standard GraphQL endpoint for Veris Schema
 *   - GET /api/analytics: JSON analytics for frontend ReputationHub & Explorer
 *   - GET /health: Health status and sync state
 */

import http from "http";
import { EnvioAnalyticsEngine } from "./analytics.js";

const PORT = parseInt(process.env["INDEXER_PORT"] || "4001", 10);
const engine = new EnvioAnalyticsEngine();

// Sync initial events on boot
await engine.syncLatestEvents();

// Background continuous sync every 4 seconds
setInterval(async () => {
  await engine.syncLatestEvents();
}, 4000);

const server = http.createServer(async (req, res) => {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = req.url || "/";

  // 1. Health Endpoint
  if (req.method === "GET" && url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        status: "healthy",
        service: "Veris Envio HyperIndex",
        networks: ["Monad Testnet (10143)", "Ethereum Mainnet (1)"],
        activeSellers: engine.processor.state.sellers.size,
        totalJobsIndexed: engine.processor.state.jobs.size,
        totalEvaluations: engine.processor.state.evaluations.size,
      })
    );
    return;
  }

  // 2. REST Analytics Endpoint
  if (req.method === "GET" && url.startsWith("/api/analytics")) {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(engine.getSnapshot(), null, 2));
    return;
  }

  // 3. GraphQL Query Endpoint
  if (req.method === "POST" && url === "/graphql") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        const snapshot = engine.getSnapshot();
        const parsed = JSON.parse(body || "{}");
        const query = (parsed.query || "").trim();

        // Simple schema-matched resolver
        const data: any = {};
        if (query.includes("sellers") || query.includes("Seller")) {
          data.sellers = snapshot.sellers;
        }
        if (query.includes("jobs") || query.includes("Job")) {
          data.jobs = snapshot.jobs;
        }
        if (query.includes("evaluations") || query.includes("SlaEvaluation")) {
          data.evaluations = snapshot.evaluations;
        }
        if (query.includes("dailyMetrics") || query.includes("SellerDailyMetric")) {
          data.dailyMetrics = snapshot.dailyMetrics;
        }
        if (query.includes("protocolMetric") || query.includes("ProtocolMetric")) {
          data.protocolMetric = snapshot.protocol;
        }
        if (query.includes("crossChainSources")) {
          data.crossChainSources = snapshot.crossChainSources;
        }

        // If generic query, return full snapshot
        if (Object.keys(data).length === 0) {
          data.protocolMetric = snapshot.protocol;
          data.sellers = snapshot.sellers;
        }

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ data }));
      } catch (err) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ errors: [{ message: String(err) }] }));
      }
    });
    return;
  }

  // Default 404
  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Not Found", endpoints: ["/graphql", "/api/analytics", "/health"] }));
});

server.listen(PORT, () => {
  console.log(`[Envio HyperIndex] Veris Indexer service running on http://localhost:${PORT}`);
  console.log(`  GraphQL Endpoint: http://localhost:${PORT}/graphql`);
  console.log(`  Analytics Feed:   http://localhost:${PORT}/api/analytics`);
  console.log(`  Health Check:     http://localhost:${PORT}/health`);
});
