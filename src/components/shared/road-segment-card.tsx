import Link from "next/link";
import { HealthScore } from "@/components/shared/health-score";
import { RiskBadge } from "@/components/shared/risk-badge";
import type { RoadSegment } from "@/lib/types";
import { daysAgo } from "@/lib/utils";
import { MapPin, Clock, ArrowUpRight } from "lucide-react";

export function RoadSegmentCard({ segment, href, rank }: { segment: RoadSegment; href: string; rank?: number }) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 rounded-xl border border-hairline bg-panel/60 p-3.5 transition-colors hover:border-cyan/25 hover:bg-panel-alt"
    >
      {rank !== undefined && (
        <div className="font-display flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-hairline-strong bg-white/[0.03] text-sm font-bold text-text-secondary">
          {rank}
        </div>
      )}
      <HealthScore value={segment.healthScore} size="sm" showLabel={false} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-mono-tech text-[11px] font-semibold text-cyan">{segment.routeNumber}</span>
          <span className="truncate text-sm font-semibold text-text-primary">{segment.roadName}</span>
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-text-tertiary">
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" /> {segment.segmentLabel}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" /> {daysAgo(segment.lastInspectionIso)}d ago
          </span>
          <span>{segment.region}</span>
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1.5">
        <RiskBadge level={segment.riskLevel} />
        <span className="text-[11px] text-text-tertiary">
          Priority <span className="font-mono-tech font-semibold text-text-primary">{segment.priorityScore}</span>
        </span>
      </div>
      <ArrowUpRight className="h-4 w-4 shrink-0 text-text-tertiary opacity-0 transition-opacity group-hover:opacity-100" />
    </Link>
  );
}
