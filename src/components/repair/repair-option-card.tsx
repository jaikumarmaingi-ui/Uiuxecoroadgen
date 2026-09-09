import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { RepairOption } from "@/lib/types";
import { cn } from "@/lib/utils";
import { CheckCircle2 } from "lucide-react";

const IMPACT_TONE: Record<string, "green" | "cyan" | "amber" | "red"> = {
  "Very Low": "green",
  Low: "cyan",
  Medium: "amber",
  High: "red",
  "Very High": "red",
};

export function RepairOptionCard({
  option,
  letter,
  recommended,
  selected,
  onSelect,
}: {
  option: RepairOption;
  letter: string;
  recommended?: boolean;
  selected?: boolean;
  onSelect?: () => void;
}) {
  return (
    <Card
      onClick={onSelect}
      className={cn(
        "relative flex cursor-pointer flex-col gap-3 p-4 transition-all",
        selected ? "border-cyan/50 bg-cyan/[0.05] shadow-[0_0_0_1px_rgba(53,224,208,0.3)]" : "hover:border-hairline-strong",
      )}
    >
      {recommended && (
        <span className="absolute -top-2.5 left-4 rounded-full bg-cyan px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-text-inverse">
          AI Recommended
        </span>
      )}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-mono-tech text-[10px] font-semibold text-text-tertiary">OPTION {letter}</div>
          <div className="font-display text-base font-bold text-text-primary">{option.shortLabel}</div>
        </div>
        <div className="text-right">
          <div className="font-display text-2xl font-bold text-cyan">{option.suitabilityScore}</div>
          <div className="text-[9px] uppercase tracking-wide text-text-tertiary">Suitability</div>
        </div>
      </div>

      <p className="text-xs leading-relaxed text-text-tertiary">{option.description}</p>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <Stat label="Expected Life" value={`${option.expectedLifeYearsMin}–${option.expectedLifeYearsMax} yrs`} />
        <Stat label="Est. Cost" value={`₹${option.estimatedCostLakhPerKm} L/km`} />
        <Stat label="Cold-Climate" value={option.climateSuitability} />
        <Stat label="Maintenance" value={option.maintenanceFrequency} />
      </div>

      <div className="flex flex-wrap gap-1.5">
        <Badge tone={IMPACT_TONE[option.environmentalImpact]}>Env. impact: {option.environmentalImpact}</Badge>
        {option.recycledMaterialPct > 0 && <Badge tone="cyan">{option.recycledMaterialPct}% recycled</Badge>}
      </div>

      {selected && (
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-cyan">
          <CheckCircle2 className="h-3.5 w-3.5" /> Selected for comparison
        </div>
      )}
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[9px] uppercase tracking-wide text-text-tertiary">{label}</div>
      <div className="font-semibold text-text-secondary">{value}</div>
    </div>
  );
}
