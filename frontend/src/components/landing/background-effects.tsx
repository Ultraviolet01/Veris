import { MonadFluidScene } from "./monad-fluid-scene";

const fadeMask = "linear-gradient(to bottom, transparent, black 0%, black 75%, transparent)";

export function BackgroundEffects() {
  return (
    <div className="absolute top-0 left-0 right-0 z-0 h-[750px] w-full pointer-events-none overflow-hidden">
      {/* 3D WebGL Fluid Canvas */}
      <div
        className="absolute inset-0 w-full h-full"
        style={{ maskImage: fadeMask, WebkitMaskImage: fadeMask }}
      >
        <MonadFluidScene />
      </div>
      {/* Ambient radial glow & hairline gridlines confined strictly to hero */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 mx-auto max-w-7xl grid-lines border-r border-l border-white/[0.03]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80vw] h-[450px] bg-[radial-gradient(ellipse_at_center,rgba(204,0,0,0.15),transparent_70%)] opacity-50 blur-3xl" />
      </div>
    </div>
  );
}
