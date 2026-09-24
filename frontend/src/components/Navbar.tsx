import React, { useState } from "react";
import { DynamicWidget, useDynamicContext, useIsLoggedIn } from "@dynamic-labs/sdk-react-core";
import { useWalletCreation } from "../hooks/useWalletCreation";
import { ShieldCheck, RefreshCw, Copy, Check } from "lucide-react";

interface NavbarProps {
  activeTab: "marketplace" | "seller" | "reputation" | "docs";
  setActiveTab: (tab: "marketplace" | "seller" | "reputation" | "docs") => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const isLoggedIn = useIsLoggedIn();
  const { primaryWallet } = useDynamicContext();
  const { status: walletStatus, isMonadNetwork, retry } = useWalletCreation();
  const [copied, setCopied] = useState(false);

  const address = primaryWallet?.address;
  const shortAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : null;

  const handleCopy = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#0a0914]/80 border-b border-white/10 px-4 lg:px-8 py-3.5 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div
            onClick={() => setActiveTab("marketplace")}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#836ef9] via-[#634fd6] to-[#22d3ee] flex items-center justify-center p-0.5 shadow-lg shadow-[#836ef9]/30 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-[#0d0c1b] rounded-[10px] flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-[#836ef9]" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-bold tracking-tight text-white font-['Outfit']">VERIS</span>
                <span className="badge badge-monad text-[10px] py-0.5 px-2">Monad 10143</span>
              </div>
              <p className="text-[11px] text-zinc-400 font-medium">Self-Enforcing SLA Data Escrow</p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
          <button
            id="nav-tab-marketplace"
            onClick={() => setActiveTab("marketplace")}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === "marketplace"
                ? "bg-[#836ef9] text-white shadow-md shadow-[#836ef9]/30"
                : "text-zinc-400 hover:text-white hover:bg-white/5"
            }`}
          >
            Data Feeds
          </button>
          <button
            id="nav-tab-seller"
            onClick={() => setActiveTab("seller")}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === "seller"
                ? "bg-[#836ef9] text-white shadow-md shadow-[#836ef9]/30"
                : "text-zinc-400 hover:text-white hover:bg-white/5"
            }`}
          >
            Seller Studio
          </button>
          <button
            id="nav-tab-reputation"
            onClick={() => setActiveTab("reputation")}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === "reputation"
                ? "bg-[#836ef9] text-white shadow-md shadow-[#836ef9]/30"
                : "text-zinc-400 hover:text-white hover:bg-white/5"
            }`}
          >
            Reputation Hub
          </button>
          <button
            id="nav-tab-docs"
            onClick={() => setActiveTab("docs")}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === "docs"
                ? "bg-[#836ef9] text-white shadow-md shadow-[#836ef9]/30"
                : "text-zinc-400 hover:text-white hover:bg-white/5"
            }`}
          >
            Dynamic Setup & Specs
          </button>
        </nav>

        {/* Dynamic Wallet & Network Controls */}
        <div className="flex items-center gap-3">
          {/* Network Indicator */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900/90 border border-white/10 text-xs">
            <span
              className={`w-2 h-2 rounded-full ${
                isMonadNetwork ? "bg-emerald-400 animate-pulse" : "bg-purple-400 animate-pulse"
              }`}
            />
            <span className="text-zinc-300 font-medium">Monad Testnet</span>
          </div>

          {/* Embedded Wallet Status Indicator */}
          {isLoggedIn && (
            <div className="hidden xl:flex items-center gap-2">
              {walletStatus === "creating" && (
                <div className="flex items-center gap-1.5 text-xs text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/20">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Provisioning WaaS...</span>
                </div>
              )}
              {walletStatus === "switching_network" && (
                <div className="flex items-center gap-1.5 text-xs text-purple-300 bg-purple-500/10 px-2.5 py-1 rounded-md border border-purple-500/20">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Switching to 10143...</span>
                </div>
              )}
              {walletStatus === "ready" && address && (
                <div
                  onClick={handleCopy}
                  title="Click to copy embedded wallet address"
                  className="flex items-center gap-1.5 text-xs text-emerald-300 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20 cursor-pointer hover:bg-emerald-500/20 transition-colors"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="font-mono">{shortAddress}</span>
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-zinc-400" />}
                </div>
              )}
              {walletStatus === "error" && (
                <button
                  onClick={() => retry()}
                  className="text-xs text-rose-300 bg-rose-500/10 px-2.5 py-1 rounded-md border border-rose-500/20 hover:bg-rose-500/20 flex items-center gap-1"
                >
                  <span>Wallet setup retry</span>
                </button>
              )}
            </div>
          )}

          {/* Dynamic SDK Widget Button */}
          <div id="dynamic-auth-button" className="dynamic-widget-wrapper">
            <DynamicWidget />
          </div>
        </div>
      </div>
    </header>
  );
};
