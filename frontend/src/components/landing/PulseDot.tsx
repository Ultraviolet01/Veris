export function PulseDot({ color = "monad" }: { color?: "monad" | "emerald" | "amber" }) {
  const colorMap = {
    monad: {
      ring: "bg-[#836ef9]",
      ping: "bg-[#836ef9]",
    },
    emerald: {
      ring: "bg-emerald-400",
      ping: "bg-emerald-400",
    },
    amber: {
      ring: "bg-amber-400",
      ping: "bg-amber-400",
    },
  };

  const c = colorMap[color] || colorMap.monad;

  return (
    <span className="relative flex h-2 w-2">
      <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${c.ping} opacity-75`} />
      <span className={`relative inline-flex h-2 w-2 rounded-full ${c.ring}`} />
    </span>
  );
}
