import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HealthScore } from "@/components/shared/health-score";
import { RiskBadge } from "@/components/shared/risk-badge";
import { AIStatusIndicator } from "@/components/shared/ai-status-indicator";
import { DemoBadge } from "@/components/shared/demo-badge";
import { getSegment, repairOptionsFor } from "@/lib/mock-data";
import { CheckCircle2, ArrowRight, Sparkles } from "lucide-react";

export function HeroRepairIntelligence() {
  const segment = getSegment("nh3-srn-leh-210")!;
  const repair = repairOptionsFor(segment.id).find((r) => r.id === segment.recommendedRepairId)!;
  const day30 = segment.predictedDeterioration[1].health;
  const costSavingLakh = 18.6;

  return (
    <Card className="relative overflow-hidden border-cyan/20 bg-gradient-to-br from-panel via-panel to-panel-alt p-0">
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-cyan/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-blue/10 blur-3xl" />

      <div className="relative flex flex-col gap-6 p-5 md:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Sparkles className="h-4 w-4 text-cyan" />
            <span className="font-display text-xs font-bold uppercase tracking-[0.15em] text-text-primary">
              AI Repair Intelligence
            </span>
            <DemoBadge />
          </div>
          <AIStatusIndicator state="generated" />
        </div>

        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h2 className="font-display text-2xl font-bold text-text-primary">
            {segment.routeNumber} <span className="text-text-tertiary">|</span> {segment.roadName}
          </h2>
          <span className="font-mono-tech text-sm text-cyan">{segment.segmentLabel}</span>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="flex items-center gap-3 rounded-lg border border-hairline bg-white/[0.02] p-3">
            <HealthScore value={segment.healthScore} size="sm" showLabel={false} />
            <div>
              <div className="text-[10px] uppercase tracking-wide text-text-tertiary">Current Health</div>
              <div className="font-display text-lg font-bold text-text-primary">{segment.healthScore}/100</div>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-hairline bg-white/[0.02] p-3">
            <HealthScore value={day30} size="sm" showLabel={false} />
            <div>
              <div className="text-[10px] uppercase tracking-wide text-text-tertiary">Predicted 30-Day</div>
              <div className="font-display text-lg font-bold text-text-primary">{day30}/100</div>
            </div>
          </div>
          <div className="flex flex-col justify-center rounded-lg border border-hairline bg-white/[0.02] p-3">
            <div className="text-[10px] uppercase tracking-wide text-text-tertiary">Risk</div>
            <RiskBadge level={segment.riskLevel} className="mt-1.5 w-fit" />
          </div>
          <div className="flex flex-col justify-center rounded-lg border border-hairline bg-white/[0.02] p-3">
            <div className="text-[10px] uppercase tracking-wide text-text-tertiary">Failure Probability</div>
            <div className="font-display text-lg font-bold text-critical">{segment.probabilityOfFailurePct}%</div>
          </div>
        </div>

        <div className="h-px bg-hairline" />

        <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-text-tertiary">Recommended Intervention</div>
            <div className="mt-1.5 font-display text-xl font-bold text-cyan">{repair.method}</div>

            <div className="mt-3 flex items-center gap-2.5">
              <div className="font-display text-3xl font-bold text-text-primary">{repair.suitabilityScore}</div>
              <div className="text-xs leading-tight text-text-tertiary">
                AI Suitability
                <br />
                Score / 100
              </div>
            </div>

            <div className="mt-4 space-y-1.5">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-text-tertiary">Why?</div>
              {repair.reasons.slice(0, 5).map((r) => (
                <div key={r} className="flex items-start gap-2 text-xs text-text-secondary">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green" />
                  <span>{r}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-text-tertiary">Impact</div>
            <div className="mt-2 grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-hairline bg-white/[0.02] p-3">
                <div className="font-display text-xl font-bold text-green">₹{costSavingLakh} L</div>
                <div className="text-[11px] text-text-tertiary">Estimated cost saving</div>
              </div>
              <div className="rounded-lg border border-hairline bg-white/[0.02] p-3">
                <div className="font-display text-xl font-bold text-cyan">{repair.carbonReductionTons} tons</div>
                <div className="text-[11px] text-text-tertiary">CO₂ reduction</div>
              </div>
              <div className="rounded-lg border border-hairline bg-white/[0.02] p-3">
                <div className="font-display text-xl font-bold text-cyan">{repair.plasticWasteUtilizedTons} tons</div>
                <div className="text-[11px] text-text-tertiary">Plastic waste diverted</div>
              </div>
              <div className="rounded-lg border border-hairline bg-white/[0.02] p-3">
                <div className="font-display text-xl font-bold text-text-primary">
                  {((repair.expectedLifeYearsMin + repair.expectedLifeYearsMax) / 2).toFixed(1)} yrs
                </div>
                <div className="text-[11px] text-text-tertiary">Expected service life</div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2.5 pt-1">
          <Link href={`/repair-recommendations/${segment.id}`}>
            <Button variant="outline">Compare Options</Button>
          </Link>
          <Link href={`/road-network/${segment.id}`}>
            <Button variant="secondary">View Engineering Plan</Button>
          </Link>
          <Link href={`/repair-recommendations/${segment.id}`}>
            <Button variant="primary">
              Approve Recommendation
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}
