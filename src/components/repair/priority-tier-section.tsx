import Link from "next/link";
import { Card } from "@/components/ui/card";
import { RiskBadge } from "@/components/shared/risk-badge";
import type { RoadSegment } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ArrowUpRight } from "lucide-react";

const TIER_META = {
  critical: { label: "CRITICAL PRIORITY", color: "text-critical", border: "border-critical/30", bg: "bg-critical/[0.04]" },
  high: { label: "HIGH PRIORITY", color: "text-high-risk", border: "border-high-risk/30", bg: "bg-high-risk/[0.04]" },
  medium: { label: "MEDIUM PRIORITY", color: "text-moderate", border: "border-moderate/30", bg: "bg-moderate/[0.04]" },
  low: { label: "LOW PRIORITY", color: "text-green", border: "border-green/30", bg: "bg-green/[0.04]" },
} as const;

function consequenceFor(s: RoadSegment) {
  if (s.strategicImportance >= 95) return "Potential loss of primary strategic access — convoy rerouting required";
  if (s.strategicImportance >= 85) return "Significant convoy delay and elevated logistics risk";
  if (s.strategicImportance >= 70) return "Moderate disruption to regional traffic and resupply";
  return "Localized disruption with limited strategic consequence";
}

export function PriorityTierSection({ tier, segments }: { tier: keyof typeof TIER_META; segments: RoadSegment[] }) {
  if (!segments.length) return null;
  const meta = TIER_META[tier];
  return (
    <div>
      <div className="mb-3 flex items-center gap-2.5">
        <span className={cn("h-2 w-2 rounded-full", meta.color.replace("text-", "bg-"))} />
        <h2 className={cn("font-display text-sm font-bold tracking-widest", meta.color)}>{meta.label}</h2>
        <span className="text-xs text-text-tertiary">({segments.length})</span>
      </div>
      <div className="space-y-2.5">
        {segments.map((s) => (
          <Link key={s.id} href={`/repair-recommendations/${s.id}`}>
            <Card className={cn("p-4 transition-colors hover:border-hairline-strong", meta.border, meta.bg)}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono-tech text-xs font-semibold text-cyan">{s.routeNumber}</span>
                    <span className="text-sm font-semibold text-text-primary">{s.roadName}</span>
                    <span className="font-mono-tech text-xs text-text-tertiary">{s.segmentLabel}</span>
                  </div>
                  <p className="mt-1 text-xs text-text-tertiary">{consequenceFor(s)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <div className="text-[10px] uppercase tracking-wide text-text-tertiary">Priority Score</div>
                    <div className={cn("font-display text-lg font-bold", meta.color)}>{s.priorityScore}/100</div>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-text-tertiary" />
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
                <MetricChip label="Risk" value={s.riskScore} />
                <MetricChip label="Strategic" value={s.strategicImportance} />
                <MetricChip label="Traffic Load" value={s.trafficLoad} />
                <MetricChip label="Time to Intervene" value={`${s.timeToInterventionDays}d`} />
                <div className="col-span-2 flex items-center gap-1.5 sm:col-span-1">
                  <RiskBadge level={s.riskLevel} />
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

function MetricChip({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg border border-hairline bg-white/[0.02] px-2 py-1.5 text-center">
      <div className="text-[9px] uppercase tracking-wide text-text-tertiary">{label}</div>
      <div className="font-mono-tech text-xs font-semibold text-text-primary">{value}</div>
    </div>
  );
}
