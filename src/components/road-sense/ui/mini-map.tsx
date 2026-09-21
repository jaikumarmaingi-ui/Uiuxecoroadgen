"use client";

import { Compass } from "lucide-react";
import { TERRAIN_SIZE, type RoadPoint } from "@/lib/road-sense/terrain-config";
import { SEVERITY_COLOR } from "@/lib/road-sense/defects-data";
import type { RoadDefect } from "@/lib/road-sense/types";

const SIZE = 190;

function toScreen(x: number, z: number) {
  const half = TERRAIN_SIZE / 2;
  return { sx: ((x + half) / TERRAIN_SIZE) * SIZE, sy: ((z + half) / TERRAIN_SIZE) * SIZE };
}

export function MiniMap({
  path,
  defects,
  droneT,
  onNavigate,
}: {
  path: RoadPoint[];
  defects: RoadDefect[];
  droneT: number;
  onNavigate: (x: number, z: number) => void;
}) {
  const linePoints = path
    .filter((_, i) => i % 3 === 0)
    .map((p) => {
      const { sx, sy } = toScreen(p.x, p.z);
      return `${sx.toFixed(1)},${sy.toFixed(1)}`;
    })
    .join(" ");

  const half = TERRAIN_SIZE / 2;
  function handleClick(e: React.MouseEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const sx = ((e.clientX - rect.left) / rect.width) * SIZE;
    const sy = ((e.clientY - rect.top) / rect.height) * SIZE;
    const x = (sx / SIZE) * TERRAIN_SIZE - half;
    const z = (sy / SIZE) * TERRAIN_SIZE - half;
    onNavigate(x, z);
  }

  const droneIdx = Math.floor(droneT * (path.length - 1));
  const dronePos = path[droneIdx] ?? path[0];
  const drone = toScreen(dronePos.x, dronePos.z);

  return (
    <div className="glass-panel pointer-events-auto rounded-xl border border-white/10 p-2.5 shadow-xl">
      <div className="mb-1.5 flex items-center gap-1.5 px-0.5 font-mono-tech text-[9px] font-bold uppercase tracking-[0.15em] text-text-tertiary">
        <Compass className="h-3 w-3 text-cyan" />
        Survey Area
      </div>
      <svg
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        onClick={handleClick}
        className="cursor-crosshair rounded-lg border border-white/10 bg-[#0a0d10]"
      >
        <rect width={SIZE} height={SIZE} fill="url(#grid)" opacity={0.5} />
        <defs>
          <pattern id="grid" width="16" height="16" patternUnits="userSpaceOnUse">
            <path d="M16 0H0V16" fill="none" stroke="rgba(148,178,200,0.08)" />
          </pattern>
        </defs>
        <polyline points={linePoints} fill="none" stroke="#35e0d0" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" opacity={0.85} />
        {defects
          .filter((d) => d.severity === "high" || d.severity === "critical")
          .map((d) => {
            const idx = Math.floor(d.t * (path.length - 1));
            const { sx, sy } = toScreen(path[idx].x, path[idx].z);
            return <circle key={d.id} cx={sx} cy={sy} r={2.6} fill={SEVERITY_COLOR[d.severity]} />;
          })}
        <circle cx={drone.sx} cy={drone.sy} r={4} fill="#35e0d0" stroke="#04302c" strokeWidth={1.5} />
        <circle cx={drone.sx} cy={drone.sy} r={7} fill="none" stroke="#35e0d0" strokeOpacity={0.4} />
      </svg>
    </div>
  );
}
