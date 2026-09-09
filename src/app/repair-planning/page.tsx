"use client";

import { useState } from "react";
import Link from "next/link";
import { KanbanSquare, ArrowRight } from "lucide-react";
import { RiskBadge } from "@/components/shared/risk-badge";
import { DemoBadge } from "@/components/shared/demo-badge";
import { ROAD_SEGMENTS, repairOptionsFor } from "@/lib/mock-data";
import type { RepairStage } from "@/lib/types";
import { cn } from "@/lib/utils";

const STAGES: RepairStage[] = [
  "Detected",
  "Assessment",
  "Recommended",
  "Approved",
  "Scheduled",
  "Under Repair",
  "Completed",
  "Monitoring",
];

const CONTRACTORS = ["BRO Project Vijayak", "BRO Project Beacon", "BRO Project Himank", "GREF Task Force 7", "BRO Project Deepak"];

function contractorFor(id: string) {
  let hash = 0;
  for (const c of id) hash = (hash * 31 + c.charCodeAt(0)) % CONTRACTORS.length;
  return CONTRACTORS[hash];
}

export default function RepairPlanningPage() {
  const [stageMap, setStageMap] = useState<Record<string, RepairStage>>(() =>
    Object.fromEntries(ROAD_SEGMENTS.map((s) => [s.id, s.repairStage])),
  );

  function advance(id: string) {
    setStageMap((prev) => {
      const current = prev[id];
      const idx = STAGES.indexOf(current);
      const next = STAGES[Math.min(STAGES.length - 1, idx + 1)];
      return { ...prev, [id]: next };
    });
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline px-4 py-3 md:px-6">
        <div>
          <div className="flex items-center gap-2.5">
            <KanbanSquare className="h-5 w-5 text-cyan" />
            <h1 className="font-display text-lg font-bold text-text-primary">Repair Planning</h1>
            <DemoBadge />
          </div>
          <p className="text-xs text-text-tertiary">Detected → Assessment → Recommended → Approved → Scheduled → Under Repair → Completed → Monitoring</p>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto p-4 md:p-6">
        <div className="flex h-full gap-4" style={{ minWidth: STAGES.length * 280 }}>
          {STAGES.map((stage) => {
            const items = ROAD_SEGMENTS.filter((s) => stageMap[s.id] === stage);
            return (
              <div key={stage} className="flex w-[270px] shrink-0 flex-col rounded-xl border border-hairline bg-panel/40">
                <div className="flex items-center justify-between border-b border-hairline px-3.5 py-2.5">
                  <span className="text-xs font-bold uppercase tracking-wide text-text-secondary">{stage}</span>
                  <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] font-semibold text-text-tertiary">{items.length}</span>
                </div>
                <div className="flex-1 space-y-2.5 overflow-y-auto p-2.5">
                  {items.map((s) => {
                    const repair = repairOptionsFor(s.id).find((r) => r.id === s.recommendedRepairId)!;
                    const isLast = stage === "Monitoring";
                    return (
                      <div key={s.id} className="rounded-lg border border-hairline bg-panel p-3 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-mono-tech font-semibold text-cyan">{s.routeNumber}</span>
                          <RiskBadge level={s.riskLevel} className="scale-90" />
                        </div>
                        <div className="mt-1 font-semibold text-text-primary">{s.roadName}</div>
                        <div className="font-mono-tech text-text-tertiary">{s.segmentLabel}</div>
                        <div className="mt-2 space-y-1 text-[11px] text-text-secondary">
                          <Row label="Method" value={repair.shortLabel} />
                          <Row label="Cost" value={`₹${repair.estimatedCostLakhPerKm} L/km`} />
                          <Row label="Duration" value={`${repair.constructionTimeDays} days`} />
                          <Row label="Contractor" value={contractorFor(s.id)} />
                          <Row label="Priority" value={`${s.priorityScore}/100`} />
                        </div>
                        <div className="mt-2.5 flex items-center justify-between">
                          <Link href={`/repair-recommendations/${s.id}`} className="text-[10px] font-semibold text-cyan hover:underline">
                            View details
                          </Link>
                          {!isLast && (
                            <button
                              onClick={() => advance(s.id)}
                              className="flex items-center gap-1 rounded-md border border-hairline-strong px-2 py-1 text-[10px] font-semibold text-text-secondary hover:border-cyan/40 hover:text-cyan"
                            >
                              Advance <ArrowRight className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {items.length === 0 && <div className="py-6 text-center text-[11px] text-text-tertiary">No segments</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className={cn("flex justify-between")}>
      <span className="text-text-tertiary">{label}</span>
      <span className="font-medium text-text-primary">{value}</span>
    </div>
  );
}
