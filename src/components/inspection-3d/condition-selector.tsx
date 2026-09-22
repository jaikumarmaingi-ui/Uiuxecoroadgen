"use client";

import { Sun, CloudRain, Waves, Snowflake, Wind, Mountain, Activity, Ban } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  CONDITIONS,
  conditionsFor,
  type CorridorCondition,
} from "@/lib/inspection-3d/conditions";
import type { CorridorTerrain } from "@/lib/inspection-3d/regimes";

const ICONS: Record<CorridorCondition, typeof Sun> = {
  clear: Sun,
  rain: CloudRain,
  flood: Waves,
  snow: Snowflake,
  sandstorm: Wind,
  landslide: Mountain,
  quake: Activity,
};

/**
 * Survey conditions.
 *
 * Only the conditions plausible for the active corridor are offered — snow is
 * not a scenario in the Thar and a sandstorm is not one in Assam — so the list
 * changes with the corridor rather than greying out most of itself.
 *
 * Conditions that block the trial pit are marked here rather than only at the
 * point of failure, so the inspector knows before driving 1.5 km that this
 * scenario is a drive-past survey.
 */
export function ConditionSelector({
  terrain,
  active,
  onSelect,
  disabled,
}: {
  terrain: CorridorTerrain;
  active: CorridorCondition;
  onSelect: (c: CorridorCondition) => void;
  disabled?: boolean;
}) {
  const options = conditionsFor(terrain);

  return (
    <div className="pointer-events-none absolute right-4 top-20 z-30 flex flex-col gap-1.5">
      <div className="ml-auto w-fit rounded bg-[rgba(8,12,16,0.7)] px-1.5 py-0.5 font-mono-tech text-[9px] font-bold uppercase tracking-[0.18em] text-text-secondary">
        Conditions
      </div>
      {options.map((id) => {
        const spec = CONDITIONS[id];
        const Icon = ICONS[id];
        const isActive = id === active;
        return (
          <button
            key={id}
            onClick={() => onSelect(id)}
            disabled={disabled && !isActive}
            title={
              disabled && !isActive
                ? "Finish or leave this inspection first"
                : `${spec.blurb}${spec.inspectable ? "" : " — trial pit not possible"}`
            }
            className={cn(
              "pointer-events-auto flex w-44 items-center gap-2.5 rounded-lg border px-2.5 py-2 text-left transition-colors",
              "bg-[rgba(8,12,16,0.86)] backdrop-blur-sm",
              isActive
                ? "border-cyan/50 bg-cyan/10"
                : "border-white/10 hover:border-white/25 disabled:cursor-not-allowed disabled:opacity-35",
            )}
          >
            <Icon className={cn("h-3.5 w-3.5 shrink-0", isActive ? "text-cyan" : "text-text-tertiary")} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span
                  className={cn(
                    "text-[11px] font-bold uppercase tracking-wide",
                    isActive ? "text-cyan" : "text-text-secondary",
                  )}
                >
                  {spec.label}
                </span>
                {!spec.inspectable && (
                  <Ban className="h-2.5 w-2.5 shrink-0 text-critical" aria-label="Trial pit not possible" />
                )}
              </div>
              <div className="truncate text-[9px] text-text-tertiary">
                {spec.kind === "hazard" ? "Hazard event" : spec.blurb}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
