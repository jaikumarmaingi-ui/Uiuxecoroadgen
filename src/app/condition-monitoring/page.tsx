"use client";

import { useState } from "react";
import Link from "next/link";
import { ActivitySquare, ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RiskBadge } from "@/components/shared/risk-badge";
import { DataConfidenceBadge } from "@/components/shared/data-confidence-badge";
import { DemoBadge } from "@/components/shared/demo-badge";
import { ConditionBreakdown } from "@/components/condition/condition-breakdown";
import { ImageAnalysisPanel } from "@/components/condition/image-analysis-panel";
import { ROAD_SEGMENTS, getSegment } from "@/lib/mock-data";
import { daysAgo } from "@/lib/utils";

export default function ConditionMonitoringPage() {
  const [selectedId, setSelectedId] = useState(ROAD_SEGMENTS[2].id);
  const segment = getSegment(selectedId)!;

  return (
    <div className="mx-auto max-w-[1300px] space-y-6 p-4 md:p-6">
      <div>
        <div className="flex items-center gap-2.5">
          <ActivitySquare className="h-5 w-5 text-cyan" />
          <h1 className="font-display text-2xl font-bold text-text-primary">Condition Monitoring</h1>
          <DemoBadge />
        </div>
        <p className="mt-1 text-sm text-text-tertiary">
          Live distress, structural, environmental and operational telemetry per road segment.
        </p>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">Segment</label>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="min-w-[280px] flex-1 rounded-lg border border-hairline-strong bg-white/[0.03] px-3 py-2 text-sm text-text-primary outline-none focus:border-cyan/40"
          >
            {ROAD_SEGMENTS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.routeNumber} · {s.roadName} · {s.segmentLabel}
              </option>
            ))}
          </select>
          <RiskBadge level={segment.riskLevel} />
          <DataConfidenceBadge level={segment.dataConfidence} />
          <Link href={`/road-network/${segment.id}`} className="flex items-center gap-1 text-xs font-semibold text-cyan hover:underline">
            Full intelligence <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="mt-3 text-xs text-text-tertiary">
          Last field inspection {daysAgo(segment.lastInspectionIso)} days ago · Health {segment.healthScore}/100
        </div>
      </Card>

      <ConditionBreakdown segment={segment} />

      <ImageAnalysisPanel segment={segment} />

      <Card>
        <CardHeader>
          <CardTitle>Network Condition Overview</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-2.5 sm:grid-cols-5">
          {(["healthy", "good", "moderate", "high-risk", "critical"] as const).map((level) => {
            const count = ROAD_SEGMENTS.filter((s) => s.riskLevel === level).length;
            return (
              <div key={level} className="rounded-lg border border-hairline bg-white/[0.02] p-3 text-center">
                <RiskBadge level={level} className="mx-auto w-fit" />
                <div className="mt-2 font-display text-xl font-bold text-text-primary">{count}</div>
                <div className="text-[10px] uppercase tracking-wide text-text-tertiary">segments</div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
