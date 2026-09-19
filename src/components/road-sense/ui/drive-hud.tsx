"use client";

import { Car, X } from "lucide-react";
import { WEATHER_LABELS } from "@/lib/road-sense/weather";
import type { TerrainConfig, WeatherCondition } from "@/lib/road-sense/types";

export function DriveHud({
  config,
  weather,
  driveT,
  onClose,
}: {
  config: TerrainConfig;
  weather: WeatherCondition;
  driveT: number;
  onClose: () => void;
}) {
  const km = (driveT * config.roadLengthKm).toFixed(1);
  const speed = Math.round(28 + config.roadCurviness * 10);

  return (
    <div className="glass-panel pointer-events-auto w-64 rounded-xl border border-cyan/30 shadow-2xl">
      <div className="flex items-center justify-between border-b border-hairline px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Car className="h-3.5 w-3.5 text-cyan" />
          <span className="font-mono-tech text-[10px] font-bold uppercase tracking-[0.15em] text-cyan">Drive Mode</span>
        </div>
        <button onClick={onClose} className="text-text-tertiary hover:text-text-primary" aria-label="Exit drive mode">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2.5 p-3.5 text-xs">
        <Telemetry label="Position" value={`KM ${km}`} />
        <Telemetry label="Speed" value={`${speed} km/h`} />
        <Telemetry label="Road Health" value={`${config.health}`} tone={config.health >= 70 ? "text-healthy" : config.health >= 50 ? "text-moderate" : "text-critical"} />
        <Telemetry label="Weather" value={WEATHER_LABELS[weather]} />
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
