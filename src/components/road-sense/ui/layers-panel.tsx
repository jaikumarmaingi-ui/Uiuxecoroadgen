"use client";

import { useState } from "react";
import { ChevronDown, Layers, Check } from "lucide-react";
import { LAYER_LABELS, LAYER_ORDER, type LayerKey } from "@/lib/road-sense/layers";
import { cn } from "@/lib/utils";

export function LayersPanel({
  layers,
  onToggle,
}: {
  layers: Record<LayerKey, boolean>;
  onToggle: (key: LayerKey) => void;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div className="glass-panel pointer-events-auto w-52 rounded-xl border border-white/10 shadow-xl">
      <button onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between px-3.5 py-2.5">
        <span className="flex items-center gap-2 font-mono-tech text-[10px] font-bold uppercase tracking-[0.15em] text-text-secondary">
          <Layers className="h-3.5 w-3.5 text-cyan" />
          Terrain Layers
        </span>
        <ChevronDown className={cn("h-3.5 w-3.5 text-text-tertiary transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="space-y-0.5 border-t border-white/10 p-2">
          {LAYER_ORDER.map((key) => (
            <button
              key={key}
              onClick={() => onToggle(key)}
              className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-xs text-text-secondary hover:bg-white/[0.05]"
            >
              <span
                className={cn(
                  "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                  layers[key] ? "border-cyan bg-cyan/20" : "border-white/20",
                )}
              >
                {layers[key] && <Check className="h-3 w-3 text-cyan" strokeWidth={3} />}
              </span>
              {LAYER_LABELS[key]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
