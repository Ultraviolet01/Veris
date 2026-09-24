import { useState, useEffect } from "react";
import { useIsLoggedIn, useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { useWalletCreation } from "./hooks/useWalletCreation";
import { DynamicProvider } from "./lib/dynamic";
import { BackgroundEffects } from "./components/landing/background-effects";
import { SiteNav, type AppView } from "./components/landing/site-nav";
import { Hero } from "./components/landing/hero";
import { HeroShowcase } from "./components/landing/hero-showcase";
import { CategoryPills } from "./components/landing/category-pills";
import { ProtocolExecutionPipeline } from "./components/landing/protocol-execution-pipeline";
import { SlaInteractiveScrubber } from "./components/landing/sla-interactive-scrubber";
import { TrustMatrixTerminal } from "./components/landing/trust-matrix-terminal";
import { EscrowTerminalCalculator } from "./components/landing/escrow-terminal-calculator";
import { SiteFooter } from "./components/landing/site-footer";
import { ScrollReveal } from "./components/landing/scroll-reveal";

import { DataMarketTerminal } from "./components/DataMarketTerminal";
import { AgentPlayground } from "./components/AgentPlayground";
import { ReputationHub } from "./components/ReputationHub";
import { AgentConnect } from "./components/AgentConnect";
import { DocsSpecs } from "./components/DocsSpecs";
import { BuyerModal } from "./components/BuyerModal";
import { SellerStudio } from "./components/SellerStudio";
import { AgentChatbot } from "./components/AgentChatbot";
import { type MarketplaceDataset } from "./lib/contracts";

export function VerisApp() {
  const [activeView, setActiveView] = useState<AppView>("overview");
  const [showSellerStudioModal, setShowSellerStudioModal] = useState(false);
  const [selectedDataset, setSelectedDataset] = useState<MarketplaceDataset | null>(null);
  const [pendingMarketplaceNav, setPendingMarketplaceNav] = useState(false);

  const isLoggedIn = useIsLoggedIn();
  const { setShowAuthFlow } = useDynamicContext();

  // Ensures embedded wallet creation & Monad network auto-switch runs upon sign in
  useWalletCreation();

  const handleOpenMarketplace = () => {
    if (!isLoggedIn) {
      setPendingMarketplaceNav(true);
      setShowAuthFlow(true);
    } else {
      setActiveView("marketplace");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  useEffect(() => {
    if (isLoggedIn && pendingMarketplaceNav) {
      setPendingMarketplaceNav(false);
      setActiveView("marketplace");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [isLoggedIn, pendingMarketplaceNav]);

  const handleOpenPlayground = () => {
    setActiveView("playground");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleOpenReputation = () => {
    setActiveView("reputation");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden pt-28 bg-[#020202] text-[#a3a3a3]">
      {/* Floating Glass Pill Nav with Dynamic Auth & View Switcher */}
      <SiteNav
        activeView={activeView}
        setActiveView={setActiveView}
        onOpenSellerStudio={() => setShowSellerStudioModal(true)}
      />

      {/* VIEW 1: OVERVIEW (LANDING PAGE) */}
      {activeView === "overview" && (
        <>
          {/* 3D WebGL Fluid Canvas & Gridlines — Strictly limited to Overview Hero */}
          <BackgroundEffects />

          <main id="top" className="max-w-7xl mx-auto pt-10 px-6 pb-12 relative z-10">
            {/* Hero Section */}
            <Hero
              onExploreMarketplace={handleOpenMarketplace}
              onOpenSellerStudio={() => setShowSellerStudioModal(true)}
            />

            {/* Hero Showcase (Live Monitor + Telemetry Cards) */}
            <HeroShowcase
              onOpenMarketplace={handleOpenMarketplace}
              onOpenSellerStudio={() => setShowSellerStudioModal(true)}
            />

            {/* Category Pills (Technical coordinate jumping) */}
            <CategoryPills />

            {/* 01. The Continuous Settlement Pipeline (Circuit Node Inspector) */}
            <ProtocolExecutionPipeline
              onOpenMarketplace={handleOpenMarketplace}
              onOpenPlayground={handleOpenPlayground}
            />

            {/* 02. The 10-Second Boundary: SlaEvaluator Real-Time Scrubber */}
            <SlaInteractiveScrubber
              onOpenPlayground={handleOpenPlayground}
              onOpenReputation={handleOpenReputation}
            />

            {/* 03. The Monad Trust Boundary: EIP-712 Attestation Inspector & Matrix */}
            <TrustMatrixTerminal />

            {/* 04. Protocol Economics: Financial Execution Terminal & KPIs */}
            <EscrowTerminalCalculator onOpenMarketplace={handleOpenMarketplace} />
          </main>

          {/* Protocol Footer — Strictly on Landing Page */}
          <SiteFooter
            onSelectView={(view) => {
              setActiveView(view);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            onOpenSellerStudio={() => setShowSellerStudioModal(true)}
          />
        </>
      )}

      {/* VIEW 2: DATA FEEDS (MARKETPLACE) */}
      {activeView === "marketplace" && (
        <main className="max-w-7xl mx-auto pt-6 px-4 sm:px-6 pb-24 relative z-10">
          <DataMarketTerminal onSelectDataset={(ds) => setSelectedDataset(ds)} />
        </main>
      )}

      {/* VIEW 3: AGENT PLAYGROUND */}
      {activeView === "playground" && (
        <main className="max-w-7xl mx-auto pt-6 px-4 sm:px-6 pb-24 relative z-10">
          <AgentPlayground />
        </main>
      )}

      {/* VIEW 4: REPUTATION HUB */}
      {activeView === "reputation" && (
        <main className="max-w-7xl mx-auto pt-6 px-4 sm:px-6 pb-24 relative z-10">
          <ReputationHub />
        </main>
      )}

      {/* VIEW 5: AGENT CONNECT (MCP & SDKs) */}
      {activeView === "connect" && (
        <main className="max-w-7xl mx-auto pt-6 px-4 sm:px-6 pb-24 relative z-10">
          <AgentConnect />
        </main>
      )}

      {/* VIEW 6: DOCS & TECHNICAL SPECS */}
      {activeView === "docs" && (
        <main className="max-w-7xl mx-auto pt-6 px-4 sm:px-6 pb-24 relative z-10">
          <DocsSpecs />
        </main>
      )}

      {/* Smooth Scroll Intersection Observer */}
      <ScrollReveal />

      {/* Interactive Buyer Escrow Modal ($50 Hard Cap Enforced) */}
      {selectedDataset && (
        <BuyerModal
          dataset={selectedDataset}
          onClose={() => setSelectedDataset(null)}
        />
      )}

      {/* Seller Studio Modal */}
      {showSellerStudioModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/10 bg-[#08090e] p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
              <div>
                <h3 className="text-xl font-medium text-white">Seller Studio Console</h3>
                <p className="text-xs text-neutral-400">Register datasets, configure SLA terms, and inspect on-chain revenue</p>
              </div>
              <button
                type="button"
                onClick={() => setShowSellerStudioModal(false)}
                className="text-neutral-400 hover:text-white px-3 py-1.5 rounded-full border border-white/10 text-xs hover:bg-white/5 cursor-pointer transition-colors"
              >
                Close
              </button>
            </div>
            <SellerStudio />
          </div>
        </div>
      )}

      {/* Natural-Language Console (Claude Chatbot) — Floating Bottom Right */}
      <AgentChatbot />
    </div>
  );
}

export default function App() {
  return (
    <DynamicProvider>
      <VerisApp />
    </DynamicProvider>
  );
}
