"use client";

import { X, Layers3, ScanEye, TrendingUp, Wrench } from "lucide-react";
import { ExplodedRoadPanel } from "./exploded-road-panel";
import { PredictPanel } from "./predict-panel";
import { RepairPanel } from "./repair-panel";
import { cn } from "@/lib/utils";
import type { InspectionMode, TerrainConfig } from "@/lib/road-sense/types";

const ACTIONS: { mode: InspectionMode; label: string; icon: typeof Layers3 }[] = [
  { mode: "explode", label: "Explode Road", icon: Layers3 },
  { mode: "xray", label: "X-Ray", icon: ScanEye },
  { mode: "predict", label: "Predict +12M", icon: TrendingUp },
  { mode: "repair", label: "Repair", icon: Wrench },
];

export function InspectionPanel({
  config,
  mode,
  onModeChange,
  onClose,
  reducedMotion,
}: {
  config: TerrainConfig;
  mode: InspectionMode;
  onModeChange: (m: InspectionMode) => void;
  onClose: () => void;
  reducedMotion: boolean;
}) {
  return (
    <div className="glass-panel pointer-events-auto absolute bottom-24 left-1/2 z-40 max-h-[70vh] w-[380px] max-w-[calc(100vw-2rem)] -translate-x-1/2 overflow-y-auto rounded-xl border border-hairline-strong shadow-2xl">
      <div className="flex items-center justify-between border-b border-hairline px-4 py-3">
        <div>
          <div className="font-mono-tech text-[10px] font-bold uppercase tracking-[0.15em] text-cyan">Structural Scan</div>
          <div className="font-display text-sm font-bold text-text-primary">{config.segment.id} · {config.label}</div>
        </div>
        <button onClick={onClose} className="text-text-tertiary hover:text-text-primary" aria-label="Close inspection">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-3.5 p-4">
        {mode === "scan" && (
          <>
            <div className="grid grid-cols-2 gap-2">
              <Metric label="Surface Condition" value={`${config.health}/100`} />
              <Metric label="Crack Density" value={`${config.crackDensityPct}%`} />
              <Metric label="Rutting" value={`${config.ruttingMm} mm`} />
              <Metric label="Moisture" value={`${config.moisturePct}%`} tone={config.moisturePct >= 65 ? "text-critical" : config.moisturePct >= 40 ? "text-moderate" : "text-healthy"} />
            </div>
            <div className="rounded-lg border border-critical/25 bg-critical/[0.06] p-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-secondary">Failure Probability</span>
                <span className="font-mono-tech font-black text-critical">{config.failureProbabilityPct}%</span>
              </div>
              <div className="mt-1 flex items-center justify-between text-[10px] text-text-tertiary">
                <span>Predicted in {config.predictedFailureDays} days</span>
                <span>{config.predictionConfidencePct}% confidence</span>
              </div>
            </div>

            <div>
              <div className="mb-1.5 font-mono-tech text-[10px] uppercase tracking-[0.12em] text-text-tertiary">
                Why is this road deteriorating?
              </div>
              <div className="space-y-1.5">
                {config.explainableFactors.map((f, i) => (
                  <div key={f.factor}>
                    <div className="mb-0.5 flex items-center justify-between text-[11px]">
                      <span className="text-text-secondary">
                        {String(i + 1).padStart(2, "0")} · {f.factor}
                      </span>
                      <span className="font-mono-tech font-semibold text-text-primary">{f.contributionPct}%</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                      <div
                        className="h-full rounded-full bg-cyan transition-[width] duration-700"
                        style={{ width: `${f.contributionPct * 2.6}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {mode === "explode" && <ExplodedRoadPanel layers={config.pavementLayers} />}

        {mode === "xray" && (
          <div className="rounded-lg border border-cyan/25 bg-cyan/[0.06] p-3 text-xs text-text-secondary">
            X-ray active — the road surface is now translucent in the 3D view, revealing subsurface moisture and the weakened base layer beneath it.
          </div>
        )}

        {mode === "predict" && <PredictPanel config={config} reducedMotion={reducedMotion} />}
        {mode === "repair" && <RepairPanel config={config} reducedMotion={reducedMotion} />}

        <div className="grid grid-cols-2 gap-1.5 border-t border-hairline pt-3">
          {ACTIONS.map((a) => (
            <button
              key={a.mode}
              onClick={() => onModeChange(a.mode)}
              className={cn(
                "flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-[10px] font-bold uppercase tracking-wide transition-colors",
                mode === a.mode ? "bg-cyan/15 text-cyan" : "border border-hairline text-text-secondary hover:border-hairline-strong",
              )}
            >
              <a.icon className="h-3 w-3" />
              {a.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-lg border border-hairline bg-white/[0.02] px-2.5 py-2">
      <div className="text-[9px] uppercase tracking-wide text-text-tertiary">{label}</div>
      <div className={cn("font-mono-tech text-sm font-bold", tone ?? "text-text-primary")}>{value}</div>
    </div>
  );
}
