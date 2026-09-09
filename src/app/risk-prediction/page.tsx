"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RoadMap } from "@/components/road-network/road-map";
import { RiskBadge } from "@/components/shared/risk-badge";
import { DataConfidenceBadge } from "@/components/shared/data-confidence-badge";
import { DemoBadge } from "@/components/shared/demo-badge";
import { PredictionChart } from "@/components/charts/prediction-chart";
import { FeatureImportance } from "@/components/charts/feature-importance";
import { ROAD_SEGMENTS, getSegment } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { ArrowUpRight, Radar } from "lucide-react";

export default function RiskPredictionPage() {
  const ranked = useMemo(() => [...ROAD_SEGMENTS].sort((a, b) => b.riskScore - a.riskScore), []);
  const [selectedId, setSelectedId] = useState(ranked[0].id);
  const selected = getSegment(selectedId)!;

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 p-4 md:p-6">
      <div>
        <div className="flex items-center gap-2.5">
          <Radar className="h-5 w-5 text-cyan" />
          <h1 className="font-display text-2xl font-bold text-text-primary">Where will the road fail next?</h1>
          <DemoBadge />
        </div>
        <p className="mt-1 text-sm text-text-tertiary">
          AI-driven deterioration prediction across the strategic road network — ranked by risk score, with
          full explainability for every forecast.
        </p>
      </div>

      <Card className="h-[380px] overflow-hidden p-0">
        <RoadMap
          segments={ranked}
          selectedId={selectedId}
          onSelect={(s) => setSelectedId(s.id)}
          colorMode="risk"
          overlays={{ weather: false, repairHistory: false, militaryTraffic: false, landslideZones: true }}
        />
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Prediction Cards</CardTitle>
          </CardHeader>
          <CardContent className="max-h-[560px] space-y-2.5 overflow-y-auto">
            {ranked.slice(0, 10).map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedId(s.id)}
                className={cn(
                  "w-full rounded-xl border p-3.5 text-left transition-colors",
                  s.id === selectedId ? "border-cyan/40 bg-cyan/[0.06]" : "border-hairline bg-panel/50 hover:border-hairline-strong",
                )}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-mono-tech text-xs font-semibold text-cyan">{s.routeNumber}</span>
                    <span className="ml-2 text-sm font-semibold text-text-primary">{s.roadName}</span>
                    <div className="font-mono-tech text-xs text-text-tertiary">{s.segmentLabel}</div>
                  </div>
                  <RiskBadge level={s.riskLevel} />
                </div>
                <div className="mt-2.5 grid grid-cols-4 gap-2 text-center text-xs">
                  <div>
                    <div className="text-text-tertiary">Risk Score</div>
                    <div className="font-display font-bold text-text-primary">{s.riskScore}</div>
                  </div>
                  <div>
                    <div className="text-text-tertiary">Probability</div>
                    <div className="font-display font-bold text-critical">{s.probabilityOfFailurePct}%</div>
                  </div>
                  <div>
                    <div className="text-text-tertiary">Window</div>
                    <div className="font-display font-bold text-text-primary">
                      {s.riskLevel === "critical" ? "30d" : s.riskLevel === "high-risk" ? "60d" : "90d"}
                    </div>
                  </div>
                  <div>
                    <div className="text-text-tertiary">Confidence</div>
                    <div className="font-display font-bold text-text-primary">{s.predictionConfidencePct}%</div>
                  </div>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>
                {selected.routeNumber} · {selected.segmentLabel}
              </CardTitle>
              <Link href={`/road-network/${selected.id}`} className="flex items-center gap-1 text-[11px] font-semibold text-cyan hover:underline">
                Full intelligence <ArrowUpRight className="h-3 w-3" />
              </Link>
            </CardHeader>
            <CardContent>
              <PredictionChart
                data={selected.predictedDeterioration.map((d) => ({ label: d.label, health: d.health }))}
                series={[{ key: "health", label: "Predicted Health", color: "var(--accent-cyan)" }]}
                height={220}
              />
              <div className="mt-2 flex items-center justify-between">
                <DataConfidenceBadge level={selected.dataConfidence} />
                <span className="text-xs text-text-tertiary">
                  Current <span className="font-mono-tech font-semibold text-text-primary">{selected.healthScore}</span> → 90d{" "}
                  <span className="font-mono-tech font-semibold text-critical">{selected.predictedDeterioration[3].health}</span>
                </span>
              </div>
            </CardContent>
          </Card>

          <FeatureImportance
            contributions={selected.featureContributions}
            explanation={selected.aiExplanation}
            confidencePct={selected.predictionConfidencePct}
            lastUpdatedIso={selected.lastInspectionIso}
          />
        </div>
      </div>
    </div>
  );
}
