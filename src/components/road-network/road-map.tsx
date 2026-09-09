"use client";

import { useMemo, useState } from "react";
import type { RoadSegment } from "@/lib/types";
import { RISK_META } from "@/lib/risk";
import { computeBounds, pathToPoints, pointsToSvgPath, pointAtFraction } from "@/lib/map-geometry";
import { cn } from "@/lib/utils";
import {
  Landmark,
  Milestone,
  Waves,
  MountainSnow,
  CloudSun,
  Wrench,
  Shield,
  TriangleAlert,
} from "lucide-react";

export type ColorMode = "risk" | "traffic" | "elevation" | "freezeThaw" | "drainage" | "priority";

export interface MapOverlays {
  weather: boolean;
  repairHistory: boolean;
  militaryTraffic: boolean;
  landslideZones: boolean;
}

const LANDMARK_ICON: Record<string, typeof Landmark> = {
  checkpoint: Shield,
  bridge: Milestone,
  culvert: Waves,
  tunnel: MountainSnow,
  "weather-station": CloudSun,
  "inspection-point": Landmark,
  "repair-site": Wrench,
};

function heatColor(t: number) {
  const clamped = Math.min(1, Math.max(0, t));
  const hue = 190 - clamped * 190; // cyan (190) -> red (0)
  return `hsl(${hue}, 85%, 58%)`;
}

function metricValue(seg: RoadSegment, mode: ColorMode): number {
  switch (mode) {
    case "traffic":
      return seg.trafficLoad / 100;
    case "elevation":
      return Math.min(1, seg.altitudeM / 5500);
    case "freezeThaw":
      return Math.min(1, seg.freezeThawCycles / 210);
    case "drainage":
      return 1 - seg.drainageScore / 100;
    case "priority":
      return seg.priorityScore / 100;
    default:
      return 0;
  }
}

export function RoadMap({
  segments,
  selectedId,
  onSelect,
  colorMode,
  overlays,
}: {
  segments: RoadSegment[];
  selectedId?: string | null;
  onSelect: (segment: RoadSegment) => void;
  colorMode: ColorMode;
  overlays: MapOverlays;
}) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const bounds = useMemo(() => computeBounds(segments.length ? segments : [], 70), [segments]);
  const hovered = segments.find((s) => s.id === hoveredId);

  if (!segments.length) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-text-tertiary">
        No road segments match the current filters.
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-inset">
      <div className="absolute inset-0 bg-grid opacity-30" />
      <svg
        viewBox={`${bounds.minX} ${bounds.minY} ${bounds.width} ${bounds.height}`}
        className="relative h-full w-full"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <filter id="glow-critical" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* stylized landslide-risk shaded zones (decorative, illustrative) */}
        {overlays.landslideZones && (
          <>
            <ellipse cx={380} cy={340} rx={90} ry={55} fill="rgba(255,77,77,0.06)" stroke="rgba(255,77,77,0.2)" strokeDasharray="4 4" />
            <ellipse cx={470} cy={460} rx={110} ry={60} fill="rgba(255,77,77,0.06)" stroke="rgba(255,77,77,0.2)" strokeDasharray="4 4" />
          </>
        )}

        {segments.map((seg) => {
          const pts = pathToPoints(seg.path);
          const d = pointsToSvgPath(pts);
          const isSelected = seg.id === selectedId;
          const isHovered = seg.id === hoveredId;
          const isCritical = seg.riskLevel === "critical";
          const color = colorMode === "risk" ? RISK_META[seg.riskLevel].color : heatColor(metricValue(seg, colorMode));

          return (
            <g key={seg.id}>
              <path
                d={d}
                fill="none"
                stroke={color}
                strokeWidth={isSelected || isHovered ? 6.5 : 4.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={isSelected || isHovered ? 1 : 0.85}
                filter={isCritical ? "url(#glow-critical)" : undefined}
                className={cn("cursor-pointer transition-[stroke-width,opacity] duration-150", isCritical && "animate-glow-pulse")}
                onMouseEnter={() => setHoveredId(seg.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => onSelect(seg)}
              />
              {/* invisible wide hit-area for easier interaction */}
              <path
                d={d}
                fill="none"
                stroke="transparent"
                strokeWidth={18}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredId(seg.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => onSelect(seg)}
              />
              {isSelected && (
                <circle cx={pts[0].x} cy={pts[0].y} r={5} fill={color} stroke="white" strokeOpacity={0.6} strokeWidth={1.5} />
              )}

              {seg.landmarks.map((lm, i) => {
                if (lm.type === "weather-station" && !overlays.weather) return null;
                if (lm.type === "repair-site" && !overlays.repairHistory) return null;
                const p = pointAtFraction(seg.path, lm.at);
                const Icon = LANDMARK_ICON[lm.type] ?? Landmark;
                return (
                  <g key={i} transform={`translate(${p.x}, ${p.y})`} className="pointer-events-none">
                    <circle r={7} fill="var(--bg-panel)" stroke="rgba(148,178,200,0.35)" strokeWidth={1} />
                    <Icon x={-4} y={-4} width={8} height={8} color="var(--text-secondary)" strokeWidth={2} />
                  </g>
                );
              })}

              {overlays.militaryTraffic && seg.militaryConvoyFrequency !== "Low" && (
                <g transform={`translate(${pointAtFraction(seg.path, 0.75).x}, ${pointAtFraction(seg.path, 0.75).y})`}>
                  <circle r={6} fill="var(--accent-blue)" opacity={0.85} />
                </g>
              )}
            </g>
          );
        })}
      </svg>

      {hovered && (
        <div className="glass-panel pointer-events-none absolute left-4 top-4 z-10 w-64 rounded-xl border border-hairline-strong p-3.5 shadow-2xl animate-count-in">
          <div className="flex items-center justify-between">
            <span className="font-mono-tech text-xs font-semibold text-cyan">{hovered.routeNumber}</span>
            <span className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase" style={{ color: RISK_META[hovered.riskLevel].color, backgroundColor: `${RISK_META[hovered.riskLevel].color}1a` }}>
              {RISK_META[hovered.riskLevel].label}
            </span>
          </div>
          <div className="mt-1 text-sm font-semibold text-text-primary">{hovered.roadName}</div>
          <div className="font-mono-tech text-xs text-text-tertiary">{hovered.segmentLabel}</div>
          <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
            <div>
              <div className="text-text-tertiary">Health</div>
              <div className="font-display font-bold text-text-primary">{hovered.healthScore}/100</div>
            </div>
            <div>
              <div className="text-text-tertiary">Deterioration Prob.</div>
              <div className="font-display font-bold text-critical">{hovered.probabilityOfFailurePct}%</div>
            </div>
          </div>
        </div>
      )}

      {colorMode !== "risk" && (
        <div className="glass-panel absolute bottom-4 left-4 z-10 flex items-center gap-2 rounded-lg border border-hairline-strong px-3 py-2 text-[10px] text-text-tertiary">
          <span>Low</span>
          <span className="h-2 w-24 rounded-full" style={{ background: "linear-gradient(90deg, hsl(190,85%,58%), hsl(95,85%,58%), hsl(0,85%,58%))" }} />
          <span>High</span>
        </div>
      )}

      <div className="glass-panel absolute bottom-4 right-4 z-10 hidden items-center gap-3 rounded-lg border border-hairline-strong px-3 py-2 text-[10px] font-medium text-text-secondary sm:flex">
        {colorMode === "risk" &&
          (["healthy", "good", "moderate", "high-risk", "critical"] as const).map((k) => (
            <span key={k} className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: RISK_META[k].color }} />
              {RISK_META[k].label}
            </span>
          ))}
      </div>

      <div className="absolute right-4 top-4 z-10 flex items-center gap-1.5 rounded-lg border border-hairline-strong bg-panel/80 px-2.5 py-1.5 text-[10px] text-text-tertiary backdrop-blur">
        <TriangleAlert className="h-3 w-3 text-moderate" />
        Mock GIS canvas — illustrative geometry, not a geographic map
      </div>
    </div>
  );
}
