import React from "react";
import { CheckCircle2, Code2, Settings, ShieldCheck, Key } from "lucide-react";
import { HARD_SPENDING_CAP_USDC } from "../lib/contracts";

export const DynamicSetupGuide: React.FC = () => {
  return (
    <section className="max-w-5xl mx-auto px-4 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <span className="badge badge-monad">Dynamic.xyz Onboarding</span>
          <span className="text-xs text-zinc-400">Implementation Specs & Dashboard Guide</span>
        </div>
        <h2 className="text-3xl font-extrabold text-white font-['Outfit']">
          Dynamic Embedded Wallet Integration
        </h2>
        <p className="text-sm text-zinc-400 mt-1 max-w-3xl">
          Complete breakdown of the Dynamic Dashboard configuration, the confirmed explicit
          <code className="text-[#a797ff] bg-white/5 px-1.5 py-0.5 rounded mx-1 font-mono text-xs">
            createWaasWalletAccounts()
          </code>
          flow, and client-side spending limits.
        </p>
      </div>

      <div className="space-y-6">
        {/* Card 1: Dashboard Configuration Checklist */}
        <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-white/10">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-[#836ef9]">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white font-['Outfit']">
                1. Dynamic Dashboard Configuration Checklist
              </h3>
              <p className="text-xs text-zinc-400">
                Configure your project settings in the Dynamic dashboard (app.dynamic.xyz)
              </p>
            </div>
          </div>

          <div className="space-y-4 text-xs text-zinc-300">
            <div className="bg-black/30 p-4 rounded-xl border border-white/5 flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block mb-0.5">Chains & Networks → Monad Testnet (10143)</strong>
                <span>
                  Enable Monad. Dynamic&apos;s published guide references Chain ID 143 (mainnet). In our Veris code,
                  we explicitly inject Monad Testnet (Chain ID 10143) via <code className="text-[#a797ff]">evmNetworks</code> override using <code className="text-[#a797ff]">mergeNetworks</code>, ensuring testnet compatibility regardless of dashboard presets.
                </span>
              </div>
            </div>

            <div className="bg-black/30 p-4 rounded-xl border border-white/5 flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block mb-0.5">Sign-in Methods → Google & Email OTP / Passkeys</strong>
                <span>
                  Enable social and/or passkey providers. Users log in frictionlessly without browser extensions.
                </span>
              </div>
            </div>

            <div className="bg-black/30 p-4 rounded-xl border border-white/5 flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block mb-0.5">Wallets → Embedded Wallets (WaaS)</strong>
                <span>
                  Enable Embedded Wallets. This provisions non-custodial Turnkey key-shares for users.
                </span>
              </div>
            </div>

            <div className="bg-black/30 p-4 rounded-xl border border-white/5 flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block mb-0.5">Security → Allowed Origins</strong>
                <span>
                  Add <code className="text-[#a797ff] font-mono">http://localhost:5173</code> (and your deployment domain). Dynamic requires this origin for iframe and WebAuthn validation.
                </span>
              </div>
            </div>

            <div className="bg-black/30 p-4 rounded-xl border border-white/5 flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block mb-0.5">Environment ID</strong>
                <span>
                  Copy your Environment ID into <code className="text-[#a797ff] font-mono">frontend/.env</code> as <code className="text-[#a797ff] font-mono">VITE_DYNAMIC_ENVIRONMENT_ID</code>.
                </span>
              </div>
            </div>

            <div className="bg-black/30 p-4 rounded-xl border border-white/5 flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block mb-0.5">Tokens & Balances — Monad Testnet USDC vs Native MON</strong>
                <span>
                  Dynamic&apos;s embedded widget queries native gas (<code className="text-[#a797ff]">MON</code>) by default via <code className="text-[#a797ff]">eth_getBalance</code>. Because Dynamic&apos;s multi-asset backend only indexes 5 mainnets via CoinGecko, custom ERC-20 testnet tokens like USDC (<code className="text-[#a797ff] font-mono">0x534b...43A3</code>) are queried directly on-chain via Veris&apos;s custom <code className="text-[#a797ff] font-mono">useUsdcBalance</code> hook and displayed in the navigation balance pill.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Confirmed Explicit Wallet Creation Flow */}
        <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-white/10">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white font-['Outfit']">
                2. Confirmed Explicit Wallet Creation Flow
              </h3>
              <p className="text-xs text-zinc-400">
                Dynamic WaaS SDK does not provision wallets automatically; our code explicitly calls it.
              </p>
            </div>
          </div>

          <div className="bg-black/50 p-5 rounded-xl border border-white/10 font-mono text-xs text-zinc-300 overflow-x-auto leading-relaxed space-y-2">
            <div className="text-zinc-500">// 1. Import confirmed client SDK modules</div>
            <div>
              <span className="text-purple-400">import</span> &#123; createWaasWalletAccounts, getChainsMissingWaasWalletAccounts &#125; <span className="text-purple-400">from</span> <span className="text-emerald-300">&quot;@dynamic-labs-sdk/client/waas&quot;</span>;
            </div>
            <div>
              <span className="text-purple-400">import</span> &#123; switchActiveNetwork, addNetwork, NetworkNotAddedError, getWalletAccounts &#125; <span className="text-purple-400">from</span> <span className="text-emerald-300">&quot;@dynamic-labs-sdk/client&quot;</span>;
            </div>
            <br />
            <div className="text-zinc-500">// 2. Explicitly create WaaS wallet accounts upon sign-in</div>
            <div>
              <span className="text-purple-400">const</span> missing = <span className="text-blue-400">getChainsMissingWaasWalletAccounts</span>();
            </div>
            <div>
              <span className="text-purple-400">if</span> (missing.length &gt; 0) &#123;
            </div>
            <div className="pl-4">
              <span className="text-purple-400">await</span> <span className="text-blue-400">createWaasWalletAccounts</span>(&#123; chains: missing &#125;);
            </div>
            <div>&#125;</div>
            <br />
            <div className="text-zinc-500">// 3. Retrieve wallet and switch active network to Monad Testnet (10143)</div>
            <div>
              <span className="text-purple-400">const</span> [wallet] = <span className="text-blue-400">getWalletAccounts</span>();
            </div>
            <div>
              <span className="text-purple-400">try</span> &#123;
            </div>
            <div className="pl-4">
              <span className="text-purple-400">await</span> <span className="text-blue-400">switchActiveNetwork</span>(&#123; walletAccount: wallet, networkId: <span className="text-emerald-300">&quot;10143&quot;</span> &#125;);
            </div>
            <div>
              &#125; <span className="text-purple-400">catch</span> (err) &#123;
            </div>
            <div className="pl-4">
              <span className="text-purple-400">if</span> (err <span className="text-purple-400">instanceof</span> NetworkNotAddedError) &#123;
            </div>
            <div className="pl-8">
              <span className="text-purple-400">await</span> <span className="text-blue-400">addNetwork</span>(&#123; walletAccount: wallet, networkData: MONAD_TESTNET_NETWORK_DATA &#125;);
            </div>
            <div className="pl-8">
              <span className="text-purple-400">await</span> <span className="text-blue-400">switchActiveNetwork</span>(&#123; walletAccount: wallet, networkId: <span className="text-emerald-300">&quot;10143&quot;</span> &#125;);
            </div>
            <div className="pl-4">&#125;</div>
            <div>&#125;</div>
          </div>
        </div>

        {/* Card 3: Security & Spending Cap Guardrails */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-panel p-6 rounded-2xl border border-white/10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-white font-['Outfit']">
                Client Spending Cap (${HARD_SPENDING_CAP_USDC} USDC)
              </h4>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Enforced strictly client-side before any signature is requested from the user&apos;s Dynamic
              embedded wallet. Any buyer job creation requesting &gt; ${HARD_SPENDING_CAP_USDC} USDC halts immediately
              with a descriptive safety rejection.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-white/10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-[#836ef9]">
                <Key className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-white font-['Outfit']">
                Operator Key Isolation
              </h4>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Dynamic embedded wallets exclusively manage human buyer and seller funds. The Phase 2
              attestation signing key is kept strictly server-side on the operator service, never exposed
              to the frontend or Dynamic client session.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
