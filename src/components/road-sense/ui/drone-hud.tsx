"use client";

import { useEffect, useState } from "react";
import { Plane, X } from "lucide-react";

export function DroneHud({ onClose }: { onClose: () => void }) {
  const [battery, setBattery] = useState(74);
  const [coverage, setCoverage] = useState(68);

  useEffect(() => {
    const id = setInterval(() => {
      setBattery((b) => Math.max(12, b - 0.15));
      setCoverage((c) => Math.min(100, c + 0.4));
    }, 1200);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="glass-panel pointer-events-auto w-72 rounded-xl border border-cyan/30 shadow-2xl">
      <div className="flex items-center justify-between border-b border-hairline px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Plane className="h-3.5 w-3.5 text-cyan" />
          <span className="font-mono-tech text-[10px] font-bold uppercase tracking-[0.15em] text-cyan">Drone 07</span>
          <span className="flex items-center gap-1 rounded-full bg-critical/15 px-1.5 py-0.5 text-[9px] font-bold text-critical">
            <span className="h-1 w-1 rounded-full bg-critical animate-glow-pulse" /> LIVE
          </span>
        </div>
        <button onClick={onClose} className="text-text-tertiary hover:text-text-primary">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2.5 p-3.5 text-xs">
        <Telemetry label="Altitude" value="84 m" />
        <Telemetry label="Speed" value="12.4 m/s" />
        <Telemetry label="Battery" value={`${battery.toFixed(0)}%`} tone={battery < 25 ? "text-critical" : "text-healthy"} />
        <Telemetry label="Coverage" value={`${coverage.toFixed(0)}%`} tone="text-cyan" />
        <Telemetry label="Camera" value="RGB + LiDAR" />
        <Telemetry label="AI Scan" value="ACTIVE" tone="text-healthy" />
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
