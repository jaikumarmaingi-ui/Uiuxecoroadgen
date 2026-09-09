"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KPIWidget } from "@/components/shared/kpi-widget";
import { AIIntelligenceStar } from "@/components/dashboard/ai-intelligence-star";
import { MountainHeroBackground } from "@/components/dashboard/mountain-hero-background";
import { MiniStrategicMap } from "@/components/dashboard/mini-strategic-map";
import { LiveFeedRow } from "@/components/dashboard/live-feed-row";
import { HeroRepairIntelligence } from "@/components/dashboard/hero-repair-intelligence";
import { RoadSegmentCard } from "@/components/shared/road-segment-card";
import { AlertPanel } from "@/components/shared/alert-panel";
import { DemoBadge } from "@/components/shared/demo-badge";
import { Button } from "@/components/ui/button";
import { ROAD_SEGMENTS, ALERTS, DASHBOARD_KPIS, SPARKLINES } from "@/lib/mock-data";
import { Route, HeartPulse, TriangleAlert, ShieldAlert, Leaf, IndianRupee, Wrench, Target } from "lucide-react";

export default function DashboardPage() {
  const topPriority = [...ROAD_SEGMENTS].sort((a, b) => b.priorityScore - a.priorityScore).slice(0, 5);

  return (
    <div className="mx-auto max-w-[1500px] space-y-6 p-4 md:p-6">
      {/* Hero */}
      <Card className="relative overflow-hidden border-hairline-strong p-0">
        <MountainHeroBackground />
        <div className="relative grid gap-6 p-6 md:p-10 lg:grid-cols-[1fr_auto_auto] lg:items-center">
          <div>
            <div className="mb-3 flex items-center gap-2 font-mono-tech text-[11px] uppercase tracking-widest text-text-tertiary">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan animate-glow-pulse" />
              ECOROADGEN 1.0 · COMMAND DASHBOARD
            </div>
            <h1 className="font-display text-4xl font-bold leading-[1.05] tracking-tight text-white sm:text-5xl">
              INTELLIGENCE
              <br />
              <span className="text-green">ON EVERY MILE</span>
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

          <div className="flex flex-col items-center">
            <AIIntelligenceStar />
            <p className="mt-1 max-w-[280px] px-2 text-center text-[11px] text-text-tertiary">
              Click a facet to open that module of the intelligence cycle.
            </p>
          </div>

          <div className="hidden lg:block">
            <MiniStrategicMap />
          </div>
        </div>

        <div className="relative flex items-center justify-between border-t border-white/5 px-6 py-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-text-tertiary md:px-10">
          <span>Strong Roads · Safer Borders · Greener Tomorrow</span>
          <span className="hidden sm:inline">Infrastructure for a Stronger Tomorrow</span>
        </div>
      </Card>

      {/* KPIs */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
        <KPIWidget
          icon={Route}
          label="Total Road Length"
          value={DASHBOARD_KPIS.totalRoadLengthKm}
          suffix=" km"
          tone="cyan"
          sparklineData={SPARKLINES.length}
          tooltip="Total length of monitored strategic road network under EcoRoadGen."
        />
        <KPIWidget
          icon={HeartPulse}
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
          icon={TriangleAlert}
          label="High Risk Segments"
          value={DASHBOARD_KPIS.highRiskSegments}
          tone="amber"
          trend={-4.2}
          trendLabel="vs last month"
          sparklineData={SPARKLINES.risk}
          tooltip="Segments with risk score above 65, requiring near-term attention."
        />
        <KPIWidget
          icon={ShieldAlert}
          label="Critical Segments"
          value={DASHBOARD_KPIS.criticalSegments}
          tone="red"
          trend={9.1}
          trendLabel="vs last month"
          sparklineData={SPARKLINES.critical}
          tooltip="Segments predicted to fail within 30 days without intervention."
        />
        <KPIWidget
          icon={Leaf}
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
          icon={IndianRupee}
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
          icon={Wrench}
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
          icon={Target}
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

      {/* Live feed row */}
      <section>
        <LiveFeedRow />
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
