"use client";

import type { PavementLayer } from "@/lib/road-sense/types";
import { cn } from "@/lib/utils";

const CONDITION_TONE: Record<PavementLayer["condition"], string> = {
  Good: "text-healthy",
  Moderate: "text-moderate",
  Poor: "text-high-risk",
  Critical: "text-critical",
};

const CONDITION_BAR: Record<PavementLayer["condition"], string> = {
  Good: "bg-healthy",
  Moderate: "bg-moderate",
  Poor: "bg-high-risk",
  Critical: "bg-critical",
};

export function ExplodedRoadPanel({ layers }: { layers: PavementLayer[] }) {
  return (
    <div className="space-y-2">
      <div className="font-mono-tech text-[10px] uppercase tracking-[0.15em] text-text-tertiary">
        Pavement Cross-Section · Layers Separated
      </div>
      <div className="space-y-1.5">
        {layers.map((layer, i) => (
          <div
            key={layer.name}
            className="animate-count-in rounded-lg border border-hairline bg-white/[0.02] p-2.5"
            style={{ animationDelay: `${i * 70}ms` }}
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-text-primary">{layer.name}</span>
              <span className={cn("font-mono-tech font-bold", CONDITION_TONE[layer.condition])}>{layer.condition}</span>
            </div>
            <div className="mt-0.5 flex items-center justify-between text-[10px] text-text-tertiary">
              <span>{layer.material}</span>
              {layer.thicknessMm > 0 && <span>{layer.thicknessMm} mm</span>}
            </div>
            <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className={cn("h-full rounded-full transition-[width] duration-700", CONDITION_BAR[layer.condition])}
                style={{ width: `${layer.contributionPct * 2.6}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
