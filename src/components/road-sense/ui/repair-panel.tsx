"use client";

import { useState } from "react";
import { Leaf } from "lucide-react";
import { useCountUp } from "@/lib/road-sense/use-count-up";
import { calculateSustainabilityImpact } from "@/lib/road-sense/sustainability";
import { cn } from "@/lib/utils";
import type { RoadRepairOption, TerrainConfig } from "@/lib/road-sense/types";

const LETTER: Record<string, string> = { PATCH_REPAIR: "A", MILLING_OVERLAY: "B", SUSTAINABLE_REHABILITATION: "C" };

export function RepairPanel({ config, reducedMotion }: { config: TerrainConfig; reducedMotion: boolean }) {
  const [selectedId, setSelectedId] = useState<RoadRepairOption["id"]>(config.recommendedRepair);
  const [applied, setApplied] = useState(false);
  const selected = config.repairOptions.find((o) => o.id === selectedId) ?? config.repairOptions[0];
  const sustainability = calculateSustainabilityImpact(selected, config);

  const afterHealth = useCountUp(config.health, applied ? Math.min(96, config.health + (selected.expectedLifeYears >= 8 ? 50 : selected.expectedLifeYears >= 5 ? 34 : 18)) : config.health, reducedMotion, 1200);
  const afterRisk = useCountUp(config.failureProbabilityPct, applied ? Math.max(6, config.failureProbabilityPct - 60) : config.failureProbabilityPct, reducedMotion, 1200);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-2">
        {config.repairOptions.map((opt) => (
          <button
            key={opt.id}
            onClick={() => {
              setSelectedId(opt.id);
              setApplied(false);
            }}
            className={cn(
              "rounded-lg border p-2.5 text-left transition-colors",
              opt.id === selectedId ? "border-cyan/50 bg-cyan/[0.08]" : "border-hairline bg-white/[0.02] hover:border-hairline-strong",
            )}
          >
            <div className="flex items-center justify-between">
              <span className="font-mono-tech text-[10px] text-text-tertiary">{LETTER[opt.id]}</span>
              {opt.id === config.recommendedRepair && (
                <span className="font-mono-tech text-[9px] font-bold uppercase tracking-wide text-cyan">AI Recommended</span>
              )}
            </div>
            <div className="mt-0.5 text-xs font-bold text-text-primary">{opt.label}</div>
            <div className="mt-1.5 grid grid-cols-3 gap-1.5 text-[10px]">
              <Stat label="Cost" value={`₹${opt.costLakh} L`} />
              <Stat label="Life" value={`${opt.expectedLifeYears} yrs`} />
              <Stat label="CO2" value={opt.embodiedCo2} />
            </div>
          </button>
        ))}
      </div>

      {!applied ? (
        <button
          onClick={() => setApplied(true)}
          className="w-full rounded-lg bg-cyan py-2 text-xs font-bold uppercase tracking-wide text-text-inverse transition-opacity hover:opacity-90"
        >
          Apply {selected.label}
        </button>
      ) : (
        <div className="animate-count-in space-y-2.5">
          <div className="rounded-lg border border-healthy/25 bg-healthy/[0.06] p-3">
            <div className="mb-2 font-mono-tech text-[10px] font-bold uppercase tracking-wide text-healthy">Repair Complete</div>
            <div className="grid grid-cols-2 gap-2 text-center">
              <div>
                <div className="text-[9px] uppercase tracking-wide text-text-tertiary">Road Health</div>
                <div className="font-display text-lg font-black tabular-nums text-healthy">
                  {config.health} → {Math.round(afterHealth)}
                </div>
              </div>
              <div>
                <div className="text-[9px] uppercase tracking-wide text-text-tertiary">Failure Risk</div>
                <div className="font-display text-lg font-black tabular-nums text-healthy">
                  {config.failureProbabilityPct}% → {Math.round(afterRisk)}%
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-hairline bg-white/[0.02] p-3">
            <div className="mb-1.5 flex items-center gap-1.5 font-mono-tech text-[10px] font-bold uppercase tracking-wide text-green">
              <Leaf className="h-3 w-3" /> Sustainability Impact
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-[10px]">
              <Stat label="Material Saved" value={`${sustainability.materialSavedTons} t`} />
              <Stat label="CO2 Reduction" value={`-${sustainability.co2ReductionPct}%`} />
              <Stat label="Landfill Diverted" value={`${sustainability.landfillDiversionTons} t`} />
              <Stat label="Service Life" value={`+${sustainability.serviceLifeGainYears} yrs`} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-hairline bg-white/[0.02] px-1.5 py-1">
      <div className="text-text-tertiary">{label}</div>
      <div className="font-mono-tech font-bold text-text-primary">{value}</div>
    </div>
  );
}
