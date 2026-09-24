import { useState } from "react";
import {
  Terminal,
  Copy,
  Check,
  Cpu,
  ShieldCheck,
  CheckCircle2,
  Code2,
} from "lucide-react";
import {
  ADDRESSES,
  HARD_SPENDING_CAP_USDC,
  MONAD_TESTNET_CHAIN_ID,
  MONAD_TESTNET_RPC,
} from "../lib/contracts";

export function DocsSpecs() {
  const [activeTab, setActiveTab] = useState<"quickstart" | "typescript" | "python" | "tools" | "security">("quickstart");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const claudeDesktopConfig = JSON.stringify(
    {
      mcpServers: {
        veris: {
          command: "npx",
          args: ["-y", "@veris/mcp-server"],
          env: {
            MONAD_TESTNET_RPC_URL: MONAD_TESTNET_RPC,
            BUYER_PRIVATE_KEY: "0xYourDedicatedAgentPrivateKey...",
          },
        },
      },
    },
    null,
    2
  );

  const cursorMcpConfig = JSON.stringify(
    {
      mcpServers: {
        veris: {
          command: "npx",
          args: ["-y", "@veris/mcp-server"],
          env: {
            MONAD_TESTNET_RPC_URL: MONAD_TESTNET_RPC,
            BUYER_PRIVATE_KEY: "0xYourDedicatedAgentPrivateKey...",
          },
        },
      },
    },
    null,
    2
  );

  const tsAgentExample = `import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

/**
 * Autonomous AI Agent: Veris SLA-Guaranteed Data Consumer
 * Target: Monad Testnet (Chain ID 10143)
 */
async function runVerisAgent() {
  // 1. Connect to Veris MCP Server via Stdio
  const transport = new StdioClientTransport({
    command: "node",
    args: ["path/to/veris/mcp/dist/server.js"],
    env: {
      MONAD_TESTNET_RPC_URL: "${MONAD_TESTNET_RPC}",
      BUYER_PRIVATE_KEY: process.env.AGENT_WALLET_KEY!,
    },
  });

  const client = new Client(
    { name: "autonomous-trading-agent", version: "1.0.0" },
    { capabilities: {} }
  );
  await client.connect(transport);
  console.log("Connected to Veris MCP Server on Monad Testnet");

  // 2. Discover live feeds and compare terms
  const listResp = await client.callTool({
    name: "list_datasets",
    arguments: {},
  });
  console.log("Live Marketplace Datasets:", listResp.content);

  // 3. Inspect target feed quote & ERC-8004 trust metrics
  const VERIS_SELLER_ID = "veris.eth";
  
  const quote = await client.callTool({
    name: "get_quote",
    arguments: { sellerId: VERIS_SELLER_ID },
  });

  const reputation = await client.callTool({
    name: "check_reputation",
    arguments: { sellerId: VERIS_SELLER_ID },
  });

  // 4. Autonomous safety gate: only buy if reliability >= 99.0%
  const repData = JSON.parse(reputation.content[0].text);
  if (repData.reliabilityBps < 9900) {
    console.warn("Seller reputation too low:", repData.reliabilityPercent);
    return;
  }

  // 5. Execute single bundled purchase with strict limits
  // Pre-flight checks price & SLA, approves USDC, funds escrow, and awaits resolution
  const receipt = await client.callTool({
    name: "purchase",
    arguments: {
      sellerId: VERIS_SELLER_ID,
      maxPrice: 0.50,    // Hard price limit in USDC
      maxAgeSeconds: 5,  // Strict freshness SLA threshold
    },
  });

  const result = JSON.parse(receipt.content[0].text);

  if (result.verdict === "completed") {
    console.log("Data Authenticated & Verified Fresh:", result.dataPayload);
    console.log("Observed Age:", result.dataAgeSeconds, "seconds");
    console.log("Settlement Hash:", result.txHash);
  } else {
    // Stale delivery or operator offline: 100% automatic escrow refund
    console.warn("SLA Breached or Failed. 100% Escrow Refunded:", result.message);
  }
}

runVerisAgent().catch(console.error);`;

  const pythonAgentExample = `import asyncio
import json
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

async def run_veris_python_agent():
    # 1. Configure MCP Stdio connection to Veris
    server_params = StdioServerParameters(
        command="node",
        args=["/path/to/veris/mcp/dist/server.js"],
        env={
            "MONAD_TESTNET_RPC_URL": "${MONAD_TESTNET_RPC}",
            "BUYER_PRIVATE_KEY": "0xYourAgentPrivateKey...",
        }
    )

    async with stdio_client(server_params) as (read, write):
        async with ClientSession(read, write) as session:
            await session.initialize()
            print("Veris MCP Client Connected (Monad Testnet 10143)")

            # 2. Step 1: List all available datasets
            datasets = await session.call_tool("list_datasets", arguments={})
            print("Datasets:", datasets.content[0].text)

            # 3. Step 2: Check live quote & ERC-8004 reputation
            VERIS_SELLER = "veris.eth"
            quote = await session.call_tool("get_quote", arguments={"sellerId": VERIS_SELLER})
            rep = await session.call_tool("check_reputation", arguments={"sellerId": VERIS_SELLER})

            # 4. Step 3: Purchase with self-enforcing SLA escrow guarantee
            purchase_resp = await session.call_tool(
                "purchase",
                arguments={
                    "sellerId": VERIS_SELLER,
                    "maxPrice": 0.50,       # Max budget USDC
                    "maxAgeSeconds": 5      # Max acceptable latency
                }
            )
            result = json.loads(purchase_resp.content[0].text)
            
            if result.get("verdict") == "completed":
                print("Fresh Data Delivered:", result.get("dataPayload"))
            else:
                print("SLA Missed — 100% refund confirmed in escrow:", result.get("message"))

            # 5. Step 4: Audit on-chain delivery record independently
            if "jobId" in result:
                audit = await session.call_tool("verify_delivery", arguments={"jobId": result["jobId"]})
                print("On-Chain Audit:", audit.content[0].text)

if __name__ == "__main__":
    asyncio.run(run_veris_python_agent())`;

  return (
    <section className="max-w-6xl mx-auto px-4 lg:px-8 py-8 space-y-8 font-sans">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              MCP PROTOCOL SPECIFICATION
            </span>
            <span className="text-[11px] font-mono text-neutral-500">
              CHAIN ID: {MONAD_TESTNET_CHAIN_ID} (MONAD TESTNET)
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-mono">
            VERIS MCP INTEGRATION GUIDE
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1 max-w-2xl font-mono">
            How autonomous AI agents and developer projects properly integrate Veris on-chain data feeds with self-enforcing SLA escrow guarantees.
          </p>
        </div>

        {/* Protocol Guarantee Pill */}
        <div className="bg-[#0b0c10] border border-white/10 px-4 py-2.5 rounded-xl flex items-center gap-3 font-mono text-xs">
          <ShieldCheck size={16} className="text-emerald-400" />
          <div className="flex flex-col">
            <span className="text-neutral-500 text-[10px] uppercase">The Veris Guarantee</span>
            <span className="text-white font-bold">&ldquo;No answer, no charge&rdquo;</span>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: "quickstart", label: "Client Setup (Claude / Cursor)" },
          { id: "typescript", label: "TypeScript / LangChain" },
          { id: "python", label: "Python (CrewAI / AutoGen)" },
          { id: "tools", label: "Tool Schemas (5 Tools)" },
          { id: "security", label: "Production & Security Guardrails" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3.5 py-2 rounded-xl text-xs font-mono whitespace-nowrap transition-all cursor-pointer ${
              activeTab === tab.id
                ? "bg-white text-black font-bold shadow-md"
                : "bg-[#0b0c10] text-neutral-400 hover:text-white border border-white/5 hover:border-white/10"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: QUICKSTART (Claude Desktop, Cursor, IDEs) */}
      {activeTab === "quickstart" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-white/10 bg-[#06070a] p-6 space-y-6">
            <div>
              <h3 className="text-lg font-bold text-white font-mono flex items-center gap-2">
                <Cpu size={18} className="text-[#836ef9]" />
                Integrating with AI Clients & IDEs
              </h3>
              <p className="text-xs text-neutral-400 font-mono mt-1">
                Connect the Veris MCP Server over standard I/O (StdioServerTransport) in under 60 seconds.
              </p>
            </div>

            {/* Zero-Install NPX Highlight */}
            <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/20 space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                  Zero Install (NPX)
                </span>
                <span className="text-white font-bold text-xs font-mono">
                  Instant Plug-and-Play Integration
                </span>
              </div>
              <p className="text-xs text-neutral-300 font-sans leading-relaxed">
                External projects, Claude Desktop, and Cursor do <strong>not</strong> need to clone or compile this repository. The server executes on-demand via <code>npx -y @veris/mcp-server</code> over standard I/O (Stdio).
              </p>
              <div className="rounded-lg bg-[#030305] border border-white/10 p-2.5 font-mono text-[11px] text-emerald-300 flex items-center justify-between">
                <code>npx -y @veris/mcp-server</code>
                <button
                  type="button"
                  onClick={() => copyToClipboard("npx -y @veris/mcp-server", "npx-cmd")}
                  className="text-neutral-400 hover:text-white transition-colors cursor-pointer"
                >
                  {copiedKey === "npx-cmd" ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                </button>
              </div>
            </div>

            {/* Step 1: Claude Desktop Config */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white font-mono flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px]">1</span>
                  Claude Desktop Configuration (<code>claude_desktop_config.json</code>)
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(claudeDesktopConfig, "claude-cfg")}
                  className="flex items-center gap-1 text-[11px] font-mono text-[#836ef9] hover:text-white transition-colors cursor-pointer"
                >
                  {copiedKey === "claude-cfg" ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  <span>{copiedKey === "claude-cfg" ? "Copied" : "Copy JSON"}</span>
                </button>
              </div>
              <pre className="rounded-xl bg-[#030305] border border-white/10 p-4 font-mono text-[11px] text-purple-200 overflow-x-auto leading-relaxed">
                {claudeDesktopConfig}
              </pre>
            </div>

            {/* Step 2: Cursor Config */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white font-mono flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px]">2</span>
                  Cursor Workspace Configuration (<code>.cursor/mcp.json</code>)
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(cursorMcpConfig, "cursor-cfg")}
                  className="flex items-center gap-1 text-[11px] font-mono text-[#836ef9] hover:text-white transition-colors cursor-pointer"
                >
                  {copiedKey === "cursor-cfg" ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  <span>{copiedKey === "cursor-cfg" ? "Copied" : "Copy JSON"}</span>
                </button>
              </div>
              <pre className="rounded-xl bg-[#030305] border border-white/10 p-4 font-mono text-[11px] text-purple-200 overflow-x-auto leading-relaxed">
                {cursorMcpConfig}
              </pre>
            </div>

            {/* Alternative: Local Source (Monorepo Contributors) */}
            <div className="pt-2 border-t border-white/5 space-y-2">
              <span className="text-[11px] font-bold text-neutral-400 font-mono flex items-center gap-1.5">
                <span>Alternative: Running from Local Source (Monorepo Contributors)</span>
              </span>
              <p className="text-[11px] text-neutral-500 font-sans">
                If contributing to or modifying the Veris codebase, compile locally: <code>cd mcp &amp;&amp; npm install &amp;&amp; npm run build</code> and set <code>&quot;command&quot;: &quot;node&quot;, &quot;args&quot;: [&quot;&lt;PATH&gt;/mcp/dist/server.js&quot;]</code>.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TYPESCRIPT / LANGCHAIN */}
      {activeTab === "typescript" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-white/10 bg-[#06070a] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white font-mono flex items-center gap-2">
                  <Code2 size={18} className="text-[#836ef9]" />
                  TypeScript Autonomous Agent Integration
                </h3>
                <p className="text-xs text-neutral-400 font-mono mt-1">
                  How autonomous agent frameworks (LangChain, LangGraph, custom loops) execute SLA-backed trades.
                </p>
              </div>
              <button
                type="button"
                onClick={() => copyToClipboard(tsAgentExample, "ts-code")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20 font-mono text-xs transition-colors cursor-pointer"
              >
                {copiedKey === "ts-code" ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                <span>{copiedKey === "ts-code" ? "Copied" : "Copy Script"}</span>
              </button>
            </div>

            <pre className="rounded-xl bg-[#030305] border border-white/10 p-5 font-mono text-[11.5px] text-emerald-300 overflow-x-auto leading-relaxed max-h-[500px]">
              {tsAgentExample}
            </pre>
          </div>
        </div>
      )}

      {/* TAB 3: PYTHON (CrewAI / AutoGen) */}
      {activeTab === "python" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-white/10 bg-[#06070a] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white font-mono flex items-center gap-2">
                  <Terminal size={18} className="text-amber-400" />
                  Python Agent Integration (CrewAI / AutoGen / LangGraph)
                </h3>
                <p className="text-xs text-neutral-400 font-mono mt-1">
                  Query verified cryptographic market data in Python using the official <code>mcp</code> client.
                </p>
              </div>
              <button
                type="button"
                onClick={() => copyToClipboard(pythonAgentExample, "py-code")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20 font-mono text-xs transition-colors cursor-pointer"
              >
                {copiedKey === "py-code" ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                <span>{copiedKey === "py-code" ? "Copied" : "Copy Script"}</span>
              </button>
            </div>

            <pre className="rounded-xl bg-[#030305] border border-white/10 p-5 font-mono text-[11.5px] text-amber-200 overflow-x-auto leading-relaxed max-h-[500px]">
              {pythonAgentExample}
            </pre>
          </div>
        </div>
      )}

      {/* TAB 4: TOOL SCHEMAS */}
      {activeTab === "tools" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-[#06070a] p-6 space-y-6">
            <div>
              <h3 className="text-lg font-bold text-white font-mono">
                The 5 Veris MCP Tools
              </h3>
              <p className="text-xs text-neutral-400 font-mono mt-1">
                Strict input/output specifications enforced by the Model Context Protocol server.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
              {/* Tool 1 */}
              <div className="p-4 rounded-xl bg-[#030305] border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-emerald-400 font-bold">1. list_datasets</span>
                  <span className="px-1.5 py-0.5 rounded bg-white/5 text-[10px] text-neutral-400">Read-Only</span>
                </div>
                <p className="text-neutral-400 text-[11px] font-sans">
                  Lists all available data feeds, prices, SLAs, and ERC-8004 reliability ratings. Pulled live on-chain, not cached.
                </p>
                <div className="text-[10.5px] text-neutral-500">
                  Input: <code>&#123;&#125;</code>
                </div>
              </div>

              {/* Tool 2 */}
              <div className="p-4 rounded-xl bg-[#030305] border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-purple-400 font-bold">2. get_quote</span>
                  <span className="px-1.5 py-0.5 rounded bg-white/5 text-[10px] text-neutral-400">Read-Only</span>
                </div>
                <p className="text-neutral-400 text-[11px] font-sans">
                  Pulls real-time quote for a specific seller: exact USDC price, freshness window, reliability BPS, and active state.
                </p>
                <div className="text-[10.5px] text-neutral-500">
                  Input: <code>&#123; sellerId: string &#125;</code>
                </div>
              </div>

              {/* Tool 3 */}
              <div className="p-4 rounded-xl bg-[#030305] border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-amber-400 font-bold">3. check_reputation</span>
                  <span className="px-1.5 py-0.5 rounded bg-white/5 text-[10px] text-neutral-400">Read-Only</span>
                </div>
                <p className="text-neutral-400 text-[11px] font-sans">
                  Queries on-chain ERC-8004 reputation score (slaMetCount, slaMissedCount, reliabilityBps) from ReputationRegistry.
                </p>
                <div className="text-[10.5px] text-neutral-500">
                  Input: <code>&#123; sellerId: string &#125;</code>
                </div>
              </div>

              {/* Tool 4 */}
              <div className="p-4 rounded-xl bg-[#030305] border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-cyan-400 font-bold">4. verify_delivery</span>
                  <span className="px-1.5 py-0.5 rounded bg-white/5 text-[10px] text-neutral-400">Audit / View</span>
                </div>
                <p className="text-neutral-400 text-[11px] font-sans">
                  Independently audit any past on-chain job without re-purchasing. Inspects status, observed data age, and verdict.
                </p>
                <div className="text-[10.5px] text-neutral-500">
                  Input: <code>&#123; jobId: number &#125;</code>
                </div>
              </div>

              {/* Tool 5 (Full width) */}
              <div className="p-4 rounded-xl bg-[#030305] border border-emerald-500/20 md:col-span-2 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-white font-bold text-sm">5. purchase (The Core Guarantee)</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                    State-Changing Escrow
                  </span>
                </div>
                <p className="text-neutral-300 text-[11.5px] font-sans leading-relaxed">
                  Single bundled execution tool: pre-flight checks price &amp; SLA against caller limits, automatically approves USDC, creates and funds escrow job on ACPCore, waits for operator attestation, and resolves on-chain via SlaEvaluator.
                </p>
                <div className="text-[11px] text-emerald-300/80">
                  Input: <code>&#123; sellerId: string, maxPrice: number, maxAgeSeconds: number &#125;</code>
                </div>
                <div className="text-[11px] text-neutral-400">
                  Returns: <code>&#123; jobId, verdict: &quot;completed&quot; | &quot;rejected&quot;, dataAgeSeconds, pricePaid, feePaid, dataPayload? &#125;</code>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: SECURITY & PRODUCTION GUARDRAILS */}
      {activeTab === "security" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-white/10 bg-[#06070a] p-6 space-y-6 font-mono text-xs">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <ShieldCheck size={18} className="text-emerald-400" />
                Production Security &amp; Guardrails
              </h3>
              <p className="text-neutral-400 text-xs font-sans mt-1">
                How Veris protects autonomous agent wallets from unauthorized drain, frontrunning, and stale data.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-[#030305] border border-white/10 space-y-2">
                <div className="flex items-center gap-2 text-white font-bold">
                  <CheckCircle2 size={14} className="text-emerald-400" />
                  Hard Spending Cap ($50.0 USDC)
                </div>
                <p className="text-neutral-400 text-[11px] font-sans">
                  The client enforces a maximum limit of ${HARD_SPENDING_CAP_USDC} USDC per call. Any attempt to purchase above this threshold is aborted client-side before any blockchain transaction is signed.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#030305] border border-white/10 space-y-2">
                <div className="flex items-center gap-2 text-white font-bold">
                  <CheckCircle2 size={14} className="text-emerald-400" />
                  Isolated Agent EOA Wallets
                </div>
                <p className="text-neutral-400 text-[11px] font-sans">
                  Agents should only use dedicated EOA wallets funded strictly with operational gas (MON) and budget (USDC). Never use deployer keys or master admin wallets.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#030305] border border-white/10 space-y-2">
                <div className="flex items-center gap-2 text-white font-bold">
                  <CheckCircle2 size={14} className="text-emerald-400" />
                  Pre-Flight Bounds Validation
                </div>
                <p className="text-neutral-400 text-[11px] font-sans">
                  Before creating or funding any job, the <code>purchase</code> tool fetches live seller terms and verifies <code>price &lt;= maxPrice</code> and <code>freshness &lt;= maxAgeSeconds</code>. If terms drift, the call rejects with 0 funds spent.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#030305] border border-white/10 space-y-2">
                <div className="flex items-center gap-2 text-white font-bold">
                  <CheckCircle2 size={14} className="text-emerald-400" />
                  Atomic Escrow Refund Guarantee
                </div>
                <p className="text-neutral-400 text-[11px] font-sans">
                  If the operator attestation reveals stale data (<code>observedAge &gt; SLA</code>) or the operator fails to respond before expiry, ACPCore triggers a 100% refund of the escrowed USDC directly back to the agent wallet.
                </p>
              </div>
            </div>

            {/* Monad Testnet Contract References */}
            <div className="rounded-xl bg-[#030305] border border-white/10 p-4 space-y-2 text-[11px]">
              <span className="text-white font-bold block">Verified Contract Addresses on Monad Testnet (Chain ID 10143)</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-neutral-400 font-mono">
                <div>ACPCore: <code className="text-purple-300">{ADDRESSES.acpCore}</code></div>
                <div>SlaEvaluator: <code className="text-purple-300">{ADDRESSES.slaEvaluator}</code></div>
                <div>SellerRegistry: <code className="text-purple-300">{ADDRESSES.sellerRegistry}</code></div>
                <div>ReputationRegistry: <code className="text-purple-300">{ADDRESSES.reputationRegistry}</code></div>
                <div>Payment Token (USDC): <code className="text-emerald-300">{ADDRESSES.paymentToken}</code></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
