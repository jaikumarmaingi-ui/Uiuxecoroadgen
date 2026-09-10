"use client";

import { Plane, ScanEye, FlaskConical } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TerrainConfig } from "@/lib/road-sense/types";

export function Toolbar({
  config,
  aiOverlay,
  setAiOverlay,
  droneActive,
  setDroneActive,
}: {
  config: TerrainConfig;
  aiOverlay: boolean;
  setAiOverlay: (v: boolean) => void;
  droneActive: boolean;
  setDroneActive: (v: boolean) => void;
}) {
  return (
    <div className="pointer-events-auto flex flex-wrap items-center gap-2.5">
      <div className="glass-panel flex items-center gap-1 rounded-xl border border-white/10 p-1">
        <button
          onClick={() => setAiOverlay(false)}
          className={cn(
            "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide transition-colors",
            !aiOverlay ? "bg-white/10 text-text-primary" : "text-text-tertiary hover:text-text-secondary",
          )}
        >
          Real World
        </button>
        <button
          onClick={() => setAiOverlay(true)}
          className={cn(
            "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide transition-colors",
            aiOverlay ? "bg-cyan/20 text-cyan" : "text-text-tertiary hover:text-text-secondary",
          )}
        >
          <ScanEye className="h-3 w-3" /> AI Analysis
        </button>
      </div>

      <button
        onClick={() => setDroneActive(!droneActive)}
        className={cn(
          "glass-panel flex items-center gap-2 rounded-xl border px-3.5 py-2 text-[10px] font-bold uppercase tracking-wide transition-colors",
          droneActive ? "border-cyan/50 bg-cyan/15 text-cyan" : "border-white/10 text-text-secondary hover:border-white/20",
        )}
      >
        <Plane className="h-3.5 w-3.5" />
        {droneActive ? "Drone Mission Active" : "Start Drone Mission"}
      </button>

      <div className="glass-panel hidden items-center gap-3 rounded-xl border border-amber-400/20 bg-amber-400/[0.06] px-3.5 py-2 text-[10px] font-semibold text-moderate md:flex">
        <FlaskConical className="h-3 w-3" />
        DEMO DATA · NH-44 / Sector 128 · {config.surveyAreaKm2} km² surveyed
      </div>
    </div>
  );
}
