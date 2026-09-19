"use client";

import { useState } from "react";
import { useCountUp } from "@/lib/road-sense/use-count-up";
import { cn } from "@/lib/utils";
import type { TerrainConfig } from "@/lib/road-sense/types";

export function PredictPanel({ config, reducedMotion }: { config: TerrainConfig; reducedMotion: boolean }) {
  const [projected, setProjected] = useState(false);
  const health = useCountUp(config.health, projected ? config.healthProjected12mo : config.health, reducedMotion, 1000);
  const failureRisk = useCountUp(
    config.failureProbabilityPct,
    projected ? Math.min(97, config.failureProbabilityPct + 14) : config.failureProbabilityPct,
    reducedMotion,
    1000,
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1 rounded-lg border border-hairline bg-white/[0.02] p-1">
        <button
          onClick={() => setProjected(false)}
          className={cn(
            "flex-1 rounded-md py-1.5 text-[10px] font-bold uppercase tracking-wide transition-colors",
            !projected ? "bg-white/10 text-text-primary" : "text-text-tertiary hover:text-text-secondary",
          )}
        >
          Current
        </button>
        <button
          onClick={() => setProjected(true)}
          className={cn(
            "flex-1 rounded-md py-1.5 text-[10px] font-bold uppercase tracking-wide transition-colors",
            projected ? "bg-critical/20 text-critical" : "text-text-tertiary hover:text-text-secondary",
          )}
        >
          +12 Months
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <div className="rounded-lg border border-hairline bg-white/[0.02] p-3 text-center">
          <div className="text-[9px] uppercase tracking-wide text-text-tertiary">Projected Health</div>
          <div className={cn("mt-1 font-display text-2xl font-black tabular-nums", health >= 55 ? "text-healthy" : health >= 35 ? "text-moderate" : "text-critical")}>
            {Math.round(health)}
          </div>
        </div>
        <div className="rounded-lg border border-hairline bg-white/[0.02] p-3 text-center">
          <div className="text-[9px] uppercase tracking-wide text-text-tertiary">Failure Risk</div>
          <div className="mt-1 font-display text-2xl font-black tabular-nums text-critical">{Math.round(failureRisk)}%</div>
        </div>
      </div>

      {projected && (
        <div className="animate-count-in rounded-lg border border-critical/25 bg-critical/[0.06] p-3 text-xs">
          <div className="mb-1.5 font-bold uppercase tracking-wide text-critical">Without Intervention</div>
          <ul className="space-y-1 text-text-secondary">
            <li>• Increased cracking &amp; pothole expansion</li>
            <li>• Drainage deterioration</li>
            <li>• Higher repair cost at time of failure</li>
            <li>• Increased closure risk on this segment</li>
          </ul>
        </div>
      )}
    </div>
  );
}
