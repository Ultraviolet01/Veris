import React from "react";
import { ArrowRight } from "lucide-react";
import { PulseDot } from "./landing/PulseDot";
import { HeroShowcase } from "./landing/HeroShowcase";

interface HeroProps {
  onExploreClick: () => void;
  onSellerClick: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onExploreClick, onSellerClick }) => {
  return (
    <section className="relative pt-12 pb-16 px-4 lg:px-8">
      <div className="max-w-6xl mx-auto relative z-10 text-center">
        {/* Top Feature Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-950/20 border border-[#836ef9]/30 text-xs font-medium text-purple-200 shadow-[0_0_20px_rgba(131,110,249,0.15)] mb-8 hover:border-[#836ef9]/60 transition-colors">
          <PulseDot color="monad" />
          <span className="uppercase text-[10px] tracking-wider font-semibold text-[#a797ff]">
            Dynamic Embedded Wallets • Monad Testnet (10143)
          </span>
        </div>

        {/* Main Headline */}
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-medium tracking-tight text-white mb-6 font-['Outfit'] leading-[0.98]">
          Self-Enforcing Freshness
          <br />
          <span className="text-zinc-500 font-light">for AI Agents on Monad.</span>
        </h1>

        {/* Subtitle */}
        <p className="max-w-2xl mx-auto text-base sm:text-lg text-zinc-400 font-light leading-relaxed mb-10 tracking-tight">
          Sellers list on-chain data under a strict freshness SLA. Buyer agents pay into an
          ERC-8183 escrow contract. If the cryptographic block attestation is fresh, seller is paid;
          if stale, buyer gets an instant refund. Zero arbitration.
        </p>

        {/* Call to Actions */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-20">
          <button
            id="hero-btn-explore"
            onClick={onExploreClick}
            className="group relative flex items-center gap-2 rounded-full bg-white text-black px-8 py-3.5 text-sm font-semibold transition-all hover:bg-zinc-200 shadow-xl shadow-white/10"
          >
            <span>Explore Data Feeds</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>

          <button
            id="hero-btn-seller"
            onClick={onSellerClick}
            className="flex items-center gap-2 rounded-full bg-white/5 border border-white/10 text-white px-7 py-3.5 text-sm font-medium transition-all hover:bg-white/10 hover:border-white/20"
          >
            <span>Register as Data Seller</span>
          </button>
        </div>

        {/* Hero Showcase Bento */}
        <HeroShowcase />
      </div>
    </section>
  );
};
