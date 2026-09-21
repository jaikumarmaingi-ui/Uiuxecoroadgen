"use client";

import { Footprints, X, TriangleAlert, MousePointer2 } from "lucide-react";
import { DEFECT_LABEL, SEVERITY_COLOR } from "@/lib/road-sense/defects-data";
import type { NearestDefect, WalkStance } from "@/lib/road-sense/walk";
import type { TerrainConfig } from "@/lib/road-sense/types";

const RISK_TEXT: Record<string, string> = {
  LOW: "text-healthy",
  MODERATE: "text-moderate",
  HIGH: "text-high-risk",
  CRITICAL: "text-critical",
};

/** Chainage distance within which a defect is close enough to act on. */
const REACH_M = 40;

const STANCE_LABEL: Record<WalkStance, string> = {
  carriageway: "Carriageway",
  shoulder: "Shoulder",
  offCorridor: "Off corridor",
};

const STANCE_TONE: Record<WalkStance, string> = {
  carriageway: "text-healthy",
  shoulder: "text-moderate",
  offCorridor: "text-text-secondary",
};

export function WalkHud({
  config,
  walkKm,
  stance,
  nearest,
  nearestDistM,
  onClose,
  onInspectNearest,
}: {
  config: TerrainConfig;
  walkKm: number;
  stance: WalkStance;
  nearest: NearestDefect | null;
  /** Chainage distance to `nearest`, in metres. */
  nearestDistM: number;
  onClose: () => void;
  onInspectNearest: (nearest: NearestDefect) => void;
}) {
  const inReach = nearest !== null && nearestDistM <= REACH_M;

  return (
    <div className="glass-panel pointer-events-auto w-72 rounded-xl border border-cyan/30 shadow-2xl">
      <div className="flex items-center justify-between border-b border-hairline px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Footprints className="h-3.5 w-3.5 text-cyan" />
          <span className="font-mono-tech text-[10px] font-bold uppercase tracking-[0.15em] text-cyan">
            Walk Mode
          </span>
        </div>
        <button onClick={onClose} className="text-text-tertiary hover:text-text-primary" aria-label="Exit walk mode">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2.5 p-3.5 text-xs">
        <Telemetry label="Chainage" value={`KM ${(walkKm).toFixed(2)}`} />
        <Telemetry label="Position" value={STANCE_LABEL[stance]} tone={STANCE_TONE[stance]} />
      </div>

      <div className="border-t border-hairline px-3.5 py-3">
        <div className="mb-1.5 font-mono-tech text-[9px] font-bold uppercase tracking-[0.15em] text-text-tertiary">
          Nearest Defect · Along Corridor
        </div>
        {nearest ? (
          <button
            onClick={() => onInspectNearest(nearest)}
            className="flex w-full items-center gap-2.5 rounded-lg border border-hairline bg-white/[0.02] px-2.5 py-2 text-left transition-colors hover:border-white/20"
          >
            <TriangleAlert className="h-3.5 w-3.5 shrink-0" style={{ color: SEVERITY_COLOR[nearest.defect.severity] }} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-[11px] font-semibold text-text-primary">
                {DEFECT_LABEL[nearest.defect.type]}
              </div>
              <div className={`font-mono-tech text-[10px] font-bold ${RISK_TEXT[nearest.defect.risk] ?? "text-text-secondary"}`}>
                {nearest.defect.risk}
              </div>
            </div>
            <div className="shrink-0 text-right">
              <div className={`font-mono-tech text-sm font-bold ${inReach ? "text-cyan" : "text-text-secondary"}`}>
                {nearestDistM < 1000 ? `${Math.round(nearestDistM)} m` : `${(nearestDistM / 1000).toFixed(1)} km`}
              </div>
              {inReach && <div className="text-[9px] uppercase tracking-wide text-cyan">In reach</div>}
            </div>
          </button>
        ) : (
          <div className="text-[11px] text-text-tertiary">No defects logged on this corridor.</div>
        )}
      </div>

      <div className="flex items-center gap-2 border-t border-hairline px-3.5 py-2.5 text-[10px] text-text-tertiary">
        <MousePointer2 className="h-3 w-3 shrink-0" />
        <span>
          <span className="font-mono-tech font-bold text-text-secondary">W/A/S/D</span> move ·{" "}
          <span className="font-mono-tech font-bold text-text-secondary">Shift</span> run · drag to look
        </span>
      </div>

      <div className="border-t border-hairline px-3.5 py-2 text-[10px] text-text-tertiary">
        {config.label} · health {config.health}/100
      </div>
    </div>
  );
}

function Telemetry({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-lg border border-hairline bg-white/[0.02] px-2.5 py-2">
      <div className="text-[9px] uppercase tracking-wide text-text-tertiary">{label}</div>
      <div className={`font-mono-tech text-sm font-bold ${tone ?? "text-text-primary"}`}>{value}</div>
    </div>
  );
}
