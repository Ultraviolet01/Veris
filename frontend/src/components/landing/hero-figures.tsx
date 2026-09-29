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
    value: "≤ 10",
    unit: "sec max",
    note: "Enforced by SlaEvaluator.sol",
    explorerUrl: `https://testnet.monadscan.com/address/0xfc10869E2Bb2E8060DD59C59D0aAB01475bb75A0`,
  },
  {
    label: "Protocol fee",
    value: "2",
    unit: "% (200 bps)",
    note: "VerisTreasury on-chain",
    explorerUrl: `https://testnet.monadscan.com/address/0x402E06B57D2e5c0452492703764a7E24e9772E56`,
  },
  {
    label: "Seller net payout",
    value: "98",
    unit: "% of escrow",
    note: "Atomic — same block as SLA check",
    explorerUrl: `https://testnet.monadscan.com/address/0xfc10869E2Bb2E8060DD59C59D0aAB01475bb75A0`,
  },
  {
    label: "Buyer refund on miss",
    value: "100",
    unit: "% guaranteed",
    note: "On-chain via acpCore.reject()",
    explorerUrl: `https://testnet.monadscan.com/address/0x5898d78653C1f691431A045580c1b1D6aFC28AF9`,
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
