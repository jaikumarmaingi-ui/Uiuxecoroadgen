"use client";

import Link from "next/link";
import { X, ArrowRight } from "lucide-react";
import { HealthScore } from "@/components/shared/health-score";
import { RiskBadge } from "@/components/shared/risk-badge";
import { DataConfidenceBadge } from "@/components/shared/data-confidence-badge";
import { Button } from "@/components/ui/button";
import type { RoadSegment } from "@/lib/types";
import { getSegment, repairOptionsFor } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export function RoadSegmentDrawer({ segment, onClose }: { segment: RoadSegment | null; onClose: () => void }) {
  const repair = segment ? repairOptionsFor(segment.id).find((r) => r.id === segment.recommendedRepairId) : undefined;

  return (
    <div className={cn("fixed inset-0 z-40", !segment && "pointer-events-none")}>
      <div
        className={cn("absolute inset-0 bg-black/60 transition-opacity", segment ? "opacity-100" : "opacity-0")}
        onClick={onClose}
      />
      <div
        className={cn(
          "glass-panel absolute right-0 top-0 h-full w-full max-w-sm overflow-y-auto border-l border-hairline-strong shadow-2xl transition-transform duration-250",
          segment ? "translate-x-0" : "translate-x-full",
        )}
      >
        {segment && (
          <div className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-mono-tech text-xs font-semibold text-cyan">{segment.routeNumber}</div>
                <h3 className="font-display text-lg font-bold text-text-primary">{segment.roadName}</h3>
                <div className="font-mono-tech text-sm text-text-secondary">{segment.segmentLabel}</div>
              </div>
              <button onClick={onClose} className="text-text-tertiary hover:text-text-primary">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 flex items-center gap-4 rounded-xl border border-hairline bg-white/[0.02] p-4">
              <HealthScore value={segment.healthScore} size="lg" />
              <div className="space-y-1.5">
                <RiskBadge level={segment.riskLevel} />
                <div className="text-xs text-text-tertiary">
                  Predicted deterioration
                  <div className="font-display text-base font-bold text-critical">{segment.probabilityOfFailurePct}% within 30 days</div>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <DataConfidenceBadge level={segment.dataConfidence} />
            </div>

            <div className="mt-5">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-text-tertiary">Primary Risk Factors</div>
              <div className="mt-2 space-y-1.5">
                {segment.featureContributions.slice(0, 4).map((f) => (
                  <div key={f.factor} className="flex items-center justify-between text-xs">
                    <span className="text-text-secondary">{f.factor}</span>
                    <span className="font-mono-tech font-semibold text-text-primary">{f.weight}%</span>
                  </div>
                ))}
              </div>
            </div>

            {repair && (
              <div className="mt-5 rounded-xl border border-cyan/25 bg-cyan/[0.05] p-4">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-cyan">Recommended Intervention</div>
                <div className="mt-1 font-display text-sm font-bold text-text-primary">{repair.method}</div>
                <div className="mt-1 text-xs text-text-tertiary">Suitability score {repair.suitabilityScore}/100</div>
              </div>
            )}

            <div className="mt-5 grid grid-cols-2 gap-2.5">
              <Link href={`/road-network/${segment.id}`}>
                <Button variant="primary" className="w-full">
                  Full Intelligence
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
              <Link href={`/repair-recommendations/${segment.id}`}>
                <Button variant="outline" className="w-full">
                  Repair Options
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function useSegmentLookup(id: string | null) {
  return id ? getSegment(id) ?? null : null;
}
