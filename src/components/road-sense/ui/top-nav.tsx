"use client";

import { useState } from "react";
import Link from "next/link";
import { Satellite, Wifi, BrainCircuit, ChevronDown, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = ["Terrain", "Road Health", "Defects", "Risk Prediction", "Drone Missions", "Analytics", "Reports"];

export function RoadSenseTopNav() {
  const [active, setActive] = useState("Terrain");

  return (
    <header className="z-30 flex shrink-0 items-center gap-4 border-b border-white/10 bg-[#07090b]/90 px-4 py-2.5 backdrop-blur md:px-6">
      <Link href="/dashboard" className="hidden shrink-0 items-center gap-1.5 text-text-tertiary hover:text-cyan sm:flex" title="Open EcoRoadGen Dashboard">
        <ArrowLeft className="h-3.5 w-3.5" />
      </Link>

      <div className="flex shrink-0 items-center gap-3">
        <div>
          <div className="font-display text-base font-black tracking-[0.08em] text-white">
            ROAD<span className="text-cyan">{"//"}</span>SENSE
          </div>
          <div className="font-mono-tech text-[9px] tracking-[0.2em] text-text-tertiary">AI ROAD &amp; TERRAIN INTELLIGENCE</div>
        </div>
      </div>

      <nav className="ml-2 hidden items-center gap-1 lg:flex">
        {NAV.map((item) => (
          <button
            key={item}
            onClick={() => setActive(item)}
            className={cn(
              "rounded-md px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide transition-colors",
              active === item ? "bg-cyan/10 text-cyan" : "text-text-tertiary hover:text-text-secondary",
            )}
          >
            {item}
          </button>
        ))}
      </nav>

      <div className="flex flex-1 items-center justify-end gap-2.5">
        <Pill icon={Satellite} label="LIVE" tone="text-critical" pulse />
        <Pill icon={Wifi} label="GPS LOCKED" tone="text-healthy" />
        <Pill icon={BrainCircuit} label="AI ANALYSIS 94%" tone="text-cyan" />

        <button className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] py-1.5 pl-1.5 pr-2.5 hover:border-cyan/30">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan/15 font-display text-[11px] font-bold text-cyan">
            OP
          </span>
          <span className="hidden text-xs font-medium text-text-secondary sm:inline">Field Operator</span>
          <ChevronDown className="hidden h-3.5 w-3.5 text-text-tertiary sm:inline" />
        </button>
      </div>
    </header>
  );
}

function Pill({ icon: Icon, label, tone, pulse }: { icon: typeof Wifi; label: string; tone: string; pulse?: boolean }) {
  return (
    <div className={cn("hidden items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[10px] font-bold tracking-wide sm:flex", tone)}>
      {pulse ? <span className="h-1.5 w-1.5 rounded-full bg-current animate-glow-pulse" /> : <Icon className="h-3 w-3" strokeWidth={2.5} />}
      {label}
    </div>
  );
}
