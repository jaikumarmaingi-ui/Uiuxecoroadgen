"use client";

import { useState } from "react";
import { EcoRoadGenMotion } from "@/components/eco-motion/EcoRoadGenMotion";
import { sampleRoadHealthData } from "@/lib/eco-motion/mock-data";
import type { RoadHealthData } from "@/lib/eco-motion/types";

// Demo/integration page for <EcoRoadGenMotion />. Shows it embedded exactly
// as it would appear inside a real page — a bounded, aspect-ratio'd section,
// not a full-screen takeover — with a couple of live data controls to prove
// the visualization reacts to prop changes instead of hard-coded values.
export default function EcoMotionDemoPage() {
  const [data, setData] = useState<RoadHealthData>(sampleRoadHealthData);

  function nudge<K extends keyof RoadHealthData>(key: K, delta: number, min: number, max: number) {
    setData((prev) => {
      const current = prev[key];
      if (typeof current !== "number") return prev;
      const next = Math.min(max, Math.max(min, current + delta));
      return { ...prev, [key]: next };
    });
  }

  return (
    <div className="mx-auto max-w-[1200px] space-y-6 p-4 md:p-6">
      <div>
        <div className="font-mono-tech text-[11px] uppercase tracking-widest text-text-tertiary">Component Preview</div>
        <h1 className="mt-1 font-display text-2xl font-bold text-text-primary">EcoRoadGenMotion</h1>
        <p className="mt-1 max-w-2xl text-sm text-text-secondary">
          Cinematic, data-driven road-intelligence motion graphic. Every value below comes from the{" "}
          <code className="rounded bg-panel-alt px-1.5 py-0.5 font-mono-tech text-[12px] text-cyan">RoadHealthData</code> object passed as{" "}
          <code className="rounded bg-panel-alt px-1.5 py-0.5 font-mono-tech text-[12px] text-cyan">data</code> — nudge the sliders to see the
          animation react live, the same way it would to a real API update.
        </p>
      </div>

      <EcoRoadGenMotion data={data} />

      <div className="flex flex-wrap gap-2">
        <DataButton label="Pavement Health −1" onClick={() => nudge("pavementHealth", -5, 0, 100)} />
        <DataButton label="Pavement Health +1" onClick={() => nudge("pavementHealth", 5, 0, 100)} />
        <DataButton label="Failure Probability −1" onClick={() => nudge("failureProbability", -8, 0, 100)} />
        <DataButton label="Failure Probability +1" onClick={() => nudge("failureProbability", 8, 0, 100)} />
        <DataButton label="Reset Demo Data" onClick={() => setData(sampleRoadHealthData)} />
      </div>
    </div>
  );
}

function DataButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg border border-hairline px-3 py-1.5 text-xs font-semibold text-text-secondary transition-colors hover:border-hairline-strong hover:text-text-primary"
    >
      {label}
    </button>
  );
}
