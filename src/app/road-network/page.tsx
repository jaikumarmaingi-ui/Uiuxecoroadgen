"use client";

import { useMemo, useState } from "react";
import { RoadMap, type ColorMode, type MapOverlays } from "@/components/road-network/road-map";
import { LayerPanel } from "@/components/road-network/layer-panel";
import { FilterPanel, DEFAULT_FILTERS, type RoadFilters } from "@/components/road-network/filter-panel";
import { RoadSegmentDrawer } from "@/components/road-network/road-segment-drawer";
import { RoadSegmentCard } from "@/components/shared/road-segment-card";
import { DemoBadge } from "@/components/shared/demo-badge";
import { ROAD_SEGMENTS } from "@/lib/mock-data";
import type { RoadSegment } from "@/lib/types";
import { daysAgo } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Map as MapIcon, List } from "lucide-react";

export default function RoadNetworkPage() {
  const [filters, setFilters] = useState<RoadFilters>(DEFAULT_FILTERS);
  const [colorMode, setColorMode] = useState<ColorMode>("risk");
  const [overlays, setOverlays] = useState<MapOverlays>({
    weather: true,
    repairHistory: false,
    militaryTraffic: false,
    landslideZones: false,
  });
  const [selected, setSelected] = useState<RoadSegment | null>(null);
  const [view, setView] = useState<"map" | "list">("map");

  const regions = useMemo(() => Array.from(new Set(ROAD_SEGMENTS.map((s) => s.region))).sort(), []);

  const filtered = useMemo(() => {
    return ROAD_SEGMENTS.filter((s) => {
      if (filters.region !== "All" && s.region !== filters.region) return false;
      if (filters.roadClass === "National Highway" && !s.routeNumber.startsWith("NH")) return false;
      if (filters.roadClass === "Border Road" && !s.routeNumber.startsWith("BRO")) return false;
      if (filters.riskLevels.length && !filters.riskLevels.includes(s.riskLevel)) return false;
      if (s.healthScore < filters.minHealth) return false;
      const dAgo = daysAgo(s.lastInspectionIso);
      if (filters.inspection === "recent" && dAgo > 7) return false;
      if (filters.inspection === "overdue" && dAgo < 14) return false;
      return true;
    });
  }, [filters]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline px-4 py-3 md:px-6">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-display text-lg font-bold text-text-primary">Road Network</h1>
            <DemoBadge />
          </div>
          <p className="text-xs text-text-tertiary">
            {filtered.length} of {ROAD_SEGMENTS.length} segments · GIS road intelligence for strategic defence corridors
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-hairline-strong bg-white/[0.03] p-1">
          <button
            onClick={() => setView("map")}
            className={cn("flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold", view === "map" ? "bg-cyan/15 text-cyan" : "text-text-tertiary")}
          >
            <MapIcon className="h-3.5 w-3.5" /> Map
          </button>
          <button
            onClick={() => setView("list")}
            className={cn("flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold", view === "list" ? "bg-cyan/15 text-cyan" : "text-text-tertiary")}
          >
            <List className="h-3.5 w-3.5" /> List
          </button>
        </div>
      </div>

      <div className="flex flex-1 gap-4 overflow-hidden p-4 md:p-6">
        <div className="hidden w-64 shrink-0 space-y-4 overflow-y-auto lg:block">
          <FilterPanel filters={filters} onChange={setFilters} regions={regions} />
          <LayerPanel
            colorMode={colorMode}
            onColorMode={setColorMode}
            overlays={overlays}
            onToggleOverlay={(k) => setOverlays((o) => ({ ...o, [k]: !o[k] }))}
          />
        </div>

        <div className="min-w-0 flex-1 overflow-hidden rounded-xl border border-hairline">
          {view === "map" ? (
            <RoadMap segments={filtered} selectedId={selected?.id} onSelect={setSelected} colorMode={colorMode} overlays={overlays} />
          ) : (
            <div className="h-full space-y-2.5 overflow-y-auto bg-panel/40 p-4">
              {filtered.map((s) => (
                <RoadSegmentCard key={s.id} segment={s} href={`/road-network/${s.id}`} />
              ))}
            </div>
          )}
        </div>
      </div>

      <RoadSegmentDrawer segment={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
