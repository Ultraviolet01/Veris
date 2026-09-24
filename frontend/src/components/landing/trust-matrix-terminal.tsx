import { Lock, ArrowUpRight, Terminal, CheckCircle2 } from "lucide-react";

export function TrustMatrixTerminal() {
  const comparisonItems = [
    {
      metric: "Settlement Speed",
      legacy: "24h - 7d challenge window",
      veris: "< 400ms atomic Monad block check",
      note: "Instant machine finality",
    },
    {
      metric: "Freshness SLA",
      legacy: "Unenforceable text in API docs",
      veris: "delta = block.timestamp - sourceTimestamp <= SLA",
      note: "EVM condition of payment",
    },
    {
      metric: "Dispute Resolution",
      legacy: "Human committee or multi-sig council",
      veris: "Zero human intervention (pure math)",
      note: "No support tickets, no arbitration",
    },
    {
      metric: "Key Isolation",
      legacy: "Shared browser wallets or hot private keys",
      veris: "Server-side operator key + Passkey seller payout",
      note: "Non-custodial Dynamic WaaS",
    },
    {
      metric: "Trust Layer",
      legacy: "Self-reported marketing testimonials",
      veris: "Persistent on-chain ERC-8004 reliability score",
      note: "Queryable agent reputation",
    },
  ];

  return (
    <section id="safety" className="mb-32 scroll-mt-32">
      {/* Industrial Ruler Header */}
      <div className="border-t border-b border-white/10 py-6 mb-10 bg-[#030305]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 font-mono text-[11px] text-neutral-500 uppercase tracking-widest">
              <span className="text-[#FF5A36] font-semibold">[03 // TRUST BOUNDARY & EIP-712]</span>
              <span>Cryptographic Verification Engine</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white font-['Manrope']">
              The Monad Trust Boundary: Code, Not Committees
            </h2>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-neutral-400">
            <span className="px-2.5 py-1 rounded bg-white/5 border border-white/10 text-emerald-400">
              SlaEvaluator.sol :: Monad 10143
            </span>
          </div>
        </div>
      </div>

      {/* Dual Console Terminal */}
      <div className="rounded-3xl border border-white/10 bg-[#06070a] overflow-hidden shadow-2xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-white/5">
          {/* Left Console: EIP-712 Cryptographic Attestation Inspector */}
          <div className="lg:col-span-6 p-6 sm:p-8 bg-[#040407] flex flex-col justify-between font-mono text-xs">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-5 text-[11px]">
                <div className="flex items-center gap-2 text-white font-semibold">
                  <Terminal size={14} className="text-[#FF5A36]" />
                  <span>EIP-712 Attestation Struct</span>
                </div>
                <span className="text-neutral-500">ecrecover verification</span>
              </div>

              {/* Code Box */}
              <div className="rounded-xl bg-[#010204] border border-white/5 p-4 text-[11px] leading-relaxed text-purple-200 mb-5 overflow-x-auto space-y-1">
                <div className="text-neutral-600">// Domain Separator</div>
                <div className="text-neutral-400">DOMAIN_SEPARATOR = keccak256(abi.encode(</div>
                <div className="pl-4 text-neutral-300">EIP712_DOMAIN_TYPEHASH,</div>
                <div className="pl-4 text-neutral-300">keccak256(&quot;VerisProtocol&quot;),</div>
                <div className="pl-4 text-neutral-300">keccak256(&quot;1.0.0&quot;),</div>
                <div className="pl-4 text-purple-400">10143, <span className="text-neutral-600">// Monad Testnet</span></div>
                <div className="pl-4 text-emerald-400">SLA_EVALUATOR_ADDRESS</div>
                <div className="text-neutral-400">));</div>
                
                <div className="text-neutral-600 pt-2">// Attestation Hash Digest</div>
                <div className="text-neutral-400">bytes32 digest = keccak256(abi.encodePacked(</div>
                <div className="pl-4 text-neutral-300">&quot;\x19\x01&quot;,</div>
                <div className="pl-4 text-neutral-300">DOMAIN_SEPARATOR,</div>
                <div className="pl-4 text-neutral-300">hashStruct(sellerId, jobId, dataHash, sourceBlock, timestamp)</div>
                <div className="text-neutral-400">));</div>

                <div className="text-neutral-600 pt-2">// ECDSA Verification on EVM</div>
                <div className="text-emerald-400 font-semibold">
                  address signer = ecrecover(digest, v, r, s);
                </div>
                <div className="text-white">require(signer == seller.operatorKey, &quot;UNAUTHORIZED_SIGNER&quot;);</div>
              </div>

              {/* Key Isolation Guarantee Box */}
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2 text-[11px]">
                <div className="flex items-center gap-2 text-white font-semibold">
                  <Lock size={13} className="text-[#FF5A36]" />
                  <span>Key Isolation Model</span>
                </div>
                <p className="text-neutral-400 font-sans text-xs leading-relaxed">
                  The automated operator signing key resides strictly in an isolated signing service.
                  Human sellers connect through Dynamic embedded wallets to claim settled payouts without exposing private keys.
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-white/5 mt-6 flex items-center justify-between text-[10.5px] text-neutral-500">
              <span>ECDSA curve: secp256k1</span>
              <span>Gas check: ~3,000 gas ecrecover</span>
            </div>
          </div>

          {/* Right Console: Legacy vs Veris Architectural Matrix */}
          <div className="lg:col-span-6 p-6 sm:p-8 bg-[#06070a] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-5">
                <span className="text-xs font-mono font-semibold uppercase tracking-wider text-neutral-400">
                  Architectural Matrix
                </span>
                <span className="text-[11px] font-mono text-emerald-400">Veris vs Legacy</span>
              </div>

              <div className="divide-y divide-white/5">
                {comparisonItems.map((item) => (
                  <div key={item.metric} className="py-3.5 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="font-semibold text-white">{item.metric}</span>
                      <span className="text-[10px] text-neutral-500">{item.note}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                      <div className="p-2.5 rounded-lg bg-red-950/15 border border-red-500/20 text-red-300 text-[11px] flex items-center gap-1.5">
                        <span className="text-red-500 shrink-0 font-bold">&times;</span>
                        <span className="truncate">{item.legacy}</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-500/30 text-emerald-300 text-[11px] flex items-center gap-1.5 font-semibold">
                        <CheckCircle2 size={12} className="text-emerald-400 shrink-0" />
                        <span className="truncate">{item.veris}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-5 mt-6 border-t border-white/5 flex items-center justify-between text-xs font-mono text-neutral-400">
              <span>Full contract audit & Foundry tests</span>
              <a
                href="https://testnet.monadscan.com"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[#FF5A36] hover:text-white transition-colors"
              >
                <span>Inspect on Monadscan</span>
                <ArrowUpRight size={11} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
