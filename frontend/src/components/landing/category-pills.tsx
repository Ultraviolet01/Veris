import { Cpu, Database, ShieldCheck, Award } from "lucide-react";

interface CategoryPillsProps {
  onSelectPill?: (target: "how-it-works" | "outcomes" | "safety" | "reputation") => void;
}

const categories = [
  { id: "how-it-works" as const, label: "01 · AI Buyer Agent", icon: Cpu },
  { id: "how-it-works" as const, label: "02 · Signing Operator", icon: Database },
  { id: "safety" as const, label: "03 · SLA Evaluator Hook", icon: ShieldCheck },
  { id: "reputation" as const, label: "04 · ERC-8004 Reputation", icon: Award },
] as const;

export function CategoryPills({ onSelectPill }: CategoryPillsProps) {
  const handleClick = (id: "how-it-works" | "outcomes" | "safety" | "reputation") => {
    if (onSelectPill) {
      onSelectPill(id);
    } else {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <div className="animate-on-scroll [animation:fadeInUp_0.8s_ease-out_0.7s_both] mb-24">
      <div className="flex flex-wrap gap-2.5 sm:gap-3.5 justify-center">
        {categories.map(({ id, label, icon: Icon }) => (
          <button
            key={label}
            onClick={() => handleClick(id)}
            className="group flex items-center gap-2 sm:gap-2.5 rounded-full border border-white/5 bg-white/[0.02] px-4 py-2 sm:px-5 sm:py-2.5 hover:bg-white/[0.06] hover:border-purple-500/30 transition-all cursor-pointer"
          >
            <Icon
              size={14}
              className="text-neutral-400 group-hover:text-purple-400 transition-colors"
            />
            <span className="text-xs sm:text-xs font-medium text-neutral-300 group-hover:text-white transition-colors">
              {label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
