export function PhoneAmountScreen({
  eyebrow,
  amount,
  unit,
  accent = false,
}: {
  eyebrow: string;
  amount: string;
  unit: string;
  accent?: boolean;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-[3cqh] px-[8cqw] text-center">
      <span className="font-mono text-[7.5cqw] uppercase tracking-widest text-neutral-400 font-medium">
        {eyebrow}
      </span>
      <span
        className={`text-[17cqw] font-bold tracking-tight ${accent ? "text-[#FF5A36]" : "text-white drop-shadow-[0_2px_8px_rgba(255,255,255,0.3)]"}`}
      >
        {amount}
      </span>
      <span className="font-mono text-[7cqw] text-neutral-300 font-medium">{unit}</span>
    </div>
  );
}
