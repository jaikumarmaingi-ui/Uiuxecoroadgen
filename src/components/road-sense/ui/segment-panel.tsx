"use client";

import { X, Route } from "lucide-react";
import type { TerrainConfig } from "@/lib/road-sense/types";

export function SegmentPanel({ config, onClose }: { config: TerrainConfig; onClose: () => void }) {
  const s = config.segment;
  const d = config.defectCounts;
  return (
    <div className="glass-panel pointer-events-auto absolute bottom-24 left-1/2 z-40 w-[320px] max-w-[calc(100vw-2rem)] -translate-x-1/2 rounded-xl border border-hairline-strong shadow-2xl">
      <div className="flex items-center justify-between border-b border-hairline px-4 py-3">
        <div className="flex items-center gap-2">
          <Route className="h-3.5 w-3.5 text-cyan" />
          <span className="font-mono-tech text-[10px] font-bold uppercase tracking-[0.15em] text-text-tertiary">Road Segment</span>
        </div>
        <button onClick={onClose} className="text-text-tertiary hover:text-text-primary">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="space-y-3.5 p-4">
        <div className="font-display text-lg font-bold text-cyan">{s.id}</div>
        <div className="grid grid-cols-2 gap-2.5 text-xs">
          <Stat label="Length" value={`${s.lengthKm} km`} />
          <Stat label="Average Health" value={`${s.avgHealth}/100`} />
          <Stat label="Defects" value={`${d.total}`} />
          <Stat label="Critical" value={`${d.critical}`} tone="text-critical" />
        </div>
        <div className="rounded-lg border border-hairline bg-white/[0.02] p-3 text-xs">
          <Row label="Potholes" value={Math.round(d.total * 0.28)} />
          <Row label="Cracks" value={Math.round(d.total * 0.32)} />
          <Row label="Rutting" value={Math.round(d.total * 0.14)} />
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-text-tertiary">Predicted Maintenance</span>
          <span className="font-mono-tech font-bold text-moderate">{s.maintenanceWindow}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-text-tertiary">Estimated Repair Cost</span>
          <span className="font-mono-tech font-bold text-text-primary">₹{s.repairCostLakh} Lakh</span>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-lg border border-hairline bg-white/[0.02] px-2.5 py-2">
      <div className="text-[9px] uppercase tracking-wide text-text-tertiary">{label}</div>
      <div className={`font-mono-tech text-sm font-bold ${tone ?? "text-text-primary"}`}>{value}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className="text-text-tertiary">{label}</span>
      <span className="font-mono-tech font-semibold text-text-primary">{value}</span>
    </div>
  );
}
