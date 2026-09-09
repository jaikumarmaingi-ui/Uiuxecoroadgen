import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Thermometer, Mountain, Snowflake, Droplets, Shield, Truck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HealthScore } from "@/components/shared/health-score";
import { RiskBadge } from "@/components/shared/risk-badge";
import { DataConfidenceBadge } from "@/components/shared/data-confidence-badge";
import { DemoBadge } from "@/components/shared/demo-badge";
import { FeatureImportance } from "@/components/charts/feature-importance";
import { PredictionChart } from "@/components/charts/prediction-chart";
import { ConditionBreakdown } from "@/components/condition/condition-breakdown";
import { SegmentTabs } from "./segment-tabs";
import { ROAD_SEGMENTS, getSegment, repairOptionsFor } from "@/lib/mock-data";
import { daysAgo } from "@/lib/utils";

export function generateStaticParams() {
  return ROAD_SEGMENTS.map((s) => ({ id: s.id }));
}

export default async function RoadSegmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const segment = getSegment(id);
  if (!segment) notFound();

  const repair = repairOptionsFor(segment.id).find((r) => r.id === segment.recommendedRepairId)!;
  const day30 = segment.predictedDeterioration[1].health;
  const day90 = segment.predictedDeterioration[3].health;

  return (
    <div className="mx-auto max-w-[1200px] space-y-5 p-4 md:p-6">
      <Link href="/road-network" className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-tertiary hover:text-cyan">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Road Network
      </Link>

      <Card className="p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 font-mono-tech text-xs font-semibold text-cyan">
              {segment.routeNumber} <span className="text-text-tertiary">·</span> {segment.region}
              <DemoBadge />
            </div>
            <h1 className="mt-1 font-display text-2xl font-bold text-text-primary md:text-3xl">{segment.roadName}</h1>
            <div className="mt-1 font-mono-tech text-sm text-text-secondary">{segment.segmentLabel}</div>
          </div>
          <RiskBadge level={segment.riskLevel} className="text-sm" />
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatBlock label="Current Health" value={`${segment.healthScore}/100`} ring={segment.healthScore} />
          <StatBlock label="Predicted 30-Day Health" value={`${day30}/100`} ring={day30} />
          <StatBlock label="Predicted 90-Day Health" value={`${day90}/100`} ring={day90} />
          <div className="flex items-center gap-3 rounded-xl border border-hairline bg-white/[0.02] p-3.5">
            <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-critical/40 bg-critical/10">
              <span className="font-display text-lg font-bold text-critical">{segment.probabilityOfFailurePct}%</span>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wide text-text-tertiary">Probability of Failure</div>
              <div className="text-xs text-text-secondary">Last inspection {daysAgo(segment.lastInspectionIso)}d ago</div>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <DataConfidenceBadge level={segment.dataConfidence} />
          <span className="text-xs text-text-tertiary">
            Prediction confidence <span className="font-mono-tech font-semibold text-text-primary">{segment.predictionConfidencePct}%</span>
          </span>
        </div>
      </Card>

      <SegmentTabs
        overview={<OverviewTab segment={segment} />}
        condition={<ConditionTab segment={segment} />}
        prediction={<PredictionTab segment={segment} />}
        rootCauses={
          <FeatureImportance
            contributions={segment.featureContributions}
            explanation={segment.aiExplanation}
            confidencePct={segment.predictionConfidencePct}
            lastUpdatedIso={segment.lastInspectionIso}
          />
        }
        repair={<RepairTab segmentId={segment.id} />}
        sustainability={<SustainabilityTab repair={repair} />}
        history={<HistoryTab segment={segment} />}
      />
    </div>
  );
}

function StatBlock({ label, value, ring }: { label: string; value: string; ring: number }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-hairline bg-white/[0.02] p-3.5">
      <HealthScore value={ring} size="sm" showLabel={false} />
      <div>
        <div className="text-[10px] uppercase tracking-wide text-text-tertiary">{label}</div>
        <div className="font-display text-base font-bold text-text-primary">{value}</div>
      </div>
    </div>
  );
}

function EnvRow({ icon: Icon, label, value }: { icon: typeof Thermometer; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-hairline bg-white/[0.02] px-3.5 py-2.5">
      <Icon className="h-4 w-4 text-cyan" strokeWidth={1.8} />
      <div className="flex-1 text-xs text-text-secondary">{label}</div>
      <div className="font-mono-tech text-sm font-semibold text-text-primary">{value}</div>
    </div>
  );
}

function OverviewTab({ segment }: { segment: (typeof ROAD_SEGMENTS)[number] }) {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Segment Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <EnvRow icon={Mountain} label="Altitude" value={`${segment.altitudeM.toLocaleString()} m`} />
          <EnvRow icon={Thermometer} label="Temperature" value={`${segment.temperatureC}°C`} />
          <EnvRow icon={Snowflake} label="Freeze-Thaw Cycles (annual)" value={`${segment.freezeThawCycles}`} />
          <EnvRow icon={Droplets} label="Drainage Score" value={`${segment.drainageScore}/100`} />
          <EnvRow icon={Shield} label="Strategic Importance" value={`${segment.strategicImportance}/100`} />
          <EnvRow icon={Truck} label="Military Convoy Frequency" value={segment.militaryConvoyFrequency} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Five-Question Snapshot</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <Snapshot q="What is wrong?" a={`${segment.surfaceCondition} surface condition with ${segment.structuralCondition.toLowerCase()} structural rating.`} />
          <Snapshot q="Where is it?" a={`${segment.roadName} (${segment.routeNumber}), ${segment.segmentLabel}, ${segment.region}.`} />
          <Snapshot q="Why is it happening?" a={segment.featureContributions[0] ? `Primarily driven by ${segment.featureContributions[0].factor.toLowerCase()} (${segment.featureContributions[0].weight}% contribution).` : ""} />
          <Snapshot q="What will happen next?" a={`Predicted to reach ${segment.predictedDeterioration[1].health}/100 within 30 days (${segment.probabilityOfFailurePct}% failure probability).`} />
          <Snapshot q="What should we do?" a="See the Repair tab for the AI-recommended intervention and full comparison." />
        </CardContent>
      </Card>
    </div>
  );
}

function Snapshot({ q, a }: { q: string; a: string }) {
  return (
    <div className="border-l-2 border-cyan/30 pl-3">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-cyan">{q}</div>
      <div className="mt-0.5 text-text-secondary">{a}</div>
    </div>
  );
}

function ConditionTab({ segment }: { segment: (typeof ROAD_SEGMENTS)[number] }) {
  return <ConditionBreakdown segment={segment} />;
}

function PredictionTab({ segment }: { segment: (typeof ROAD_SEGMENTS)[number] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Deterioration Forecast</CardTitle>
      </CardHeader>
      <CardContent>
        <PredictionChart
          data={segment.predictedDeterioration.map((d) => ({ label: d.label, health: d.health }))}
          series={[{ key: "health", label: "Predicted Health", color: "var(--accent-cyan)" }]}
        />
        <div className="mt-3 grid grid-cols-3 gap-3 text-center">
          {segment.predictedDeterioration.slice(1).map((d) => (
            <div key={d.label} className="rounded-lg border border-hairline bg-white/[0.02] py-2.5">
              <div className="text-[10px] uppercase tracking-wide text-text-tertiary">{d.label}</div>
              <div className="font-display text-lg font-bold text-text-primary">{d.health}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function RepairTab({ segmentId }: { segmentId: string }) {
  const recommended = repairOptionsFor(segmentId).find((r) => r.id === getSegment(segmentId)!.recommendedRepairId)!;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recommended Repair</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="font-display text-xl font-bold text-cyan">{recommended.method}</div>
          <p className="mt-1 text-sm text-text-secondary">{recommended.description}</p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MiniStat label="Suitability" value={`${recommended.suitabilityScore}/100`} />
          <MiniStat label="Expected Life" value={`${recommended.expectedLifeYearsMin}–${recommended.expectedLifeYearsMax} yrs`} />
          <MiniStat label="Cost" value={`₹${recommended.estimatedCostLakhPerKm} L/km`} />
          <MiniStat label="Cold-Climate" value={recommended.climateSuitability} />
        </div>
        <Link href={`/repair-recommendations/${segmentId}`}>
          <Button variant="primary">Open AI Repair Intelligence Workspace</Button>
        </Link>
      </CardContent>
    </Card>
  );
}

function SustainabilityTab({ repair }: { repair: ReturnType<typeof repairOptionsFor>[number] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Sustainability Snapshot</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MiniStat label="CO₂ Reduction" value={`${repair.carbonReductionTons} t`} tone="text-green" />
        <MiniStat label="Recycled Material" value={`${repair.recycledMaterialPct}%`} tone="text-cyan" />
        <MiniStat label="Plastic Waste Diverted" value={`${repair.plasticWasteUtilizedTons} t`} tone="text-cyan" />
        <MiniStat label="Environmental Impact" value={repair.environmentalImpact} />
      </CardContent>
    </Card>
  );
}

function MiniStat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-lg border border-hairline bg-white/[0.02] p-3">
      <div className="text-[10px] uppercase tracking-wide text-text-tertiary">{label}</div>
      <div className={`font-display text-base font-bold ${tone ?? "text-text-primary"}`}>{value}</div>
    </div>
  );
}

function HistoryTab({ segment }: { segment: (typeof ROAD_SEGMENTS)[number] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Segment History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-0">
          {segment.history.map((h, i) => (
            <div key={i} className="flex gap-4 pb-5 last:pb-0">
              <div className="flex flex-col items-center">
                <span className="h-2.5 w-2.5 rounded-full bg-cyan" />
                {i < segment.history.length - 1 && <span className="mt-1 w-px flex-1 bg-hairline" />}
              </div>
              <div className="-mt-0.5 pb-1">
                <div className="text-xs text-text-tertiary">{new Date(h.dateIso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</div>
                <div className="text-sm font-medium text-text-primary">{h.event}</div>
                <div className="text-xs text-text-tertiary">Health after: {h.healthAfter}/100</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
