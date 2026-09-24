import type { LucideIcon } from "lucide-react";
import { Clock, Lock, ShieldCheck } from "lucide-react";

interface Feature {
  title: string;
  description: string;
  icon: LucideIcon;
}

const features: readonly Feature[] = [
  {
    title: "Atomic BeforeAction hook",
    description:
      "ACPCore delegates freshness validation to SlaEvaluator before any job can complete. Forged or stale data never touches funds.",
    icon: Lock,
  },
  {
    title: "Deterministic block mathematics",
    description:
      "Freshness is measured strictly by Monad block timestamp and height: delta = block.timestamp - sourceBlockTimestamp <= SLA window.",
    icon: Clock,
  },
  {
    title: "Operator key isolation",
    description:
      "Human sellers connect via Dynamic embedded wallets to receive payouts. Automated operator signing keys remain strictly server-side.",
    icon: ShieldCheck,
  },
];

export function PrecisionFeatures() {
  return (
    <ul className="mt-8 space-y-6">
      {features.map(({ title, description, icon: Icon }) => (
        <li key={title} className="flex items-start gap-4">
          <span className="mt-1 h-8 w-8 rounded-lg bg-white/5 ring-1 ring-white/10 grid place-items-center text-white shrink-0">
            <Icon size={16} />
          </span>
          <div>
            <div className="text-sm font-medium text-white">{title}</div>
            <div className="text-sm text-neutral-500 mt-1">{description}</div>
          </div>
        </li>
      ))}
    </ul>
  );
}
