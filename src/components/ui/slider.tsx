"use client";

import { cn } from "@/lib/utils";

export function Slider({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  className,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-text-secondary">{label}</span>
        <span className="font-mono-tech text-cyan tabular-nums">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="slider-input h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/[0.08] accent-cyan"
        style={{
          background: `linear-gradient(to right, var(--accent-cyan) ${((value - min) / (max - min)) * 100}%, rgba(255,255,255,0.08) ${((value - min) / (max - min)) * 100}%)`,
        }}
      />
    </div>
  );
}
