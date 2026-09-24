interface TimelineStep {
  label: string;
  detail: string;
  timestamp: string;
  complete: boolean;
}

const defaultSteps: TimelineStep[] = [
  {
    label: "ACPCore escrow funded",
    detail: "0x4a9f...b72e · block 14,829,102",
    timestamp: "12:04:18.210",
    complete: true,
  },
  {
    label: "Data sampled from source",
    detail: "Aave V3 Monad pool · lending rates",
    timestamp: "12:04:19.450",
    complete: true,
  },
  {
    label: "Operator attestation signed",
    detail: "ECDSA key 0x9B14...E8F1 · block 14,829,104",
    timestamp: "12:04:20.120",
    complete: true,
  },
  {
    label: "SlaEvaluator hook resolved",
    detail: "Freshness 2.8s <= 10s SLA · Seller paid",
    timestamp: "12:04:20.340",
    complete: true,
  },
];

export function SaleTimelineScreen() {
  return (
    <div className="flex h-full flex-col justify-between px-[3.2cqw] pt-[3cqw] pb-[2.4cqw]">
      <header className="flex items-start justify-between gap-[2cqw]">
        <div className="flex flex-col gap-[0.6cqh]">
          <span className="text-[2.8cqw] font-medium text-white">Job #8183-042 · Verification timeline</span>
          <span className="font-mono text-[1.7cqw] text-neutral-500">
            Monad Testnet · Chain ID 10143 · 10,000 TPS
          </span>
        </div>
        <span className="rounded-full border border-green-500/20 bg-green-500/10 px-[1.4cqw] py-[0.4cqw] font-mono text-[1.6cqw] text-green-400">
          SLA HONORED
        </span>
      </header>

      <ol className="flex flex-col gap-[1.6cqh]">
        {defaultSteps.map((step) => (
          <li key={step.label} className="flex items-center gap-[2cqw]">
            <span
              className={`size-[1.4cqw] shrink-0 rounded-full ${
                step.complete ? "bg-green-500" : "animate-pulse bg-[#FF5A36]"
              }`}
            />
            <div className="flex min-w-0 flex-1 flex-col">
              <span className={`text-[2.3cqw] ${step.complete ? "text-neutral-100" : "text-[#FF5A36]"}`}>
                {step.label}
              </span>
              <span className="truncate font-mono text-[1.7cqw] text-neutral-500">
                {step.detail}
              </span>
            </div>
            <span className="shrink-0 font-mono text-[1.7cqw] text-neutral-500">
              {step.timestamp}
            </span>
          </li>
        ))}
      </ol>

      <footer className="font-mono text-[1.6cqw] text-neutral-600">
        Monad block proof validated atomically via IACPHook beforeAction()
      </footer>
    </div>
  );
}
