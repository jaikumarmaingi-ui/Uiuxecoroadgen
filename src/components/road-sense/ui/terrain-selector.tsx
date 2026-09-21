"use client";

import { Mountain, Trees, Triangle, Sun, Building2, Waves } from "lucide-react";
import { TERRAIN_CONFIGS, TERRAIN_ORDER } from "@/lib/road-sense/terrain-config";
import type { TerrainType } from "@/lib/road-sense/types";
import { cn } from "@/lib/utils";

const ICONS: Record<TerrainType, typeof Mountain> = {
  plains: Waves,
  hilly: Triangle,
  mountain: Mountain,
  desert: Sun,
  forest: Trees,
  urban: Building2,
};

export function TerrainSelector({
  active,
  onSelect,
  className,
}: {
  active: TerrainType;
  onSelect: (t: TerrainType) => void;
  className?: string;
}) {
  return (
    <div className={cn("pointer-events-auto flex gap-2 lg:flex-col lg:gap-1.5", className)}>
      {TERRAIN_ORDER.map((id) => {
        const config = TERRAIN_CONFIGS[id];
        const Icon = ICONS[id];
        const isActive = active === id;
        return (
          <button
            key={id}
            onClick={() => onSelect(id)}
            className={cn(
              "glass-panel group flex shrink-0 items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-all lg:w-40",
              isActive ? "border-cyan/50 bg-cyan/[0.08]" : "border-white/10 hover:border-white/20",
            )}
          >
            <span
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-[10px] font-bold",
                isActive ? "border-cyan/40 bg-cyan/15 text-cyan" : "border-white/10 text-text-tertiary",
              )}
            >
              <Icon className="h-4 w-4" strokeWidth={1.8} />
            </span>
            <span className="min-w-0">
              <span className="block font-mono-tech text-[9px] text-text-tertiary">{config.code}</span>
              <span className={cn("block truncate text-xs font-bold uppercase tracking-wide", isActive ? "text-cyan" : "text-text-secondary")}>
                {config.label}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
