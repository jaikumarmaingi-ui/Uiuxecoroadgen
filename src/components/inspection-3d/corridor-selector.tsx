"use client";

import { Mountain, Waves, Trees, Sun, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { CORRIDOR_REGIMES, CORRIDOR_TERRAIN_ORDER, type CorridorTerrain } from "@/lib/inspection-3d/regimes";

const ICONS: Record<CorridorTerrain, typeof Mountain> = {
  mountain: Mountain,
  hilly: Waves,
  plains: Layers,
  desert: Sun,
  forest: Trees,
};

/**
 * Corridor picker.
 *
 * Disabled once the inspector is out of the vehicle: swapping the landscape
 * under someone standing in an open trial pit is not a state worth supporting,
 * and the alternative — silently discarding their inspection — is worse.
 */
export function CorridorSelector({
  active,
  onSelect,
  disabled,
}: {
  active: CorridorTerrain;
  onSelect: (t: CorridorTerrain) => void;
  disabled?: boolean;
}) {
  return (
    <div className="pointer-events-none absolute left-4 top-20 z-30 flex flex-col gap-1.5">
      <div className="px-1 font-mono-tech text-[9px] font-bold uppercase tracking-[0.18em] text-text-tertiary">
        Corridor
      </div>
      {CORRIDOR_TERRAIN_ORDER.map((id) => {
        const regime = CORRIDOR_REGIMES[id];
        const Icon = ICONS[id];
        const isActive = id === active;
        return (
          <button
            key={id}
            onClick={() => onSelect(id)}
            disabled={disabled && !isActive}
            title={disabled && !isActive ? "Finish or leave this inspection first" : regime.blurb}
            className={cn(
              "pointer-events-auto flex w-44 items-center gap-2.5 rounded-lg border px-2.5 py-2 text-left transition-colors",
              "glass-panel backdrop-blur",
              isActive
                ? "border-cyan/50 bg-cyan/10"
                : "border-white/10 hover:border-white/25 disabled:cursor-not-allowed disabled:opacity-35",
            )}
          >
            <Icon className={cn("h-3.5 w-3.5 shrink-0", isActive ? "text-cyan" : "text-text-tertiary")} />
            <div className="min-w-0">
              <div
                className={cn(
                  "text-[11px] font-bold uppercase tracking-wide",
                  isActive ? "text-cyan" : "text-text-secondary",
                )}
              >
                {regime.label}
              </div>
              <div className="truncate text-[9px] text-text-tertiary">{regime.routeLabel}</div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
