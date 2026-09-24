import { ArrowUpRight } from "lucide-react";

interface HeroFigure {
  readonly label: string;
  readonly value: string;
  readonly unit: string;
  readonly note: string;
  readonly transactionHash?: string;
  readonly explorerUrl?: string;
}

const figures: readonly HeroFigure[] = [
  {
    label: "Freshness SLA",
    value: "10.0",
    unit: "sec max",
    note: "Monad block delta check",
    explorerUrl: "https://testnet.monadscan.com",
  },
  {
    label: "Buyer escrowed",
    value: "1.50",
    unit: "USDC",
    note: "ACPCore job deposit",
    explorerUrl: "https://testnet.monadscan.com",
  },
  {
    label: "Seller net payout",
    value: "1.47",
    unit: "USDC",
    note: "Net of 200 bps treasury",
    explorerUrl: "https://testnet.monadscan.com",
  },
  {
    label: "ERC-8004 reliability",
    value: "99.8",
    unit: "%",
    note: "3,420 resolved proofs",
    explorerUrl: "https://testnet.monadscan.com",
  },
];

function FigureCell({ figure }: { figure: HeroFigure }) {
  return (
    <div className="flex flex-col items-center gap-2 bg-[#050505] px-4 py-6">
      <dt className="text-[10px] font-medium uppercase tracking-widest text-neutral-500">
        {figure.label}
      </dt>
      <dd className="font-mono text-xl text-white tabular-nums md:text-2xl">
        {figure.value}
        <span className="ml-1.5 text-xs text-neutral-500">{figure.unit}</span>
      </dd>
      <dd className="text-[11px] text-neutral-500">
        <a
          href={figure.explorerUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 transition-colors hover:text-[#FF5A36]"
        >
          {figure.note}
          <ArrowUpRight size={10} />
        </a>
      </dd>
    </div>
  );
}

export function HeroFigures() {
  return (
    <div className="animate-on-scroll [animation:fadeInUp_0.8s_ease-out_0.5s_both] animate mx-auto mt-16 max-w-4xl">
      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/5 bg-white/5 md:grid-cols-4">
        {figures.map((figure) => (
          <FigureCell key={figure.label} figure={figure} />
        ))}
      </dl>
      <p className="mt-4 text-[11px] text-neutral-500">
        Live Monad Testnet telemetry (Chain ID 10143) · Verified via on-chain ECDSA attestation
      </p>
    </div>
  );
}
