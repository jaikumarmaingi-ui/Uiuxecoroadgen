import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DemoBadge } from "@/components/shared/demo-badge";
import { PriorityTierSection } from "@/components/repair/priority-tier-section";
import { ROAD_SEGMENTS } from "@/lib/mock-data";
import { Wrench, ArrowUpRight } from "lucide-react";

export default function RepairRecommendationsPage() {
  const ranked = [...ROAD_SEGMENTS].sort((a, b) => b.priorityScore - a.priorityScore);
  const top = ranked[0];

  const tiers = {
    critical: ranked.filter((s) => s.priorityScore >= 80),
    high: ranked.filter((s) => s.priorityScore >= 65 && s.priorityScore < 80),
    medium: ranked.filter((s) => s.priorityScore >= 45 && s.priorityScore < 65),
    low: ranked.filter((s) => s.priorityScore < 45),
  } as const;

  return (
    <div className="mx-auto max-w-[1100px] space-y-6 p-4 md:p-6">
      <div>
        <div className="flex items-center gap-2.5">
          <Wrench className="h-5 w-5 text-cyan" />
          <h1 className="font-display text-2xl font-bold text-text-primary">AI Repair Recommendations</h1>
          <DemoBadge />
        </div>
        <p className="mt-1 text-sm text-text-tertiary">
          Priority Score = Risk × Strategic Importance × Traffic/Load × Failure Consequence × Repair Urgency.
          Select a segment to open its full AI Repair Intelligence workspace.
        </p>
      </div>

      <Card className="border-cyan/25 bg-cyan/[0.04] p-5">
        <CardHeader className="p-0 pb-3">
          <CardTitle className="text-cyan">Priority #1 · Why prioritized?</CardTitle>
          <Link href={`/repair-recommendations/${top.id}`} className="flex items-center gap-1 text-[11px] font-semibold text-cyan hover:underline">
            Open workspace <ArrowUpRight className="h-3 w-3" />
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          <div className="flex flex-wrap items-baseline gap-x-3">
            <span className="font-display text-lg font-bold text-text-primary">{top.routeNumber}</span>
            <span className="font-mono-tech text-sm text-text-secondary">{top.segmentLabel}</span>
            <span className="ml-auto font-display text-2xl font-bold text-cyan">{top.priorityScore}/100</span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
            <WhyStat label="Risk" value={top.riskScore} />
            <WhyStat label="Strategic Importance" value={top.strategicImportance} />
            <WhyStat label="Traffic Load" value={top.trafficLoad} />
            <WhyStat label="Failure Consequence" value={Math.round((top.strategicImportance + top.riskScore) / 2)} />
            <WhyStat label="Time to Intervention" value={`${top.timeToInterventionDays}d`} />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-8">
        <PriorityTierSection tier="critical" segments={tiers.critical} />
        <PriorityTierSection tier="high" segments={tiers.high} />
        <PriorityTierSection tier="medium" segments={tiers.medium} />
        <PriorityTierSection tier="low" segments={tiers.low} />
      </div>
    </div>
  );
}

function WhyStat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg border border-hairline bg-white/[0.03] p-2.5 text-center">
      <div className="text-[9px] uppercase tracking-wide text-text-tertiary">{label}</div>
      <div className="font-display text-base font-bold text-text-primary">{value}</div>
    </div>
  );
}
