import tradePayerImg from "../../assets/landing/trade-payer.webp";
import tradeBuyerImg from "../../assets/landing/trade-buyer.webp";
import tradeSellerImg from "../../assets/landing/trade-seller.webp";
import { ProductCard, type Product } from "./product-card";
import { PhoneAmountScreen } from "./screens/phone-amount-screen";
import { screens } from "./screens/screen-geometry";

const outlineAction =
  "w-full rounded-full border border-white/10 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-white hover:text-black";
const accentBadge = "text-[10px] font-bold uppercase tracking-widest text-red-500";

interface CuratedSelectionsProps {
  onOpenMarketplace?: () => void;
  onOpenSellerStudio?: () => void;
}

export function CuratedSelections({ onOpenMarketplace, onOpenSellerStudio }: CuratedSelectionsProps) {
  const products: Product[] = [
    {
      name: "Buyer agent escrows funds",
      price: "1.50 USDC locked in ACPCore",
      badge: "1 · Buyer Agent",
      image: tradePayerImg,
      screen: screens.payerPhone,
      screenContent: <PhoneAmountScreen eyebrow="Escrowed" amount="1.50" unit="USDC" />,
      action: "Open Marketplace Escrow",
      onClick: onOpenMarketplace,
      cardClassName:
        "animate-on-scroll [animation:fadeInUp_0.8s_ease-out_0.3s_both] group overflow-hidden transition-colors hover:bg-white/[0.03] border-white/5 border rounded-2xl pt-8 pr-8 pb-8 pl-8 relative",
      badgeClassName: accentBadge,
      actionClassName: outlineAction,
      hasHoverTint: false,
      featherPhoto: true,
    },
    {
      name: "Operator delivers signed block proof",
      price: "ECDSA key 0x9B14...E8F1 isolated",
      badge: "2 · Operator Service",
      image: tradeBuyerImg,
      screen: screens.buyerPhone,
      screenContent: <PhoneAmountScreen eyebrow="Signed" amount="< 10s" unit="Freshness" accent />,
      action: "Review SLA Specification",
      href: "#safety",
      cardClassName:
        "animate-on-scroll [animation:fadeInUp_0.8s_ease-out_0.4s_both] group overflow-hidden bg-[#0F0F0F] border-white/10 border rounded-2xl pt-8 pr-8 pb-8 pl-8 relative shadow-2xl",
      badgeClassName: accentBadge,
      actionClassName:
        "w-full rounded-full bg-white py-2.5 text-xs font-semibold text-black transition-transform hover:scale-[1.02]",
      hasHoverTint: true,
      featherPhoto: true,
    },
    {
      name: "Seller receives net proceeds",
      price: "1.47 USDC after 200 bps treasury fee",
      badge: "3 · Data Seller",
      image: tradeSellerImg,
      screen: screens.sellerPhone,
      screenContent: <PhoneAmountScreen eyebrow="Settled" amount="1.47" unit="USDC" />,
      action: "Launch Seller Studio",
      onClick: onOpenSellerStudio,
      cardClassName:
        "animate-on-scroll [animation:fadeInUp_0.8s_ease-out_0.5s_both] group relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.01] p-8 transition-colors hover:bg-white/[0.03]",
      badgeClassName: "text-[10px] font-bold uppercase tracking-widest text-neutral-600",
      actionClassName: outlineAction,
      hasHoverTint: false,
      featherPhoto: true,
    },
  ];

  return (
    <div id="how-it-works" className="mb-32 scroll-mt-32">
      <div className="flex animate-on-scroll [animation:fadeInUp_0.8s_ease-out_0.2s_both] mb-12 items-end justify-between">
        <div>
          <h2 className="text-3xl font-medium tracking-tight text-white mb-2">
            One trade, three roles
          </h2>
          <p className="text-neutral-500 text-sm">
            Live on Monad Testnet. Gross budget, protocol fee, and seller net settle atomically.
            Buyer funds never leave escrow without cryptographic freshness verification.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {products.map((product) => (
          <ProductCard key={product.name} product={product} />
        ))}
      </div>
    </div>
  );
}
