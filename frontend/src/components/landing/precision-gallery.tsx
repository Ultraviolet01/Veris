import { CheckCircle2 } from "lucide-react";
import galleryProofImg from "../../assets/landing/gallery-proof.webp";
import thumbVaultImg from "../../assets/landing/thumb-vault.webp";
import thumbClockImg from "../../assets/landing/thumb-clock.webp";
import { CoverPhoto } from "./screens/cover-photo";
import { ProofScreen } from "./screens/proof-screen";
import { screens } from "./screens/screen-geometry";
import { ScreenSurface } from "./screens/screen-surface";

const thumbnails = [
  { image: thumbVaultImg, key: "vault" },
  { image: thumbClockImg, key: "deadline" },
] as const;

export function PrecisionGallery() {
  return (
    <div id="verify" className="relative scroll-mt-32">
      <div className="absolute -inset-4 rounded-3xl bg-gradient-to-tr from-red-500/10 via-neutral-500/5 to-white/5 blur-2xl opacity-50" />

      <div className="relative rounded-2xl border border-white/10 bg-[#0A0A0A] p-3 shadow-2xl">
        <div className="rounded-xl overflow-hidden relative group">
          <div className="relative w-full h-[360px] sm:h-[420px]">
            <CoverPhoto
              image={galleryProofImg}
              motionClassName="transition-transform duration-700 group-hover:scale-105"
              imageClassName="opacity-80 group-hover:opacity-100 transition-opacity duration-700"
            >
              <ScreenSurface geometry={screens.proofTablet}>
                <ProofScreen />
              </ScreenSurface>
            </CoverPhoto>
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
          <div className="absolute bottom-4 left-4 right-4">
            <div className="flex items-center gap-3 bg-black/40 backdrop-blur-md p-3 rounded-lg border border-white/10">
              <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center text-white">
                <CheckCircle2 size={20} className="text-green-400" />
              </div>
              <div>
                <div className="text-sm font-medium text-white">Native Monad block proof</div>
                <div className="text-xs text-neutral-400">Verified by SlaEvaluator on Chain ID 10143</div>
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 mt-3">
          {thumbnails.map(({ image, key }) => (
            <div
              key={key}
              className="relative h-24 w-full overflow-hidden rounded-lg border border-white/10 group cursor-pointer"
            >
              <img
                src={image}
                alt=""
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110 opacity-60 group-hover:opacity-100"
              />
            </div>
          ))}
          <a
            href="https://testnet.monadscan.com"
            target="_blank"
            rel="noreferrer"
            className="relative h-24 w-full overflow-hidden rounded-lg border border-white/10 group"
          >
            <div className="absolute inset-0 bg-white/5 flex flex-col items-center justify-center gap-1 text-white group-hover:bg-white/10 transition-colors">
              <span className="text-xs font-medium">Monadscan</span>
              <span className="text-[10px] text-neutral-500">Explorer tx</span>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}
