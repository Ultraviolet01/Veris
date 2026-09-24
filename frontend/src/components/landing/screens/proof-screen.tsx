export function ProofScreen() {
  const fields = [
    { label: "Target chain", value: "10143 · Monad Testnet" },
    { label: "Source block", value: "14,829,102" },
    { label: "Operator key", value: "0x9B14...E8F1 (Isolated)" },
    { label: "Attestation hash", value: "0x7a2d...3c41" },
    { label: "Evaluation latency", value: "18 ms · Monad VM" },
  ];

  return (
    <div className="flex h-full flex-col justify-between p-[3.4cqw]">
      <header className="flex items-center justify-between">
        <span className="text-[3cqw] font-medium text-white">Freshness attestation</span>
        <span className="rounded-md bg-green-500/10 px-[1.6cqw] py-[0.5cqw] font-mono text-[2.4cqw] text-green-500">
          VERIFIED
        </span>
      </header>
      <dl className="grid grid-cols-2 gap-x-[3cqw] gap-y-[2.4cqh]">
        {fields.map(({ label, value }) => (
          <div key={label} className="flex flex-col gap-[0.4cqh]">
            <dt className="text-[2.2cqw] text-neutral-500">{label}</dt>
            <dd className="truncate font-mono text-[2.5cqw] text-neutral-100">{value}</dd>
          </div>
        ))}
      </dl>
      <footer className="rounded-md border border-[#FF5A36]/20 bg-[#FF5A36]/5 px-[2cqw] py-[1.2cqh] font-mono text-[2.2cqw] text-[#FF5A36]">
        ECDSA signed over (sellerId, jobId, dataHash, blockNumber, timestamp)
      </footer>
    </div>
  );
}
