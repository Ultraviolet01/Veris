import React, { useState } from "react";
import { useDynamicContext, useIsLoggedIn } from "@dynamic-labs/sdk-react-core";
import { useSellerFlow, type RegisterSellerParams } from "../hooks/useSellerFlow";
import { ADDRESSES, MONAD_TESTNET_CHAIN_ID, MONAD_TESTNET_EXPLORER } from "../lib/contracts";
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  Key,
  Database,
  Coins,
  Cpu,
} from "lucide-react";

export const SellerStudio: React.FC = () => {
  const isLoggedIn = useIsLoggedIn();
  const { primaryWallet } = useDynamicContext();
  const { step, error, receipt, registerSeller, reset } = useSellerFlow();

  const [formData, setFormData] = useState<RegisterSellerParams>({
    datasetName: "NOAA Doppler Radar & Severe Storm Telemetry",
    category: "Weather & Climate",
    priceUsdc: 0.25,
    freshnessWindowSeconds: 15,
    operatorKey: ADDRESSES.defaultOperatorKey,
    sourceChainId: MONAD_TESTNET_CHAIN_ID,
  });

  const embeddedWalletAddress = primaryWallet?.address;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn) return;
    try {
      await registerSeller(formData);
    } catch {
      // Error handled in hook state
    }
  };

  return (
    <section className="max-w-4xl mx-auto px-4 lg:px-8 py-10">
      {/* Title */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <span className="badge badge-monad">Seller Studio</span>
          <span className="text-xs text-zinc-400">SellerRegistry.sol Onboarding</span>
        </div>
        <h2 className="text-3xl font-extrabold text-white font-['Outfit']">
          Register Data Seller & Freshness Terms
        </h2>
        <p className="text-sm text-zinc-400 mt-1 max-w-2xl">
          Publish your AI agent dataset with an automated freshness guarantee. You receive payouts to your
          Dynamic embedded wallet whenever queries satisfy your SLA window.
        </p>
      </div>

      {/* Operator Key Separation Architecture Callout */}
      <div className="glass-panel p-5 rounded-2xl border border-[#836ef9]/30 bg-[#836ef9]/5 mb-8 relative overflow-hidden">
        <div className="flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-xl bg-[#836ef9]/20 border border-[#836ef9]/30 flex items-center justify-center shrink-0 text-[#836ef9]">
            <Key className="w-5 h-5" />
          </div>
          <div className="text-xs text-zinc-300 leading-relaxed">
            <h4 className="font-bold text-white text-sm mb-1 font-['Outfit']">
              Architecture Separation: Seller Wallet vs. Operator Key
            </h4>
            <p className="mb-1.5 text-zinc-300">
              <strong className="text-white">Payout Address:</strong> Your Dynamic embedded wallet
              receives all USDC query fees upon successful job completions.
            </p>
            <p className="text-zinc-300">
              <strong className="text-white">Operator Key:</strong> Attestations are cryptographically
              signed by your off-chain operator service (Phase 2) using its own dedicated signing key,
              kept securely server-side and never exposed to the frontend or Dynamic.
            </p>
          </div>
        </div>
      </div>

      {/* Registration Form */}
      <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-white/10 shadow-xl shadow-black/40">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Dataset Name & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                Dataset Name
              </label>
              <div className="relative">
                <Database className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="seller-dataset-name"
                  type="text"
                  required
                  value={formData.datasetName}
                  onChange={(e) => setFormData({ ...formData, datasetName: e.target.value })}
                  placeholder="e.g. Aave V3 Liquidity Rates"
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#836ef9]"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                Category
              </label>
              <select
                id="seller-category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#836ef9]"
              >
                <option value="Weather & Climate">Weather & Climate</option>
                <option value="Order Books & Equities">Order Books & Equities</option>
                <option value="Macro & Commodities">Macro & Commodities</option>
                <option value="Aviation & Logistics">Aviation & Logistics</option>
                <option value="DeFi Rates">DeFi Rates</option>
                <option value="DEX Liquidity">DEX Liquidity</option>
                <option value="NFT & Digital Assets">NFT & Digital Assets</option>
                <option value="Sports & Events">Sports & Events</option>
                <option value="Prediction Markets">Prediction Markets</option>
              </select>
            </div>
          </div>

          {/* Pricing & SLA Window */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                Query Price (USDC)
              </label>
              <div className="relative">
                <Coins className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="seller-price"
                  type="number"
                  step="0.05"
                  min="0.01"
                  required
                  value={formData.priceUsdc}
                  onChange={(e) =>
                    setFormData({ ...formData, priceUsdc: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#836ef9]"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                Promised Freshness SLA (Seconds)
              </label>
              <div className="relative">
                <Clock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="seller-sla-seconds"
                  type="number"
                  min="1"
                  max="300"
                  required
                  value={formData.freshnessWindowSeconds}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      freshnessWindowSeconds: parseInt(e.target.value, 10) || 10,
                    })
                  }
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#836ef9]"
                />
              </div>
            </div>
          </div>

          {/* Dynamic Embedded Payout Address (Readonly) */}
          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
              Payout Address (Your Dynamic Embedded Wallet)
            </label>
            <div className="relative">
              <ShieldCheck className="w-4 h-4 text-emerald-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="seller-payout-address"
                type="text"
                readOnly
                value={embeddedWalletAddress || "Sign in with Dynamic to connect embedded wallet"}
                className="w-full bg-zinc-900/60 border border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-xs font-mono text-zinc-300 cursor-not-allowed"
              />
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">
              Escrow funds will be released directly to this embedded wallet upon SlaEvaluator resolution.
            </p>
          </div>

          {/* Operator Public Key (Server-Side Key) */}
          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
              Operator Signing Public Address (Phase 2 Server Key)
            </label>
            <div className="relative">
              <Cpu className="w-4 h-4 text-[#836ef9] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="seller-operator-key"
                type="text"
                required
                value={formData.operatorKey}
                onChange={(e) =>
                  setFormData({ ...formData, operatorKey: e.target.value as `0x${string}` })
                }
                className="w-full bg-zinc-900 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-[#836ef9]"
              />
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">
              Public address corresponding to the server-side signing key used by the Phase 2 operator service.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 text-xs text-rose-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Success Receipt */}
          {receipt && step === "confirmed" && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-5 text-xs text-emerald-200 space-y-3">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5" />
                <span>Seller Registered on Monad Testnet!</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono bg-black/40 p-3 rounded-lg border border-white/5">
                <div>
                  <span className="text-zinc-500 block">Seller ID:</span>
                  <span className="text-zinc-300 truncate block">{receipt.sellerId}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block">Dataset ID:</span>
                  <span className="text-zinc-300 truncate block">{receipt.datasetId}</span>
                </div>
              </div>
              <p className="text-zinc-300 text-xs">
                Your dataset is now indexed in SellerRegistry.sol. When buyer jobs are created, your Phase 2 operator service can query the data and call SlaEvaluator with cryptographic block attestations.
              </p>
              {receipt.txHash && (
                <a
                  href={`${MONAD_TESTNET_EXPLORER}/tx/${receipt.txHash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-[#a797ff] hover:underline font-mono text-xs pt-1 font-semibold"
                >
                  <span>View Registration Transaction on MonadScan</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-2 flex items-center justify-end gap-3">
            {receipt && (
              <button
                type="button"
                onClick={reset}
                className="btn-secondary text-xs py-2.5 px-4"
              >
                Register Another Dataset
              </button>
            )}

            <button
              id="seller-submit-btn"
              type="submit"
              disabled={!isLoggedIn || step === "submitting_tx" || step === "preparing"}
              className="btn-primary text-xs py-2.5 px-6 flex items-center gap-2"
            >
              {step === "submitting_tx" || step === "preparing" ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Confirming on Monad...</span>
                </>
              ) : !isLoggedIn ? (
                <span>Sign in with Dynamic to Register</span>
              ) : (
                <>
                  <span>Sign & Register Seller Terms</span>
                  <ShieldCheck className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
};
