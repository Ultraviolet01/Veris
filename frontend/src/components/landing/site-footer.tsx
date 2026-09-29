import { SiteLogo } from "./site-logo";
import { ArrowUpRight } from "lucide-react";
import type { AppView } from "./site-nav";

interface SiteFooterProps {
  onSelectView?: (view: AppView) => void;
  onOpenSellerStudio?: () => void;
  onOpenPrivacy?: () => void;
  onOpenTerms?: () => void;
}

export function SiteFooter({ onSelectView, onOpenSellerStudio, onOpenPrivacy, onOpenTerms }: SiteFooterProps) {
  const handleNav = (view: AppView) => {
    if (onSelectView) {
      onSelectView(view);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <footer className="border-t border-white/5 bg-[#020204] pb-12 pt-24 text-neutral-400">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-16 flex flex-col justify-between gap-12 md:flex-row">
          {/* Brand Col */}
          <div className="max-w-xs">
            <div className="flex items-center gap-2 mb-4">
              <SiteLogo />
            </div>
            <p className="text-xs leading-relaxed text-neutral-500">
              Veris provides autonomous on-chain freshness guarantees for AI agent data feeds on Monad.
              Escrow payments in ACPCore, verify ECDSA block attestations via SlaEvaluator, and settle funds atomically with zero disputes.
            </p>
          </div>

          {/* Links Grid */}
          <div className="flex flex-wrap gap-x-16 gap-y-8 text-xs">
            {/* Column 1: Application */}
            <div className="flex flex-col gap-3">
              <span className="font-semibold text-white uppercase tracking-wider text-[11px]">Protocol</span>
              <button
                onClick={() => handleNav("overview")}
                className="text-left text-neutral-400 hover:text-white transition-colors cursor-pointer"
              >
                Overview
              </button>
              <button
                onClick={() => handleNav("marketplace")}
                className="text-left text-neutral-400 hover:text-white transition-colors cursor-pointer"
              >
                Data Feeds Directory
              </button>
              <button
                onClick={() => handleNav("playground")}
                className="text-left text-neutral-400 hover:text-white transition-colors cursor-pointer"
              >
                Agent Query Playground
              </button>
              <button
                onClick={() => handleNav("reputation")}
                className="text-left text-neutral-400 hover:text-white transition-colors cursor-pointer"
              >
                ERC-8004 Reputation Hub
              </button>
              {onOpenSellerStudio && (
                <button
                  onClick={onOpenSellerStudio}
                  className="text-left text-purple-300 hover:text-white transition-colors cursor-pointer"
                >
                  Seller Studio Console
                </button>
              )}
            </div>

            {/* Column 2: Developers */}
            <div className="flex flex-col gap-3">
              <span className="font-semibold text-white uppercase tracking-wider text-[11px]">Developers</span>
              <button
                onClick={() => handleNav("connect")}
                className="text-left text-neutral-400 hover:text-white transition-colors cursor-pointer"
              >
                MCP Server Config
              </button>
              <button
                onClick={() => handleNav("docs")}
                className="text-left text-neutral-400 hover:text-white transition-colors cursor-pointer"
              >
                Smart Contracts & Specs
              </button>
              <a
                href="https://testnet.monadscan.com"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-neutral-400 hover:text-white transition-colors"
              >
                <span>Monadscan Explorer</span>
                <ArrowUpRight size={11} />
              </a>
              <a
                href="https://docs.monad.xyz"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-neutral-400 hover:text-white transition-colors"
              >
                <span>Monad Documentation</span>
                <ArrowUpRight size={11} />
              </a>
            </div>

            {/* Column 3: Trust Standards */}
            <div className="flex flex-col gap-3">
              <span className="font-semibold text-white uppercase tracking-wider text-[11px]">Standards</span>
              <a
                href="https://github.com/erc8183/erc8183-reference"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-neutral-400 hover:text-white transition-colors"
              >
                <span>ERC-8183 Standard</span>
                <ArrowUpRight size={11} />
              </a>
              <a
                href="https://www.dynamic.xyz/docs"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-neutral-400 hover:text-white transition-colors"
              >
                <span>Dynamic WaaS Docs</span>
                <ArrowUpRight size={11} />
              </a>
              <a
                href="https://envio.dev"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-neutral-400 hover:text-white transition-colors"
              >
                <span>Envio HyperRPC</span>
                <ArrowUpRight size={11} />
              </a>
            </div>

            {/* Column 4: Legal */}
            <div className="flex flex-col gap-3">
              <span className="font-semibold text-white uppercase tracking-wider text-[11px]">Legal</span>
              <button
                type="button"
                onClick={onOpenPrivacy}
                className="text-left text-neutral-400 hover:text-white transition-colors cursor-pointer"
              >
                Privacy Policy
              </button>
              <button
                type="button"
                onClick={onOpenTerms}
                className="text-left text-neutral-400 hover:text-white transition-colors cursor-pointer"
              >
                Terms of Service
              </button>
              <a
                href="mailto:hello@veris.xyz"
                className="text-neutral-400 hover:text-white transition-colors"
              >
                Contact Us
              </a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-t border-white/5 pt-8 text-[11px] text-neutral-500">
          <div className="flex flex-col gap-1">
            <p>© 2026 Veris Protocol · Monad Metropolis Track 4 (Trust, Identity &amp; AI Infrastructure)</p>
            <p>
              <a href="mailto:hello@veris.xyz" className="hover:text-neutral-300 transition-colors underline underline-offset-2">
                hello@veris.xyz
              </a>
              {" · "}
              <button type="button" onClick={onOpenPrivacy} className="hover:text-neutral-300 transition-colors underline underline-offset-2 cursor-pointer">
                Privacy
              </button>
              {" · "}
              <button type="button" onClick={onOpenTerms} className="hover:text-neutral-300 transition-colors underline underline-offset-2 cursor-pointer">
                Terms
              </button>
            </p>
          </div>
          <div className="flex flex-col items-end gap-1 font-mono">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" aria-hidden="true" />
              <span>Monad Testnet (Chain ID 10143) · Up to 10,000 TPS*</span>
            </div>
            <span className="text-neutral-700 text-[10px]">* Testnet performance. Mainnet figures may vary.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
