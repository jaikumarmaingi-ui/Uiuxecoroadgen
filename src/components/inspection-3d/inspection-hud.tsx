"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Car,
  Footprints,
  Layers3,
  Sparkles,
  Loader2,
  CheckCircle2,
  ArrowRight,
  X,
  TriangleAlert,
  Gauge,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PredictionChart } from "@/components/charts/prediction-chart";
import { FeatureImportance } from "@/components/charts/feature-importance";
import { RepairOptionCard } from "@/components/repair/repair-option-card";
import { RISK_META } from "@/lib/risk";
import { repairOptionsFor } from "@/lib/mock-data";
import type { RoadSegment } from "@/lib/types";
import { layerInspectionFor } from "./pavement-layers";
import type { FlowState } from "./types";

const DISTRESS_LABELS: { key: keyof RoadSegment["distress"]; label: string }[] = [
  { key: "cracking", label: "Cracking" },
  { key: "potholes", label: "Potholes" },
  { key: "rutting", label: "Rutting" },
  { key: "ravelling", label: "Ravelling" },
  { key: "edgeDeterioration", label: "Edge Deterioration" },
  { key: "depression", label: "Depression" },
];

export function InspectionHUD({
  flow,
  segment,
  selectedLayer,
  onSelectLayer,
  onEnterWorld,
  onStopAndInspect,
  onGetOut,
  onInspectRoad,
  onExplodeLayers,
  onTriggerAI,
  onRestart,
}: {
  flow: FlowState;
  segment: RoadSegment;
  selectedLayer: number | null;
  onSelectLayer: (index: number | null) => void;
  onEnterWorld: () => void;
  onStopAndInspect: () => void;
  onGetOut: () => void;
  onInspectRoad: () => void;
  onExplodeLayers: () => void;
  onTriggerAI: () => void;
  onRestart: () => void;
}) {
  const router = useRouter();
  const risk = RISK_META[segment.riskLevel];
  const [selectedRepairId, setSelectedRepairId] = useState<string | null>(null);

  const topRepairs = useMemo(() => {
    return [...repairOptionsFor(segment.id)].sort((a, b) => b.suitabilityScore - a.suitabilityScore).slice(0, 3);
  }, [segment.id]);

  const showSidePanel = flow === "inspecting" || flow === "exploded" || flow === "analyzing" || flow === "results";

  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col">
      {flow !== "intro" && (
        <div className="pointer-events-auto flex items-center justify-between gap-3 p-3 sm:p-4">
          <div className="glass-panel flex items-center gap-2.5 rounded-xl border border-hairline px-3 py-2">
            <ShieldCheck className="h-4 w-4 text-cyan" />
            <div>
              <div className="font-display text-xs font-bold text-text-primary sm:text-sm">
                {segment.routeNumber} · {segment.segmentLabel}
              </div>
              <div className="font-mono-tech text-[9px] text-text-tertiary sm:text-[10px]">3D FIELD INSPECTION — DEMO DATA</div>
            </div>
            <Badge tone={riskTone(segment.riskLevel)} className="ml-1">
              {risk.label}
            </Badge>
          </div>
          <Button variant="secondary" size="sm" onClick={() => router.push("/field-inspection")}>
            <X className="h-3.5 w-3.5" /> Exit
          </Button>
        </div>
      )}

      <div className="relative flex-1">
        {flow === "intro" && (
          <div className="pointer-events-auto absolute inset-0 flex items-center justify-center bg-base/70 p-4">
            <Card className="max-w-md p-6 text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full border border-cyan/30 bg-cyan/10">
                <Car className="h-7 w-7 text-cyan" />
              </div>
              <h1 className="font-display text-xl font-bold text-text-primary">3D Field Inspection</h1>
              <p className="mt-2 text-sm leading-relaxed text-text-tertiary">
                Drive {segment.roadName} {segment.segmentLabel}, stop at a flagged defect, step out and inspect the
                pavement — explode the layer stack, inspect material condition, then trigger AI analysis for the
                predicted damage and repair recommendation.
              </p>
              <Button variant="primary" size="lg" className="mt-5 w-full" onClick={onEnterWorld}>
                Enter 3D World <ArrowRight className="h-4 w-4" />
              </Button>
              <p className="mt-3 text-[11px] text-text-tertiary">WASD / Arrow keys to drive &amp; walk · E to interact</p>
            </Card>
          </div>
        )}

        {(flow === "driving" || flow === "approaching") && (
          <div className="pointer-events-none absolute left-4 top-4 sm:left-6 sm:top-20">
            <div className="glass-panel rounded-lg border border-hairline px-3 py-2 text-[11px] text-text-tertiary">
              <span className="font-mono-tech text-text-secondary">W/S</span> drive ·{" "}
              <span className="font-mono-tech text-text-secondary">A/D</span> steer
            </div>
          </div>
        )}

        {flow === "onfoot" && (
          <div className="pointer-events-none absolute left-4 top-4 sm:left-6 sm:top-20">
            <div className="glass-panel rounded-lg border border-hairline px-3 py-2 text-[11px] text-text-tertiary">
              <span className="font-mono-tech text-text-secondary">WASD</span> walk around the site
            </div>
          </div>
        )}

        {flow === "approaching" && (
          <CenterPrompt>
            <TriangleAlert className="h-5 w-5 text-critical" />
            <div>
              <div className="text-sm font-semibold text-text-primary">Defect flagged ahead</div>
              <div className="text-xs text-text-tertiary">
                Predicted failure probability {segment.probabilityOfFailurePct}%. Stop and inspect the flagged section.
              </div>
            </div>
            <Button variant="danger" onClick={onStopAndInspect}>
              Stop &amp; Inspect <span className="font-mono-tech text-[10px] opacity-70">[E]</span>
            </Button>
          </CenterPrompt>
        )}

        {flow === "parked" && (
          <CenterPrompt>
            <Car className="h-5 w-5 text-cyan" />
            <div>
              <div className="text-sm font-semibold text-text-primary">Vehicle parked</div>
              <div className="text-xs text-text-tertiary">Step out to inspect the road on foot.</div>
            </div>
            <Button variant="primary" onClick={onGetOut}>
              Get Out <span className="font-mono-tech text-[10px] opacity-70">[E]</span>
            </Button>
          </CenterPrompt>
        )}

        {flow === "onfoot" && (
          <CenterPrompt>
            <Footprints className="h-5 w-5 text-cyan" />
            <div>
              <div className="text-sm font-semibold text-text-primary">Walk to the marked patch</div>
              <div className="text-xs text-text-tertiary">Approach the flagged defect and begin inspection.</div>
            </div>
            <Button variant="primary" onClick={onInspectRoad}>
              Inspect Road <span className="font-mono-tech text-[10px] opacity-70">[E]</span>
            </Button>
          </CenterPrompt>
        )}

        {flow === "exploded" && (
          <CenterPrompt>
            <Sparkles className="h-5 w-5 text-cyan" />
            <div>
              <div className="text-sm font-semibold text-text-primary">Layers exploded</div>
              <div className="text-xs text-text-tertiary">Click a layer to inspect its material, then run AI analysis.</div>
            </div>
            <Button variant="primary" onClick={onTriggerAI}>
              Trigger AI Analysis <span className="font-mono-tech text-[10px] opacity-70">[E]</span>
            </Button>
          </CenterPrompt>
        )}

        {flow === "analyzing" && (
          <div className="pointer-events-none absolute inset-x-0 top-1/2 flex -translate-y-1/2 justify-center">
            <div className="glass-panel flex items-center gap-3 rounded-xl border border-cyan/30 px-5 py-3.5">
              <Loader2 className="h-5 w-5 animate-spin text-cyan" />
              <div>
                <div className="text-sm font-semibold text-text-primary">Running AI analysis…</div>
                <div className="text-xs text-text-tertiary">Scoring distress, structural readings &amp; deterioration forecast</div>
              </div>
            </div>
          </div>
        )}

        {showSidePanel && (
          <div className="pointer-events-auto absolute bottom-4 right-4 top-20 w-[min(92vw,360px)] space-y-3 overflow-y-auto no-scrollbar sm:bottom-6 sm:right-6 sm:top-24">
            {flow !== "results" && (
              <Card className="glass-panel p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="font-display text-sm font-bold text-text-primary">Distress Readout</h2>
                  <Gauge className="h-4 w-4 text-cyan" />
                </div>
                <div className="space-y-2.5">
                  {DISTRESS_LABELS.map(({ key, label }) => (
                    <div key={key}>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="text-text-secondary">{label}</span>
                        <span className="font-mono-tech font-semibold text-text-primary">{segment.distress[key]}</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                        <div
                          className="h-full rounded-full bg-cyan/80 transition-[width] duration-500"
                          style={{ width: `${segment.distress[key]}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                {flow === "inspecting" && (
                  <Button variant="primary" className="mt-4 w-full" onClick={onExplodeLayers}>
                    <Layers3 className="h-4 w-4" /> Explode Pavement Layers
                  </Button>
                )}
                {(flow === "exploded" || flow === "analyzing") && (
                  <p className="mt-3 text-[11px] text-text-tertiary">Click any exploded layer in the scene to inspect its material.</p>
                )}
              </Card>
            )}

            {flow === "results" && (
              <>
                <Card className="glass-panel p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green" />
                    <h2 className="font-display text-sm font-bold text-text-primary">AI Analysis Complete</h2>
                  </div>
                  <p className="text-xs leading-relaxed text-text-tertiary">{segment.aiExplanation}</p>
                </Card>

                <Card className="p-0">
                  <CardHeader>
                    <CardTitle>Predicted Deterioration</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <PredictionChart
                      height={160}
                      data={segment.predictedDeterioration.map((d) => ({ label: d.label, health: d.health }))}
                      series={[{ key: "health", label: "Predicted Health", color: "var(--accent-cyan)" }]}
                    />
                  </CardContent>
                </Card>

                <FeatureImportance
                  contributions={segment.featureContributions}
                  explanation={segment.aiExplanation}
                  confidencePct={segment.predictionConfidencePct}
                  lastUpdatedIso={segment.lastInspectionIso}
                />

                <div className="space-y-2.5">
                  <h2 className="px-1 font-display text-sm font-bold text-text-primary">Recommended Repairs</h2>
                  {topRepairs.map((opt, i) => (
                    <RepairOptionCard
                      key={opt.id}
                      option={opt}
                      letter={String.fromCharCode(65 + i)}
                      recommended={opt.id === segment.recommendedRepairId}
                      selected={selectedRepairId === opt.id}
                      onSelect={() => setSelectedRepairId(opt.id)}
                    />
                  ))}
                </div>

                <div className="flex gap-2 pb-2">
                  <Button variant="secondary" className="flex-1" onClick={onRestart}>
                    Restart
                  </Button>
                  <Button variant="primary" className="flex-1" onClick={() => router.push("/condition-monitoring")}>
                    Sync to Dashboard
                  </Button>
                </div>
              </>
            )}
          </div>
        )}

        {selectedLayer !== null && (flow === "exploded" || flow === "results") && (
          <MaterialInspector
            index={selectedLayer}
            segment={segment}
            onClose={() => onSelectLayer(null)}
          />
        )}
      </div>
    </div>
  );
}

function CenterPrompt({ children }: { children: React.ReactNode }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-8 flex justify-center px-4 sm:bottom-10">
      <div className="glass-panel pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-xl border border-hairline-strong p-3.5">
        {children}
      </div>
    </div>
  );
}

function MaterialInspector({
  index,
  segment,
  onClose,
}: {
  index: number;
  segment: RoadSegment;
  onClose: () => void;
}) {
  const inspection = layerInspectionFor(index, segment);
  return (
    <div className="pointer-events-auto absolute inset-x-4 bottom-4 sm:inset-x-auto sm:bottom-6 sm:left-6 sm:w-[380px]">
      <Card className="glass-panel border-cyan/30 p-4">
        <div className="mb-2 flex items-start justify-between gap-2">
          <div>
            <div className="font-mono-tech text-[10px] uppercase tracking-wide text-cyan">Material Inspector</div>
            <div className="font-display text-base font-bold text-text-primary">{inspection.label}</div>
          </div>
          <button onClick={onClose} className="text-text-tertiary hover:text-text-primary">
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="text-xs text-text-tertiary">{inspection.composition}</p>
        <div className="mt-3">
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="text-text-secondary">Structural Integrity</span>
            <span className="font-mono-tech font-semibold text-text-primary">{inspection.integrityPct}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className="h-full rounded-full transition-[width] duration-500"
              style={{
                width: `${inspection.integrityPct}%`,
                backgroundColor: inspection.integrityPct >= 65 ? "var(--state-healthy)" : inspection.integrityPct >= 40 ? "var(--state-moderate)" : "var(--state-critical)",
              }}
            />
          </div>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-text-secondary">{inspection.note}</p>
      </Card>
    </div>
  );
}

function riskTone(level: RoadSegment["riskLevel"]): "cyan" | "green" | "amber" | "red" {
  if (level === "healthy" || level === "good") return "green";
  if (level === "moderate") return "amber";
  if (level === "high-risk" || level === "critical") return "red";
  return "cyan";
}
