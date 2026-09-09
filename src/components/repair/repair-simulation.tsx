import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PredictionChart } from "@/components/charts/prediction-chart";
import { clamp } from "@/lib/utils";
import type { RoadSegment } from "@/lib/types";

export function RepairSimulation({ segment }: { segment: RoadSegment }) {
  const health = segment.healthScore;
  const none = segment.predictedDeterioration.map((d) => d.health);
  const preventive = [health, clamp(health + 25, 0, 95), clamp(health + 32, 0, 95), clamp(health + 30, 0, 95)];
  const rehab = [health, clamp(health + 47, 0, 97), clamp(health + 50, 0, 98), clamp(health + 49, 0, 98)];

  const data = ["Now", "30d", "60d", "90d"].map((label, i) => ({
    label,
    none: none[i],
    preventive: preventive[i],
    rehab: rehab[i],
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Simulate Intervention</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-3 text-xs text-text-tertiary">
          Comparing projected road health with no intervention against preventive repair and major rehabilitation.
        </p>
        <PredictionChart
          data={data}
          series={[
            { key: "none", label: "No Intervention", color: "var(--state-critical)" },
            { key: "preventive", label: "Preventive Repair", color: "var(--accent-cyan)" },
            { key: "rehab", label: "Major Rehabilitation", color: "var(--accent-green)" },
          ]}
          height={280}
        />
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <TrajectoryRow label="Without Intervention" values={none} tone="text-critical" />
          <TrajectoryRow label="Preventive Repair" values={preventive} tone="text-cyan" />
          <TrajectoryRow label="Major Rehabilitation" values={rehab} tone="text-green" />
        </div>
      </CardContent>
    </Card>
  );
}

function TrajectoryRow({ label, values, tone }: { label: string; values: number[]; tone: string }) {
  return (
    <div className="rounded-lg border border-hairline bg-white/[0.02] p-3">
      <div className={`text-[11px] font-semibold uppercase tracking-wide ${tone}`}>{label}</div>
      <div className="mt-1.5 font-mono-tech text-sm text-text-primary">{values.map((v) => Math.round(v)).join(" → ")}</div>
    </div>
  );
}
