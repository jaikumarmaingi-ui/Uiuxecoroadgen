"use client";

import { useState } from "react";
import { ChevronDown, Mountain, Activity, Radar } from "lucide-react";
import { Sparkline } from "@/components/shared/sparkline";
import { cn } from "@/lib/utils";
import type { TerrainConfig } from "@/lib/road-sense/types";

const RISK_TONE: Record<string, string> = {
  LOW: "text-healthy",
  MODERATE: "text-moderate",
  MEDIUM: "text-moderate",
  HIGH: "text-critical",
  SEVERE: "text-critical",
  GOOD: "text-healthy",
  POOR: "text-critical",
};

function Panel({
  title,
  icon: Icon,
  children,
  defaultOpen = true,
}: {
  title: string;
  icon: typeof Mountain;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="glass-panel pointer-events-auto rounded-xl border border-white/10 shadow-xl">
      <button onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between px-3.5 py-2.5">
        <span className="flex items-center gap-2 font-mono-tech text-[10px] font-bold uppercase tracking-[0.15em] text-text-secondary">
          <Icon className="h-3.5 w-3.5 text-cyan" />
          {title}
        </span>
        <ChevronDown className={cn("h-3.5 w-3.5 text-text-tertiary transition-transform", open && "rotate-180")} />
      </button>
      {open && <div className="border-t border-white/10 p-3.5">{children}</div>}
    </div>
  );
}

function Row({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="flex items-center justify-between py-1 text-xs">
      <span className="text-text-tertiary">{label}</span>
      <span className={cn("font-mono-tech font-bold", tone ?? "text-text-primary")}>{value}</span>
    </div>
  );
}

function BreakdownBar({ label, value }: { label: string; value: number }) {
  const tone = value >= 75 ? "bg-healthy" : value >= 55 ? "bg-moderate" : "bg-critical";
  return (
    <div className="py-1">
      <div className="mb-1 flex items-center justify-between text-[11px]">
        <span className="text-text-tertiary">{label}</span>
        <span className="font-mono-tech font-semibold text-text-primary">{value}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
        <div className={cn("h-full rounded-full transition-[width] duration-700", tone)} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

export function RightPanels({ config }: { config: TerrainConfig }) {
  return (
    <div className="pointer-events-none flex w-72 flex-col gap-3">
      <Panel title="Terrain Analysis" icon={Mountain}>
        <Row label="Elevation" value={`${config.stats.elevationM.toLocaleString()} m`} />
        <Row label="Slope" value={`${config.stats.slopeDeg}°`} />
        <Row label="Terrain" value={config.stats.terrainLabel} />
        <Row label="Soil" value={config.stats.soil} />
        <Row label="Rainfall Risk" value={config.stats.rainfallRisk} tone={RISK_TONE[config.stats.rainfallRisk]} />
        <Row label="Drainage" value={config.stats.drainage} tone={RISK_TONE[config.stats.drainage]} />
        <Row label="Landslide Risk" value={config.stats.landslideRisk} tone={RISK_TONE[config.stats.landslideRisk]} />
        <Row label="Road Exposure" value={config.stats.roadExposure} tone={RISK_TONE[config.stats.roadExposure]} />
      </Panel>

      <Panel title="Road Health" icon={Activity}>
        <div className="mb-3 flex items-end justify-between">
          <div>
            <div className="font-display text-3xl font-black text-text-primary">
              {config.health}
              <span className="text-base font-medium text-text-tertiary">/100</span>
            </div>
            <div className={cn("mt-0.5 text-[10px] font-bold uppercase tracking-wide", config.health >= 75 ? "text-healthy" : config.health >= 55 ? "text-moderate" : "text-critical")}>
              {config.health >= 75 ? "Good" : config.health >= 55 ? "Moderate" : "Poor"}
            </div>
          </div>
        </div>
        <BreakdownBar label="Surface Integrity" value={config.healthBreakdown.surfaceIntegrity} />
        <BreakdownBar label="Structural Stability" value={config.healthBreakdown.structuralStability} />
        <BreakdownBar label="Drainage" value={config.healthBreakdown.drainage} />
        <BreakdownBar label="Shoulder Integrity" value={config.healthBreakdown.shoulderIntegrity} />
        <BreakdownBar label="Traffic Load" value={config.healthBreakdown.trafficLoad} />
        <BreakdownBar label="Climate Stress" value={config.healthBreakdown.climateStress} />
      </Panel>

      <Panel title="Failure Prediction · 30d" icon={Radar}>
        <Row label="Pothole Expansion" value={config.risk.potholeExpansion} tone={RISK_TONE[config.risk.potholeExpansion]} />
        <Row label="Crack Propagation" value={config.risk.crackPropagation} tone={RISK_TONE[config.risk.crackPropagation]} />
        <Row label="Shoulder Failure" value={config.risk.shoulderFailure} tone={RISK_TONE[config.risk.shoulderFailure]} />
        <Row label="Drainage Failure" value={config.risk.drainageFailure} tone={RISK_TONE[config.risk.drainageFailure]} />
        <div className="my-2 h-px bg-white/10" />
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-text-secondary">Overall Failure Risk</span>
          <span className={cn("font-mono-tech text-sm font-black", RISK_TONE[config.risk.overall])}>{config.risk.overall}</span>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-wide text-text-tertiary">Predicted Degradation</span>
        </div>
        <div className="mt-1">
          <Sparkline data={config.risk.trend} width={240} height={44} color="var(--state-critical)" />
        </div>
      </Panel>
    </div>
  );
}
