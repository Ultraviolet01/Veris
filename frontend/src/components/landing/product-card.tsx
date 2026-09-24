import type { ReactNode } from "react";
import { PhoneShot } from "./screens/phone-shot";
import type { ScreenGeometry } from "./screens/screen-geometry";
import { ScreenSurface } from "./screens/screen-surface";

export interface Product {
  name: string;
  price: string;
  badge: string;
  image: string;
  screen: ScreenGeometry;
  screenContent: ReactNode;
  action: string;
  href?: string;
  onClick?: () => void;
  cardClassName: string;
  badgeClassName: string;
  actionClassName: string;
  hasHoverTint: boolean;
  featherPhoto: boolean;
}

export function ProductCard({ product }: { product: Product }) {
  return (
    <div className={product.cardClassName}>
      {product.hasHoverTint && (
        <div className="group-hover:opacity-100 transition-opacity bg-red-500/5 opacity-0 absolute top-0 right-0 bottom-0 left-0" />
      )}
      <div className="absolute top-4 left-4">
        <span className={product.badgeClassName}>{product.badge}</span>
      </div>
      <div className="flex z-10 h-56 mt-4 mb-8 relative items-center justify-center">
        <PhoneShot image={product.image} feather={product.featherPhoto}>
          <ScreenSurface geometry={product.screen}>{product.screenContent}</ScreenSurface>
        </PhoneShot>
      </div>
      <h3 className="text-lg font-medium text-white mb-2">{product.name}</h3>
      <p className="text-sm text-neutral-500 mb-6 font-mono">{product.price}</p>
      {product.onClick ? (
        <button
          onClick={product.onClick}
          className={`block w-full text-center cursor-pointer ${product.actionClassName}`}
        >
          {product.action}
        </button>
      ) : (
        <a
          href={product.href || "#"}
          className={`block text-center ${product.actionClassName}`}
        >
          {product.action}
        </a>
      )}
    </div>
  );
}
