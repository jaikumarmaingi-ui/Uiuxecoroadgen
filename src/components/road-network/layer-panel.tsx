"use client";

import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import type { ColorMode, MapOverlays } from "./road-map";

const COLOR_MODES: { value: ColorMode; label: string }[] = [
  { value: "risk", label: "Road Health & Risk" },
  { value: "traffic", label: "Traffic Load" },
  { value: "elevation", label: "Elevation" },
  { value: "drainage", label: "Drainage" },
  { value: "freezeThaw", label: "Freeze-Thaw Exposure" },
  { value: "priority", label: "Sustainability Priority" },
];

const OVERLAY_ITEMS: { key: keyof MapOverlays; label: string }[] = [
  { key: "weather", label: "Weather Stations" },
  { key: "repairHistory", label: "Repair History Sites" },
  { key: "militaryTraffic", label: "Military Traffic" },
  { key: "landslideZones", label: "Landslide Risk Zones" },
];

function CheckboxRow({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <button onClick={onChange} className="flex w-full items-center gap-2.5 rounded-lg px-1.5 py-1.5 text-left text-xs text-text-secondary hover:bg-white/[0.04]">
      <span
        className={cn(
          "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
          checked ? "border-cyan bg-cyan/20" : "border-hairline-strong bg-transparent",
        )}
      >
        {checked && <Check className="h-3 w-3 text-cyan" strokeWidth={3} />}
      </span>
      {label}
    </button>
  );
}

export function LayerPanel({
  colorMode,
  onColorMode,
  overlays,
  onToggleOverlay,
}: {
  colorMode: ColorMode;
  onColorMode: (m: ColorMode) => void;
  overlays: MapOverlays;
  onToggleOverlay: (k: keyof MapOverlays) => void;
}) {
  return (
    <Card className="p-0">
      <CardHeader className="pb-2 pt-3.5">
        <CardTitle className="text-xs">Map Layers</CardTitle>
      </CardHeader>
      <div className="space-y-3 p-3.5 pt-2">
        <div>
          <div className="mb-1 px-1.5 text-[10px] font-semibold uppercase tracking-wider text-text-tertiary">Coloring</div>
          <div className="space-y-0.5">
            {COLOR_MODES.map((m) => (
              <CheckboxRow key={m.value} checked={colorMode === m.value} onChange={() => onColorMode(m.value)} label={m.label} />
            ))}
          </div>
        </div>
        <div className="h-px bg-hairline" />
        <div>
          <div className="mb-1 px-1.5 text-[10px] font-semibold uppercase tracking-wider text-text-tertiary">Overlays</div>
          <div className="space-y-0.5">
            {OVERLAY_ITEMS.map((o) => (
              <CheckboxRow key={o.key} checked={overlays[o.key]} onChange={() => onToggleOverlay(o.key)} label={o.label} />
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
