export function SiteLogo() {
  return (
    <a href="#top" className="flex items-center gap-2.5 group">
      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-neutral-900 border border-white/10 group-hover:border-red-500/30 transition-colors">
        <div className="h-2 w-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="font-mono text-sm font-semibold tracking-wider text-white">
          VERIS
        </span>
        <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">
          Protocol
        </span>
      </div>
    </a>
  );
}
