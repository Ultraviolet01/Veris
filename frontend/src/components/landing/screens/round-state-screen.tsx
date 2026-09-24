function StateRow({
  label,
  value,
  tone = "text-neutral-200",
}: {
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-[2cqw] border-t border-white/5 pt-[1.6cqh]">
      <span className="text-[2.4cqw] text-neutral-500">{label}</span>
      <span className={`truncate font-mono text-[2.3cqw] ${tone}`}>{value}</span>
    </div>
  );
}

export function RoundStateScreen() {
  return (
    <div className="flex h-full flex-col justify-center gap-[5cqh] p-[4cqw]">
      <header className="flex items-center justify-between">
        <span className="text-[2.8cqw] text-neutral-400">
          SLA Evaluator · Feed #AAVE-USD / Monad Testnet
        </span>
        <span className="rounded-md bg-green-500/10 px-[1.6cqw] py-[0.6cqw] font-mono text-[2.4cqw] font-medium text-green-500">
          PROVED FRESH
        </span>
      </header>
      <div className="flex flex-col gap-[1.6cqh]">
        <StateRow label="Guaranteed SLA" value="10.0 seconds max age" />
        <StateRow
          label="Attested block age"
          value="2.8 seconds ✓ (Fresh)"
          tone="text-green-500"
        />
        <StateRow label="Settlement" value="1.47 USDC → Seller embedded wallet" />
        <StateRow
          label="Arbitration risk"
          value="0.0% · Deterministic on-chain math"
          tone="text-[#FF5A36]"
        />
      </div>
    </div>
  );
}
