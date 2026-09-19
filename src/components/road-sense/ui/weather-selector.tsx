"use client";

import { CloudRain, Snowflake, Sun, Thermometer, MountainSnow } from "lucide-react";
import { WEATHER_ORDER, WEATHER_LABELS, WEATHER_NOTES } from "@/lib/road-sense/weather";
import { cn } from "@/lib/utils";
import type { WeatherCondition } from "@/lib/road-sense/types";

const WEATHER_ICON: Record<WeatherCondition, typeof Sun> = {
  normal: Sun,
  monsoon: CloudRain,
  snow: Snowflake,
  "freeze-thaw": Thermometer,
  landslide: MountainSnow,
};

export function WeatherSelector({ weather, onSelect }: { weather: WeatherCondition; onSelect: (w: WeatherCondition) => void }) {
  return (
    <div className="glass-panel pointer-events-auto rounded-xl border border-white/10 p-2 shadow-xl">
      <div className="mb-1.5 px-1 font-mono-tech text-[10px] font-bold uppercase tracking-[0.15em] text-text-tertiary">
        Environment Simulation
      </div>
      <div className="flex flex-wrap gap-1">
        {WEATHER_ORDER.map((w) => {
          const Icon = WEATHER_ICON[w];
          return (
            <button
              key={w}
              onClick={() => onSelect(w)}
              title={WEATHER_NOTES[w]}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wide transition-colors",
                weather === w ? "bg-cyan/15 text-cyan" : "text-text-tertiary hover:text-text-secondary",
              )}
            >
              <Icon className="h-3 w-3" />
              {WEATHER_LABELS[w]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
