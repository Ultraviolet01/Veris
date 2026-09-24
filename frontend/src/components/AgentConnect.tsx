import { useState } from "react";
import { Terminal, Copy, Check, Cpu, Globe, ShieldCheck } from "lucide-react";

export function AgentConnect() {
  const [copiedMcp, setCopiedMcp] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [selectedLang, setSelectedLang] = useState<"ts" | "py" | "curl">("ts");

  const mcpConfig = JSON.stringify(
    {
      mcpServers: {
        veris: {
          command: "npx",
          args: ["-y", "@veris-protocol/mcp-server"],
          env: {
            MONAD_RPC: "https://testnet-rpc.monad.xyz",
            CHAIN_ID: "10143",
            CLIENT_SPENDING_CAP_USDC: "50.0",
          },
        },
      },
    },
    null,
    2
  );

  const codeSnippets = {
    ts: `import { VerisClient } from "@veris-protocol/sdk";

// Initialize Veris on Monad Testnet (Chain ID 10143)
const veris = new VerisClient({
  rpcUrl: "https://testnet-rpc.monad.xyz",
  maxSpendingCapUsdc: 50.0, // Hard client cap
});

// Autonomous agent queries real-time lending rates
const result = await veris.query("aave-v3-lending-rates", {
  maxAgeSeconds: 10,
  depositUsdc: 1.50,
});

if (result.status === "PROOF_VERIFIED") {
  console.log("Verified APY:", result.data.lendingApy);
  console.log("Monad Block:", result.proof.blockNumber);
  console.log("Settlement Hash:", result.receipt.txHash);
} else {
  // Stale or invalid data — 100% refunded to agent wallet
  console.warn("SLA breached, buyer escrow refunded:", result.refund);
}`,
    py: `from veris import VerisClient

# Initialize Veris on Monad Testnet
client = VerisClient(
    rpc_url="https://testnet-rpc.monad.xyz",
    max_spending_cap_usdc=50.0
)

# Request verified dataset with strict SLA
result = client.query(
    dataset="monad-dex-prices",
    params={"asset": "MON/USDC"},
    max_sla_seconds=5
)

if result.is_fresh:
    print(f"Verified Price: {result.data['price']} USDC")
    print(f"Monad Block: {result.proof['block_height']}")
else:
    print("SLA missed. 100% refund confirmed in escrow contract.")`,
    curl: `# Step 1: Query endpoint with x402 payment header
curl -X POST https://api.veris.market/v1/query/monad-dex-prices \\
  -H "Content-Type: application/json" \\
  -H "X-PAYMENT-ESCROW: 0x4a9fb72e018a...monad" \\
  -d '{
    "asset": "MON/USDC",
    "maxSlaSeconds": 10
  }'

# Response returns verified block attestation:
# {
#   "status": "PROOF_VERIFIED",
#   "data": { "price": 1.8427 },
#   "proof": { "sourceBlock": 38219447, "timestamp": 1727083458 }
# }`,
  };

  const copyMcp = () => {
    navigator.clipboard.writeText(mcpConfig);
    setCopiedMcp(true);
    setTimeout(() => setCopiedMcp(false), 2000);
  };

  const copyCode = () => {
    navigator.clipboard.writeText(codeSnippets[selectedLang]);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <section className="max-w-6xl mx-auto px-4 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-10 text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-950/20 px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-purple-300 mb-3">
          <Cpu size={12} className="text-purple-400" />
          Agent Integration
        </div>
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white font-['Outfit']">
          Give Your Agent a Market of Verified Data
        </h2>
        <p className="mt-2 text-sm text-neutral-400 leading-relaxed">
          Connect over Model Context Protocol (MCP) or call Veris over HTTP.
          Dataset discovery is free; every query carries its own price and self-enforcing freshness guarantee.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-16">
        {/* Left Column: MCP Setup */}
        <div className="lg:col-span-5">
          <div className="glass-panel p-6 sm:p-7 rounded-2xl border border-white/10 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-4">
              <div className="flex items-center gap-2">
                <Terminal size={16} className="text-purple-400" />
                <span className="text-xs font-semibold text-white font-mono">MCP Configuration</span>
              </div>
              <button
                onClick={copyMcp}
                className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white bg-white/5 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
              >
                {copiedMcp ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                <span>{copiedMcp ? "Copied" : "Copy Config"}</span>
              </button>
            </div>

            <p className="text-xs text-neutral-400 mb-4 leading-relaxed">
              Add Veris as an MCP server to Claude Desktop, Cursor, or AutoGPT to let your agent discover and query verified Monad datasets automatically.
            </p>

            <pre className="rounded-xl bg-[#030407] border border-white/5 p-4 font-mono text-xs leading-relaxed text-purple-200 overflow-x-auto">
              <code>{mcpConfig}</code>
            </pre>

            <div className="mt-4 pt-3 border-t border-white/5 space-y-2 text-xs text-neutral-400">
              <div className="flex items-center gap-2">
                <ShieldCheck size={14} className="text-emerald-400 shrink-0" />
                <span className="text-[11px]">Hard Spending Cap: $50.00 USDC per call limit</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe size={14} className="text-purple-400 shrink-0" />
                <span className="text-[11px]">Server Endpoint: https://api.veris.market/mcp</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Code SDKs */}
        <div className="lg:col-span-7">
          <div className="glass-panel p-6 sm:p-7 rounded-2xl border border-white/10 shadow-2xl">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/5 mb-4">
              <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-xl border border-white/5">
                <button
                  onClick={() => setSelectedLang("ts")}
                  className={`px-3 py-1 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
                    selectedLang === "ts" ? "bg-purple-600 text-white" : "text-neutral-400 hover:text-white"
                  }`}
                >
                  TypeScript
                </button>
                <button
                  onClick={() => setSelectedLang("py")}
                  className={`px-3 py-1 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
                    selectedLang === "py" ? "bg-purple-600 text-white" : "text-neutral-400 hover:text-white"
                  }`}
                >
                  Python
                </button>
                <button
                  onClick={() => setSelectedLang("curl")}
                  className={`px-3 py-1 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
                    selectedLang === "curl" ? "bg-purple-600 text-white" : "text-neutral-400 hover:text-white"
                  }`}
                >
                  cURL / HTTP
                </button>
              </div>

              <button
                onClick={copyCode}
                className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white bg-white/5 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
              >
                {copiedCode ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                <span>{copiedCode ? "Copied" : "Copy Code"}</span>
              </button>
            </div>

            <pre className="rounded-xl bg-[#030407] border border-white/5 p-4 font-mono text-xs leading-relaxed text-purple-200 overflow-x-auto max-h-[380px] overflow-y-auto">
              <code>{codeSnippets[selectedLang]}</code>
            </pre>
          </div>
        </div>
      </div>

      {/* 4-Step Architecture Banner */}
      <div className="border-t border-white/5 pt-12">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-6 text-center">
          How Autonomous Agents Transact on Veris
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-panel p-5 rounded-xl border border-white/5">
            <span className="text-[10px] font-mono text-purple-400 font-semibold mb-2 block">01 · DISCOVER</span>
            <h4 className="text-sm font-medium text-white mb-1">Free Catalog Ingestion</h4>
            <p className="text-xs text-neutral-400">Agent reads available data feeds, price per call, and promised SLA.</p>
          </div>
          <div className="glass-panel p-5 rounded-xl border border-white/5">
            <span className="text-[10px] font-mono text-purple-400 font-semibold mb-2 block">02 · ESCROW</span>
            <h4 className="text-sm font-medium text-white mb-1">On-Chain Deposit</h4>
            <p className="text-xs text-neutral-400">Funds locked in ACPCore. Client guard prevents &gt; $50 spending.</p>
          </div>
          <div className="glass-panel p-5 rounded-xl border border-white/5">
            <span className="text-[10px] font-mono text-purple-400 font-semibold mb-2 block">03 · VERIFY</span>
            <h4 className="text-sm font-medium text-white mb-1">Block Proof Check</h4>
            <p className="text-xs text-neutral-400">SlaEvaluator compares block timestamp delta against promised SLA.</p>
          </div>
          <div className="glass-panel p-5 rounded-xl border border-white/5">
            <span className="text-[10px] font-mono text-purple-400 font-semibold mb-2 block">04 · SETTLE</span>
            <h4 className="text-sm font-medium text-white mb-1">Pay or Instant Refund</h4>
            <p className="text-xs text-neutral-400">Seller paid if fresh; buyer refunded 100% if stale or corrupted.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
