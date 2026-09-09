"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams, notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { HealthScore } from "@/components/shared/health-score";
import { RiskBadge } from "@/components/shared/risk-badge";
import { DemoBadge } from "@/components/shared/demo-badge";
import { AIStatusIndicator } from "@/components/shared/ai-status-indicator";
import { RepairOptionCard } from "@/components/repair/repair-option-card";
import { RepairComparisonTable } from "@/components/repair/repair-comparison-table";
import { WeightSliders, DEFAULT_WEIGHTS, type RepairWeights } from "@/components/repair/weight-sliders";
import { WhyThisRepair } from "@/components/repair/why-this-repair";
import { SustainabilityCalculator } from "@/components/repair/sustainability-calculator";
import { RepairSimulation } from "@/components/repair/repair-simulation";
import { getSegment, repairOptionsWeighted, repairOptionsFor } from "@/lib/mock-data";

const LETTERS = ["A", "B", "C", "D"];

export default function RepairWorkspacePage() {
  const params = useParams<{ id: string }>();
  const segment = getSegment(params.id);
  const [weights, setWeights] = useState<RepairWeights>(DEFAULT_WEIGHTS);
  const [approved, setApproved] = useState(false);

  const weighted = useMemo(() => (segment ? repairOptionsWeighted(segment.id, weights) : []), [segment, weights]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (!segment) notFound();

  const recommended = weighted[0];
  const selected = weighted.find((o) => o.id === selectedId) ?? recommended;
  const baseOptions = repairOptionsFor(segment.id);
  const conventional = baseOptions.find((o) => o.id === "hot-mix")!;
  const day30 = segment.predictedDeterioration[1].health;

  return (
    <div className="mx-auto max-w-[1300px] space-y-5 p-4 md:p-6">
      <Link href="/repair-recommendations" className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-tertiary hover:text-cyan">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Repair Recommendations
      </Link>

      <Card className="relative overflow-hidden border-cyan/20 p-5 md:p-7">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-cyan/10 blur-3xl" />
        <div className="relative">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Sparkles className="h-4 w-4 text-cyan" />
              <span className="font-display text-xs font-bold uppercase tracking-[0.15em] text-text-primary">
                AI Repair Recommendation
              </span>
              <DemoBadge />
            </div>
            <AIStatusIndicator state="generated" />
          </div>
          <h1 className="mt-2 font-display text-2xl font-bold text-text-primary md:text-3xl">What&rsquo;s the best intervention for this road?</h1>
          <div className="mt-1 flex flex-wrap items-baseline gap-x-3">
            <span className="font-mono-tech text-sm font-semibold text-cyan">{segment.routeNumber}</span>
            <span className="text-sm font-medium text-text-secondary">{segment.roadName}</span>
            <span className="font-mono-tech text-sm text-text-tertiary">{segment.segmentLabel}</span>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="flex items-center gap-3 rounded-lg border border-hairline bg-white/[0.02] p-3">
              <HealthScore value={segment.healthScore} size="sm" showLabel={false} />
              <div>
                <div className="text-[10px] uppercase tracking-wide text-text-tertiary">Current Health</div>
                <div className="font-display text-base font-bold text-text-primary">{segment.healthScore}/100</div>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-hairline bg-white/[0.02] p-3">
              <HealthScore value={day30} size="sm" showLabel={false} />
              <div>
                <div className="text-[10px] uppercase tracking-wide text-text-tertiary">Predicted 30-Day</div>
                <div className="font-display text-base font-bold text-text-primary">{day30}/100</div>
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

          <div className="mt-5 flex flex-wrap items-center gap-2.5">
            {approved ? (
              <div className="flex items-center gap-2 rounded-lg border border-green/30 bg-green/10 px-3.5 py-2 text-sm font-semibold text-green">
                <CheckCircle2 className="h-4 w-4" /> Recommendation approved — sent to Repair Planning
              </div>
            ) : (
              <Button variant="primary" onClick={() => setApproved(true)}>
                Approve Recommendation
              </Button>
            )}
            <Link href="/repair-planning">
              <Button variant="secondary">View Repair Planning Board</Button>
            </Link>
          </div>
        </div>
      </Card>

      <Tabs defaultValue="options">
        <TabsList>
          <TabsTrigger value="options">Options &amp; Comparison</TabsTrigger>
          <TabsTrigger value="matrix">Decision Matrix</TabsTrigger>
          <TabsTrigger value="why">Why This Repair</TabsTrigger>
          <TabsTrigger value="sustainability">Sustainability</TabsTrigger>
          <TabsTrigger value="simulation">Simulate Intervention</TabsTrigger>
        </TabsList>

        <div className="pt-5">
          <TabsContent value="options" className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {weighted.map((opt, i) => (
                <RepairOptionCard
                  key={opt.id}
                  option={opt}
                  letter={LETTERS[i]}
                  recommended={opt.id === recommended.id}
                  selected={opt.id === selected.id}
                  onSelect={() => setSelectedId(opt.id)}
                />
              ))}
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Repair Decision Matrix</CardTitle>
              </CardHeader>
              <CardContent>
                <RepairComparisonTable options={weighted} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="matrix" className="grid gap-5 lg:grid-cols-[1fr_1.3fr]">
            <WeightSliders weights={weights} onChange={setWeights} />
            <Card>
              <CardHeader>
                <CardTitle>Recalculated Suitability</CardTitle>
              </CardHeader>
              <CardContent>
                <RepairComparisonTable options={weighted} />
                <p className="mt-3 text-xs text-text-tertiary">
                  Adjusting the sliders re-ranks repair options by weighted suitability. Current top recommendation:{" "}
                  <span className="font-semibold text-cyan">{recommended.method}</span>.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="why">
            <WhyThisRepair option={selected} />
          </TabsContent>

          <TabsContent value="sustainability">
            <SustainabilityCalculator option={selected} conventional={conventional} costSavingLakh={conventional.estimatedCostLakhPerKm - selected.estimatedCostLakhPerKm} />
          </TabsContent>

          <TabsContent value="simulation">
            <RepairSimulation segment={segment} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
