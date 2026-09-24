import bentoAssignedImg from "../../assets/landing/bento-assigned.webp";
import bentoCancelledImg from "../../assets/landing/bento-cancelled.webp";
import bentoLateProofImg from "../../assets/landing/bento-late-proof.webp";
import bentoWrongSaleImg from "../../assets/landing/bento-wrong-sale.webp";
import bentoOldRoundImg from "../../assets/landing/bento-old-round.webp";
import { MaterialTile } from "./material-tile";
import { CoverPhoto } from "./screens/cover-photo";
import { RoundStateScreen } from "./screens/round-state-screen";
import { screens } from "./screens/screen-geometry";
import { ScreenSurface } from "./screens/screen-surface";

export function MaterialInnovation() {
  return (
    <section
      id="outcomes"
      className="relative border-t border-white/5 bg-[#030303] py-32 overflow-hidden scroll-mt-32"
    >
      <div className="z-10 max-w-7xl mr-auto ml-auto pr-6 pl-6 relative">
        <div className="mb-20 text-center">
          <h2 className="animate-on-scroll [animation:fadeInUp_0.8s_ease-out_0.2s_both] text-3xl font-medium tracking-tight text-white md:text-5xl">
            Two outcomes, never both
          </h2>
          <p className="animate-on-scroll [animation:fadeInUp_0.8s_ease-out_0.3s_both] mt-4 text-neutral-400 font-light">
            The Monad block timestamp decides what happened. SlaEvaluator settles on the proof.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:h-[600px] h-auto gap-x-4 gap-y-4">
          <div className="animate-on-scroll [animation:fadeInUp_0.8s_ease-out_0.4s_both] col-span-1 md:col-span-2 md:row-span-2 min-h-[560px] md:min-h-0 relative rounded-3xl border border-white/5 bg-[#0A0A0A] overflow-hidden group hover:border-red-500/20 transition-colors">
            <CoverPhoto
              image={bentoAssignedImg}
              imageClassName="group-hover:opacity-100 transition-opacity duration-700 opacity-40"
            >
              <ScreenSurface geometry={screens.assignedMonitor}>
                <RoundStateScreen />
              </ScreenSurface>
            </CoverPhoto>
            <div className="bg-gradient-to-t from-black via-transparent to-transparent absolute top-0 right-0 bottom-0 left-0 pointer-events-none" />

            <div className="absolute bottom-0 left-0 w-full p-10 flex flex-col items-center text-center z-10">
              <h3 className="text-white text-3xl font-medium tracking-tight mb-2">
                Attested before the deadline
              </h3>
              <p className="text-neutral-500 text-sm max-w-xs mb-6">
                The operator submits a signed proof within the SLA window. SlaEvaluator releases seller proceeds
                in the exact same block.
              </p>
              <a
                href="#safety"
                className="bg-red-600 text-white px-6 py-2 rounded-full text-xs font-medium hover:bg-red-500 transition-colors"
              >
                Read the trust boundary
              </a>
            </div>
          </div>

          <div className="animate-on-scroll [animation:fadeInUp_0.8s_ease-out_0.5s_both] col-span-1 md:col-span-1 min-h-[280px] md:min-h-0 overflow-hidden group flex flex-col hover:border-red-500/20 transition-colors z-10 bg-[#0A0A0A] border-white/5 border rounded-3xl pt-6 pr-6 pb-6 pl-6 relative items-center justify-end">
            <CoverPhoto
              image={bentoCancelledImg}
              imageClassName="opacity-40 group-hover:opacity-100 transition-opacity duration-700"
            />
            <h3 className="relative z-10 text-white text-lg font-medium">
              Stale data detected
            </h3>
            <p className="relative z-10 text-[10px] text-neutral-500">
              Buyer refunded in full, zero fee
            </p>
          </div>

          <div className="animate-on-scroll [animation:fadeInUp_0.8s_ease-out_0.6s_both] col-span-1 md:col-span-1 min-h-[280px] md:min-h-0 overflow-hidden group flex flex-col bg-[#0A0A0A] hover:border-red-500/20 transition-colors border-white/5 border rounded-3xl pt-6 pr-6 pb-6 pl-6 relative items-center justify-end">
            <CoverPhoto
              image={bentoLateProofImg}
              imageClassName="opacity-40 group-hover:opacity-100 transition-opacity duration-700"
            />
            <h3 className="z-10 leading-tight text-lg font-medium text-white text-center relative">
              Late or invalid proof
            </h3>
            <p className="z-10 text-[10px] text-neutral-500 relative">
              submit() reverts, escrow refunded
            </p>
          </div>

          <MaterialTile
            image={bentoWrongSaleImg}
            title="Wrong block hash"
            caption="Signature mismatch rejected on-chain"
            headingClassName="text-white text-lg font-medium"
          />
          <MaterialTile
            image={bentoOldRoundImg}
            title="Replay prevention"
            caption="Cannot replay proof across job IDs"
            headingClassName="text-lg font-medium text-white"
          />
        </div>
      </div>
    </section>
  );
}
