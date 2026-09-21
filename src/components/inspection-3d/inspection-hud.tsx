"use client";

import { useEffect, useMemo, useState } from "react";
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
import { TreatmentCard } from "./treatment-card";
import type { RoadSegment } from "@/lib/types";
import { layerInspectionFor } from "./pavement-layers";
import { FAILURE_META, type CorridorRegime } from "@/lib/inspection-3d/regimes";
import {
  SEVERITY_HEX,
  SEVERITY_LABEL,
  type CorridorDefect,
} from "@/lib/inspection-3d/corridor-defects";
import { ROAD_LENGTH_M, ROAD_START_Z } from "@/lib/inspection-3d/terrain";
import { diagnoseDefect, LAYER_LABEL } from "@/lib/inspection-3d/diagnosis";
import { matchTreatments, type TreatmentQuote } from "@/lib/inspection-3d/treatments";
import type { FlowState, WorldRefState } from "./types";

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
  regime,
  defects,
  activeDefect,
  defectIndex,
  remaining,
  isLast,
  world,
  selectedLayer,
  onSelectLayer,
  onEnterWorld,
  onStopAndInspect,
  onGetOut,
  onInspectRoad,
  onExplodeLayers,
  onTriggerAI,
  onContinue,
  onRestart,
  onChooseTreatment,
}: {
  flow: FlowState;
  segment: RoadSegment;
  regime: CorridorRegime;
  defects: CorridorDefect[];
  activeDefect: CorridorDefect | null;
  defectIndex: number;
  remaining: number;
  isLast: boolean;
  world: React.RefObject<WorldRefState>;
  selectedLayer: number | null;
  onSelectLayer: (index: number | null) => void;
  onEnterWorld: () => void;
  onStopAndInspect: () => void;
  onGetOut: () => void;
  onInspectRoad: () => void;
  onExplodeLayers: () => void;
  onTriggerAI: () => void;
  onContinue: () => void;
  onRestart: () => void;
  onChooseTreatment: (quote: TreatmentQuote) => void;
}) {
  const router = useRouter();
  // The badge describes the corridor in front of you, not the fixed demo
  // segment: a desert corridor whose worst failure is moderate ravelling
  // should not be labelled CRITICAL because the mock record says so.
  const worst = useMemo(() => {
    if (defects.some((d) => d.severity === "critical")) return "critical" as const;
    if (defects.some((d) => d.severity === "high")) return "high" as const;
    return "moderate" as const;
  }, [defects]);
  const corridorRisk = worst === "critical" ? "Critical" : worst === "high" ? "High Risk" : "Moderate";
  const corridorTone = worst === "critical" ? ("red" as const) : worst === "high" ? ("amber" as const) : ("cyan" as const);
  /**
   * The treatment the inspector picked, scoped to the defect they picked it
   * for. Treatment ids repeat across failures, so an unscoped id would carry
   * a previous failure's selection onto the next one and highlight a card
   * nobody chose here.
   */
  const [picked, setPicked] = useState<{ defectId: string; treatmentId: string } | null>(null);

  /**
   * The findings for the failure actually under inspection.
   *
   * Previously everything below came from a fixed demo segment, so a desert
   * bleeding failure and a Himalayan frost heave produced the same
   * explanation, the same curve and the same recommended repair — which
   * contradicted the mechanism printed beside them.
   */
  const diagnosis = useMemo(
    () => (activeDefect ? diagnoseDefect(activeDefect, regime) : null),
    [activeDefect, regime],
  );
  const match = useMemo(
    () => (activeDefect && diagnosis ? matchTreatments(activeDefect, diagnosis, regime) : null),
    [activeDefect, diagnosis, regime],
  );
  const treatments = match?.options ?? [];

  const showSidePanel = flow === "inspecting" || flow === "exploded" || flow === "analyzing" || flow === "results";

  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col">
      {flow !== "intro" && (
        <div className="pointer-events-auto flex items-center justify-between gap-3 p-3 sm:p-4">
          <div className="glass-panel flex items-center gap-2.5 rounded-xl border border-hairline px-3 py-2">
            <ShieldCheck className="h-4 w-4 text-cyan" />
            <div>
              <div className="font-display text-xs font-bold text-text-primary sm:text-sm">
                {regime.routeLabel} · {regime.chainageLabel}
              </div>
              <div className="font-mono-tech text-[9px] text-text-tertiary sm:text-[10px]">3D FIELD INSPECTION — DEMO DATA</div>
            </div>
            <Badge tone={corridorTone} className="ml-1">
              {corridorRisk}
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
                Drive {(ROAD_LENGTH_M / 1000).toFixed(1)} km of {regime.label.toLowerCase()} corridor with{" "}
                {defects.length} flagged failures on it. Stop at each one, step out and inspect the pavement — explode
                the layer stack, inspect material condition, then run AI analysis for the predicted damage and repair.
              </p>
              <p className="mt-2 text-xs text-text-tertiary">{regime.blurb}</p>
              <Button variant="primary" size="lg" className="mt-5 w-full" onClick={onEnterWorld}>
                Enter 3D World <ArrowRight className="h-4 w-4" />
              </Button>
              <p className="mt-3 text-[11px] text-text-tertiary">WASD / Arrow keys to drive &amp; walk · E to interact</p>
            </Card>
          </div>
        )}

        {(flow === "driving" || flow === "approaching") && (
          <>
            <div className="pointer-events-none absolute right-4 top-20 sm:right-6 sm:top-24">
              <div className="glass-panel rounded-lg border border-hairline px-3 py-2 text-[11px] text-text-tertiary">
                <span className="font-mono-tech text-text-secondary">W/S</span> drive ·{" "}
                <span className="font-mono-tech text-text-secondary">A/D</span> steer
              </div>
            </div>
            <CorridorProgress
              world={world}
              defects={defects}
              activeDefect={activeDefect}
              defectIndex={defectIndex}
              remaining={remaining}
            />
          </>
        )}

        {flow === "onfoot" && (
          <div className="pointer-events-none absolute left-4 top-4 sm:left-6 sm:top-20">
            <div className="glass-panel rounded-lg border border-hairline px-3 py-2 text-[11px] text-text-tertiary">
              <span className="font-mono-tech text-text-secondary">WASD</span> walk around the site
            </div>
          </div>
        )}

        {flow === "approaching" && activeDefect && (
          <CenterPrompt>
            <TriangleAlert className="h-5 w-5" style={{ color: SEVERITY_HEX[activeDefect.severity] }} />
            <div>
              <div className="text-sm font-semibold text-text-primary">
                {FAILURE_META[activeDefect.kind].label} ahead · {SEVERITY_LABEL[activeDefect.severity]}
              </div>
              <div className="text-xs text-text-tertiary">
                {FAILURE_META[activeDefect.kind].summary} Flagged at KM{" "}
                {(activeDefect.chainageM / 1000).toFixed(2)}, {activeDefect.confidencePct}% confidence.
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

            {flow === "results" && diagnosis && match && activeDefect && (
              <>
                <Card className="glass-panel p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green" />
                    <h2 className="font-display text-sm font-bold text-text-primary">AI Analysis Complete</h2>
                  </div>
                  <p className="font-display text-sm font-semibold leading-snug text-text-primary">
                    {diagnosis.headline}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-text-tertiary">{diagnosis.explanation}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <Badge tone={diagnosis.structural ? "red" : "amber"}>
                      {diagnosis.structural ? "Structural failure" : "Surface-bound failure"}
                    </Badge>
                    <Badge tone="neutral">Origin: {LAYER_LABEL[diagnosis.originLayer]}</Badge>
                    <Badge tone={diagnosis.timeToInterventionDays <= 30 ? "red" : "cyan"}>
                      Intervene within {diagnosis.timeToInterventionDays} d
                    </Badge>
                  </div>
                </Card>

                <Card className="p-0">
                  <CardHeader>
                    <CardTitle>Deterioration If Untreated</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <PredictionChart
                      height={160}
                      data={diagnosis.forecast.map((d) => ({ label: d.label, health: d.health }))}
                      series={[{ key: "health", label: "Predicted Health", color: "var(--accent-cyan)" }]}
                    />
                  </CardContent>
                </Card>

                <FeatureImportance
                  contributions={diagnosis.contributions}
                  explanation={diagnosis.explanation}
                  confidencePct={diagnosis.confidencePct}
                  // No freshness line: this finding came from a core cut
                  // moments ago, and the demo segment's inspection date would
                  // date it to whenever that record says, which is not when
                  // this analysis ran.
                />

                <div className="space-y-2.5">
                  <div className="px-1">
                    <h2 className="font-display text-sm font-bold text-text-primary">Matched Treatments</h2>
                    <p className="mt-0.5 text-[11px] text-text-tertiary">
                      Priced against the {diagnosis.areaM2} m² this failure actually covers, not a per-kilometre
                      rate.
                    </p>
                  </div>
                  {treatments.map((q, i) => (
                    <TreatmentCard
                      key={q.def.id}
                      quote={q}
                      letter={String.fromCharCode(65 + i)}
                      selected={
                        (picked?.defectId === activeDefect.id
                          ? picked.treatmentId
                          : match.recommended.def.id) === q.def.id
                      }
                      onSelect={() => {
                        setPicked({ defectId: activeDefect.id, treatmentId: q.def.id });
                        onChooseTreatment(q);
                      }}
                    />
                  ))}
                </div>

                <div className="space-y-2 pb-2">
                  {!isLast ? (
                    <Button variant="primary" className="w-full" onClick={onContinue}>
                      Continue to next failure <span className="font-mono-tech text-[10px] opacity-70">[E]</span>
                    </Button>
                  ) : (
                    <div className="rounded-lg border border-green/30 bg-green/[0.06] px-3 py-2.5 text-xs text-text-secondary">
                      Last flagged failure on this corridor. Switch corridor or restart to survey another.
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button variant="secondary" className="flex-1" onClick={onRestart}>
                      Restart
                    </Button>
                    <Button
                      variant="primary"
                      className="flex-1"
                      onClick={() => router.push("/survey-report")}
                    >
                      Survey report
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {selectedLayer !== null && (flow === "exploded" || flow === "results") && (
          <MaterialInspector
            index={selectedLayer}
            segment={segment}
            defect={activeDefect}
            onClose={() => onSelectLayer(null)}
          />
        )}
      </div>
    </div>
  );
}

/**
 * Chainage strip along the bottom of the drive.
 *
 * A 1.5 km corridor with eight failures on it needs a sense of place: where
 * you are, how far the next one is, and how much of the survey is left. Polled
 * from the world ref on an interval rather than driven from the render loop —
 * the numbers only need to be current, not per-frame exact, and re-rendering
 * the HUD at 60fps to move a progress bar would be wasteful.
 */
function CorridorProgress({
  world,
  defects,
  activeDefect,
  defectIndex,
  remaining,
}: {
  world: React.RefObject<WorldRefState>;
  defects: CorridorDefect[];
  activeDefect: CorridorDefect | null;
  defectIndex: number;
  remaining: number;
}) {
  const [z, setZ] = useState(ROAD_START_Z);

  useEffect(() => {
    const id = setInterval(() => setZ(world.current.vehicle.z), 180);
    return () => clearInterval(id);
  }, [world]);

  const travelled = Math.max(0, ROAD_START_Z - z);
  const pct = Math.min(100, (travelled / ROAD_LENGTH_M) * 100);
  const toNext = activeDefect ? Math.max(0, z - activeDefect.z) : 0;

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 px-4 pb-3 sm:px-6 sm:pb-4">
      <div className="glass-panel mx-auto max-w-3xl rounded-xl border border-hairline px-4 py-3">
        <div className="mb-2 flex items-end justify-between gap-3">
          <div>
            <div className="font-mono-tech text-[9px] uppercase tracking-[0.15em] text-text-tertiary">Chainage</div>
            <div className="font-mono-tech text-sm font-bold text-text-primary">
              KM {(travelled / 1000).toFixed(2)}
              <span className="ml-1 text-[10px] font-normal text-text-tertiary">
                / {(ROAD_LENGTH_M / 1000).toFixed(1)}
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="font-mono-tech text-[9px] uppercase tracking-[0.15em] text-text-tertiary">
              Failure {Math.min(defectIndex + 1, defects.length)} of {defects.length} · {remaining} left
            </div>
            <div className="font-mono-tech text-sm font-bold text-cyan">
              {activeDefect ? (toNext > 0 ? `${Math.round(toNext)} m ahead` : "At the site") : "—"}
            </div>
          </div>
        </div>

        <div className="relative h-1.5 w-full rounded-full bg-white/[0.07]">
          <div className="h-full rounded-full bg-cyan/70" style={{ width: `${pct}%` }} />
          {defects.map((d) => {
            const at = Math.min(100, Math.max(0, ((ROAD_START_Z - d.z) / ROAD_LENGTH_M) * 100));
            return (
              <span
                key={d.id}
                title={FAILURE_META[d.kind].label}
                className="absolute top-1/2 h-2.5 w-[3px] -translate-y-1/2 rounded-sm"
                style={{ left: `${at}%`, backgroundColor: SEVERITY_HEX[d.severity] }}
              />
            );
          })}
        </div>
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
  defect,
  onClose,
}: {
  index: number;
  segment: RoadSegment;
  defect: CorridorDefect | null;
  onClose: () => void;
}) {
  const inspection = layerInspectionFor(index, segment, defect);
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

