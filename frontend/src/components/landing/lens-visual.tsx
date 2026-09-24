import { Clock, ShieldCheck } from "lucide-react";
import lensVerifierImg from "../../assets/landing/lens-verifier.webp";
import { CoverPhoto } from "./screens/cover-photo";
import { PhoneAmountScreen } from "./screens/phone-amount-screen";
import { screens } from "./screens/screen-geometry";
import { ScreenSurface } from "./screens/screen-surface";

export function LensVisual() {
  return (
    <div className="relative animate-on-scroll [animation:fadeInUp_0.8s_ease-out_0.4s_both]">
      <div className="group relative overflow-hidden rounded-3xl border border-white/5 bg-[#050505] aspect-[4/5] lg:aspect-square">
        <CoverPhoto
          image={lensVerifierImg}
          motionClassName="transition-transform duration-1000 group-hover:scale-110"
          imageClassName="opacity-80"
        >
          <ScreenSurface geometry={screens.verifierPhone}>
            <PhoneAmountScreen eyebrow="In escrow" amount="1.50" unit="USDC locked" />
          </ScreenSurface>
        </CoverPhoto>
        <div className="absolute inset-0 bg-gradient-to-tr from-black/80 via-transparent to-white/5 pointer-events-none" />

        <div className="absolute top-8 right-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white animate-spin [animation-duration:10s]">
            <Clock size={20} />
          </div>
        </div>

        <div className="absolute bottom-8 left-8 right-8">
          <div className="rounded-xl border border-white/10 bg-black/40 backdrop-blur-xl p-5">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500">
                <ShieldCheck size={20} />
              </div>
              <div>
                <h4 className="text-sm font-medium text-white">Escrowed before data arrives</h4>
                <p className="text-[11px] text-neutral-400 mt-1 leading-relaxed">
                  ACPCore takes the buyer&apos;s USDC into escrow with a client-enforced $50.00 cap.
                  The seller claims proceeds only when block freshness passes verification.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="hidden lg:block absolute -z-10 -top-4 -right-4 w-24 h-24 border-t border-r border-white/10 rounded-tr-3xl" />
      <div className="hidden lg:block absolute -z-10 -bottom-4 -left-4 w-24 h-24 border-b border-l border-white/10 rounded-bl-3xl" />
    </div>
  );
}
