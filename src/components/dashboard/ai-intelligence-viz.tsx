"use client";

import Link from "next/link";
import { useState } from "react";
import { Eye, Radar, ListOrdered, Wrench, Leaf, BrainCircuit } from "lucide-react";
import { cn } from "@/lib/utils";

const NODES = [
  { key: "monitor", label: "MONITOR", desc: "Live condition & sensor telemetry", icon: Eye, href: "/condition-monitoring", pos: { left: 50, top: 8 } },
  { key: "predict", label: "PREDICT", desc: "Deterioration forecasting", icon: Radar, href: "/risk-prediction", pos: { left: 89, top: 38 } },
  { key: "prioritize", label: "PRIORITIZE", desc: "Priority scoring engine", icon: ListOrdered, href: "/repair-recommendations", pos: { left: 74, top: 84 } },
  { key: "repair", label: "REPAIR", desc: "AI repair intelligence", icon: Wrench, href: "/repair-recommendations", pos: { left: 26, top: 84 } },
  { key: "sustain", label: "SUSTAIN", desc: "Sustainability impact", icon: Leaf, href: "/sustainability", pos: { left: 11, top: 38 } },
] as const;

export function AIIntelligenceViz() {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[420px]">
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        {NODES.map((n) => (
          <line
            key={n.key}
            x1={50}
            y1={50}
            x2={n.pos.left}
            y2={n.pos.top}
            stroke={hovered === n.key ? "var(--accent-cyan)" : "rgba(148,178,200,0.18)"}
            strokeWidth={hovered === n.key ? 0.6 : 0.35}
            className="transition-all duration-300"
          />
        ))}
        <circle cx={50} cy={50} r={38} fill="none" stroke="rgba(53,224,208,0.08)" strokeWidth={0.3} strokeDasharray="1.2 1.4" />
      </svg>

      {/* Center node */}
      <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center">
        <div className="relative flex h-24 w-24 items-center justify-center rounded-full border border-cyan/40 bg-panel shadow-[0_0_40px_rgba(53,224,208,0.15)]">
          <span className="absolute inset-0 rounded-full animate-pulse-ring border border-cyan/50" />
          <BrainCircuit className="h-9 w-9 text-cyan" strokeWidth={1.5} />
        </div>
        <div className="mt-2 text-center">
          <div className="font-display text-[11px] font-bold tracking-wider text-text-primary">AI ROAD</div>
          <div className="font-display text-[11px] font-bold tracking-wider text-cyan">INTELLIGENCE</div>
        </div>
      </div>

      {NODES.map((n) => {
        const Icon = n.icon;
        const active = hovered === n.key;
        return (
          <Link
            key={n.key}
            href={n.href}
            onMouseEnter={() => setHovered(n.key)}
            onMouseLeave={() => setHovered(null)}
            style={{ left: `${n.pos.left}%`, top: `${n.pos.top}%` }}
            className="group absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1.5"
          >
            <div
              className={cn(
                "flex h-14 w-14 items-center justify-center rounded-full border bg-panel transition-all duration-200",
                active ? "border-cyan bg-cyan/10 shadow-[0_0_24px_var(--accent-cyan-glow)] scale-110" : "border-hairline-strong",
              )}
            >
              <Icon className={cn("h-5 w-5", active ? "text-cyan" : "text-text-secondary")} strokeWidth={1.8} />
            </div>
            <span className={cn("font-display text-[10px] font-bold tracking-wider", active ? "text-cyan" : "text-text-secondary")}>
              {n.label}
            </span>
            <span
              className={cn(
                "pointer-events-none absolute top-full mt-1 w-32 rounded-md border border-hairline-strong bg-panel px-2 py-1 text-center text-[10px] text-text-tertiary opacity-0 shadow-lg transition-opacity",
                active && "opacity-100",
              )}
            >
              {n.desc}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
