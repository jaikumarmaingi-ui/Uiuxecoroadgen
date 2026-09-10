"use client";

import { X, TriangleAlert } from "lucide-react";
import { DEFECT_LABEL, SEVERITY_COLOR } from "@/lib/road-sense/defects-data";
import type { RoadDefect } from "@/lib/road-sense/types";

const RISK_TEXT: Record<RoadDefect["risk"], string> = {
  LOW: "text-healthy",
  MODERATE: "text-moderate",
  HIGH: "text-high-risk",
  CRITICAL: "text-critical",
};

function daysAgo(iso: string) {
  return Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 86400000));
}

export function DefectPanel({ defect, onClose }: { defect: RoadDefect; onClose: () => void }) {
  const color = SEVERITY_COLOR[defect.severity];
  return (
    <div className="glass-panel pointer-events-auto absolute bottom-24 left-1/2 z-40 max-h-[65vh] w-[340px] max-w-[calc(100vw-2rem)] -translate-x-1/2 overflow-y-auto rounded-xl border border-hairline-strong shadow-2xl">
      <div className="flex items-center justify-between border-b border-hairline px-4 py-3">
        <div className="flex items-center gap-2">
          <TriangleAlert className="h-3.5 w-3.5" style={{ color }} />
          <span className="font-mono-tech text-[10px] font-bold uppercase tracking-[0.15em] text-text-tertiary">
            AI Detected Defect
          </span>
        </div>
        <button onClick={onClose} className="text-text-tertiary hover:text-text-primary">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-3.5 p-4">
        <div>
          <div className="font-display text-lg font-bold text-text-primary">
            {DEFECT_LABEL[defect.type]} <span className="font-mono-tech text-sm text-text-tertiary">#{defect.id}</span>
          </div>
          <div className="mt-1 font-mono-tech text-xs text-text-tertiary">{defect.segment}</div>
        </div>

        <div className="grid grid-cols-2 gap-2.5 text-xs">
          <Stat label="Severity" value={defect.severity.toUpperCase()} color={color} />
          {defect.depthMm !== undefined && <Stat label="Depth" value={`${defect.depthMm} mm`} />}
          {defect.diameterMm !== undefined && <Stat label="Diameter" value={`${defect.diameterMm} mm`} />}
          {defect.rutDepthMm !== undefined && <Stat label="Rut Depth" value={`${defect.rutDepthMm} mm`} />}
          <Stat label="Confidence" value={`${defect.confidencePct}%`} />
          <Stat label="Detected" value={`${daysAgo(defect.detectedIso)}d ago`} />
        </div>

        <div className="rounded-lg border border-hairline bg-white/[0.02] p-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-text-tertiary">Predicted Growth (30d)</span>
            <span className="font-mono-tech font-semibold text-critical">+{defect.predictedGrowthPct}%</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="text-text-tertiary">Risk</span>
            <span className={`font-mono-tech font-bold ${RISK_TEXT[defect.risk]}`}>{defect.risk}</span>
          </div>
        </div>

        <button className="w-full rounded-lg bg-cyan py-2 text-xs font-bold uppercase tracking-wide text-text-inverse transition-opacity hover:opacity-90">
          View Analysis
        </button>
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="rounded-lg border border-hairline bg-white/[0.02] px-2.5 py-2">
      <div className="text-[9px] uppercase tracking-wide text-text-tertiary">{label}</div>
      <div className="font-mono-tech text-sm font-bold" style={{ color: color ?? "var(--text-primary)" }}>
        {value}
      </div>
    </div>
  );
}
