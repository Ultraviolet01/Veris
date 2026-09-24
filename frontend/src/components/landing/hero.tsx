import { ArrowRight } from "lucide-react";
import { HeroFigures } from "./hero-figures";

interface HeroProps {
  onExploreMarketplace?: () => void;
  onOpenSellerStudio?: () => void;
}

export function Hero({ onExploreMarketplace, onOpenSellerStudio }: HeroProps) {
  return (
    <div className="mx-auto mb-24 max-w-4xl text-center">

      <h1 className="animate-on-scroll [animation:fadeInUp_0.8s_ease-out_0.2s_both] mb-6 text-5xl font-medium leading-[0.95] tracking-tight text-white md:text-7xl md:leading-none animate">
        Sell verified data
        <br />
        <span className="text-neutral-500">before it goes stale.</span>
      </h1>

      <p className="animate-on-scroll [animation:fadeInUp_0.8s_ease-out_0.3s_both] mx-auto mb-10 max-w-xl text-lg font-light leading-relaxed text-neutral-400 tracking-tight animate">
        AI agents escrow USDC on Monad. Sellers provide cryptographically bound block proofs.
        Our SlaEvaluator hook validates freshness atomically — paying on time or refunding instantly.
      </p>

      <div className="animate-on-scroll [animation:fadeInUp_0.8s_ease-out_0.4s_both] flex flex-wrap items-center justify-center gap-4 animate">
        <button
          onClick={onExploreMarketplace}
          className="group relative flex items-center gap-2 rounded-full bg-white text-black px-8 py-3 text-sm font-medium transition-all hover:bg-gray-200 cursor-pointer"
        >
          <span>Explore Live Feeds</span>
          <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
        </button>
        {onOpenSellerStudio && (
          <button
            onClick={onOpenSellerStudio}
            className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 text-neutral-300 px-6 py-3 text-sm font-medium transition-colors hover:bg-white/10 hover:text-white cursor-pointer"
          >
            <span>Register as Seller</span>
          </button>
        )}
      </div>

      <HeroFigures />
    </div>
  );
}
