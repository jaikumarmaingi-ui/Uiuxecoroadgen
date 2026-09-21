import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CheckCircle2, TriangleAlert } from "lucide-react";
import { SCALE_LABEL, type TreatmentQuote } from "@/lib/inspection-3d/treatments";
import { LAYER_LABEL } from "@/lib/inspection-3d/diagnosis";

/**
 * One matched treatment for the failure under inspection.
 *
 * Quantities are the ones the survey measured — area, cost for that area,
 * carbon for that area — rather than a per-kilometre rate, because the thing
 * being priced is a discrete defect and quoting it per kilometre overstates
 * the job by orders of magnitude.
 */
export function TreatmentCard({
  quote,
  letter,
  selected,
  onSelect,
}: {
  quote: TreatmentQuote;
  letter: string;
  selected?: boolean;
  onSelect?: () => void;
}) {
  const { def } = quote;
  return (
    <Card
      onClick={onSelect}
      className={cn(
        "relative flex cursor-pointer flex-col gap-3 p-4 transition-all",
        selected
          ? "border-cyan/50 bg-cyan/[0.05] shadow-[0_0_0_1px_rgba(53,224,208,0.3)]"
          : "hover:border-hairline-strong",
        quote.underReaches && "opacity-60",
      )}
    >
      {quote.recommended && (
        <span className="absolute -top-2.5 left-4 rounded-full bg-cyan px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-text-inverse">
          AI Recommended
        </span>
      )}

      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="font-mono-tech text-[10px] font-semibold text-text-tertiary">
            OPTION {letter} · {SCALE_LABEL[def.scale].toUpperCase()}
          </div>
          <div className="font-display text-base font-bold text-text-primary">{def.shortLabel}</div>
        </div>
        <div className="shrink-0 text-right">
          <div className="font-display text-2xl font-bold text-cyan">{quote.suitabilityScore}</div>
          <div className="text-[9px] uppercase tracking-wide text-text-tertiary">Suitability</div>
        </div>
      </div>

      <p className="text-xs leading-relaxed text-text-tertiary">{def.description}</p>

      {quote.underReaches && (
        <div className="flex items-start gap-1.5 rounded-lg border border-critical/30 bg-critical/[0.06] px-2.5 py-2 text-[11px] text-text-secondary">
          <TriangleAlert className="mt-px h-3.5 w-3.5 shrink-0 text-critical" />
          <span>
            Reaches only the {LAYER_LABEL[def.reachesLayer].toLowerCase()} — cannot treat a failure
            originating below it. Listed for comparison, not recommended.
          </span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 text-xs">
        <Stat label="Treated Area" value={`${quote.areaM2} m²`} />
        <Stat label="Est. Cost" value={`₹${quote.costLakh.toFixed(2)} L`} />
        <Stat label="Expected Life" value={`${def.expectedLifeYears[0]}–${def.expectedLifeYears[1]} yrs`} />
        <Stat label="Duration" value={`${quote.durationDays} day${quote.durationDays === 1 ? "" : "s"}`} />
      </div>

      <div className="flex flex-wrap gap-1.5">
        <Badge tone={quote.co2AvoidedTons > 0 ? "green" : "neutral"}>
          {quote.co2Tons.toFixed(2)} t CO₂e
        </Badge>
        {quote.co2AvoidedTons > 0 && (
          <Badge tone="green">−{quote.co2AvoidedTons.toFixed(2)} t vs conventional</Badge>
        )}
        {def.recycledPct > 0 && <Badge tone="cyan">{def.recycledPct}% recycled</Badge>}
        {quote.plasticWasteTons > 0 && (
          <Badge tone="cyan">{quote.plasticWasteTons.toFixed(2)} t plastic</Badge>
        )}
      </div>

      {selected && (
        <div className="space-y-2 border-t border-hairline pt-2.5">
          <div>
            <div className="text-[9px] uppercase tracking-wide text-text-tertiary">Why this treatment</div>
            <ul className="mt-1 space-y-1">
              {def.reasons.map((r) => (
                <li key={r} className="flex gap-1.5 text-[11px] leading-relaxed text-text-secondary">
                  <CheckCircle2 className="mt-px h-3 w-3 shrink-0 text-green" />
                  {r}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="text-[9px] uppercase tracking-wide text-text-tertiary">Risk considerations</div>
            <ul className="mt-1 space-y-1">
              {def.risks.map((r) => (
                <li key={r} className="flex gap-1.5 text-[11px] leading-relaxed text-text-secondary">
                  <TriangleAlert className="mt-px h-3 w-3 shrink-0 text-moderate" />
                  {r}
                </li>
              ))}
            </ul>
          </div>
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
