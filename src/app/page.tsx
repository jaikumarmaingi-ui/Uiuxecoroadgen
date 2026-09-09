import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KPIWidget } from "@/components/shared/kpi-widget";
import { AIIntelligenceViz } from "@/components/dashboard/ai-intelligence-viz";
import { HeroRepairIntelligence } from "@/components/dashboard/hero-repair-intelligence";
import { RoadSegmentCard } from "@/components/shared/road-segment-card";
import { AlertPanel } from "@/components/shared/alert-panel";
import { DemoBadge } from "@/components/shared/demo-badge";
import { Button } from "@/components/ui/button";
import { ROAD_SEGMENTS, ALERTS, DASHBOARD_KPIS, SPARKLINES } from "@/lib/mock-data";

export default function DashboardPage() {
  const topPriority = [...ROAD_SEGMENTS].sort((a, b) => b.priorityScore - a.priorityScore).slice(0, 5);

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 p-4 md:p-6">
      {/* Hero */}
      <section className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <Card className="relative flex flex-col justify-center overflow-hidden p-6 md:p-9">
          <div className="pointer-events-none absolute inset-0 bg-grid opacity-40" />
          <div className="relative">
            <div className="mb-3 flex items-center gap-2 font-mono-tech text-[11px] uppercase tracking-widest text-text-tertiary">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan animate-glow-pulse" />
              ECOROADGEN 1.0 · COMMAND DASHBOARD
            </div>
            <h1 className="font-display text-4xl font-bold leading-[1.05] tracking-tight text-text-primary sm:text-5xl">
              INTELLIGENCE
              <br />
              <span className="text-cyan">ON EVERY MILE</span>
            </h1>
            <p className="mt-4 font-display text-base font-semibold tracking-wide text-text-secondary">
              Predict <span className="text-text-tertiary">|</span> Prioritize <span className="text-text-tertiary">|</span> Preserve
            </p>
            <p className="mt-1.5 max-w-md text-sm text-text-tertiary">
              For stronger borders &amp; a greener tomorrow — AI-powered predictive road health and sustainable
              repair intelligence for strategic defence roads.
            </p>
            <div className="mt-6 flex flex-wrap gap-2.5">
              <Link href="/road-network">
                <Button variant="primary">Open Road Network</Button>
              </Link>
              <Link href="/repair-recommendations">
                <Button variant="outline">Repair Recommendations</Button>
              </Link>
            </div>
            <div className="mt-6">
              <DemoBadge />
            </div>
          </div>
        </Card>

        <Card className="flex flex-col items-center justify-center p-5">
          <CardHeader className="w-full p-0 pb-2">
            <CardTitle>AI Road Intelligence Network</CardTitle>
          </CardHeader>
          <AIIntelligenceViz />
          <p className="mt-2 px-2 text-center text-[11px] text-text-tertiary">
            Click a node to open that module of the intelligence cycle.
          </p>
        </Card>
      </section>

      {/* KPIs */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
        <KPIWidget
          label="Total Road Length"
          value={DASHBOARD_KPIS.totalRoadLengthKm}
          suffix=" km"
          tone="cyan"
          sparklineData={SPARKLINES.length}
          tooltip="Total length of monitored strategic road network under EcoRoadGen."
        />
        <KPIWidget
          label="Overall Road Health"
          value={DASHBOARD_KPIS.overallHealth}
          suffix=" / 100"
          tone="green"
          trend={2.6}
          trendLabel="vs last month"
          sparklineData={SPARKLINES.health}
          tooltip="Network-wide average health score across all monitored segments."
        />
        <KPIWidget
          label="High Risk Segments"
          value={DASHBOARD_KPIS.highRiskSegments}
          tone="amber"
          trend={-4.2}
          trendLabel="vs last month"
          sparklineData={SPARKLINES.risk}
          tooltip="Segments with risk score above 65, requiring near-term attention."
          onClick={undefined}
        />
        <KPIWidget
          label="Critical Segments"
          value={DASHBOARD_KPIS.criticalSegments}
          tone="red"
          trend={9.1}
          trendLabel="vs last month"
          sparklineData={SPARKLINES.critical}
          tooltip="Segments predicted to fail within 30 days without intervention."
        />
        <KPIWidget
          label="CO₂ Reduction Potential"
          value={DASHBOARD_KPIS.co2ReductionPotentialTons}
          suffix=" t"
          tone="green"
          trend={5.4}
          trendLabel="vs last quarter"
          sparklineData={SPARKLINES.co2}
          tooltip="Estimated CO₂ emissions avoided by adopting AI-recommended repairs over conventional methods."
        />
        <KPIWidget
          label="Estimated Cost Savings"
          value={DASHBOARD_KPIS.estimatedCostSavingsCr}
          prefix="₹"
          suffix=" Cr"
          decimals={1}
          tone="cyan"
          trend={3.1}
          trendLabel="vs last quarter"
          sparklineData={SPARKLINES.savings}
          tooltip="Cumulative cost savings from AI-optimized repair method selection."
        />
        <KPIWidget
          label="Repair Backlog"
          value={DASHBOARD_KPIS.repairBacklogKm}
          suffix=" km"
          tone="amber"
          trend={-2.3}
          trendLabel="vs last month"
          sparklineData={SPARKLINES.backlog}
          tooltip="Total length of road segments awaiting repair execution."
        />
        <KPIWidget
          label="Prediction Accuracy"
          value={DASHBOARD_KPIS.predictionAccuracyPct}
          suffix="%"
          decimals={1}
          tone="blue"
          trend={0.4}
          trendLabel="model rolling avg"
          sparklineData={SPARKLINES.accuracy}
          tooltip="Rolling accuracy of the deterioration prediction model against verified outcomes."
        />
      </section>

      {/* Hero repair intelligence */}
      <section>
        <HeroRepairIntelligence />
      </section>

      {/* Priority + alerts */}
      <section className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Top Priority Segments</CardTitle>
            <Link href="/repair-recommendations" className="text-[11px] font-semibold text-cyan hover:underline">
              View prioritization engine →
            </Link>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {topPriority.map((s, i) => (
              <RoadSegmentCard key={s.id} segment={s} href={`/road-network/${s.id}`} rank={i + 1} />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Live Alerts</CardTitle>
            <Link href="/alerts" className="text-[11px] font-semibold text-cyan hover:underline">
              View all →
            </Link>
          </CardHeader>
          <CardContent>
            <AlertPanel alerts={ALERTS.slice(0, 5)} compact />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
